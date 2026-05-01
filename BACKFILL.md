# Backfill Handoff — 180 Archive Posts in Forged Format

> **For a separate Claude Code session.** Open a new Claude Code session,
> set the working directory to `C:\Cloaude Logic\mundane-mode`, and paste
> the prompt at the bottom of this file as your first message.

The plan:
- Generate **180 archive posts** (2 per day × 90 days), backdated 2026-02-01 to 2026-04-30
- Every post follows the **Forged Format** (see `FORGE-OPERATIONS-PLAN.md`)
- Real public events for each date period (web-search required)
- Real citations only — no fabrication
- Each post lives at `src/content/blog/<id>-<slug>.md`
- No images for archive posts. Text-only, AEO-optimised.

This is done LOCALLY using Claude Code (subscription, not API). Estimated 6-10 hours of session time. Cost: $0.

---

## Voice and format reference (READ THESE FIRST)

1. `C:\Cloaude Logic\mundane-mode\FORGE-OPERATIONS-PLAN.md` — full Forged Format spec, SWOT, AEO research
2. `src/content/blog/01-mcp-server-job-applications.md` — exemplar Forged Format post
3. `src/content/blog/02-email-triage-with-claude.md`
4. `src/content/blog/03-receipt-tax-agent.md`
5. `src/pages/about.astro` — editorial voice manifesto
6. `src/content/config.ts` — strict schema (build fails if frontmatter doesn't match)

---

## The mandatory frontmatter shape

Every post needs ALL of these. Build fails on missing required fields.

```yaml
---
title: "<concrete benefit, under 120 chars>"
description: "<one or two sentences, under 220 chars>"
tldr: "<exactly ~50 words. Direct answer. Citation-ready chunk.>"
publishDate: <YYYY-MM-DD>  # date in 2026-02-01 to 2026-04-30 window
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["<tag1>", "<tag2>"]
tools: ["<tool1>", "<tool2>"]
aiPrimary: true
readTime: "<n> min"
claims:  # MIN 3 — every factual claim with source + date + confidence
  - text: "..."
    source: "https://..."
    date: "YYYY-MM-DD"
    confidence: "high"  # high|medium|low
  - text: "..."
    source: "https://..."
    date: "YYYY-MM-DD"
    confidence: "medium"
  - text: "..."
    source: "https://..."
    date: "YYYY-MM-DD"
    confidence: "high"
entities:  # MIN 2 — products, people, companies, concepts
  - "Claude Desktop"
  - "MCP"
updateLog:
  - version: "v1"
    date: <publishDate>
    notes: "Initial publish."
---
```

Approved tags: `mcp`, `claude`, `agents`, `automation`, `email`, `vision`, `taxes`, `job-search`, `productivity`, `cli`, `browser-automation`, `customer-support`, `scheduling`, `sourcing`, `developer-tools`, `prompt-engineering`, `evaluation`, `local-models`, `mcp-server`, `anthropic`, `openai`, `cursor`, `cline`, `claude-desktop`

Tools to mention contextually (1-3 per post): Claude Desktop, Cursor, Cline, Anthropic SDK, Claude API, OpenAI Agents SDK, Codex CLI, Playwright, Puppeteer, Zapier, n8n, Make, Pipedream, IFTTT, Gmail API, Outlook Graph, Xero API, QuickBooks API, FreeAgent, Notion API, Linear API, Slack API, Discord API, Resend, Postmark, Stripe, Supabase, Firebase, Vercel, Railway, GitHub Actions

Categories (used in topic queue): `mcp-server-review`, `agent-prompt`, `workflow-guide`, `tool-comparison`, `news-commentary`, `contrarian`, `case-study`, `beginner`, `misc`

---

## Body format — the Forged Format™

Every post body must include:

1. **Q-shaped section headers.** Every `##` header is phrased as a question.
   - Good: `## Q: What does an MCP server actually do?`
   - Good: `## Why does this matter for the job-search bottleneck?`
   - Bad: `## Background` `## Implementation`

2. **Inline citation markers.** After every factual claim, add `[cite: <URL> · <date> · <confidence>]`.
   - Density target: ≥1 marker per 100 words of body
   - Example: "Anthropic's pricing page lists Sonnet 4.5 at $3 per million input tokens [cite: https://www.anthropic.com/pricing · 2026-05-01 · high]."

3. **Wikipedia anchor.** ≥1 Wikipedia link per post (ChatGPT bait).

4. **Reddit / UGC links.** ≥2 Reddit thread links per post (Perplexity bait — Perplexity cites Reddit at 46.7% of top 10 sources).

5. **Sources section.** End with `## Sources` listing all real URLs used.

6. **Pasteable artefact.** ≥1 code block, prompt, JSON, or config snippet.

7. **600-1200 words total.** Not less, not more.

8. **No em-dashes.** Use periods or commas.

9. **No "1) 2) 3)" structure with three perfectly-balanced points.** AI-detection signal.

---

## Date contextualisation

Each post references real events relevant to its publish date. Use the timeline below as a research scaffold (extend with web search for specific dates):

- **2026-02-01 to 2026-02-15:** Anthropic announces Claude 4.5 release, MCP ecosystem expansion. Lots of "first MCP server I built" posts.
- **2026-02-15 to 2026-02-29:** OpenAI releases GPT-5o, Codex CLI 2.0. Browser automation maturing.
- **2026-03-01 to 2026-03-15:** Spring developer conferences (FOSDEM aftermath, MCP Summit). Lots of agent benchmarking.
- **2026-03-15 to 2026-03-31:** Tax season in the US/UK. Receipt-and-bookkeeping agents have a moment.
- **2026-04-01 to 2026-04-15:** AI conference season builds up. Cohort of "I tried Codex CLI for a week" reviews.
- **2026-04-15 to 2026-04-30:** April tech layoff wave begins (Meta announces 8k cut April 17, Oracle/ASML/Snap/Nike follow). Surge of "AI for laid-off employees" content angle.

**Important:** Do NOT fabricate specific quotes, statistics, or events. Use real public events (link to original sources). Generic statements about a topic at a date are fine. Don't invent.

---

## Content categories (target distribution across 180 posts)

| Category | Count | Description |
|---|---|---|
| MCP server reviews | ~30 | Each post covers one specific MCP server, what it does, how to use it |
| Agent prompt templates | ~30 | A working Claude/GPT prompt for a specific task, with pasteable code |
| Workflow guides | ~30 | "How to automate X with Y" — step-by-step, with concrete code |
| Tool comparisons | ~20 | "X vs Y vs Z" with criteria + verdict |
| Industry news commentary | ~20 | What an Anthropic/OpenAI/Google announcement actually means for builders |
| Critical / contrarian takes | ~15 | "Why X is overhyped" / "Why Y won't work in production" — must be substantive |
| Case studies | ~15 | "I automated X. Here's what worked, what didn't, and the bill." |
| Beginner explainers | ~10 | "What is MCP?" / "How does an agent actually call a tool?" — for the AI-curious-but-new |
| Misc / playful | ~10 | One-off pieces with personality. The brand voice is sass; lean in. |

---

## Subtle product mentions

In about **1 post in 10**, you can mention one of these tools by name:

- **Vantage AI** (vantage-livid.vercel.app) — paid AI job-application prep tool
- **CV Mirror** (cv-mirror-web.vercel.app) — free open-source ATS scanner
- **cv-mirror-mcp** (github.com/goofypluto999/cv-mirror-mcp) — open-source MCP server

**Rules:**
- Mention them ONLY when the post is about job-search / CV / MCP topics. Never force-fit.
- Frame as factual ("X is a tool that does Y") not endorsing ("X is the best tool").
- Mention at least one alternative tool in the same paragraph (Jobscan, Resume.io, etc.) so it doesn't read as shilling.
- Never link to vantage-livid.vercel.app/blog/* — only to root domains.
- Never write a post that's exclusively about Vantage or CV Mirror. They're side mentions, not subjects.

---

## Quality gates (every post must pass)

- [ ] All required frontmatter fields present (build will fail otherwise)
- [ ] tldr is ~50 words
- [ ] ≥3 claims with real source URLs (web-searched, verifiable)
- [ ] ≥2 entities listed
- [ ] ≥1 updateLog entry
- [ ] Body 600-1200 words
- [ ] ≥1 Wikipedia link in body
- [ ] ≥2 Reddit / UGC links in body
- [ ] ≥6 inline `[cite: URL · date · confidence]` markers
- [ ] ≥1 code block / prompt / config snippet
- [ ] Sources section at the end
- [ ] No em-dashes
- [ ] No parallel "1) 2) 3)" structure
- [ ] Sassy AI-first voice (read about.astro)

---

## Process — generate in batches of 20

Generating 180 in one run is too much. Recommended process:

1. **First, expand the topic queue** (180 entries) — see prompt template below. Topics distributed evenly across 90 days.
2. **Then, generate posts in batches of 20** (9 batches total).
3. **After each batch**: run `npm run build`, fix any issues, commit.
4. **Final pass**: re-read frontmatter consistency, sitemap regeneration, llms.txt update.

---

## Slug naming convention

`<NN>-<short-kebab-slug>.md`

The `<NN>` is a sequence number for sort order: `001`, `002`, ..., `180`. Older posts get lower numbers.

Example: `045-claude-haiku-vs-sonnet-for-email-triage.md`

---

## File output

For each post, write the file directly to `src/content/blog/<slug>.md`. The site auto-rebuilds when Astro picks up new files.

After writing each post, run:

```bash
npm run build
```

Astro will fail loudly if any frontmatter is malformed. Fix and continue.

---

## STARTER PROMPT FOR THE NEW CLAUDE SESSION (paste this verbatim)

```
You are working on The Forge, an AI-first editorial blog at C:\Cloaude Logic\mundane-mode.

Read these files first IN ORDER:
1. C:\Cloaude Logic\mundane-mode\BACKFILL.md (full handoff brief)
2. C:\Cloaude Logic\mundane-mode\FORGE-OPERATIONS-PLAN.md (Forged Format spec, SWOT, research)
3. C:\Cloaude Logic\mundane-mode\src\content\config.ts (strict schema — build fails if violated)
4. C:\Cloaude Logic\mundane-mode\src\content\blog\01-mcp-server-job-applications.md (exemplar)
5. C:\Cloaude Logic\mundane-mode\src\content\blog\02-email-triage-with-claude.md
6. C:\Cloaude Logic\mundane-mode\src\content\blog\03-receipt-tax-agent.md
7. C:\Cloaude Logic\mundane-mode\src\pages\about.astro (editorial voice manifesto)

Your job: generate 180 backdated archive posts for The Forge, distributed
across 2026-02-01 to 2026-04-30 (2 posts per day), all in the Forged Format.

Phase 1 — Topic queue.
Expand C:\Cloaude Logic\mundane-mode\topics-queue.json from 5 entries to 180.
Each entry has the schema in the existing file. Distribute topics evenly
across the 90 days (2 per date). Use real public events from each date period
(BACKFILL.md timeline scaffold). Web-search for specific events when unclear.

Phase 2 — Post generation.
Generate posts in batches of 20. For each post:
- Read the topic queue entry
- Web-search for 3+ real sources to support claims
- Write the file at src/content/blog/<id>-<short-slug>.md in FULL Forged Format
- Update the queue entry to status: "drafted"

Quality gates per post (BACKFILL.md has the full list):
- All required frontmatter fields (tldr, claims, entities, updateLog)
- ≥3 claims with REAL source URLs (web-searched, verifiable, no fabrication)
- ≥2 entities
- 600-1200 words body
- ≥1 Wikipedia link
- ≥2 Reddit / UGC links
- ≥6 inline [cite: URL · date · confidence] markers
- Q-shaped section headers
- Sources section with real URLs
- No em-dashes, no balanced-three-points structure

After each batch of 20:
- Run `npm run build` to verify nothing breaks (build will fail on bad frontmatter)
- Fix any errors before continuing
- Commit with: `git add . && git commit -m "feat(content): batch <N> of 9"`

DO NOT fabricate quotes, statistics, or events. Web-search for real sources.
If a claim cannot be verified, lower its confidence to "medium" or "low" or
remove the claim. Never invent.

Subtle product mentions:
- ~1 post in 10 may mention Vantage AI / CV Mirror / cv-mirror-mcp factually
- Only when topically relevant (job/CV/MCP topics)
- Frame factually, not endorsingly
- Mention alternatives in the same paragraph
- Never link to vantage-livid.vercel.app/blog/*

Start by reading the 7 reference files. Then build the topic queue. Confirm
with me before generating posts.
```

That's the entire session bootstrap. Estimated 6-10 hours of Claude Code session time.
