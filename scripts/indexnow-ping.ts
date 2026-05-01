#!/usr/bin/env node
/**
 * IndexNow ping — notify Bing, Yandex, and other IndexNow-compatible search
 * engines about updated URLs. Run after publish to accelerate indexing.
 *
 * Setup:
 * 1. Generate a key: any 8-128 char hex string. Place in .env as INDEXNOW_KEY
 * 2. Host the key at https://adsforge.store/<KEY>.txt (file content = the key itself)
 *    Astro: drop a file at public/<KEY>.txt with the key as its content
 * 3. Run this script after each deploy
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HOST = 'adsforge.store';
const KEY = process.env.INDEXNOW_KEY ?? '';

if (!KEY) {
  console.error('INDEXNOW_KEY missing from environment.');
  process.exit(1);
}

// Discover URLs from sitemap.xml.ts behaviour: about, archive, plus all blog posts
async function getUrls(): Promise<string[]> {
  const blogDir = path.join(ROOT, 'src/content/blog');
  const slugs = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));

  const urls = [
    `https://${HOST}/`,
    `https://${HOST}/about/`,
    `https://${HOST}/archive/`,
    ...slugs.map((s) => `https://${HOST}/${s}/`),
    ...slugs.map((s) => `https://${HOST}/${s}.cite.json`),
    `https://${HOST}/rss.xml`,
    `https://${HOST}/feed.json`,
    `https://${HOST}/sitemap.xml`,
    `https://${HOST}/llms.txt`,
  ];

  return urls;
}

async function main() {
  const urls = await getUrls();
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  console.log(`Pinging ${urls.length} URLs to ${endpoints.length} IndexNow endpoints...`);

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      console.log(`  ${ep}: HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      console.warn(`  ${ep}: failed - ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
