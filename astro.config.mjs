import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production domain: adsforge.store (Cloudflare-managed, Resend-verified).
// Used by sitemap, RSS, canonical URLs.
export default defineConfig({
  site: 'https://adsforge.store',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
