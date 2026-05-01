#!/usr/bin/env node
/**
 * The Forge — organic topic ingestion.
 *
 * Pulls last-24h items from a curated set of RSS / JSON feeds, asks Claude
 * to extract Forge-relevant topic candidates, deduplicates against the
 * existing queue, scores by freshness + relevance, appends top N to the
 * topic queue.
 *
 * Run via GitHub Actions cron (see .github/workflows/ingest-feeds.yml)
 * daily at 02:00 UTC, before the publish cron at 06:00 UTC.
 *
 * Required env: ANTHROPIC_API_KEY
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUEUE_PATH = path.join(ROOT, 'topics-queue.json');

const TOPICS_PER_RUN = Number(process.env.TOPICS_PER_RUN ?? 4);
const MODEL = process.env.MODEL ?? 'claude-haiku-4-5-20251001';

/**
 * Curated source feeds. Mix of canonical AI / agent topics + community signals.
 * Reddit is the highest-leverage source for Perplexity citations (46.7% of top 10).
 */
const FEEDS = [
  { name: 'Hacker News front page', url: 'https://hnrss.org/frontpage', kind: 'rss' },
  { name: 'Anthropic news', url: 'https://www.anthropic.com/news/feed.xml', kind: 'rss' },
  { name: 'OpenAI blog', url: 'https://openai.com/blog/rss.xml', kind: 'rss' },
  { name: 'Google Research blog', url: 'https://research.google/blog/rss/', kind: 'rss' },
  { name: 'r/LocalLLaMA new', url: 'https://www.reddit.com/r/LocalLLaMA/new.json?limit=25', kind: 'reddit' },
  { name: 'r/ClaudeAI new', url: 'https://www.reddit.com/r/ClaudeAI/new.json?limit=25', kind: 'reddit' },
  { name: 'r/MachineLearning new', url: 'https://www.reddit.com/r/MachineLearning/new.json?limit=25', kind: 'reddit' },
];

interface FeedItem {
  source: string;
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
}

interface Topic {
  id: string;
  publishDate: string;
  title: string;
  description: string;
  tags: string[];
  tools: string[];
  category: string;
  status: 'queued' | 'drafted' | 'published' | 'skipped';
  sourceLink?: string;
  ingestedAt?: string;
}

interface Queue {
  _meta: Record<string, unknown>;
  topics: Topic[];
}

async function fetchFeed(url: string, kind: string, sourceName: string): Promise<FeedItem[]> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'TheForge/1.0 (https://adsforge.store; bots@adsforge.store)',
    };
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`  Skipping ${sourceName}: HTTP ${res.status}`);
      return [];
    }

    if (kind === 'reddit') {
      const json = (await res.json()) as { data?: { children?: Array<{ data: { title: string; url: string; permalink: string; created_utc: number; selftext?: string } }> } };
      const items = json.data?.children ?? [];
      return items.map((it) => ({
        source: sourceName,
        title: it.data.title,
        link: `https://www.reddit.com${it.data.permalink}`,
        publishedAt: new Date(it.data.created_utc * 1000).toISOString(),
        summary: (it.data.selftext ?? '').slice(0, 400),
      }));
    }

    // RSS — minimal parser, no external dep
    const xml = await res.text();
    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 25) {
      const block = match[1];
      const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) ?? [])[1] ?? '';
      const link = (block.match(/<link>([\s\S]*?)<\/link>/) ?? [])[1] ?? '';
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? [])[1] ?? '';
      const description = (block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ?? [])[1] ?? '';
      items.push({
        source: sourceName,
        title: title.trim().replace(/<[^>]+>/g, ''),
        link: link.trim(),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        summary: description.trim().replace(/<[^>]+>/g, '').slice(0, 400),
      });
    }
    return items;
  } catch (err) {
    console.warn(`  Skipping ${sourceName}: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

function within24h(iso: string): boolean {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return false;
  return Date.now() - d < 24 * 60 * 60 * 1000;
}

const EXTRACT_SYSTEM = `You evaluate news / blog / forum items and decide if they would make
a good post for The Forge — an AI-first editorial about agents and tools that
automate boring tasks (job applications, email triage, receipt processing,
scheduling, customer support, sourcing).

For EACH item below, output one line in this exact format (no other text):

KEEP|<title in 80 chars>|<short description in 1 sentence>|<comma-separated tags from approved list>|<category>

OR

SKIP|<reason>

Approved tags: mcp, claude, agents, automation, email, vision, taxes, job-search, productivity, cli, browser-automation, customer-support, scheduling, sourcing, developer-tools, prompt-engineering, evaluation, local-models, mcp-server, anthropic, openai, cursor, cline, claude-desktop

Categories: mcp-server-review, agent-prompt, workflow-guide, tool-comparison, news-commentary, contrarian, case-study, beginner, misc

Rules:
- KEEP only if the item is about AI agents, MCP, automation tooling, prompt engineering, agent benchmarks, or related editorial topics.
- SKIP if it's general AI hype, model release with no practical builder angle, or off-topic.
- Each KEEP must have a strong "what could a Forge post about this teach?" angle.`;

async function extractTopics(client: Anthropic, items: FeedItem[]): Promise<Topic[]> {
  if (items.length === 0) return [];

  const itemsBlock = items
    .map((it, i) => `[${i + 1}] ${it.source} — ${it.title}\n  ${it.summary.slice(0, 160)}\n  link: ${it.link}`)
    .join('\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content: `Items to evaluate:\n\n${itemsBlock}` }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('\n');

  const today = new Date().toISOString().slice(0, 10);
  const topics: Topic[] = [];

  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('KEEP|')) return;
    const parts = trimmed.split('|').map((p) => p.trim());
    if (parts.length < 5) return;

    const [, title, description, tagsStr, category] = parts;
    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);

    topics.push({
      id: `ing-${Date.now()}-${topics.length + 1}`,
      publishDate: today,
      title,
      description,
      tags,
      tools: [],
      category: category || 'misc',
      status: 'queued',
      ingestedAt: new Date().toISOString(),
    });
  });

  return topics;
}

function dedup(existing: Topic[], candidates: Topic[]): Topic[] {
  const existingTitles = new Set(existing.map((t) => t.title.toLowerCase()));
  return candidates.filter((c) => !existingTitles.has(c.title.toLowerCase()));
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing.');
    process.exit(1);
  }

  console.log('Fetching feeds...');
  const allItems: FeedItem[] = [];
  for (const feed of FEEDS) {
    const items = await fetchFeed(feed.url, feed.kind, feed.name);
    const fresh = items.filter((it) => within24h(it.publishedAt));
    console.log(`  ${feed.name}: ${items.length} items, ${fresh.length} fresh`);
    allItems.push(...fresh);
  }

  if (allItems.length === 0) {
    console.log('No fresh items. Exiting.');
    return;
  }

  console.log(`\nExtracting topic candidates from ${allItems.length} items...`);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const candidates = await extractTopics(client, allItems);
  console.log(`  Got ${candidates.length} candidates.`);

  const queue: Queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const fresh = dedup(queue.topics, candidates).slice(0, TOPICS_PER_RUN);
  console.log(`  After dedup, taking top ${fresh.length}.`);

  if (fresh.length === 0) {
    console.log('Nothing new to add. Exiting.');
    return;
  }

  queue.topics.push(...fresh);
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
  console.log(`\nQueue now has ${queue.topics.length} total topics. Done.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
