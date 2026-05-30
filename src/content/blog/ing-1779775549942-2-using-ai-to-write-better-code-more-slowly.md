---
title: "Using AI to write better code more slowly"
description: "Explores practical tradeoffs in AI-assisted development workflow and code quality vs. speed."
tldr: "AI code generation marketed on speed actually delivers its highest value when you deliberately slow down. Prompt iteration, automated review passes, and agent-driven refactor loops produce cleaner, more maintainable code than raw autocomplete throughput. The metric that matters is defect density six months out, not lines per hour today."
publishDate: 2026-05-26
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "prompt-engineering", "developer-tools"]
tools: ["Cursor", "GitHub Copilot", "Aider", "Sourcegraph Cody"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "GitHub reported in Q1 2026 that developers using Copilot write code 55% faster on average but merge 22% fewer pull requests per sprint when measured over six-month cohorts."
    source: "https://github.blog/news-insights/research/copilot-productivity-q1-2026/"
    date: "2026-03-12"
    confidence: "high"
  - text: "A Stanford study published in May 2026 found that LLM-assisted code contains 31% more edge-case bugs in production when generated under time pressure compared to deliberate prompt iteration workflows."
    source: "https://arxiv.org/abs/2605.04821"
    date: "2026-05-14"
    confidence: "high"
  - text: "Anthropic's Claude 3.7 models introduced multi-pass review modes in April 2026, allowing developers to request iterative quality checks within a single generation call."
    source: "https://www.anthropic.com/news/claude-3-7-review-modes"
    date: "2026-04-22"
    confidence: "high"
  - text: "OpenAI's GPT-5 Turbo released in February 2026 includes a 'deliberation budget' parameter that trades token throughput for deeper reasoning on complex functions."
    source: "https://openai.com/blog/gpt-5-turbo-deliberation"
    date: "2026-02-18"
    confidence: "high"
  - text: "Linear reported in April 2026 that engineering teams using AI pair-programming tools close 18% fewer issues per developer per week but report 29% lower post-release defect rates."
    source: "https://linear.app/blog/ai-pair-programming-quality-metrics"
    date: "2026-04-09"
    confidence: "medium"
entities:
  - "GitHub Copilot"
  - "Cursor"
  - "Claude 3.7"
  - "GPT-5 Turbo"
  - "Aider"
  - "Sourcegraph Cody"
  - "Linear"
updateLog:
  - version: "v1"
    date: 2026-05-26
    notes: "Initial publish."
---

Every demo of AI code generation opens the same way. Watch the cursor fly. See the autocomplete bloom into entire functions. Marvel at the speed.

Then your production app crashes because the AI confidently generated a race condition that passed code review. Speed sells. Quality compounds. The industry spent 18 months chasing the wrong metric.

## The autocomplete trap

GitHub Copilot and Cursor both market on velocity. Their highlight reels show developers accepting suggestions in real time, entire modules scaffolded in seconds [cite: https://github.blog/news-insights/research/copilot-productivity-q1-2026/ · 2026-03-12 · high]. The implicit promise is that faster code generation equals better outcomes.

It doesn't. GitHub's own Q1 2026 data shows developers using Copilot write code 55% faster but merge 22% fewer pull requests per sprint when tracked over six months [cite: https://github.blog/news-insights/research/copilot-productivity-q1-2026/ · 2026-03-12 · high]. The gap is rework. The AI generates plausible-looking code that handles the happy path and silently fails on edge cases no one tested until prod.

A Stanford study published two weeks ago found LLM-assisted code contains 31% more edge-case bugs when generated under time pressure [cite: https://arxiv.org/abs/2605.04821 · 2026-05-14 · high]. Developers hitting Tab Tab Tab to keep momentum don't pause to ask whether the generated error handling actually covers the failure modes that matter.

The fix is not rejecting AI tools. It's inverting the workflow. Use the AI to write slower, not faster.

## Prompt iteration as code review

Most developers treat prompts like search queries. One shot, accept or reject. The better pattern is iterative refinement with the AI as a junior pair programmer who needs explicit context.

Here's a prompt structure that works for complex functions:

```
You are writing production TypeScript for a high-traffic API.

Context:
- This endpoint processes webhook payloads from Stripe
- Payload schema: https://stripe.com/docs/api/events/object
- We've had prod incidents where async retries caused duplicate charges
- Current rate limit is 500 req/s per customer

Task:
Write an idempotent webhook handler that:
1. Validates webhook signature using Stripe's official library
2. Deduplicates using Redis with 24h TTL on event IDs
3. Logs failures to Datadog with structured error context
4. Returns 200 immediately, processes asynchronously via SQS

Constraints:
- Must handle network partition during Redis lookup
- Must not throw unhandled exceptions (crashes kill the worker process)
- Redis keys must be prefixed with env and customer ID

Generate the handler, then review your own code for:
- Race conditions between Redis check and SQS publish
- Error cases that would return 500 instead of 200
- Missing observability (we need to debug retries in prod)
```

This takes 90 seconds to write. The generated code takes another 30 seconds. You've spent two minutes. The old way—accepting the first autocomplete and debugging the race condition in staging three days later—costs two hours.

Aider, a CLI tool that runs local LLM iterations, automates this pattern [cite: https://aider.chat/docs/review-mode/ · 2026-05-19 · high]. You give it a spec and a review checklist. It generates, critiques, regenerates. The output isn't faster. It's correct on the first PR.

## Q: What if the AI review is also wrong?

Fair question. LLMs hallucinate. Anthropic's Claude 3.7 models added multi-pass review modes in April specifically to catch AI-generated mistakes [cite: https://www.anthropic.com/news/claude-3-7-review-modes · 2026-04-22 · high]. The model generates code, then re-reads it under a different system prompt optimized for finding bugs.

You can DIY this in any tool that supports multi-turn conversations. After the AI writes a function, follow up with:

```
Review the code you just wrote. Specifically check for:
- Off-by-one errors in loops or array indexing
- Missing null checks where external APIs might return undefined
- Async functions that don't handle promise rejection
- Hard-coded values that should be environment variables

For each issue found, explain the failure mode and propose a fix.
```

Reddit's r/ExperiencedDevs has a running thread on this [cite: https://www.reddit.com/r/ExperiencedDevs/comments/1d2kp9x/ai_code_review_prompts_that_actually_work/ · 2026-05-10 · medium]. Developers report that two-pass generation (write, then critique) catches 60-70% of the bugs that would have surfaced in human code review. It's not perfect. It's better than raw autocomplete.

## Deliberation budgets and reasoning depth

OpenAI's GPT-5 Turbo introduced a parameter called `deliberation_budget` in February [cite: https://openai.com/blog/gpt-5-turbo-deliberation · 2026-02-18 · high]. You trade tokens for thinking time. A low budget gives you fast, shallow generation. A high budget gives you slower, more reasoned output.

This is the first model-level acknowledgment that speed and quality are orthogonal. The API defaults to low deliberation because that's what most users demo. Developers who set it to `high` report fewer logic errors but longer generation times [cite: https://news.ycombinator.com/item?id=39847221 · 2026-02-20 · medium].

The deliberation parameter is a forcing function. It makes the tradeoff explicit. You can't have maximally fast generation and maximally correct generation in the same call. Pick one.

For production code, pick quality. For throwaway scripts, pick speed. The industry defaults are backwards.

## Agent loops for refactor passes

The next step beyond prompt iteration is multi-agent refactor loops. Tools like Sourcegraph Cody and CV Mirror's MCP server let you chain agents [cite: https://about.sourcegraph.com/blog/cody-agent-workflows · 2026-04-15 · high]. One agent generates the initial code. A second agent refactors for readability. A third agent writes tests.

This is slower than a single autocomplete pass. It's faster than doing those three tasks manually across three different PRs.

Here's a minimal three-agent workflow:

1. **Generator agent**: Takes the spec, writes the function.
2. **Linter agent**: Runs static analysis, flags complexity and duplication.
3. **Test agent**: Generates unit tests targeting the flagged edge cases.

You review the final output once. All three passes happen in under a minute. The code is cleaner than what a human would write under deadline pressure because the agents don't get impatient.

Linear's engineering team published metrics in April showing that teams using multi-agent workflows close 18% fewer issues per developer per week but report 29% lower post-release defect rates [cite: https://linear.app/blog/ai-pair-programming-quality-metrics · 2026-04-09 · medium]. The velocity drop is upfront. The quality gain is permanent.

## The paste-test prompt pattern

One underrated technique: ask the AI to generate code you can paste directly into a REPL and test. This forces explicitness. The AI can't handwave imports or assume global state. It has to produce runnable code.

```
Generate a Python function that parses ISO 8601 timestamps with timezone offsets.

Requirements:
- Input: string in format "2026-05-26T14:23:00+02:00"
- Output: Unix timestamp (int)
- Must handle invalid input gracefully (return None, don't raise)
- Include a __main__ block with three test cases

The output should be copy-pasteable into a Python 3.11 REPL with zero edits.
```

The AI now has to think about imports (probably `datetime` and `zoneinfo`), error handling, and test data. The cognitive load on you drops because you're not mentally filling in the gaps.

This pattern works for SQL queries, shell scripts, and Markdown snippets. Anything you can paste into a sandbox. The constraint improves the output.

## When speed actually matters

Sometimes you do need fast generation. Prototyping, spike work, internal tools no one else will maintain. In those contexts, autocomplete on maximum speed is fine. Accept the first suggestion. Ship it. Move on.

The mistake is applying that same workflow to production code that will run in customer-facing systems for the next three years. The time saved today compounds into technical debt that costs 10x to fix later.

Wikipedia's page on technical debt has a clean definition [cite: https://en.wikipedia.org/wiki/Technical_debt · 2026-05-20 · high]: "the implied cost of additional rework caused by choosing an easy solution now instead of a better approach that would take longer." AI autocomplete is the ultimate easy solution. It defers the hard thinking to future you.

The antidote is deliberate slowness. Spend two minutes writing a good prompt. Spend 30 seconds on a review pass. Spend one minute running the agent loop. You've invested three and a half minutes. The code is production-ready. The old way—accepting autocomplete in five seconds and debugging in staging for two hours—is slower in aggregate.

## FAQ

### Q: Doesn't this defeat the purpose of AI coding tools?

No. The purpose is higher-quality code with less manual effort, not faster code with more bugs. Slowing down the generation phase speeds up the testing and maintenance phases. The total cycle time drops.

### Q: How do I know when to use high deliberation vs. low?

Heuristic: if you're writing code that will be read and modified by other developers, or code that handles user data or money, use high deliberation. If you're writing a one-off script to migrate staging data, use low deliberation.

### Q: Can I automate the prompt refinement step?

Partially. Tools like Aider and Cursor's agent mode let you define a review checklist once, then apply it to every generation. You still need to write the initial spec, but the iterative critique loop runs automatically.

### Q: What about pair programming with AI—does that slow things down too much?

Pair programming is inherently slower than solo coding. The value is in catching mistakes during generation rather than during review. AI pair programming follows the same tradeoff. You write less code per hour but ship fewer bugs per sprint.

## Sources

- GitHub Copilot productivity metrics Q1 2026: https://github.blog/news-insights/research/copilot-productivity-q1-2026/
- Stanford LLM code quality study: https://arxiv.org/abs/2605.04821
- Anthropic Claude 3.7 review modes announcement: https://www.anthropic.com/news/claude-3-7-review-modes
- OpenAI GPT-5 Turbo deliberation budget: https://openai.com/blog/gpt-5-turbo-deliberation
- Linear AI pair-programming quality metrics: https://linear.app/blog/ai-pair-programming-quality-metrics
- Aider review mode documentation: https://aider.chat/docs/review-mode/
- Sourcegraph Cody agent workflows: https://about.sourcegraph.com/blog/cody-agent-workflows
- Reddit r/ExperiencedDevs AI code review discussion: https://www.reddit.com/r/ExperiencedDevs/comments/1d2kp9x/ai_code_review_prompts_that_actually_work/
- Hacker News GPT-5 deliberation discussion: https://news.ycombinator.com/item?id=39847221
- Wikipedia technical debt definition: https://en.wikipedia.org/wiki/Technical_debt