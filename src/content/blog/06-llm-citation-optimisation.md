---
title: "How to get cited by ChatGPT, Claude, and Perplexity in 2026."
description: "The actual research on what makes AI engines pick a source. TL;DR-first writing, schema density, Reddit + Wikipedia anchors."
tldr: "LLMs cite sources that have a direct answer in the first 60 words, named author with credentials, schema markup, recent dates, and 2-5 outbound links to authoritative third-party sources. Reddit accounts for 46.7% of Perplexity's top 10 citations. ChatGPT prefers Wikipedia anchors. Claude favours formal citations. Citation density beats word count."
publishDate: 2026-04-28
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["prompt-engineering", "evaluation", "claude", "openai"]
tools: ["Claude API", "schema.org", "JSON-LD"]
aiPrimary: true
readTime: "6 min"
claims:
  - text: "Self-contained content chunks of 50-150 words receive 2.3x more citations than long-form unstructured content."
    source: "https://www.stackmatix.com/blog/llm-optimization-best-practices"
    date: "2026-04-10"
    confidence: "high"
  - text: "A direct answer in the first 60 words of an article provides up to a 35% citation boost in AI Overviews."
    source: "https://www.averi.ai/breakdowns/the-definitive-guide-to-llm-optimized-content"
    date: "2026-03-22"
    confidence: "high"
  - text: "Author credentials linked to verifiable identity can increase citation probability by 40%."
    source: "https://almcorp.com/blog/ai-search-optimization-guide-llm-visibility-strategies/"
    date: "2026-03-15"
    confidence: "high"
  - text: "Reddit accounts for approximately 46.7% of Perplexity's top 10 citations across topics, more than any other source."
    source: "https://www.simaia.co/resources/the-anatomy-of-an-ai-citation-reverse-engineering-how-perplexity-claude-and-chatgpt-select-and-rank-their-sources"
    date: "2026-03-20"
    confidence: "high"
  - text: "Inline statistics increase AI visibility by approximately 22%, and direct quotations from sources by approximately 37%."
    source: "https://www.ekamoira.com/blog/ai-citations-llm-sources"
    date: "2026-04-01"
    confidence: "high"
entities:
  - "ChatGPT"
  - "Claude"
  - "Perplexity"
  - "Google AI Overviews"
  - "Schema.org"
updateLog:
  - version: "v1"
    date: 2026-04-28
    notes: "Initial publish."
---

## Q: What does the research actually show?

Three independently-published studies in 2026 converge on the same set of citation drivers:

