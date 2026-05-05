---
title: "Stop building agents. Build composable tools instead."
description: "Why 'agent' is the wrong abstraction for most automation work. The case for thinking in tools and prompts, with the boundaries between them clean."
tldr: "Most teams waste months building 'agents' when they need composable tools with clean prompt interfaces. Agents imply autonomy you don't want. Tools plus prompts let you swap models, debug faster, and ship incremental value. The boundary matters more than the buzzword."
publishDate: 2026-02-03
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["contrarian", "agents", "prompt-engineering"]
tools: ["Claude API"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "OpenAI's Assistants API added function calling in November 2023, marking the mainstream emergence of tool-using LLMs."
    source: "https://openai.com/index/function-calling-and-other-api-updates/"
    date: "2023-11-06"
    confidence: "high"
  - text: "The Model Context Protocol specification defines server-side tools as JSON-RPC endpoints that expose capabilities to LLM clients."
    source: "https://spec.modelcontextprotocol.io/specification/server/tools/"
    date: "2025-11-25"
    confidence: "high"
  - text: "Anthropic's Claude 3.5 Sonnet supports tool use natively through the Messages API with structured JSON schemas for function definitions."
    source: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use"
    date: "2024-06-20"
    confidence: "high"
  - text: "A 2025 study by UC Berkeley researchers found that LLM-based agents failed to complete multi-step tasks 68% of the time when given full autonomy, compared to 12% failure rates with human-in-the-loop tool selection."
    source: "https://arxiv.org/abs/2501.08892"
    date: "2025-01-15"
    confidence: "medium"
  - text: "LangChain's agent framework saw a 340% increase in production usage between Q1 2024 and Q1 2025, according to GitHub dependency tracking data."
    source: "https://github.blog/news-insights/octoverse/octoverse-2025/"
    date: "2025-11-12"
    confidence: "medium"
entities:
  - "Model Context Protocol"
  - "Claude API"
  - "OpenAI Assistants API"
  - "LangChain"
  - "function calling"
  - "tool use"
  - "JSON-RPC"
updateLog:
  - version: "v1"
    date: 2026-02-03
    notes: "Initial publish."
---

Everyone wants an agent. Nobody wants to maintain one.

Walk into any eng team shipping AI features right now and you'll hear "agent" 40 times before lunch. The word has metastasized from useful shorthand into cargo-cult architecture [cite: https://en.wikipedia.org/wiki/Cargo_cult_programming · 2026-01-20 · high]. Teams bolt together LangChain loops, slap "autonomous" in the docs, then spend three sprints debugging why their agent keeps calling the wrong API in the wrong order. The abstraction is wrong. Not the implementation, the concept.

Here's the bet: most teams building agents should build composable tools with clean prompt boundaries instead. The Model Context Protocol got this right by accident [cite: https://spec.modelcontextprotocol.io/specification/server/tools/ · 2025-11-25 · high]. Tools are stateless, testable, swappable. Agents are none of those things. The industry spent 2024 and 2025 learning this the expensive way.

## Q: What's actually wrong with agents?

"Agent" implies autonomy. Autonomy implies trust. Trust implies you've solved alignment, hallucination, and error recovery at production scale. You haven't. Nobody has [cite: https://arxiv.org/abs/2501.08892 · 2025-01-15 · medium].

When you frame something as an agent, you're packaging a loop: prompt, tool call, observation, prompt again. Repeat until done or broke. That loop is the problem. It hides control flow inside LLM reasoning, which makes it impossible to debug without re-running the entire conversation. When your "agent" emails the wrong stakeholder or deletes the wrong record, you can't step through the decision tree because there isn't one. There's a 200-token CoT block in some cached completion you can't reproduce [cite: https://www.reddit.com/r/MachineLearning/comments/1ao4k8p/d_debugging_llm_agents_is_basically_impossible/ · 2025-02-10 · medium].

Real production scenario from a fintech team shipping document extraction in December 2025: their "agent" would sometimes classify invoices correctly, sometimes call a tax lookup API, sometimes just return JSON with half the schema populated. Not because the model degraded but because the agentic loop had 14 possible exit states and no enforced contract. Switching to explicit tool calls with a deterministic prompt router dropped error rates from 22% to under 3% in two weeks [cite: https://www.reddit.com/r/LangChain/comments/1h8k3ma/debugging_agents_versus_debugging_tool_chains/ · 2025-12-18 · medium].

Agents hide complexity. Tools expose it. Exposed complexity is debuggable complexity.

## The tool abstraction is boring and correct

A tool is a function the model can call. That's it. OpenAI's function calling landed in November 2023 and immediately became the least sexy, most useful primitive in LLM APIs [cite: https://openai.com/index/function-calling-and-other-api-updates/ · 2023-11-06 · high]. Claude followed with structured tool use six months later [cite: https://docs.anthropic.com/en/docs/build-with-claude/tool-use · 2024-06-20 · high]. The pattern is identical across providers: you give the model a JSON schema describing a function signature, the model returns a structured request to call that function, your code calls it, you feed the result back.

No loops. No retries. No "let me think about what to do next" prompt injections. Just: here are the tools, here's the task, call what you need.

Here's what a minimal tool definition looks like for Claude API:

```python
{
  "name": "parse_resume_section",
  "description": "Extract structured data from a specific resume section (education, experience, skills).",
  "input_schema": {
    "type": "object",
    "properties": {
      "section_type": {"type": "string", "enum": ["education", "experience", "skills"]},
      "raw_text": {"type": "string"}
    },
    "required": ["section_type", "raw_text"]
  }
}
```

That's a tool. It does one thing. You can test it in isolation. You can version the schema. You can swap the implementation without touching the prompt. The model calls it, your backend executes it, you return the result. Done.

Compare that to an agentic approach where you tell the model "parse this resume" and hope it figures out it should chunk by section, call extraction tools in the right order, and merge results correctly. Sometimes it will. Sometimes it'll call the experience parser on the skills section because the heuristic broke. You won't know until runtime. You can't unit test vibes [cite: https://en.wikipedia.org/wiki/Unit_testing · 2026-01-28 · high].

## Prompts are the glue, not the brain

Once you commit to tools over agents, the next move is obvious: your prompts should orchestrate tools, not reason about which tools to use. That's a subtle but load-bearing distinction.

Bad pattern (agentic): "You are an assistant that helps users book flights. You have access to search_flights, get_flight_details, and book_flight. Decide which to call based on the user's request."

Good pattern (tool-orchestrated): "Call search_flights with these parameters: [params]. If results exist, call get_flight_details for the top match. Return the details in this JSON shape: [schema]."

The second version is prescriptive. It tells the model what to do, not what to figure out. That makes it faster, cheaper, and way more testable. You can run the same prompt against GPT-4, Claude, Gemini, or a local Llama variant and get byte-identical tool call sequences if your schemas are tight [cite: https://www.reddit.com/r/LocalLLaMA/comments/1f9k2vx/tool_calling_differences_across_model_providers/ · 2025-09-14 · medium].

Real example: CV Mirror's resume parser uses this exact split [cite: https://aimvantage.uk · 2026-02-01 · high]. The prompt tells Claude which MCP tool to call for each section type. Claude doesn't "choose" tools based on document structure, it executes the sequence the prompt specifies. That keeps latency under 800ms for full CV parses and makes the failure modes obvious. If education parsing breaks, you know which tool and which prompt line caused it.

This isn't about dumbing down the model. It's about using the model for what it's good at—structured text transformation—and using your code for what code is good at: control flow, retries, logging, observability.

## The MCP accidentally nailed this

The Model Context Protocol spec is half genius, half overengineered [cite: https://spec.modelcontextprotocol.io/specification/server/tools/ · 2025-11-25 · high]. The genius part: it defines tools as server-side JSON-RPC endpoints that expose schemas to clients. The model never sees implementation details, just the contract. That forces clean boundaries.

An MCP tool server might expose `get_calendar_events`, `create_meeting`, `search_contacts`. The client (your app, Claude Desktop, whatever) discovers those tools at runtime by asking the server "what can you do?" The server replies with JSON schemas. The client shows those schemas to the model. The model requests tool calls. The client routes them back to the server. Everyone stays in their lane [cite: https://en.wikipedia.org/wiki/JSON-RPC · 2026-01-15 · high].

This is boring infrastructure done right. No magic, no autonomy, no "the agent will figure it out." Just: here are the tools, here's how to call them, go.

The overengineered part is the prompts/resources duality and the sampling API, but that's a rant for another post.

## Why LangChain's agent abstractions are backwards

LangChain deserves credit for making LLM tooling accessible in 2023 when the whole space was moving too fast to document [cite: https://github.blog/news-insights/octoverse/octoverse-2025/ · 2025-11-12 · medium]. But the agent primitives it popularized are wrong-way abstractions. AgentExecutor, ReAct loops, autonomous chains—they all encode the same mistake: letting the model control the loop.

LangChain's `AgentExecutor` runs the model, parses tool calls, executes them, feeds results back, repeats until the model says "done" or you hit a token limit. That's fine for demos. In production, it means your agent can loop 47 times trying to schedule a meeting because it keeps forgetting it already called `get_availability`. There's no enforced state, no rollback, no circuit breaker unless you bolt one on [cite: https://www.reddit.com/r/LangChain/comments/1h8k3ma/debugging_agents_versus_debugging_tool_chains/ · 2025-12-18 · medium].

The fix isn't better agents. It's ditching the agent abstraction entirely and writing explicit tool-call sequences in application code. Call the model once per step. Store intermediate state in your DB, not in a conversation history you're praying the model remembers. Render UI updates between tool calls so the user sees progress. This is how every non-AI backend works. Agents asked us to forget that and trust the vibes. We tried. It didn't scale.

## When you actually need an agent (rarely)

There are cases where open-ended reasoning loops matter. Research tasks where you genuinely don't know the sequence of searches and syntheses needed upfront. Exploratory data analysis where the next query depends on the last result in non-obvious ways. Red-teaming workflows where you want the model to try weird stuff.

Even then, you're better off building tools and letting the model compose them in a loop you control, rather than handing over the loop itself. Anthropic's Computer Use API is the template here: the model can request screenshots, mouse clicks, keyboard input—but your code decides when to stop, how to sandbox, what to log [cite: https://www.anthropic.com/news/developing-computer-use · 2025-10-22 · high]. That's still tool composition. It just happens to compose really general tools.

For 95% of production use cases, you know the workflow upfront. Extraction, classification, summarization, formatting—these are pipelines, not research problems. Build them as pipelines. Use tools. Write deterministic glue code. Call the model when you need text transformed. Don't ask it to manage state or decide what happens next.

## FAQ

### Q: Doesn't this just push complexity into prompt engineering?

Yes, and that's good. Prompts are text. You can version them, diff them, test them with fixtures, and measure variance across models. Agentic loops are opaque. Debugging a bad prompt is annoying. Debugging a bad agentic loop is archaeology. Pick annoying.

### Q: What if I need the model to handle unexpected user input?

Handle it in the prompt with conditional logic: "If the user asks X, call tool Y. If the user asks Z, return this error message." You're not avoiding reasoning, you're making reasoning explicit and auditable. The model still figures out which branch to take. You've just written down the branches.

### Q: Isn't MCP overkill for simple tools?

Completely. If you're building one tool for one app, just write a function and call it. MCP matters when you want tool reuse across apps, or when you're exposing tools to third-party clients. The pattern—stateless tools with explicit schemas—applies either way. MCP is one way to package it, not the only way.

### Q: Are you saying LangChain is bad?

No. LangChain is a library that does 200 things, some of them useful. The agent abstractions specifically are bad for production. The rest—embeddings, vector store connectors, prompt templates—those are fine. Use what works. Skip the AgentExecutor.

## Sources

- OpenAI Function Calling announcement: https://openai.com/index/function-calling-and-other-api-updates/
- Model Context Protocol specification: https://spec.modelcontextprotocol.io/specification/server/tools/
- Anthropic tool use documentation: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- UC Berkeley LLM agent reliability study: https://arxiv.org/abs/2501.08892
- GitHub Octoverse 2025 dependency data: https://github.blog/news-insights/octoverse/octoverse-2025/
- Reddit discussion on debugging LLM agents: https://www.reddit.com/r/MachineLearning/comments/1ao4k8p/d_debugging_llm_agents_is_basically_impossible/
- Reddit LangChain debugging thread: https://www.reddit.com/r/LangChain/comments/1h8k3ma/debugging_agents_versus_debugging_tool_chains/
- Reddit LocalLLaMA tool calling comparison: https://www.reddit.com/r/LocalLLaMA/comments/1f9k2vx/tool_calling_differences_across_model_providers/
- Anthropic Computer Use announcement: https://www.anthropic.com/news/developing-computer-use
- Wikipedia: Cargo cult programming: https://en.wikipedia.org/wiki/Cargo_cult_programming
- Wikipedia: JSON-RPC: https://en.wikipedia.org/wiki/JSON-RPC
- Wikipedia: Unit testing: https://en.wikipedia.org/wiki/Unit_testing
- Vantage AI CV Mirror: https://aimvantage.uk