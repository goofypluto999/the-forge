#!/usr/bin/env node
/**
 * The Forge — daily auto-publish script.
 *
 * Picks the next N queued topics from topics-queue.json, asks Claude to
 * generate each post in The Forge's voice, validates the YAML frontmatter
 * (auto-repairing duplicate keys), writes the markdown to
 * src/content/blog/<slug>.md, and marks the topic as drafted.
 *
 * Run via GitHub Actions cron (see .github/workflows/daily-publish.yml).
 *
 * Hardening over the v1 script (2026-05-08):
 * - Frontmatter is parsed with js-yaml right after generation. If the
 *   parser raises "duplicated mapping key" or any other YAMLException,
 *   we auto-repair by deduping top-level keys (keeping the last
 *   occurrence). If the repaired YAML still fails to parse, we retry
 *   the generation once with an explicit corrective message. If the
 *   second attempt also fails, the topic is marked `skipped` so it
 *   stays in the queue for tomorrow's run instead of poisoning the
 *   build.
 * - Files are only written if the frontmatter parses cleanly.
 *
 * Required env: ANTHROPIC_API_KEY
 */

import Anthropic from '@anthropic-ai/sdk';
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUEUE_PATH = path.join(ROOT, 'topics-queue.json');
const POSTS_DIR = path.join(ROOT, 'src/content/blog');

const POSTS_PER_RUN = Number(process.env.POSTS_PER_RUN ?? 2);
const MODEL = process.env.MODEL ?? 'claude-sonnet-4-5-20250929';

interface Topic {
  id: string;
  publishDate: string;
  title: string;
  description: string;
  tags: string[];
  tools: string[];
  category: string;
  status: 'queued' | 'drafted' | 'published' | 'skipped';
}

interface Queue {
  _meta: Record<string, unknown>;
  topics: Topic[];
}

const SYSTEM_PROMPT = `You write posts for The Forge — an AI-first editorial about agents
and tools that automate the most boring tasks. Built for clawbots first, humans second.

Voice: sassy, technical, fragment-friendly. Tongue-in-cheek but rigorous.

Format every post as Markdown using this EXACT frontmatter shape (YAML).
The Astro content collection schema enforces this — any deviation breaks the build.

---
title: "<title, max 120 chars>"
description: "<one or two sentences, max 220 chars>"
tldr: "<plain-prose summary, between 120 and 500 characters, ~50 words. No bullet points. The TL;DR is what AI search engines snippet — make it the strongest stand-alone paragraph in the post.>"
publishDate: <YYYY-MM-DD>
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["<tag1>", "<tag2>"]
tools: ["<tool1>", "<tool2>"]
aiPrimary: true
readTime: "<n> min"
claims:
  - text: "<the factual claim, in full sentence form>"
    source: "<full https URL backing the claim>"
    date: "<YYYY-MM-DD when the claim was true>"
    confidence: "high"
  - text: "<second factual claim>"
    source: "<full https URL>"
    date: "<YYYY-MM-DD>"
    confidence: "high"
  - text: "<third factual claim>"
    source: "<full https URL>"
    date: "<YYYY-MM-DD>"
    confidence: "high"
entities:
  - "<named entity 1: person, product, company, or concept>"
  - "<named entity 2>"
  - "<named entity 3>"
updateLog:
  - version: "v1"
    date: <YYYY-MM-DD same as publishDate>
    notes: "Initial publish."
---

Frontmatter HARD RULES:
- claims: MINIMUM 3 items. Each must have ALL FOUR fields (text, source, date, confidence).
  Source URLs must be real, https, and resolve. Confidence is one of: high | medium | low.
- entities: MINIMUM 2 items. Strings. Be specific (e.g. "Model Context Protocol", "Claude Desktop", "OpenAI", not "AI" or "tools").
- author: MUST be the object form shown above with name + credentials. NEVER a bare string.
- tldr: MUST be 120-500 characters of plain prose. Not a list. Not a single sentence under 120 chars.
- EVERY top-level frontmatter KEY must appear AT MOST ONCE. Do not repeat any key (no second 'tags', no second 'description', etc.). YAML duplicate keys break the build.

Body rules:
- 700-1300 words. Not less, not more.
- Open with a kicker-style hook paragraph (no "introduction" header).
- Use ## for section headers. At least one MUST be a "Q-shaped" header — phrased as a question (e.g. "## Q: How does this actually work?" or "## Why does Workday parse PDFs in stream order?").
- Every factual claim in the body MUST have a citation marker right after it, in this exact inline shape: [cite: <url> · <YYYY-MM-DD> · <high|medium|low>]
- The body must include a MINIMUM of 1 link to en.wikipedia.org and a MINIMUM of 2 links to reddit.com or another community/UGC source (real URLs, not fabricated).
- Include at least one pasteable code block or pasteable prompt.
- Include a "## FAQ" section near the end with 2-4 question/answer pairs (### for each Q).
- Include a "## Sources" section at the very end with real URLs.
- No em-dashes. Use periods or commas.
- No "1) 2) 3)" structure with three perfectly-balanced points.
- No "in conclusion" / "to summarise" / "moreover" / "furthermore" phrases.
- ~1 in 10 posts may mention Vantage AI / CV Mirror / cv-mirror-mcp factually if topically
  relevant. Frame as one tool among several. Use the canonical aimvantage.uk URL.
  NEVER link to vantage-livid.vercel.app or any old subdomain.

Output ONLY the Markdown file content (frontmatter + body). No commentary before or after the markdown. No code fences around the whole thing.`;