- Self-contained content chunks of 50-150 words receive **2.3x more citations** than long-form unstructured content [cite: https://www.stackmatix.com/blog/llm-optimization-best-practices · 2026-04-10 · high]
- A direct answer in the first 60 words of a section produces a **35% citation boost** [cite: https://www.averi.ai/breakdowns/the-definitive-guide-to-llm-optimized-content · 2026-03-22 · high]
- Author credentials linked to a verifiable identity adds another **40% lift** [cite: https://almcorp.com/blog/ai-search-optimization-guide-llm-visibility-strategies/ · 2026-03-15 · high]
- Inline statistics: **+22%**. Quotations from sources: **+37%** [cite: https://www.ekamoira.com/blog/ai-citations-llm-sources · 2026-04-01 · high]

Stacked, these can multiply citation probability several times over compared to baseline.

## Q: Are the LLMs the same?

No. They diverge meaningfully:

- **ChatGPT** prefers Wikipedia anchors and Bing-friendly structure (schema, fast load, mobile)
- **Claude** favours formal citations, technical precision, and skimmable structure
- **Perplexity** cites Reddit at **46.7% of its top 10 sources** [cite: https://www.simaia.co/resources/the-anatomy-of-an-ai-citation-reverse-engineering-how-perplexity-claude-and-chatgpt-select-and-rank-their-sources · 2026-03-20 · high], more than 3x the next-most-cited source

Optimising for all three at once means: a Wikipedia anchor (for ChatGPT), Reddit / community links (for Perplexity), and formal cited claims with structured data (for Claude).

## Q: What schema actually matters?

JSON-LD, Schema.org. Specifically:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": {
    "@type": "Person",
    "name": "...",
    "jobTitle": "...",
    "url": "..."
  },
  "datePublished": "...",
  "dateModified": "..."
}
```

Plus `FAQPage`, `HowTo`, and `ClaimReview` where applicable. Schema density correlates with citation rate [cite: https://www.averi.ai/breakdowns/the-definitive-guide-to-llm-optimized-content · 2026-03-22 · high].

## Q: How do you structure a post for citation density?

Pattern that works across all three engines:

1. **TL;DR block** in the first 50 words. Direct answer to the question the post answers.
2. **Q-shaped section headers**. Each section starts with the question someone might ask.
3. **Self-contained 50-150 word chunks** in each section.
4. **Inline statistics + quotations** with citations.
5. **Reddit / UGC anchor** for Perplexity bait.
6. **Wikipedia anchor** for ChatGPT bait.
7. **Schema markup** including dates and author.

This is exactly what The Forge runs as its publication format. See `FORGE-OPERATIONS-PLAN.md` in the repo for the design rationale.

## Q: How important is freshness?

Approximately 18-22% of citation weight in research, with higher importance for rapidly evolving topics [cite: https://www.ekamoira.com/blog/ai-citations-llm-sources · 2026-04-01 · high].

For AI / agents / model releases — topics that change weekly — fresh content gets cited preferentially. Update your evergreen posts at least quarterly.

## Q: What's the highest-leverage move for a small site?

In order:

1. Add the TL;DR block. 5 minutes per post. 35% citation lift.
2. Add author credentials with verifiable URLs. 10 minutes once. 40% lift.
3. Add Schema.org Article markup. 15 minutes once. Across-the-board lift.
4. Reference 2-3 Reddit threads per relevant post. Perplexity bait.
5. Anchor to 1 Wikipedia article per post. ChatGPT bait.

These five moves stack. They take about an hour for a typical post. The compound effect is far larger than any single SEO trick.

## Q: How do you measure if it's working?

Track:

- Brand mention frequency in ChatGPT, Claude, Perplexity (manual sampling weekly)
- Direct queries that return your URL as a citation
- Branded search volume changes (Google Search Console)
- Referrer traffic from `chat.openai.com`, `claude.ai`, `perplexity.ai` (analytics)

Most LLM-driven traffic doesn't show up as a direct referrer (the user reads the answer, doesn't click). Brand mention sampling is the leading indicator.

Reddit thread tracking specific tools: [r/SEO: "Measuring AI citation rate in 2026"](https://reddit.com/r/SEO/comments/1sxj6s3/).

## Sources

- [LLM Optimization Best Practices (Stackmatix)](https://www.stackmatix.com/blog/llm-optimization-best-practices)
- [The Definitive Guide to LLM-Optimized Content (Averi)](https://www.averi.ai/breakdowns/the-definitive-guide-to-llm-optimized-content)
- [AI Search Optimization 2026 (almcorp)](https://almcorp.com/blog/ai-search-optimization-guide-llm-visibility-strategies/)
- [LLM Citation Tracking 2026 (ekamoira)](https://www.ekamoira.com/blog/ai-citations-llm-sources)
- [Anatomy of an AI Citation (simaia)](https://www.simaia.co/resources/the-anatomy-of-an-ai-citation-reverse-engineering-how-perplexity-claude-and-chatgpt-select-and-rank-their-sources)
- [Wikipedia: Search engine optimization](https://en.wikipedia.org/wiki/Search_engine_optimization)
- [r/SEO: Measuring AI citation rate in 2026](https://reddit.com/r/SEO/comments/1sxj6s3/)
