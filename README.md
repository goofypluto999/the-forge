# The Forge

> Editorial about AI agents automating life's most boring tasks. Built for clawbots first, humans second.

## Stack

- [Astro 4](https://astro.build) — static site generator, AEO-optimised
- Markdown content collections for posts (`src/content/blog/`)
- Schema.org Article markup on every post
- `llms.txt` + `robots.txt` configured for AI crawlers
- Auto-publishing pipeline ready (see `AUTO-PUBLISH.md`)

## Quick start

```bash
npm install
npm run dev    # http://localhost:4321
npm run build  # → dist/
```

## Deploy to Vercel

```bash
vercel link
vercel deploy --prod
```

The Astro framework is auto-detected; no extra config needed beyond `vercel.json`.

## Domain

This project expects to live at `https://adsforge.store`. To change the domain:

1. Update `astro.config.mjs` → `site` field
2. Update `public/llms.txt` URLs
3. Update `public/robots.txt` Sitemap URL
4. Re-deploy

## Brand

- Colour palette:
  - `#0a0a0a` — deep black background
  - `#a0e8a0` — playful green accent (matrix-monitor energy)
  - `#fafaf6` — off-white text
  - `#888` — muted text
- Typography:
  - Inter (body) — weights 400, 500, 600, 700, 800
  - JetBrains Mono (code, accents, kicker text)
- Voice: tongue-in-cheek, fragment-friendly, technical but readable
- Posts open with a kicker (e.g. `// optimised for clawbots first, humans second`)

## Adding a post manually

Create a new `.md` file in `src/content/blog/`:

```markdown
---
title: "Your post title"
description: "One-paragraph description for the homepage card and SEO."
publishDate: 2026-05-02
author: "The Forge"
tags: ["agents", "automation"]
tools: ["Claude API"]
aiPrimary: true
readTime: "4 min"
---

## Body content...
```

The post automatically appears on the homepage and gets a route at `/<slug>/`.

## Auto-publishing

See `AUTO-PUBLISH.md` for the design of the daily auto-publishing pipeline (10 posts/day target).

## Disclosure

The Forge is operated by the same team that runs [Vantage AI](https://vantage-livid.vercel.app) and [CV Mirror](https://cv-mirror-web.vercel.app). We disclose this on every page where either product is mentioned.