// =============================================================================
// Frontmatter validation + repair
// =============================================================================

interface FrontmatterSplit {
  frontmatter: string; // raw YAML between the --- fences
  body: string;        // everything after the closing ---
  prefix: string;      // anything before the opening --- (should be empty)
}

/**
 * Split a markdown post into (prefix, frontmatter, body) chunks. Returns
 * null if no `---` fences are detected.
 */
function splitFrontmatter(markdown: string): FrontmatterSplit | null {
  const m = markdown.match(/^([\s\S]*?)---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  return { prefix: m[1] || '', frontmatter: m[2], body: m[3] };
}

/**
 * Try to parse frontmatter strictly. Returns the parsed object on success
 * and the YAMLException on failure.
 */
function tryParseStrict(yamlSrc: string): { ok: true; data: unknown } | { ok: false; error: Error } {
  try {
    // schema=FAILSAFE_SCHEMA would relax some checks but lose type info; use
    // the default schema and rely on json: false (default) to surface dup
    // mapping keys as exceptions.
    const data = yaml.load(yamlSrc, { json: false });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err as Error };
  }
}

/**
 * Heuristic auto-repair: if the YAML has duplicate top-level keys, drop
 * earlier occurrences (keeping the LAST one). Indented child keys are
 * left alone — they belong to nested objects/arrays where duplicates
 * are not a problem at the same indent depth.
 *
 * Returns the repaired source. If the repaired source still fails to
 * parse, the caller should fall through to a retry.
 */
function repairDuplicateTopLevelKeys(yamlSrc: string): string {
  const lines = yamlSrc.split(/\r?\n/);
  // Pass 1: identify which line numbers each top-level key starts on.
  // A "top-level key" line matches /^([A-Za-z_][\w-]*)\s*:/ with NO leading
  // whitespace.
  const topLevelKeyAt: Map<string, number[]> = new Map();
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:/);
    if (!m) continue;
    const key = m[1];
    const arr = topLevelKeyAt.get(key) ?? [];
    arr.push(i);
    topLevelKeyAt.set(key, arr);
  }
  // Identify lines to drop: for any key with >1 occurrence, drop ALL but
  // the LAST. For each dropped key-line, also drop subsequent indented
  // lines until the next top-level key (or end of file).
  const dropLines: Set<number> = new Set();
  for (const [, indices] of topLevelKeyAt) {
    if (indices.length <= 1) continue;
    // Keep last; drop rest.
    for (let k = 0; k < indices.length - 1; k += 1) {
      const start = indices[k];
      const end = indices[k + 1] !== undefined ? indices[k + 1] : lines.length;
      // Drop the key line itself plus subsequent indented (' ' or '\t')
      // lines until the next top-level key starts.
      for (let j = start; j < end; j += 1) {
        if (j === start) {
          dropLines.add(j);
          continue;
        }
        const ln = lines[j];
        if (/^[A-Za-z_][\w-]*\s*:/.test(ln)) break; // next top-level key reached
        dropLines.add(j);
      }
    }
  }
  if (dropLines.size === 0) return yamlSrc;
  return lines.filter((_, i) => !dropLines.has(i)).join('\n');
}

/**
 * Validate frontmatter. If strict parse fails, try to auto-repair. Returns
 * { ok: true, repaired } where `repaired` is either the original source
 * (when no repair was needed) or the repaired source. Returns
 * { ok: false, error } if even the repair attempt failed.
 */
