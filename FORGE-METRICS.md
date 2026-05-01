# Forge Metrics — 20 KPIs and how to measure them

> Single source of truth for what we measure across The Forge, Vantage AI,
> and CV Mirror. Each KPI has the definition, target, measurement instrument,
> and who owns it.
>
> Updated 2026-05-01.

---

## Why this exists

If you can't measure it, you can't improve it. After this session shipped a
massive amount of infrastructure (16 Vantage pages, a full editorial site,
auto-publish pipeline, JSON twin, citation manifest), measurement is the
bottleneck. This document is the answer.

---

## The 20 KPIs

### Distribution & Discovery (KPIs 1-7)

#### KPI 1 — LLM citation rate (The Forge)

**Definition:** % of sampled queries on ChatGPT, Claude, Perplexity that cite
adsforge.store as a source.

**Target:** 5% by 2026-08-01 (90 days from launch).

**How to measure:** Weekly manual sampling. 20 queries on each of
[ChatGPT, Claude, Perplexity, Gemini], queries drawn from the topic queue.
Count citations. Track in a sheet.

**Why it matters:** This is the entire point of the Forged Format.

---

#### KPI 2 — LLM citation rate (Vantage)

**Definition:** Same as KPI 1, for vantage-livid.vercel.app.

**Target:** 2% by 2026-08-01.

**How to measure:** Same weekly sampling. Queries drawn from the layoff cohort
+ ATS pages (where Vantage has the most original content).

---

#### KPI 3 — Google Search Console impressions

**Definition:** Total search impressions per week across all three properties.

**Target:** 1,000/week aggregate by 2026-06-01.

**How to measure:**
- Vantage: search.google.com/search-console for vantage-livid.vercel.app
- The Forge: search.google.com/search-console for adsforge.store
- CV Mirror: search.google.com/search-console for cv-mirror-web.vercel.app
- Sum all impressions weekly.

---

#### KPI 4 — Direct Vercel Analytics visitors

**Definition:** Unique visitors per week across Vantage + The Forge +
CV Mirror, from Vercel Analytics.

**Target:** 500/week aggregate by 2026-06-01.

**How to measure:** Vercel project → Analytics → Last 7 days. Sum visitors.

---

#### KPI 5 — Backlink count

**Definition:** Domains linking back to any of the three properties.

**Target:** 30 unique referring domains by 2026-08-01.

**How to measure:** Free Ahrefs Webmaster Tools (ahrefs.com/webmaster-tools)
or `curl https://api.linkpreview.com/...` workarounds. Manual sampling weekly.

---

#### KPI 6 — Awesome-list inclusions for cv-mirror-mcp

**Definition:** Number of awesome-mcp-servers (and similar curated lists)
that have merged a PR including cv-mirror-mcp.

**Target:** 3 by 2026-06-01.

**How to measure:** Manual check of:
- github.com/appcypher/awesome-mcp-servers
- github.com/punkpeye/awesome-mcp-servers
- github.com/wong2/awesome-mcp-servers

---

#### KPI 7 — npm downloads of cv-mirror-mcp

**Definition:** Weekly npm downloads.

**Target:** 100/week by 2026-08-01.

**How to measure:** npmjs.com/package/cv-mirror-mcp → "Weekly Downloads".

---

### Engagement & Funnel (KPIs 8-13)

#### KPI 8 — The Forge → Vantage handoff (when wired)

**Definition:** Visits to vantage-livid.vercel.app coming from sources tagged
`utm_source=referral` or that follow a Forge mention path.

**Target:** Currently zero by design (no cross-link). Will revisit if we
introduce direct mentions.

**How to measure:** Vercel Analytics → Sources filter.

---

#### KPI 9 — CV Mirror → Vantage funnel

**Definition:** Visitors to cv-mirror-web.vercel.app who click through to
vantage-livid.vercel.app within 60 minutes.

