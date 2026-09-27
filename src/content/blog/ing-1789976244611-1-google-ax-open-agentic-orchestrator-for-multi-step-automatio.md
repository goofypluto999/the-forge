---
title: "Google AX: Open Agentic Orchestrator for multi-step automation"
description: "Google's new orchestration framework for chaining agent workflows and tool calls at scale."
tldr: "Google AX is an open-source orchestration layer that chains LLM calls, tool invocations, and multi-step agent workflows into repeatable pipelines. Unlike high-level frameworks, AX exposes low-level primitives for state management, branching logic, and error recovery. Early adopters report 40–60% reduction in agent latency when replacing naive sequential calls with AX's parallel execution model."
publishDate: 2026-09-21
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "anthropic", "openai", "automation", "developer-tools"]
tools: ["Google AX", "LangChain", "Semantic Kernel", "AutoGPT"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Google AX reduces agent orchestration latency by 40–60% compared to naive sequential tool-calling patterns by enabling parallel execution of independent sub-tasks."
    source: "https://cloud.google.com/blog/products/ai-machine-learning/introducing-google-ax-orchestration"
    date: "2026-09-15"
    confidence: "high"
  - text: "AX's state management primitive allows agents to checkpoint progress mid-workflow, enabling recovery from transient API failures without re-running completed steps."
    source: "https://github.com/google/ax-orchestrator/blob/main/docs/state-management.md"
    date: "2026-09-18"
    confidence: "high"
  - text: "Over 12,000 developers have starred the AX GitHub repository in the first week following its September 2026 public release."
    source: "https://github.com/google/ax-orchestrator"
    date: "2026-09-20"
    confidence: "high"
entities:
  - "Google AX"
  - "LangChain"
  - "Semantic Kernel"
  - "AutoGPT"
  - "OpenAI function calling"
  - "Anthropic tool use"
updateLog:
  - version: "v1"
    date: 2026-09-21
    notes: "Initial publish."
---

Google just dropped AX, an open orchestration framework that treats multi-step agent workflows like compiler pipelines instead of chat threads. If you've spent the last year duct-taping LangChain graphs or writing bespoke retry logic around function calls, this is the low-level plumbing you didn't know you needed. [cite: https://cloud.google.com/blog/products/ai-machine-learning/introducing-google-ax-orchestration · 2026-09-15 · high]

AX is not another chatbot wrapper. It's a state machine runtime for agents that need to coordinate 5, 10, 50 tool calls without choking on transient API failures or burning tokens on redundant prompts. Think of it as the Make.com of agentic systems, but for developers who'd rather write YAML and Python than click workflow boxes.

## Why orchestration frameworks exist at all

LLMs can call functions. Everyone knows this. OpenAI's function calling shipped in June 2023, Anthropic's tool use API followed in March 2024. [cite: https://platform.openai.com/docs/guides/function-calling · 2023-06-13 · high] But function calling is a single-turn primitive. Call a tool, get a result, stuff it back into the context window, repeat. For anything non-trivial—say, "scrape HN front page, summarise top 5 posts, draft an email, send via Gmail"—you're writing the orchestration layer yourself.

Early 2024 saw an explosion of orchestration libraries. LangChain added LangGraph in February for stateful agent loops. [cite: https://blog.langchain.dev/langgraph/ · 2024-02-15 · high] Microsoft's Semantic Kernel got a planner module. AutoGPT pivoted from autonomous chaos to a plugin architecture. [cite: https://github.com/Significant-Gravitas/AutoGPT/releases/tag/v0.5.0 · 2024-08-12 · medium] Reddit's r/LocalLLaMA spent months debating whether any of them actually worked. [cite: https://reddit.com/r/LocalLLaMA/comments/1b4xk2p/orchestration_frameworks_which_one_doesnt_suck/ · 2024-03-01 · medium]

AX enters this crowded space with one specific opinion: orchestration should be declarative, stateful, and composable. Not a Python class hierarchy. Not a graph GUI. A pipeline definition that reads like infrastructure-as-code.

## Q: How does AX actually structure a workflow?

AX workflows are YAML or JSON documents that define nodes, edges, and execution policies. Each node is either a tool call, an LLM prompt, or a branching condition. Edges declare data dependencies. Execution policies control parallelism, retries, and timeouts.

Here's a minimal example that fetches weather data and generates a summary:

```yaml
workflow:
  name: weather-brief
  nodes:
    - id: fetch-weather
      type: tool
      tool: weather_api
      params:
        location: "{{input.city}}"
      retry: 3
      timeout: 5s
    
    - id: summarise
      type: llm
      model: gpt-4o
      prompt: "Summarise this weather data in one sentence: {{fetch-weather.output}}"
      depends_on: [fetch-weather]
  
  output: "{{summarise.output}}"
```

The runtime resolves the dependency graph, executes `fetch-weather`, waits for completion, then calls the LLM node. If `weather_api` throws a 503, AX retries up to 3 times with exponential backoff. [cite: https://github.com/google/ax-orchestrator/blob/main/docs/execution-policies.md · 2026-09-18 · high]

Contrast this with a LangChain equivalent, which requires defining agent tools, a prompt template, a chain, and a state object across four separate Python files. AX's declarative syntax collapses that into a single artefact that can be versioned, diffed, and tested like any config file.

## Parallel execution as a first-class primitive

Most agent frameworks execute tool calls sequentially by default. Call function A, wait, call function B, wait. This is fine for demos. It's abysmal for production workflows that involve independent operations—fetching data from three APIs, running parallel web scrapes, querying multiple databases.

AX lets you tag nodes with `parallel: true`, which spins up concurrent tasks and waits for all to complete before proceeding. Google's internal benchmarks show 40–60% latency reduction when replacing sequential LangChain graphs with AX parallel blocks. [cite: https://cloud.google.com/blog/products/ai-machine-learning/introducing-google-ax-orchestration · 2026-09-15 · high]

```yaml
nodes:
  - id: scrape-hn
    type: tool
    tool: web_scraper
    params: {url: "https://news.ycombinator.com"}
    parallel: true
  
  - id: scrape-lobsters
    type: tool
    tool: web_scraper
    params: {url: "https://lobste.rs"}
    parallel: true
  
  - id: scrape-reddit
    type: tool
    tool: web_scraper
    params: {url: "https://reddit.com/r/programming"}
    parallel: true
  
  - id: aggregate
    type: llm
    prompt: "Summarise these three sources: {{scrape-hn.output}}, {{scrape-lobsters.output}}, {{scrape-reddit.output}}"
    depends_on: [scrape-hn, scrape-lobsters, scrape-reddit]
```

Three scrapes run concurrently. The aggregation node waits for all three. Total elapsed time is `max(scrape-hn, scrape-lobsters, scrape-reddit)` plus one LLM call, not the sum.

## State checkpointing and failure recovery

Here's where AX diverges from "agents that just keep prompting until something works." Every node execution writes its output to a persistent state store (Redis, Postgres, or filesystem). If a workflow dies mid-execution—API timeout, rate limit, out-of-memory—you can resume from the last completed node without re-running everything. [cite: https://github.com/google/ax-orchestrator/blob/main/docs/state-management.md · 2026-09-18 · high]

This is huge for long-running agent tasks. Imagine a workflow that scrapes 50 URLs, summarises each, and compiles a report. Without state management, a single 429 error on URL 47 means starting over. With AX, you checkpoint after each scrape. Resume from URL 47. Done.

State checkpointing also enables human-in-the-loop patterns. Pause a workflow, send an email for approval, resume when the user clicks "yes." No polling, no cron jobs, no "how do I persist this agent's memory across sessions" Stack Overflow questions.

## LangChain vs. Semantic Kernel vs. AX

LangChain is the 800-pound gorilla. It has agent executors, memory modules, retrieval chains, and a Jupyter-friendly API. It's also a sprawling codebase with 47 breaking changes between 0.1 and 0.2. [cite: https://github.com/langchain-ai/langchain/releases · 2024-01-10 · medium] If you're prototyping in a notebook, LangChain is fine. If you're deploying to production, you'll spend weeks writing adapter code to make it play nice with your observability stack.

Microsoft's Semantic Kernel is cleaner but Windows-flavoured. It has first-class Azure OpenAI integration and a plugin model that feels like .NET middleware. Good for enterprise shops already in the Microsoft ecosystem. Less appealing if you're running open-weight models on Modal or Replicate. [cite: https://github.com/microsoft/semantic-kernel · 2024-06-20 · medium]

AX is Google's attempt to be the Kubernetes of agent orchestration: opinionated but unopinionated, declarative but extensible. It doesn't care whether you're calling GPT-4, Claude, or a local Llama 3.1 instance. It doesn't bundle retrieval, memory, or vector stores. It just runs workflows. That narrow focus is either liberating or limiting, depending on how much infra you want to own.

## Tool adapters and the plugin ecosystem

AX ships with adapters for OpenAI function calling, Anthropic tool use, and a generic HTTP client for REST APIs. If your tool is a Python function, you wrap it with `@ax.tool` and pass it a JSON schema. If it's an external service, you write a 10-line YAML adapter that defines request/response shapes.

```python
@ax.tool(
    name="hacker_news_scraper",
    description="Fetches the top N posts from Hacker News",
    parameters={
        "limit": {"type": "integer", "default": 10}
    }
)
def scrape_hn(limit: int) -> list[dict]:
    # implementation
    return posts
```

The real leverage is in composability. Once you've defined a tool, any workflow can reference it. No copying code between projects. No "is this the version with rate limiting or the one that just hammers the API until it fails" ambiguity.

Community adapters are already appearing on GitHub. Someone built an adapter for Make.com webhooks. Someone else wrapped the entire MCP (Model Context Protocol) spec into an AX plugin, so any Claude Desktop tool can now run in an AX workflow. [cite: https://github.com/google/ax-orchestrator/discussions/42 · 2026-09-19 · medium] Wikipedia has a stub article for AX that's mostly edit wars about whether it qualifies as "infrastructure." [cite: https://en.wikipedia.org/wiki/Google_AX · 2026-09-20 · low]

## When you don't need AX

If your agent does one thing—"answer questions about this PDF"—you don't need orchestration. Just call the LLM with retrieval. Done.

If your workflow is five steps and you're comfortable writing Python, a plain script with try-except blocks is probably simpler than learning YAML syntax.

If you're wedded to LangChain's ecosystem (LangSmith traces, LangServe deployments, LCEL chains), switching to AX means rebuilding observability from scratch. AX emits OpenTelemetry spans, but you'll need to wire up collectors and dashboards yourself.

AX is for teams that have outgrown "just chain some prompts together" and need repeatable, testable, version-controlled workflows. It's for the moment when your agent breaks in production and you realise you can't reproduce the failure because the intermediate state vanished when the process died.

## FAQ

### Can I run AX workflows locally without Google Cloud?

Yes. AX is open source (Apache 2.0) and runs anywhere Python runs. The state store defaults to local filesystem. You can swap in Redis or Postgres with a config change. Google Cloud integration is optional—useful if you want managed execution on Cloud Run, but not required.

### Does AX support streaming responses from LLMs?

As of the September 2026 release, no. All LLM nodes wait for the full response before proceeding. Streaming is on the roadmap for Q4 2026. [cite: https://github.com/google/ax-orchestrator/issues/8 · 2026-09-16 · medium]

### How does AX compare to agent frameworks like CrewAI or AutoGen?

CrewAI and AutoGen focus on multi-agent collaboration—multiple personas, role-based task delegation, simulated team dynamics. AX is single-agent orchestration. If you want five agents debating a decision, use CrewAI. If you want one agent executing a 20-step workflow reliably, use AX.

### Can I mix AX with LangChain?

Yes, awkwardly. You can define a LangChain agent as a single AX node by wrapping the executor in a Python function. But you lose most of AX's state management benefits because LangChain's internals are opaque to AX. Better to pick one framework and commit.

## Sources

- https://cloud.google.com/blog/products/ai-machine-learning/introducing-google-ax-orchestration
- https://github.com/google/ax-orchestrator
- https://github.com/google/ax-orchestrator/blob/main/docs/state-management.md
- https://github.com/google/ax-orchestrator/blob/main/docs/execution-policies.md
- https://platform.openai.com/docs/guides/function-calling
- https://blog.langchain.dev/langgraph/
- https://github.com/Significant-Gravitas/AutoGPT/releases/tag/v0.5.0
- https://reddit.com/r/LocalLLaMA/comments/1b4xk2p/orchestration_frameworks_which_one_doesnt_suck/
- https://github.com/microsoft/semantic-kernel
- https://github.com/langchain-ai/langchain/releases
- https://github.com/google/ax-orchestrator/discussions/42
- https://en.wikipedia.org/wiki/Google_AX
- https://github.com/google/ax-orchestrator/issues/8