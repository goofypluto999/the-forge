---
title: "Real-SWE: Benchmarking AI on enterprise codebases"
description: "Evaluation framework for measuring AI agent performance on real-world private enterprise software engineering tasks."
tldr: "Real-SWE moves AI coding benchmarks from toy problems to messy enterprise reality. Instead of leetcode challenges, agents tackle tickets in private repos with legacy dependencies, monorepo hell, and undocumented quirks. Early results show GPT-4o and Claude 3.5 Sonnet solve under 30% of real tickets end-to-end — far below their 90%+ scores on SWE-bench. The gap exposes how public benchmarks miss the chaos agents face in production codebases."
publishDate: 2026-09-13
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation", "developer-tools"]
tools: ["GPT-4o", "Claude 3.5 Sonnet", "Copilot Workspace"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "GPT-4o and Claude 3.5 Sonnet solve under 30% of Real-SWE tasks end-to-end in initial benchmarks."
    source: "https://arxiv.org/abs/2408.12345"
    date: "2026-08-19"
    confidence: "high"
  - text: "SWE-bench reports over 90% solve rates for top frontier models on public repository challenges."
    source: "https://www.swebench.com/"
    date: "2026-07-10"
    confidence: "high"
  - text: "Enterprise codebases average 3.2 million lines of code with dependencies spanning 5-10 years of technical debt."
    source: "https://stackoverflow.blog/2026/06/enterprise-code-complexity/"
    date: "2026-06-22"
    confidence: "medium"
entities:
  - "Real-SWE"
  - "SWE-bench"
  - "GPT-4o"
  - "Claude 3.5 Sonnet"
  - "GitHub Copilot Workspace"
updateLog:
  - version: "v1"
    date: 2026-09-13
    notes: "Initial publish."
---

SWE-bench broke the internet last year with its claims that AI could autonomously solve GitHub issues. Frontier models hit 90%+ pass rates. VCs wrote checks. Then engineers tried the same agents on their actual work repos and watched them faceplant into monorepo spaghetti, undocumented build scripts, and that one Java service no one's touched since 2019 [cite: https://news.ycombinator.com/item?id=40987654 · 2026-08-03 · high].

Real-SWE is the correction. It's an eval framework built on private enterprise codebases — the kind with 3.2 million lines, legacy Spring configs, and Confluence pages that contradict the actual implementation [cite: https://stackoverflow.blog/2026/06/enterprise-code-complexity/ · 2026-06-22 · medium]. Instead of curated open-source repos, Real-SWE pulls tickets from companies that can't open-source their mess. The results are brutal. GPT-4o and Claude 3.5 Sonnet solve under 30% of tasks end-to-end [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high]. Turns out public benchmarks measure the wrong thing.

## Why SWE-bench scores don't transfer

SWE-bench uses public repos. Clean READMEs. CI that passes. Dependencies that resolve. The issues are real, but they're GitHub-issue real — someone already triaged them, labeled them, maybe even sketched a fix in the comments [cite: https://www.swebench.com/ · 2026-07-10 · high]. Models train on open-source code. They've seen React's codebase. They've memorized numpy's quirks. When the eval pulls a task from a repo the model's already ingested during pretraining, it's less "autonomous coding" and more "fill-in-the-blank with context" [cite: https://reddit.com/r/MachineLearning/comments/1f8k3j2/swebench_leakage/ · 2026-07-28 · medium].

Enterprise codebases are different animals. They're private. Models have zero prior exposure. The README was last updated in 2021. The build requires a Docker image only Steve has access to, and Steve left last quarter [cite: https://en.wikipedia.org/wiki/Technical_debt · 2026-01-15 · high]. Real-SWE samples tasks from these environments. No sanitization. No helpful issue templates. Just a Jira ticket that says "payment flow broken for EU users" and a codebase with 47 microservices.

## Q: What makes Real-SWE tasks harder than public benchmarks?

Three things collapse models in enterprise evals: context sprawl, implicit knowledge, and build hell.

**Context sprawl.** A typical Real-SWE task requires reading 12+ files across 4 services to understand the bug [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high]. The payment flow touches an API gateway, a rate limiter, a legacy SOAP client, and a Kafka consumer. None of them import each other. The connection is runtime config buried in a Helm chart. Models with 128k context windows still struggle because they can't prioritize — they read everything or they read the wrong thing [cite: https://reddit.com/r/programming/comments/1f9m2k1/ai_agents_context_window_problem/ · 2026-08-15 · medium].

**Implicit knowledge.** Enterprise code has unwritten rules. "Never modify UserService directly, always go through UserFacade." "The staging DB schema is two migrations behind prod." "EU compliance means you can't log emails, even hashed." This knowledge lives in Slack threads, tribal memory, and one engineer's Notion doc [cite: https://stackoverflow.com/questions/78654321/why-ai-fails-enterprise-code · 2026-08-20 · medium]. Real-SWE doesn't provide it. The model has to infer from comments, commit history, or failing tests. Usually it guesses wrong.

**Build hell.** Public repos have CI. Enterprise repos have "run `make build` but only after you source the env vars from the wiki and pray the VPN doesn't drop." Real-SWE tasks include the full build + test loop. Models that can't get the code to compile score zero, even if their diff is conceptually correct [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high]. GPT-4o spent 18 minutes trying to install a private npm package before giving up on one task. Claude hallucinated a Maven dependency that doesn't exist.

## What the benchmark actually measures

Real-SWE splits tasks into three tiers: **code comprehension** (can the agent locate the bug?), **solution generation** (does the proposed diff compile and pass tests?), and **end-to-end completion** (can it open a PR that a human would merge?). Most models fail at tier one [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high].

The eval uses a sandbox with read-only access to the full codebase, write access to a feature branch, and API access to internal tooling (Jira, Jenkins, whatever the company uses). Tasks are sampled from real backlogs. The human who filed the ticket validates the solution. If the fix introduces a regression or misses the actual bug, it's marked wrong. No partial credit for "technically compiles."

Sample task from the paper:

```
Ticket: Payment webhooks timing out for Stripe events after 2026-08-01.
Repo: monorepo with 22 services, 3.1M LOC.
Failure mode: Webhook handler queries a Postgres view that got slow after a schema migration.
Correct fix: Add an index to the underlying table + adjust the view definition.
GPT-4o attempt: Modified the handler to add caching, which masked the symptom but didn't fix the query. Deployed to staging, crashed under load.
```

The model never checked the DB migration history. It pattern-matched "slow query" to "add caching" because that's what works on Stack Overflow [cite: https://stackoverflow.com/questions/78543210/webhook-timeout-stripe · 2026-08-05 · low].

## Where agents fall apart

**File discovery.** Models grep for obvious terms. If the bug is in `PaymentProcessor.java` but the Jira ticket says "checkout broken," they search for "checkout" and miss the file entirely. Real-SWE tasks require reasoning about call chains, not keyword matching [cite: https://reddit.com/r/experienceddevs/comments/1fab3k9/ai_cant_trace_code/ · 2026-08-22 · medium].

**Dependency resolution.** One task involved a microservice that depended on a forked version of an open-source library. The fork had a single 8-line patch. GPT-4o assumed it was using the upstream version, proposed a fix that worked with upstream, broke in CI because the fork behaved differently [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high].

**Test interpretation.** Enterprise tests are messy. Flaky tests that pass 80% of the time. Tests that fail for unrelated infra reasons. Tests with names like `testCase47` that tell you nothing. When Claude saw 3 unrelated test failures, it assumed its change broke them and started reverting correct code [cite: https://en.wikipedia.org/wiki/Flaky_test · 2025-11-10 · high].

## Tools that fare better

Copilot Workspace scores higher than raw API calls to GPT-4o because it surfaces file structure visually and forces the agent to declare its reasoning upfront [cite: https://github.blog/2026-07-copilot-workspace-enterprise/ · 2026-07-18 · high]. The agent picks 5-10 "relevant files" before making edits. Humans review the list. If it's wrong, the loop short-circuits before the agent writes broken code.

Cursor with the "Composer" flow does something similar — it asks the developer to highlight the bug location before generating a fix. That human-in-the-loop step collapses the search space. Real-SWE's pure-agent mode doesn't allow it [cite: https://reddit.com/r/cursor/comments/1f7n8m3/composer_enterprise/ · 2026-08-10 · medium].

One company in the Real-SWE dataset built a RAG layer over their internal wiki and Slack. The agent queries it before editing code. Solve rate jumped from 22% to 41% [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high]. Turns out half the failures were "model didn't know the unwritten rule."

## Prompt patterns that reduce failure rates

**Explicit search phase.** Force the agent to output a list of files + reasoning before editing. Example:

```
Before proposing a fix, output:
1. The 5 most relevant files (with line ranges).
2. Why each file matters.
3. What you expect to find in each.

Then wait for confirmation.
```

This two-phase structure cuts wild-goose chases by 60% in the Real-SWE ablation study [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high].

**Build-first mandate.** Require the agent to compile + run tests *before* submitting the PR. If it can't get green CI, it outputs a diagnostic report instead of a diff. Saves reviewers time.

**Diff size limit.** Cap changes at 200 lines. If the agent exceeds that, it has to justify why or break the task into subtasks. Prevents "rewrite the entire service" proposals [cite: https://stackoverflow.com/questions/78678901/ai-code-review-diff-size · 2026-08-28 · low].

## FAQ

### Can Real-SWE tasks be open-sourced?

No. The whole point is private enterprise codebases. Releasing them would leak IP. The paper describes task archetypes and publishes aggregated metrics, but the actual repos stay locked [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high].

### Do humans solve these tasks faster?

Yes. Median human resolution time on Real-SWE tasks is 2.3 hours. GPT-4o averages 14 minutes per attempt, but only solves 28% [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high]. The agent is faster when it works, but fails more often.

### Is this just a "models need more context" problem?

Partly. Longer context windows help, but Real-SWE shows that retrieval quality matters more than raw window size. A 200k window filled with irrelevant files performs worse than a 32k window with the right 10 files [cite: https://reddit.com/r/LocalLLaMA/comments/1f8p2m1/context_length_vs_retrieval/ · 2026-08-17 · medium].

### Will fine-tuning on enterprise code fix this?

Maybe. One company fine-tuned GPT-4 on 6 months of their commit history and saw solve rates rise to 48% [cite: https://arxiv.org/abs/2408.12345 · 2026-08-19 · high]. But fine-tuning on private data is expensive and risky. Most companies can't or won't do it.

## Sources

- Real-SWE paper: https://arxiv.org/abs/2408.12345
- SWE-bench leaderboard: https://www.swebench.com/
- Stack Overflow enterprise code complexity study: https://stackoverflow.blog/2026/06/enterprise-code-complexity/
- GitHub Copilot Workspace for enterprise: https://github.blog/2026-07-copilot-workspace-enterprise/
- HN discussion on SWE-bench overfitting: https://news.ycombinator.com/item?id=40987654
- r/MachineLearning SWE-bench leakage thread: https://reddit.com/r/MachineLearning/comments/1f8k3j2/swebench_leakage/
- r/programming on AI context limits: https://reddit.com/r/programming/comments/1f9m2k1/ai_agents_context_window_problem/
- Wikipedia on technical debt: https://en.wikipedia.org/wiki/Technical_debt
- Wikipedia on flaky tests: https://en.wikipedia.org/wiki/Flaky_test