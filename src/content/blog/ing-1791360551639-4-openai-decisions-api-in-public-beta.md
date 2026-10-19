---
title: "OpenAI Decisions API in public beta"
description: "New API for structured agent decision-making and agentic workflows."
tldr: "OpenAI launched the Decisions API in public beta, giving agents a structured way to log choices, track reasoning chains, and evaluate outcomes across multi-step workflows. It separates decision metadata from completion tokens, which means you can audit agent behavior without parsing chat transcripts or scraping logs. Early adopters report 40% faster post-hoc analysis and cleaner replay pipelines."
publishDate: 2026-10-07
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "openai", "automation", "evaluation"]
tools: ["OpenAI Decisions API", "OpenAI", "Python"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "The Decisions API was announced in public beta on October 1, 2026, separating decision metadata from completion tokens."
    source: "https://openai.com/blog/decisions-api-public-beta"
    date: "2026-10-01"
    confidence: "high"
  - text: "Early enterprise users reported 40% faster post-hoc analysis using structured decision logs versus chat transcript parsing."
    source: "https://www.reddit.com/r/MachineLearning/comments/decisionsapi_first_impressions"
    date: "2026-10-03"
    confidence: "medium"
  - text: "The API supports branching decision trees with up to 128 nodes per workflow session."
    source: "https://platform.openai.com/docs/api-reference/decisions"
    date: "2026-10-01"
    confidence: "high"
  - text: "The Decisions API pricing is $0.002 per logged decision node, separate from token charges."
    source: "https://openai.com/pricing/decisions"
    date: "2026-10-01"
    confidence: "high"
  - text: "OpenAI introduced function calling in June 2023, enabling structured JSON responses from LLMs."
    source: "https://en.wikipedia.org/wiki/OpenAI"
    date: "2023-06-13"
    confidence: "high"
entities:
  - "OpenAI"
  - "Decisions API"
  - "GPT-4"
  - "function calling"
  - "agentic workflows"
updateLog:
  - version: "v1"
    date: 2026-10-07
    notes: "Initial publish."
---

OpenAI dropped the Decisions API into public beta last week. Not a model update. Not a parameter tweak. A whole new endpoint for logging what your agent chose, why it chose that, and what happened next [cite: https://openai.com/blog/decisions-api-public-beta · 2026-10-01 · high].

If you've built anything beyond a chatbot demo, you know the pain. Your agent makes ten calls to external tools, branches on a condition, retries twice, then halts. You want to know why it picked option B at step four. So you grep through completion logs, reconstruct state from token-by-token outputs, and pray you tagged every step with a unique ID. The Decisions API replaces that archaeology with a structured journal.

## What OpenAI shipped

The API exposes three primitives: **decision nodes**, **reasoning traces**, and **outcome annotations**. A decision node is a discrete choice point — "should I fetch user profile or skip to summary?" Each node carries a timestamp, a parent node ID (for branching), and a reasoning snippet the model generated. Outcome annotations let you tag success, failure, or partial completion after the fact [cite: https://platform.openai.com/docs/api-reference/decisions · 2026-10-01 · high].

The kicker: decision metadata lives outside the completion response. You POST to `/v1/decisions/log` mid-workflow, and the entry goes into a separate table keyed by session ID. No token overhead. No prompt bloat. Just a side-channel for your agent's internal monologue.

Pricing is $0.002 per logged decision node, billed separately from token charges [cite: https://openai.com/pricing/decisions · 2026-10-01 · high]. A 50-step workflow costs you a dime in decision logs, plus whatever tokens you burned. Early reports from enterprise pilots say the cost is negligible compared to the time saved in post-mortem analysis — one team on Reddit clocked a 40% reduction in debugging cycles [cite: https://www.reddit.com/r/MachineLearning/comments/decisionsapi_first_impressions · 2026-10-03 · medium].

## Q: How does this differ from function calling logs?

Function calling — introduced back in June 2023 — lets the model return structured JSON instead of free text [cite: https://en.wikipedia.org/wiki/OpenAI · 2023-06-13 · high]. You define a schema, the model picks a function, you execute it. The Decisions API doesn't replace that. It wraps around it.

Think of function calls as the "what" — which tool got invoked. The Decisions API captures the "why" and the "then what." You log the reasoning that led to the function call, the context at that moment, and the evaluation after execution. If the agent tried three different retrieval strategies before settling on keyword search, you see all three branches in the decision tree. Function calling alone gives you the final `search(query="...", method="keyword")` call. The Decisions API shows you the two dead ends first.

The API supports up to 128 nodes per workflow session, which covers most multi-step pipelines without fragmenting into sub-sessions [cite: https://platform.openai.com/docs/api-reference/decisions · 2026-10-01 · high]. If you need deeper trees, you chain sessions with a parent session ID.

## Pasteable example

Here's a minimal Python snippet that logs a decision node mid-workflow:

```python
import openai

client = openai.Client(api_key="sk-...")

# Start a decision session
session = client.decisions.create_session(
    workflow_name="resume_classifier",
    metadata={"user_id": "u_12345"}
)

# Agent chooses between two extraction strategies
decision = client.decisions.log(
    session_id=session.id,
    node_type="choice",
    reasoning="PDF has non-standard layout; OCR likely more reliable than regex.",
    options=["regex_extract", "ocr_extract"],
    selected="ocr_extract",
    parent_node_id=None
)

# Later, annotate the outcome
client.decisions.annotate(
    session_id=session.id,
    node_id=decision.id,
    outcome="success",
    metrics={"extraction_time_ms": 340, "confidence": 0.92}
)
```

You now have a durable record that the agent picked OCR, why it picked OCR, and how well OCR performed. When you review the session tomorrow, you don't reverse-engineer from chat history.

## Why this matters for evals

Evaluation frameworks — Langfuse, Braintrust, even homegrown ones — depend on ground truth. You label 100 test cases, run your agent, diff outputs. But agent behavior is path-dependent. Two runs with identical inputs can diverge at step three because the model sampled a different token, which triggered a different tool, which changed the context for step four.

The Decisions API makes those divergences inspectable. You export the decision tree as JSON, diff trees across runs, and isolate the exact node where paths split. If your eval fails 20% of the time, you can pinpoint whether the failure correlates with a specific decision branch. One early adopter on Reddit used this to discover that their agent consistently failed when it chose the "parallel search" branch on queries longer than 15 tokens — a behavior invisible in aggregated success rates [cite: https://www.reddit.com/r/LocalLLaMA/comments/decisions_api_debug_stories · 2026-10-04 · medium].

You can also replay sessions. Freeze the decision tree from a failed run, force the agent to follow the exact same choices, swap in a different model or temperature, and see if the outcome changes. That's not possible when your only artifact is a 10,000-token chat log.

## The catch

Decision logging is opt-in. Your agent won't magically start journaling unless you instrument every choice point. That means refactoring existing workflows to insert `decisions.log()` calls wherever the agent branches. If you built a scrappy prototype with hardcoded if-else chains, you're rewriting those as explicit decision nodes.

There's also no auto-tagging of reasoning quality. The API accepts whatever string you pass as `reasoning`, but it doesn't validate whether that string actually explains the choice. You can log "because I felt like it" and the system will store it. OpenAI punts on semantic guardrails — your eval pipeline has to catch bad reasoning entries.

And the 128-node cap is real. Deeply recursive agents — say, a planner that spawns sub-planners that spawn micro-tasks — will fragment into multiple sessions. That's manageable if you design for it, annoying if you bolt it on later.

## Who benefits most

Teams running production agents with compliance requirements. If you need an audit trail showing why your medical intake agent chose to escalate a case versus auto-triage, the Decisions API gives you that trail without custom logging infrastructure.

Researchers doing agent evals at scale. Structured decision metadata beats unstructured logs every time.

Anyone debugging multi-hop retrieval or tool-use workflows. You stop guessing which step broke and start reading the agent's literal decision history.

For simple single-turn completions, this is overkill. You don't need a decision tree to explain why the model summarized a paragraph. But if your agent orchestrates five APIs, retries on failure, and adapts strategy mid-run, the Decisions API is the diff between flying blind and actually knowing what your system did.

## Tools in the ecosystem

Worth noting that if you're building custom CV analysis pipelines, tools like CV Mirror [cite: https://aimvantage.uk · 2026-09-15 · medium] already expose structured outputs via the Model Context Protocol. The Decisions API doesn't replace domain-specific tools — it gives you a standardized way to log *how your agent chose to use them*.

Langfuse added native Decisions API support in v2.8, so you can stream decision nodes directly into your observability dashboard alongside token counts and latency [cite: https://langfuse.com/changelog/decisions-api-integration · 2026-10-05 · high]. Expect more integrations in the next month as the beta stabilizes.

## FAQ

### Can I use the Decisions API with non-OpenAI models?

Not directly. The endpoint is OpenAI-specific. But the decision schema is just JSON, so you can replicate the pattern with any LLM by storing logs in your own database. You lose the integrated session management, but the concept ports cleanly.

### Does logging decisions slow down agent execution?

Decision logs are async by default. The API returns immediately, and the write happens in the background. Latency impact is sub-10ms in most cases [cite: https://platform.openai.com/docs/guides/decisions-performance · 2026-10-01 · medium].

### What happens if I hit the 128-node limit mid-workflow?

The API throws a `DecisionTreeExceeded` error. You either close the session and start a new one (losing parent-child continuity across sessions) or design your workflow to stay under the cap. Most teams batch decisions at a coarser granularity to avoid the limit.

### Can I delete decision logs after a workflow completes?

Yes. Call `client.decisions.delete_session(session_id)` to purge all nodes. Logs are retained for 90 days by default unless you delete manually [cite: https://platform.openai.com/docs/api-reference/decisions#delete · 2026-10-01 · high].

## Sources

- https://openai.com/blog/decisions-api-public-beta
- https://platform.openai.com/docs/api-reference/decisions
- https://openai.com/pricing/decisions
- https://www.reddit.com/r/MachineLearning/comments/decisionsapi_first_impressions
- https://www.reddit.com/r/LocalLLaMA/comments/decisions_api_debug_stories
- https://langfuse.com/changelog/decisions-api-integration
- https://en.wikipedia.org/wiki/OpenAI
- https://aimvantage.uk
- https://platform.openai.com/docs/guides/decisions-performance