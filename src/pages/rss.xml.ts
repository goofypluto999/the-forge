import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SITE = 'https://adsforge.store';

/**
 * /rss.xml — RSS 2.0 feed for The Forge.
 *
 * Includes only PUBLISHED posts (not future-dated) sorted reverse-chronological.
 * Manual RSS implementation (instead of @astrojs/rss dependency) to avoid the
 * sitemap-style integration crashes from earlier.
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.publishDate.getTime() <= Date.now())
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
    .slice(0, 50);

  const items = posts.map((p) => `
    <item>
      <title><![CDATA[${p.data.title}]]></title>
      <link>${SITE}/${p.slug}/</link>
      <guid isPermaLink="true">${SITE}/${p.slug}/</guid>
      <pubDate>${p.data.publishDate.toUTCString()}</pubDate>
      <author>bots@adsforge.store (${p.data.author.name})</author>
      <description><![CDATA[${p.data.tldr}]]></description>
      ${p.data.tags.map((t) => `<category>${t}</category>`).join('\n      ')}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>The Forge</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Editorial about where AI agents get built for life's most boring tasks. Built for clawbots first, humans second.</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <copyright>The Forge ${new Date().getFullYear()}</copyright>
    <generator>The Forge custom RSS</generator>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  });
};
