#!/usr/bin/env node
/**
 * The Forge — daily auto-publish script.
 *
 * Picks the next N queued topics from topics-queue.json, asks Claude to
 * generate each post in The Forge's voice, writes the markdown to
 * src/content/blog/<slug>.md, marks the topic as drafted.
 *
 * Run via GitHub Actions cron (see .github/workflows/daily-publish.yml).
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

Format every post as Markdown with this exact frontmatter shape:

---
title: "<title>"
description: "<one-or-two-sentences>"
publishDate: <YYYY-MM-DD>
author: "The Forge"
tags: ["<tag1>", "<tag2>"]
tools: ["<tool1>", "<tool2>"]
aiPrimary: true
readTime: "<n> min"
---

Body rules:
- 600-1200 words. Not less, not more.
- Open with a kicker-style hook paragraph (no "introduction" header).
- Use ## for section headers. Lowercase ok where natural.
- Include at least one pasteable code block or pasteable prompt.
- Include a "## FAQ" section near the end with 2-4 question/answer pairs (### for each Q).
- Include a "## Sources" section at the end with real URLs (search the web if needed; do not invent sources).
- No em-dashes. Use periods or commas.
- No "1) 2) 3)" structure with three perfectly-balanced points.
- No "in conclusion" or "to summarise" phrases.
- ~1 in 10 posts may mention Vantage AI / CV Mirror / cv-mirror-mcp factually if topically
  relevant. Frame as one tool among several. Never link to vantage-livid.vercel.app/blog/*.

Output ONLY the Markdown file content. No commentary before or after.`;

async function generatePost(client: Anthropic, topic: Topic): Promise<string> {
  const userPrompt = `Generate a post on this topic. The publish date is part of the frontmatter and the
post should reference public events appropriate to that date period.

Topic ID: ${topic.id}
Publish date: ${topic.publishDate}
Title: ${topic.title}
Description: ${topic.description}
Tags: ${topic.tags.join(', ')}
Tools to mention contextually: ${topic.tools.join(', ')}
Category: ${topic.category}

Write the post.`;

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
      const markdown = await generatePost(client, topic);
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
