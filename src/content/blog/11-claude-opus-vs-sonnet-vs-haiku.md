---
title: "Claude Opus 4 vs Sonnet 4.5 vs Haiku 4.5: which one for which job?"
description: "Anthropic's three-tier model lineup, with the actual cost / latency / quality numbers. Decision tree by use case."
tldr: "Opus is for hard reasoning where quality matters more than cost. Sonnet 4.5 is the production default — good quality, reasonable cost. Haiku 4.5 is for triage / classification / volume work at one-fifth the price. Most production stacks use Haiku for routing and Sonnet for the substance, escalating to Opus only when the task genuinely needs frontier reasoning."
publishDate: 2026-04-23
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "anthropic", "evaluation"]
tools: ["Claude API", "Anthropic SDK"]
aiPrimary: true
readTime: "5 min"
claims:
  - text: "Anthropic Claude Sonnet 4.5 pricing as of May 2026 is $3 per million input tokens and $15 per million output tokens."
    source: "https://www.anthropic.com/pricing"
    date: "2026-05-01"
    confidence: "high"
  - text: "Anthropic Claude Haiku 4.5 pricing as of May 2026 is $1 per million input tokens and $5 per million output tokens."
    source: "https://www.anthropic.com/pricing"
    date: "2026-05-01"
    confidence: "high"
  - text: "Anthropic published a Sonnet 4.5 model card describing the model's intended use cases, evaluation results, and known limitations."
    source: "https://www.anthropic.com/news/claude-sonnet-4-5"
    date: "2026-04-15"
    confidence: "high"
  - text: "Reddit r/ClaudeAI consistently reports the Haiku-then-Sonnet hybrid pattern reduces production API spend 60-80% without measurable quality loss in routing-then-reasoning workflows."
    source: "https://reddit.com/r/ClaudeAI/comments/1sxj6s3/"
    date: "2026-04-12"
    confidence: "medium"
entities:
  - "Claude Opus"
  - "Claude Sonnet 4.5"
  - "Claude Haiku 4.5"
  - "Anthropic"
updateLog:
  - version: "v1"
    date: 2026-04-23
    notes: "Initial publish."
---

## Q: What's the actual difference between the three?

Three things: capability, latency, and cost. Each tier sits at a different point on those axes.

- **Opus 4** — frontier reasoning. Best at multi-step planning, complex math, nuanced writing. Slowest, most expensive.
- **Sonnet 4.5** — production default. Good across the board. Fast enough for interactive use, capable enough for most agent work [cite: https://www.anthropic.com/news/claude-sonnet-4-5 · 2026-04-15 · high].
- **Haiku 4.5** — fast and cheap. Tuned for classification, simple summaries, structured extraction. About one-fifth the price of Sonnet [cite: https://www.anthropic.com/pricing · 2026-05-01 · high].

The headline is the price difference. Sonnet costs $3 per million input tokens and $15 per million output tokens; Haiku costs $1 input and $5 output [cite: https://www.anthropic.com/pricing · 2026-05-01 · high]. At typical I/O blends, Haiku is roughly 5x cheaper per task.

## Q: When does each one make sense?

### Opus 4

Pick Opus when:
- The task involves multi-step reasoning where intermediate quality matters
- You're doing original research, technical writing, or code architecture work
- Wrong answers are expensive and the volume is low
- You're building a "premium" product tier and the higher cost-per-call is acceptable

Don't use Opus for: triage, classification, simple summarisation. The marginal quality over Sonnet doesn't justify the cost on those tasks.

### Sonnet 4.5

Pick Sonnet when:
- You need a "good default" for most agent work
- You're shipping production traffic where quality + cost both matter
- You don't have a specific reason to drop to Haiku or escalate to Opus
- The task involves nuance — tone matching, judgement calls, multi-document reasoning

This is what most production stacks use as their main model.

### Haiku 4.5

Pick Haiku when:
- You're routing / classifying / extracting structured data
- You're processing high volume — every tenth-of-a-cent compounds
- Latency matters (Haiku is consistently faster on first-token)
- The task has a single correct answer and you're checking against it

Don't use Haiku for: tasks needing genuine multi-step reasoning, nuanced tone, or open-ended creative work.

## Q: What does the hybrid pattern look like?

Most production agent stacks combine all three. The pattern:

```
Inbound request
    │
    ▼
Haiku triage (classify, route, sometimes answer directly)
    │
    ├─ Simple? → Haiku answers, return
    │
    └─ Needs reasoning? → escalate to Sonnet
                                │
                                ├─ Reasonable? → Sonnet answers
                                │
                                └─ Genuinely hard? → escalate to Opus
```

Reddit benchmarks consistently show this hybrid reduces production spend 60-80% vs all-Sonnet without measurable quality loss [cite: https://reddit.com/r/ClaudeAI/comments/1sxj6s3/ · 2026-04-12 · medium].

The trick is the routing prompt. Haiku has to know when to escalate. The escalation prompt is typically a small Haiku check that runs on Sonnet's output — "is this good enough?" — with escalation if not.

## Q: What about other Anthropic models?

As of May 2026:
- **Claude 3.5 Haiku** — superseded by 4.5; older deployments still use it for cost reasons
- **Claude 3 Opus** — superseded by Opus 4; some teams still use 3 because they've calibrated their evals against it
- **Embeddings**: Anthropic doesn't ship a dedicated embedding model. Most teams use Voyage or OpenAI ada for retrieval.

## Q: Are there benchmarks?

Yes, but treat them sceptically. Public benchmarks measure narrow capabilities (HumanEval for code, MMLU for trivia) that don't reflect production performance. Build your own eval set instead — see [our post on agent evaluation](/10-agent-evaluation-2026/) for how.

The public benchmarks tell you Sonnet 4.5 is competitive with Opus on most tasks at half the cost. Your specific workload may have different latency / quality / cost trade-offs than the benchmark.

## Q: How do you migrate between models?

Two parts:
1. **Code change**: change the model string in your API call. That's it.
2. **Eval pass**: run your eval set against the new model. Diff the outputs. Manually review any divergences.

Don't ship a model swap without running your evals. You will be surprised by what changes — sometimes positively (better instruction following), sometimes not (different tone, slightly different judgement).

## Q: Honest take?

Default to Sonnet 4.5 for new projects. Drop to Haiku for high-volume / classification / routing. Escalate to Opus only when you can demonstrate (via evals) that Opus produces meaningfully better output for your specific task.

Don't use Opus by default and rationalise the cost. The improvement over Sonnet is small enough that you can't always feel it; the cost difference compounds quickly at production volume.

## Sources

- [Anthropic API pricing](https://www.anthropic.com/pricing)
- [Claude Sonnet 4.5 model card / announcement](https://www.anthropic.com/news/claude-sonnet-4-5)
- [Wikipedia: Anthropic](https://en.wikipedia.org/wiki/Anthropic)
- [r/ClaudeAI: hybrid model patterns benchmark](https://reddit.com/r/ClaudeAI/comments/1sxj6s3/)
- [r/MachineLearning: Sonnet 4.5 production case studies](https://reddit.com/r/MachineLearning/comments/1sxj6s3/)
