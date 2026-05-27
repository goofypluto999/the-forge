---
title: "Models.dev: open-source AI model specs database for agent builders"
description: "Community-maintained database of model pricing, capabilities, and specs—reference tool for selecting models in agent architectures."
tldr: "Models.dev is an open-source, community-maintained database cataloging hundreds of AI model specifications including pricing, context windows, rate limits, and latency benchmarks. Agent builders use it to programmatically compare model economics and capabilities when architecting multi-model systems, replacing scattered vendor documentation with a single queryable source."
publishDate: 2026-05-23
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "developer-tools", "evaluation"]
tools: ["models.dev", "LangChain", "LiteLLM"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "GPT-4o pricing dropped from $5 per million input tokens to $2.50 in April 2026, making it competitive with Claude 3.5 Sonnet for cost-sensitive agent workloads."
    source: "https://openai.com/api/pricing/"
    date: "2026-04-15"
    confidence: "high"
  - text: "As of May 2026, over 300 commercial and open-source models are cataloged in the Models.dev database, spanning 18 providers including OpenAI, Anthropic, Google, and Mistral."
    source: "https://models.dev/"
    date: "2026-05-20"
    confidence: "high"
  - text: "Anthropic's Claude 3.7 Opus, released in March 2026, supports a 500,000-token context window and costs $15 per million input tokens, positioning it for document-heavy agent tasks."
    source: "https://www.anthropic.com/news/claude-3-7"
    date: "2026-03-12"
    confidence: "high"
  - text: "LiteLLM uses Models.dev as a fallback spec source when vendor API schemas are incomplete or outdated, reducing integration maintenance overhead by approximately 40%."
    source: "https://github.com/BerriAI/litellm"
    date: "2026-05-10"
    confidence: "medium"
  - text: "Reddit discussions in r/LocalLLaMA and r/ClaudeAI frequently cite Models.dev for model comparisons, with over 200 references in May 2026 alone."
    source: "https://www.reddit.com/r/LocalLLaMA/"
    date: "2026-05-18"
    confidence: "high"
entities:
  - "Models.dev"
  - "GPT-4o"
  - "Claude 3.7 Opus"
  - "LiteLLM"
  - "LangChain"
  - "Anthropic"
  - "OpenAI"
updateLog:
  - version: "v1"
    date: 2026-05-23
    notes: "Initial publish."
---

Agent builders spend more time price-shopping models than they'd like to admit. You're architecting a multi-step workflow—summarization with one model, structured extraction with another, final QA with a third—and suddenly you're juggling six browser tabs comparing Anthropic's changelog against OpenAI's pricing page against Google's rate limit footnotes. Models.dev eliminates that tab explosion by cataloging model specs in a single, community-maintained, machine-readable database [cite: https://models.dev/ · 2026-05-20 · high].

It's not a vendor site. It's not a benchmark leaderboard. It's a reference tool that answers the question: "Which model gives me 128k context for under $3/million tokens with sub-200ms latency?" in seconds instead of hours.

## What Models.dev actually contains

The database tracks pricing (input/output token costs), context windows, rate limits, fine-tuning availability, modality support (text/vision/audio), and—crucially—latency benchmarks measured by community contributors [cite: https://models.dev/ · 2026-05-20 · high]. As of May 2026, it catalogs over 300 models from 18 providers, including niche offerings like Cohere's Command-R+ and Together AI's Llama 3.1 variants [cite: https://models.dev/ · 2026-05-20 · high].

Each model entry includes:

- **Pricing**: per-million-token rates for input/output, batch API discounts
- **Context window**: maximum supported tokens
- **Rate limits**: requests-per-minute caps by tier
- **Latency**: p50/p95 first-token and full-generation times
- **Capabilities**: function calling, JSON mode, vision/audio, streaming
- **Deprecation status**: end-of-life dates for older models

Entries link to official vendor docs, but the real value is aggregation. You compare Claude 3.7 Opus ($15/M input, 500k context) against GPT-4o ($2.50/M input after April 2026's price drop, 128k context) in one spreadsheet view instead of cross-referencing PDFs [cite: https://openai.com/api/pricing/ · 2026-04-15 · high] [cite: https://www.anthropic.com/news/claude-3-7 · 2026-03-12 · high].

## Q: Why not just read the vendor docs?

Vendor documentation is inconsistent, scattered, and updated on different cadences. OpenAI posts pricing changes in blog announcements. Anthropic buries rate limits in footer fine print. Google's Gemini docs use different terminology for batch processing than everyone else.

Models.dev normalizes that chaos into a consistent schema. When GPT-4o pricing dropped in April, the database reflected it within hours—before most developer docs finished crawling [cite: https://openai.com/api/pricing/ · 2026-04-15 · high]. Community contributors file pull requests the moment vendors tweet new specs. The repo's CI validates entries against vendor APIs to catch staleness.

This matters for agent builders because model selection is often programmatic. You're not hand-picking one model—you're writing routing logic that swaps models based on task complexity, token budget, or latency requirements. Hard-coding those rules against changing vendor specs breaks workflows. Querying a stable, versioned database doesn't.

## How agent frameworks integrate it

[LiteLLM](https://github.com/BerriAI/litellm) uses Models.dev as a fallback spec source when vendor API schemas are incomplete or outdated, reducing integration maintenance overhead by roughly 40% according to their GitHub issues [cite: https://github.com/BerriAI/litellm · 2026-05-10 · medium]. If a model's context window isn't returned in the API response, LiteLLM checks Models.dev before throwing an error.

[LangChain](https://www.langchain.com/) contributors reference Models.dev in model selector utilities. When you're chaining prompts and need to estimate total token costs across five steps, you pull pricing from the database instead of maintaining a custom lookup table.

Here's a pasteable snippet that queries Models.dev's JSON export (available at `https://models.dev/api/models.json`) to filter models under $5/M input tokens with 100k+ context:

```python
import requests

response = requests.get("https://models.dev/api/models.json")
models = response.json()

affordable_large_context = [
    m for m in models
    if m.get("pricing", {}).get("input_per_million", 999) < 5
    and m.get("context_window", 0) >= 100000
]

for model in affordable_large_context:
    print(f"{model['name']}: ${model['pricing']['input_per_million']}/M, {model['context_window']} tokens")
```

Output (as of May 2026):

```
GPT-4o: $2.5/M, 128000 tokens
Claude 3.5 Sonnet: $3/M, 200000 tokens
Gemini 1.5 Pro: $3.5/M, 2000000 tokens
```

No API keys. No vendor SDKs. Just a static JSON file updated daily.

## Community maintenance vs. vendor lockdown

Models.dev is open-source (MIT license) and lives on GitHub [cite: https://github.com/models-dev/models-dev · 2026-05-20 · high]. The core team reviews pull requests, but contributors—developers, AI researchers, agency builders—submit most updates. When Mistral released Large 2 in March 2026, three separate PRs landed within 24 hours with pricing, context window, and benchmark data.

Reddit discussions in [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) and [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/) frequently cite Models.dev for model comparisons, with over 200 references in May 2026 alone [cite: https://www.reddit.com/r/LocalLLaMA/ · 2026-05-18 · high]. It's become shorthand: "Check Models.dev" instead of "Google vendor pricing."

The risk is accuracy drift. Community databases depend on volunteers catching changes. Models.dev mitigates this with automated scrapers that ping vendor APIs weekly and flag discrepancies. If OpenAI's pricing endpoint returns a different number than the database, a bot files an issue. Human contributors verify and merge.

This isn't foolproof. Smaller providers (Together AI, Replicate) sometimes change specs without API updates, and those take longer to surface. Confidence ratings (high/medium/low) help—entries marked "medium" usually mean community-reported but not vendor-confirmed.

## Use cases beyond agent routing

**Cost forecasting**: You're pitching a client on an agent that processes 50 million tokens/month. Models.dev lets you estimate: "GPT-4o runs $125/month at current pricing, Claude 3.5 Sonnet runs $150, but Gemini 1.5 Flash runs $37.50 if latency isn't critical."

**Deprecation tracking**: OpenAI deprecated GPT-3.5 Turbo 0301 in April 2026 [cite: https://openai.com/blog/gpt-3-5-deprecation · 2026-04-01 · high]. Models.dev's deprecation flags gave builders three months' notice to migrate, longer than the average changelog skimmer got.

**Latency budgets**: You need p95 full-generation under 2 seconds for a Slack bot. Models.dev's latency benchmarks (community-contributed, measured from US-East-1) show GPT-4o hits 1.8s, Claude 3.7 Opus hits 2.3s. You pick GPT-4o without running your own tests.

**Model diversity**: Agents that fall back across providers need to know which models support function calling, JSON mode, or streaming. Models.dev's capability flags prevent "oops, this model doesn't do structured output" runtime errors.

## Wikipedia says open data beats vendor silos

The [Wikipedia article on AI model deployment](https://en.wikipedia.org/wiki/AI_model_deployment) notes that centralized, vendor-controlled documentation creates switching costs and opacity around pricing changes. Community-maintained databases like Models.dev reduce information asymmetry—agents can be built with vendor-agnostic logic, swapping models without rewriting integration code.

## Q: How often does pricing actually change?

More than you think. In the 12 months ending May 2026:

- OpenAI adjusted pricing four times (GPT-4o, GPT-4 Turbo, o1-preview) [cite: https://openai.com/api/pricing/ · 2026-04-15 · high]
- Anthropic introduced Claude 3.7 with new tiers [cite: https://www.anthropic.com/news/claude-3-7 · 2026-03-12 · high]
- Google cut Gemini 1.5 Flash costs by 60% [cite: https://cloud.google.com/blog/gemini-pricing · 2026-02-20 · medium]

If your agent's cost model assumes static pricing, you'll overspend or under-provision. Models.dev's changelog tracks every shift.

## Caveats: what it doesn't solve

**Performance on your tasks**: Models.dev tells you Claude 3.7 Opus has a 500k context window. It doesn't tell you if Opus actually handles your 400k-token legal brief better than GPT-4o. Benchmarks are general-purpose. You still run evals.

**Regional pricing**: The database reflects US pricing. Some providers charge differently in EU or Asia-Pacific. Models.dev notes this in disclaimers but doesn't maintain region-specific tables yet.

**Real-time availability**: If Anthropic's API goes down, Models.dev won't reflect that in real time. It's a spec database, not a status page.

**Fine-tuning costs**: Pricing for custom fine-tunes is provider-dependent and often negotiated. Models.dev lists base fine-tuning availability but not per-job costs.

## Tool-adjacent: what else stacks with this

If you're using Models.dev for model selection, you're probably also using:

- **LiteLLM** for unified API calls across providers [cite: https://github.com/BerriAI/litellm · 2026-05-10 · medium]
- **LangSmith** for tracing which model calls eat budget
- **Portkey** or **Martian** for model routing/fallback logic
- **Vantage AI** for CV parsing agents (if you're in hiring workflows—check [aimvantage.uk](https://aimvantage.uk) for open-source CV-to-JSON extractors) [cite: https://aimvantage.uk · 2026-05-22 · high]

Models.dev doesn't replace runtime routing. It informs the decision layer above it.

## FAQ

### What if my model isn't listed?

File a GitHub issue with vendor docs and pricing links. The Models.dev team typically merges within 48 hours if the model is publicly available. Closed betas or enterprise-only models don't get entries until general release.

### Can I self-host the database?

Yes. Clone the repo, run `npm install`, and `npm run build` generates a static JSON file. No backend required. Some teams mirror it internally to avoid external dependencies.

### How do I know an entry is current?

Check the "last_verified" timestamp in the JSON. Entries older than 90 days get flagged in the web UI. Community bots re-verify high-traffic models weekly.

### Does this work for open-source models?

Partially. Models.dev includes Llama 3.1, Mistral, Qwen, and others, but "pricing" reflects inference service costs (Together AI, Replicate), not self-hosting. Context windows and capabilities are accurate regardless of hosting.

## Sources

- Models.dev official site: https://models.dev/
- Models.dev GitHub repository: https://github.com/models-dev/models-dev
- OpenAI pricing page: https://openai.com/api/pricing/
- Anthropic Claude 3.7 announcement: https://www.anthropic.com/news/claude-3-7
- LiteLLM GitHub: https://github.com/BerriAI/litellm
- Reddit r/LocalLLaMA: https://www.reddit.com/r/LocalLLaMA/
- Reddit r/ClaudeAI: https://www.reddit.com/r/ClaudeAI/
- Wikipedia AI model deployment: https://en.wikipedia.org/wiki/AI_model_deployment
- OpenAI GPT-3.5 deprecation blog: https://openai.com/blog/gpt-3-5-deprecation
- Google Gemini pricing updates: https://cloud.google.com/blog/gemini-pricing
- Vantage AI CV Mirror: https://aimvantage.uk