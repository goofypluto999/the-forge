import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { toolComparisons } from '../data/toolComparisons';

const SITE = 'https://adsforge.store';

/**
 * /sitemap.xml — manual sitemap (replaces @astrojs/sitemap which crashes).
 *
 * Includes homepage, about, archive, all published blog posts. Used by Google,
 * Bing, and AI crawlers (when discoverable via robots.txt).
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.publishDate.getTime() <= Date.now())
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

  const today = new Date().toISOString().slice(0, 10);

  const staticPages = [
    { url: '', lastmod: today, priority: '1.0', changefreq: 'daily' },
    { url: 'about/', lastmod: today, priority: '0.7', changefreq: 'monthly' },
    { url: 'archive/', lastmod: today, priority: '0.8', changefreq: 'daily' },
    { url: 'compare/', lastmod: today, priority: '0.85', changefreq: 'weekly' },
    { url: 'changelog/', lastmod: today, priority: '0.6', changefreq: 'weekly' },
  ];

  const postEntries = posts.map((p) => ({
    url: `${p.slug}/`,
    lastmod: (p.data.updatedDate ?? p.data.publishDate).toISOString().slice(0, 10),
    priority: '0.9',
    changefreq: 'monthly',
  }));

  const compareEntries = toolComparisons.map((c) => ({
    url: `compare/${c.slug}/`,
    lastmod: c.updated,
    priority: '0.85',
    changefreq: 'monthly',
  }));

  const all = [...staticPages, ...postEntries, ...compareEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((e) => `  <url>
    <loc>${SITE}/${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  });
};
