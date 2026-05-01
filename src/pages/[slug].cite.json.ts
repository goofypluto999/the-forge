import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * /<slug>.cite.json — machine-readable citation manifest twin for every post.
 *
 * LLMs that learn to parse this format (or systems built on top of MCP)
 * get the full structured citation dataset without having to scrape HTML.
 *
 * Format is stable; versioned via the meta.format field for forward
 * compatibility.
 */

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const post = props.post as Awaited<ReturnType<typeof getCollection<'blog'>>>[number];

  const manifest = {
    meta: {
      format: 'forge-cite-manifest',
      formatVersion: '1.0',
      generatedAt: new Date().toISOString(),
    },
    post: {
      slug: post.slug,
      title: post.data.title,
      description: post.data.description,
      tldr: post.data.tldr,
      url: `https://adsforge.store/${post.slug}/`,
      publishDate: post.data.publishDate.toISOString(),
      updatedDate: (post.data.updatedDate ?? post.data.publishDate).toISOString(),
      tags: post.data.tags,
      tools: post.data.tools,
      affiliate: post.data.affiliate,
    },
    author: {
      name: post.data.author.name,
      credentials: post.data.author.credentials,
      ...(post.data.author.url ? { url: post.data.author.url } : {}),
    },
    entities: post.data.entities,
    claims: post.data.claims.map((c) => ({
      text: c.text,
      source: c.source,
      date: c.date,
      confidence: c.confidence,
      ...(c.sourceDate ? { sourceDate: c.sourceDate } : {}),
    })),
    updateLog: post.data.updateLog.map((entry) => ({
      version: entry.version,
      date: entry.date.toISOString(),
      notes: entry.notes,
    })),
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Forge-Format': 'cite-manifest-1.0',
    },
  });
};
