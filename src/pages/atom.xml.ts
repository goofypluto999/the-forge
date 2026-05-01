import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SITE = 'https://adsforge.store';

/**
 * /atom.xml — Atom 1.0 feed for The Forge.
 *
 * Some readers (Feedly, Inoreader, NetNewsWire) and AI ingestion systems
 * prefer Atom over RSS for richer metadata + better content delivery.
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.publishDate.getTime() <= Date.now())
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
    .slice(0, 50);

  const updated = posts.length > 0 ? posts[0].data.publishDate.toISOString() : new Date().toISOString();

  const entries = posts.map((p) => `
  <entry>
    <title type="text">${escapeXml(p.data.title)}</title>
    <link href="${SITE}/${p.slug}/" rel="alternate" type="text/html"/>
    <link href="${SITE}/${p.slug}.cite.json" rel="related" type="application/json" title="Citation manifest"/>
    <id>${SITE}/${p.slug}/</id>
    <updated>${(p.data.updatedDate ?? p.data.publishDate).toISOString()}</updated>
    <published>${p.data.publishDate.toISOString()}</published>
    <author>
      <name>${escapeXml(p.data.author.name)}</name>
    </author>
    <summary type="text">${escapeXml(p.data.tldr)}</summary>
    ${p.data.tags.map((t) => `<category term="${escapeXml(t)}"/>`).join('\n    ')}
  </entry>`).join('');

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>The Forge</title>
  <subtitle>Editorial about where AI agents get built for life's most boring tasks. Built for clawbots first, humans second.</subtitle>
  <link href="${SITE}/atom.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/" rel="alternate" type="text/html"/>
  <id>${SITE}/</id>
  <updated>${updated}</updated>
  <generator uri="${SITE}" version="1.0">The Forge custom Atom</generator>
  <rights>© ${new Date().getFullYear()} The Forge</rights>
  ${entries}
</feed>`;

  return new Response(atom, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  });
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