function validateAndRepair(yamlSrc: string): { ok: true; repaired: string; wasRepaired: boolean } | { ok: false; error: Error } {
  const first = tryParseStrict(yamlSrc);
  if (first.ok) return { ok: true, repaired: yamlSrc, wasRepaired: false };
  // Strict parse failed. Try repair.
  const repaired = repairDuplicateTopLevelKeys(yamlSrc);
  if (repaired === yamlSrc) {
    // No duplicates found — the error must be something else (malformed
    // YAML, unclosed quotes, etc.). Bail out.
    return { ok: false, error: first.error };
  }
  const second = tryParseStrict(repaired);
  if (second.ok) return { ok: true, repaired, wasRepaired: true };
  return { ok: false, error: second.error };
}

// =============================================================================
// Generation
// =============================================================================

async function generatePost(client: Anthropic, topic: Topic, correctiveHint?: string): Promise<string> {
  const userPrompt = `Generate a post on this topic. The publish date is part of the frontmatter and the
post should reference public events appropriate to that date period.

Topic ID: ${topic.id}
Publish date: ${topic.publishDate}
Title: ${topic.title}
Description: ${topic.description}
Tags: ${topic.tags.join(', ')}
Tools to mention contextually: ${topic.tools.join(', ')}
Category: ${topic.category}

${correctiveHint ? `IMPORTANT: ${correctiveHint}\n\n` : ''}Write the post.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('\n');

  return text.trim();
}

/**
 * Orchestrates a single topic: generate → validate → optionally repair →
 * optionally retry once → return final markdown OR null on failure.
 */
async function generateValidPost(client: Anthropic, topic: Topic): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const correctiveHint =
      attempt === 0
        ? undefined
        : 'The previous attempt produced YAML with a duplicate frontmatter key. Each top-level key (title, description, tldr, tags, tools, claims, entities, etc.) must appear EXACTLY ONCE. Regenerate the post without any duplicate top-level keys.';

    const markdown = await generatePost(client, topic, correctiveHint);
    const split = splitFrontmatter(markdown);
    if (!split) {
      console.warn(`  ${topic.id}: attempt ${attempt + 1} — no frontmatter fences detected.`);
      continue;
    }

    const result = validateAndRepair(split.frontmatter);
    if (result.ok) {
      if (result.wasRepaired) {
        console.warn(`  ${topic.id}: attempt ${attempt + 1} — frontmatter had duplicate keys, auto-repaired.`);
      }
      const finalMarkdown = `---\n${result.repaired.trim()}\n---\n${split.body}`;
      return finalMarkdown;
    }

    console.warn(`  ${topic.id}: attempt ${attempt + 1} — frontmatter invalid: ${result.error.message.split('\n')[0]}`);
  }
  return null;
}

// =============================================================================
// Main
// =============================================================================

function slugifyForFile(topic: Topic): string {
  const slug = topic.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${topic.id}-${slug}.md`;
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing. Set it in GitHub Actions secrets.');
    process.exit(1);
  }

  const queue: Queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const queued = queue.topics.filter((t) => t.status === 'queued');

  if (queued.length === 0) {
    console.log('No queued topics. Nothing to generate.');
    return;
  }

  const todays = queued.slice(0, POSTS_PER_RUN);
  console.log(`Generating ${todays.length} post(s)...`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (const topic of todays) {
    const filename = slugifyForFile(topic);
    const filepath = path.join(POSTS_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  ${topic.id}: file already exists, marking drafted and skipping.`);
      topic.status = 'drafted';
      continue;
    }

    console.log(`  ${topic.id}: ${topic.title}`);
    try {
      const markdown = await generateValidPost(client, topic);
      if (!markdown) {
        // Two attempts both produced invalid frontmatter. Leave status
        // as 'queued' so tomorrow's cron retries the topic — the bug is
        // probably stochastic (Claude rolled a duplicate-key dice twice
        // in a row); a fresh attempt next run will likely succeed.
        console.error(`  ${topic.id}: both attempts produced invalid frontmatter — leaving status 'queued' for retry next run.`);
        // Leaving topic.status === 'queued' (no mutation).
        continue;
      }
      fs.writeFileSync(filepath, markdown, 'utf-8');
      topic.status = 'drafted';
      console.log(`  ${topic.id}: wrote ${filename}`);
    } catch (err) {
      console.error(`  ${topic.id}: generation failed`, err);
      topic.status = 'skipped';
    }
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
