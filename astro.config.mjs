import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// IMPORTANT: replace site below with the real domain once Gio plugs in his.
// Used by sitemap, RSS, canonical URLs.
export default defineConfig({
  site: 'https://mundanemode.com',
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