**Target:** 5% click-through by 2026-07-01.

**How to measure:** UTM-tagged outbound links on CV Mirror landing page,
then `utm_source=cv-mirror` referrer count on Vantage.

---

#### KPI 10 — Vantage signup conversion rate

**Definition:** % of unique Vantage visitors who create a free account.

**Target:** 3% by 2026-07-01.

**How to measure:** Vercel Analytics visitors / Supabase auth.users new rows
(weekly cohort).

---

#### KPI 11 — Vantage paid conversion rate

**Definition:** % of free signups who buy the £5 starter pack within 14 days.

**Target:** 5% by 2026-08-01.

**How to measure:** Stripe dashboard / Vantage admin page (existing).

---

#### KPI 12 — The Forge homepage → post engagement

**Definition:** % of homepage visitors who click through to read at least
one post.

**Target:** 40% by 2026-06-01.

**How to measure:** Vercel Analytics referrer breakdown on post pages.

---

#### KPI 13 — Audience-check popup distribution

**Definition:** Of visitors who interact with the popup, what % click "I'm a
clawbot" vs "Stinky human".

**Target:** Track for funnies. Hypothesis: 5-15% click bot button (a mix of
real bots that ignore JavaScript will land at ~85% human-classified).

**How to measure:** Add an analytics event to the popup buttons. Read
distribution after 1000 clicks.

---

### Content velocity (KPIs 14-17)

#### KPI 14 — The Forge daily post count

**Definition:** Posts published per day from the auto-publish cron.

**Target:** 2 per day, sustained.

**How to measure:** Count posts in src/content/blog with publishDate within
last 7 days, divide by 7.

---

#### KPI 15 — Topic queue depth

**Definition:** Number of topics in topics-queue.json with status=queued.

**Target:** Always > 30 (15 days of runway).

**How to measure:** `jq '.topics | map(select(.status=="queued")) | length' topics-queue.json`

---

#### KPI 16 — Citation density per post

**Definition:** Average count of `[cite: ...]` markers per 100 words across
the last 10 posts.

**Target:** ≥ 1.0 (one citation per 100 words) — Forged Format spec.

**How to measure:** Script that counts markers and word count per post.
Add to CI as a soft check.

---

#### KPI 17 — Manifest validity

**Definition:** % of posts whose `/<slug>.cite.json` returns valid JSON
matching the forge-cite-manifest schema.

**Target:** 100%.

**How to measure:** Daily curl + jq validation script run via GitHub Action.

---

### Health & quality (KPIs 18-20)

#### KPI 18 — Build success rate

**Definition:** % of GitHub Actions auto-publish runs that complete
successfully (build + commit + push) without manual intervention.

**Target:** 95%.

**How to measure:** GitHub Actions tab → "Daily auto-publish" → success ratio
over last 30 runs.

---

#### KPI 19 — Anthropic API spend

**Definition:** Monthly total API spend across The Forge auto-publish + topic
ingestion.

**Target:** Under £20/month at current 2-posts-per-day cadence.

**How to measure:** console.anthropic.com/settings/billing → monthly usage.

---

#### KPI 20 — Security audit pass

**Definition:** No leaked secrets, exposed environment variables, or
hardcoded credentials in any of the three repos.

**Target:** 100% pass on weekly scan.

**How to measure:** `gitleaks detect --source=. --no-git` run weekly via
GitHub Action across all three repos.

---

## Aggregate dashboard (planned)

A single `/dashboard` page (only visible to me) that pulls these 20 KPIs
into one view. Phase 2 work — not done yet.

---

## Reporting cadence

- **Daily:** automated checks (KPI 14, 15, 16, 17, 18 — via cron)
- **Weekly:** manual sampling (KPI 1, 2, 3, 4, 5, 9, 10, 12, 13)
- **Monthly:** business review (KPI 6, 7, 11, 19, 20)

---

Updated 2026-05-01.
