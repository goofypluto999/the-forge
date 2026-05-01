#!/usr/bin/env node
/**
 * The Forge — review/approve helper.
 *
 * Lists all topics with status: 'drafted' (ready for human review) and
 * lets you flip them to 'published'. Anything still drafted after a week
 * gets flagged.
 *
 * Usage:
 *   npm run approve            # interactive review
 *   npm run approve -- --all   # approve all drafted in one go (use with care)
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUEUE_PATH = path.join(ROOT, 'topics-queue.json');

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

async function main(): Promise<void> {
  const queue: Queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const drafted = queue.topics.filter((t) => t.status === 'drafted');

  if (drafted.length === 0) {
    console.log('No drafted posts to review.');
    return;
  }

  const approveAll = process.argv.includes('--all');

  if (approveAll) {
    drafted.forEach((t) => { t.status = 'published'; });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
    console.log(`Approved all ${drafted.length} drafted posts.`);
    return;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  console.log(`\n${drafted.length} drafted post(s) ready for review:\n`);

  for (const topic of drafted) {
    console.log(`  [${topic.id}] ${topic.title}`);
    console.log(`     ${topic.description}`);
    console.log(`     date: ${topic.publishDate} · tags: ${topic.tags.join(', ')}`);
    const ans = (await rl.question(`     approve? (y/n/skip) `)).trim().toLowerCase();
    if (ans === 'y') {
      topic.status = 'published';
      console.log('     ✓ approved\n');
    } else if (ans === 'skip') {
      topic.status = 'skipped';
      console.log('     ✗ skipped\n');
    } else {
      console.log('     ↪ left as drafted\n');
    }
  }

  rl.close();
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
  console.log('Done. Run `git status` and commit changes.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
