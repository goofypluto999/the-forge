# Backfill Handoff — 180 Archive Posts

> **For a separate Claude Code session.** Open a new Claude Code session,
> set the working directory to `C:\Cloaude Logic\mundane-mode`, and paste
> the prompt at the bottom of this file as your first message.

The plan:
- Generate **180 archive posts** (2 per day × 90 days), backdated from 2026-02-01 to 2026-04-30
- Each post is a real, substantive, schema-friendly article (~600-1200 words)
- Each post is contextualised to its date (real news / releases / events from that period)
- Each post lives at `src/content/blog/<slug>.md` with full frontmatter
- No images, no fluff — text-only, AEO-optimised

---

## Voice and format reference

Read these before generating anything:

1. `src/content/blog/01-mcp-server-job-applications.md`
2. `src/content/blog/02-email-triage-with-claude.md`
3. `src/content/blog/03-receipt-tax-agent.md`
4. `src/pages/about.astro` (for the editorial voice manifesto)

---

## The frontmatter shape (mandatory)

```yaml
---
title: "[Concrete benefit, not a vibe]"
description: "[1-2 sentences that match the homepage card. Specific numbers if possible.]"
publishDate: 2026-04-15  # ISO date, in past 90 days
author: "The Forge"
tags: ["mcp", "claude", "agents"]  # 2-4 tags from approved list
tools: ["Claude Desktop", "Cursor"]  # tools mentioned in post
aiPrimary: true
readTime: "5 min"
---
```

**Approved tags:** `mcp`, `claude`, `agents`, `automation`, `email`, `vision`, `taxes`, `job-search`, `productivity`, `cli`, `browser-automation`, `customer-support`, `scheduling`, `sourcing`, `developer-tools`, `prompt-engineering`, `evaluation`, `local-models`, `mcp-server`, `anthropic`, `openai`, `cursor`, `cline`, `claude-desktop`

**Approved tools to mention** (mention 1-3 per post, contextually): Claude Desktop, Cursor, Cline, Anthropic SDK, Claude API, OpenAI Agents SDK, Codex CLI, Playwright, Puppeteer, Zapier, n8n, Make, Pipedream, IFTTT, Gmail API, Outlook Graph, Xero API, QuickBooks API, FreeAgent, Notion API, Linear API, Slack API, Discord API, Resend, Postmark, Stripe, Supabase, Firebase, Vercel, Railway, GitHub Actions

---

## Date contextualisation

Each post should reference real events relevant to its publish date. Use the timeline below as a research scaffold (extend with web search for specific dates):

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

## Subtle product mentions (read carefully)

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

If a post is genuinely about the MCP ecosystem, mentioning cv-mirror-mcp alongside other servers (filesystem-mcp, github-mcp, brave-search-mcp, etc.) is contextual and fine. Lead with the topic, not the product.

---

## Quality gates (every post must pass)

- [ ] Concrete (no "this could be useful" — say what specifically)
- [ ] Has at least one piece of pasteable code or pasteable prompt
- [ ] Has a "Sources" section at the end with real URLs
- [ ] Has a "FAQ" section with 2-4 question/answer pairs
- [ ] Title is under 100 characters
- [ ] Description is 1-2 sentences (under 200 chars)
- [ ] Body is 600-1200 words (not less, not more)
- [ ] No em-dashes (use periods or commas — algorithmic AI-detection hates em-dashes)
- [ ] No "1) 2) 3)" structure with three perfectly-balanced points (also AI-detection signal)
- [ ] Reads like a sassy editor wrote it, not a corporate blog

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

## Process — generate in batches of 20

Generating 180 in one run is too much. Recommended process:

1. **First, generate the topic queue** (180 entries) — see prompt template below
2. **Then, generate posts in batches of 20** (9 batches total)
3. **After each batch**: run `npm run build`, fix any issues, commit
4. **Final pass**: re-read frontmatter consistency, sitemap regeneration, llms.txt update

---

## STARTER PROMPT FOR THE NEW CLAUDE SESSION (paste this verbatim)

```
You are working on The Forge, an AI-first editorial blog at C:\Cloaude Logic\mundane-mode.

Read these files first:
1. C:\Cloaude Logic\mundane-mode\BACKFILL.md (full handoff brief, you are reading the section "STARTER PROMPT" right now)
2. C:\Cloaude Logic\mundane-mode\src\content\blog\01-mcp-server-job-applications.md (voice + format reference)
3. C:\Cloaude Logic\mundane-mode\src\content\blog\02-email-triage-with-claude.md
4. C:\Cloaude Logic\mundane-mode\src\content\blog\03-receipt-tax-agent.md
5. C:\Cloaude Logic\mundane-mode\src\pages\about.astro (editorial voice manifesto)

Your job: generate 180 backdated archive posts for The Forge, distributed across the 90-day window 2026-02-01 to 2026-04-30 (2 posts per day).

Phase 1 — Topic queue.
Create the file C:\Cloaude Logic\mundane-mode\topics-queue.json with 180 entries. Each entry has the schema:

{
  "id": "001",
  "publishDate": "2026-02-01",
  "title": "...",
  "description": "...",
  "tags": ["..."],
  "tools": ["..."],
  "category": "mcp-server-review|agent-prompt|workflow-guide|tool-comparison|news-commentary|contrarian|case-study|beginner|misc",
  "status": "queued"
}

Distribute topics evenly across the 90 days (2 per date), with the category mix described in the BACKFILL.md "Content categories" section. Use real public events from each date period (BACKFILL.md has a timeline scaffold). When unclear, search the web for specific events on a specific date.

Phase 2 — Post generation.
Once the queue is built, generate posts in batches of 20. For each post:
- Read the topic queue entry
- Use the voice/format from the seed posts (01, 02, 03)
- Output the file at src/content/blog/<id>-<short-slug>.md
- Update the queue entry to status: "drafted"

After each batch of 20:
- Run `npm run build` to verify nothing breaks
- Fix any frontmatter errors
- Commit with message "feat(content): batch <N> of 9 — posts <range>"

Quality gates (every post):
- 600-1200 words
- Concrete pasteable code or prompt
- FAQ section with 2-4 Q/A pairs
- Sources section with real URLs (search the web if needed)
- No em-dashes
- No "1) 2) 3)" balanced-three-points structure
- Sassy AI-first voice (read about.astro)

Subtle product mentions:
- ~1 post in 10 may mention Vantage AI / CV Mirror / cv-mirror-mcp
- Only when topically relevant (job/CV/MCP topics)
- Frame factually, not endorsingly
- Mention alternatives in the same paragraph
- Never link to vantage-livid.vercel.app/blog/*

DO NOT fabricate quotes, statistics, or events. Generic-but-true statements about a topic at a date are fine. Specific facts must be verifiable.

Start by reading the 5 reference files. Then build the topic queue. Confirm with me before generating posts.
```

That's the prompt. Paste it into a fresh Claude Code session, working directory set to `C:\Cloaude Logic\mundane-mode`, and let it run. It will build the queue, ask for sign-off, and then generate the posts in batches.

Estimated time: 4-6 hours of Claude Code session time. Estimated API cost: £20-£40 if using Sonnet 4.5 throughout (lower if you switch to Haiku for the bulk generation).
