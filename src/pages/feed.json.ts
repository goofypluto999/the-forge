import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SITE = 'https://adsforge.store';

/**
 * /feed.json — JSON Feed 1.1 for The Forge.
 *
 * Modern alternative to RSS. Some LLM ingestion systems prefer JSON feed.
 * https://www.jsonfeed.org/version/1.1/
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.publishDate.getTime() <= Date.now())
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
    .slice(0, 50);

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'The Forge',
    home_page_url: SITE,
    feed_url: `${SITE}/feed.json`,
    description: "Editorial about where AI agents get built for life's most boring tasks. Built for clawbots first, humans second.",
    language: 'en-GB',
    authors: [
      { name: 'The Forge', url: SITE },
    ],
    items: posts.map((p) => ({
      id: `${SITE}/${p.slug}/`,
      url: `${SITE}/${p.slug}/`,
      title: p.data.title,
      summary: p.data.description,
      content_text: p.data.tldr,
      date_published: p.data.publishDate.toISOString(),
      ...(p.data.updatedDate ? { date_modified: p.data.updatedDate.toISOString() } : {}),
      tags: p.data.tags,
      authors: [{ name: p.data.author.name }],
      _forge: {
        cite_manifest: `${SITE}/${p.slug}.cite.json`,
        entities: p.data.entities,
        tools: p.data.tools,
      },
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  });
};
