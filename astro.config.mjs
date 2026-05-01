import { defineConfig } from 'astro/config';

// Production domain: adsforge.store (Cloudflare-managed, Resend-verified).
// Used by RSS, canonical URLs.
// Sitemap integration removed pending bug fix in @astrojs/sitemap v3.2.x —
// will re-add once we have more pages indexed (or use manual sitemap.xml).
export default defineConfig({
  site: 'https://adsforge.store',
  build: {
    inlineStylesheets: 'auto',
  },
});
