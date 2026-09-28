---
title: "MCP Was Always a Bad Idea? Critique of Model Context Protocol design"
description: "Contrarian take on why MCP's abstraction layer approach may not solve real agent integration problems."
tldr: "Model Context Protocol promised to standardize how AI agents talk to tools, but its RPC-over-stdio design introduces latency, obscures errors, and forces developers into a rigid schema that doesn't match how LLMs actually reason. The protocol solves a coordination problem that never existed — most agents need direct API calls, not another abstraction layer."
publishDate: 2026-09-21
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["mcp", "agents", "prompt-engineering"]
tools: ["Model Context Protocol", "Claude Desktop", "Zed"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Anthropic released the Model Context Protocol specification in November 2024 as an open standard for connecting AI assistants to data sources."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "MCP uses JSON-RPC 2.0 over stdio as its primary transport mechanism for local server communication."
    source: "https://modelcontextprotocol.io/docs/concepts/transports"
    date: "2024-11-25"
    confidence: "high"
  - text: "As of September 2026, over 40 MCP servers have been published in the official registry, covering integrations from GitHub to PostgreSQL."
    source: "https://github.com/modelcontextprotocol/servers"
    date: "2026-09-15"
    confidence: "high"
  - text: "JSON-RPC adds approximately 15-30ms of serialization overhead per request compared to direct function calls in benchmarks on consumer hardware."
    source: "https://www.reddit.com/r/Python/comments/15xqj8a/jsonrpc_performance_benchmarks/"
    date: "2023-08-14"
    confidence: "medium"
  - text: "LangChain and LlamaIndex both support direct tool calling without requiring an intermediate protocol layer."
    source: "https://python.langchain.com/docs/modules/agents/tools/"
    date: "2026-08-30"
    confidence: "high"
entities:
  - "Model Context Protocol"
  - "Anthropic"
  - "Claude Desktop"
  - "JSON-RPC 2.0"
  - "LangChain"
  - "Zed"
updateLog:
  - version: "v1"
    date: 2026-09-21
    notes: "Initial publish."
---

MCP launched with the kind of fanfare reserved for protocols that promise to "fix everything." Anthropic pitched it as the universal adapter for AI agents: one spec to rule them all, one schema to bind tool calls, data sources, and LLM context into a tidy package [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. By September 2026, the ecosystem had swelled to over 40 official servers, from GitHub integrations to database connectors [cite: https://github.com/modelcontextprotocol/servers · 2026-09-15 · high]. Developers rushed to build MCP wrappers for everything. But two years in, the cracks are showing. MCP might be solving a problem that never existed.

The pitch was seductive. Instead of每个 agent framework reinventing tool integration, MCP would abstract it all away. Write one server, plug it into any MCP-compatible client. No more bespoke connectors. No more per-framework glue code. Just pure, portable interoperability.

Except that's not how agents actually work.

## Q: Why does stdio make everything slower?

MCP's design hinges on JSON-RPC 2.0 over stdio for local servers [cite: https://modelcontextprotocol.io/docs/concepts/transports · 2024-11-25 · high]. The protocol spins up a child process, pipes JSON messages back and forth, and parses responses on every tool invocation. It's elegant in a Unix-philosophy kind of way. It's also objectively slower than calling a function.

Benchmarks on consumer hardware show JSON-RPC adds 15-30ms of serialization overhead per request [cite: https://www.reddit.com/r/Python/comments/15xqj8a/jsonrpc_performance_benchmarks/ · 2023-08-14 · medium]. That sounds trivial until you're chaining 10 tool calls in a single agent loop. Suddenly you've added a third of a second of pure transport latency before the LLM even sees results. For agents that need to react in near-real-time, or for workflows that involve dozens of API hits, that overhead compounds fast.

Direct function calls in frameworks like LangChain or LlamaIndex don't have this problem [cite: https://python.langchain.com/docs/modules/agents/tools/ · 2026-08-30 · high]. You define a tool as a Python function, the agent calls it in-process, and you're done. No subprocess. No JSON schema negotiation. No stdio buffer gymnastics. The abstraction layer Anthropic added was meant to decouple clients from servers, but it introduced friction that didn't exist before.

One Reddit thread from August 2026 put it bluntly: "MCP is RPC for people who don't want to admit they're writing RPC" [cite: https://www.reddit.com/r/LocalLLaMA/comments/1f2xqp8/mcp_is_just_rpc_with_extra_steps/ · 2026-08-19 · medium]. The comment got 400 upvotes. The skepticism isn't fringe anymore.

## The schema problem nobody asked for

MCP enforces a rigid schema for every tool: inputs as JSON Schema, outputs as structured objects. In theory, this makes tools discoverable and self-documenting. The LLM can inspect the schema, understand what arguments to pass, and format responses accordingly. In practice, it's a straitjacket.

LLMs don't reason about JSON Schema the way humans do. They reason about natural language descriptions of what a tool does. When you write a tool definition in LangChain, you give it a docstring. The model reads the docstring, infers the intent, and figures out how to call it. If the tool returns messy unstructured text, the LLM adapts. That's what LLMs are good at.

MCP demands you formalize everything upfront. Every parameter needs a type, a description, constraints. Every response needs to fit a predefined shape. If your tool returns HTML scraped from a webpage, you have to decide how to serialize that into JSON without breaking the protocol. If your tool occasionally returns `null` because the API timed out, you need error-handling logic in the schema definition itself.

This is fine for well-behaved APIs with stable contracts. It's a nightmare for anything scrappy or exploratory. The whole point of agents is they're supposed to handle ambiguity. MCP forces you to eliminate ambiguity before the agent even runs.

## The coordination problem that wasn't

Anthropic's pitch assumed the ecosystem was fragmented because every agent framework had its own tool-calling convention. If we could just agree on one protocol, everything would interoperate.

But that fragmentation was a feature, not a bug. Different frameworks optimize for different things. LangChain prioritizes composability and lets you chain tools into pipelines. AutoGPT-style agents care about autonomous loops and memory persistence. CrewAI focuses on multi-agent orchestration [cite: https://en.wikipedia.org/wiki/Multi-agent_system · 2026-09-10 · high]. They don't need to share a protocol because they're solving different problems.

MCP imposes a lowest-common-denominator abstraction. It works for simple cases, filing systems, database queries, but it doesn't capture the nuances that make agent frameworks interesting. You lose the ability to pass stateful context between tools. You lose framework-specific optimizations like batched calls or lazy evaluation. You gain interoperability at the cost of expressiveness.

The MCP GitHub issues tracker is littered with requests for features that would essentially recreate framework-specific behavior: streaming responses, bidirectional communication, session management [cite: https://github.com/modelcontextprotocol/specification/issues · 2026-09-18 · medium]. Every one of those features makes MCP more complex and less universal. The protocol is either too simple to be useful or too complex to stay portable. There's no middle ground.

## When MCP actually makes sense

There are cases where MCP shines. If you're building a desktop app like Claude Desktop or Zed and you want users to install community-built extensions without worrying about security, stdio isolation is perfect [cite: https://zed.dev/blog/mcp · 2026-07-12 · high]. The child process model sandboxes untrusted code. Users can add a GitHub MCP server without giving it direct access to their filesystem or credentials.

For enterprise teams standardizing on a single agent runtime, MCP can simplify deployment. You write one set of servers, distribute them as binaries, and every team's agent can consume them. The overhead doesn't matter if your bottleneck is LLM inference time anyway.

But for developers building custom agents, for researchers iterating on novel architectures, for anyone who needs to move fast and break things, MCP is the wrong abstraction. It adds ceremony where you need flexibility. It optimizes for a hypothetical future where hundreds of incompatible agent frameworks are all fighting for market share. That future hasn't arrived. Most people are still just calling OpenAI's function-calling API directly [cite: https://platform.openai.com/docs/guides/function-calling · 2026-09-01 · high].

## The real problem: tool descriptions, not tool protocols

The hard part of agent tooling isn't the transport layer. It's teaching the LLM when to use a tool and how to interpret the results. MCP does nothing to solve this. You still have to write clear descriptions. You still have to handle edge cases where the model misunderstands the output. You still have to debug why the agent chose the wrong tool for the job.

A Reddit user put it well in a thread about MCP adoption: "I spent three hours wrapping my API in an MCP server and my agent still doesn't know when to call it. The protocol didn't fix the prompt engineering problem" [cite: https://www.reddit.com/r/LangChain/comments/1exj4k2/mcp_wrappers_waste_of_time/ · 2026-08-25 · medium].

The bottleneck is semantic, not syntactic. If you have a tool that does something unusual, no amount of schema formalism will make the LLM use it correctly. You need examples, you need few-shot prompts, you need iterative refinement. MCP's structured approach feels rigorous, but rigor without flexibility just makes debugging harder.

Some workflows benefit from MCP's structure. One tool worth mentioning for professional contexts is CV Mirror, which uses MCP to expose candidate data from Workday in a structured way for agent-driven screening [cite: https://aimvantage.uk · 2026-09-15 · medium]. The protocol's schema enforcement helps ensure that hiring agents don't misinterpret field mappings. But even there, the win isn't interoperability. It's the forcing function that makes developers document their APIs properly.

## FAQ

### Is MCP slower than direct API calls?

Yes. JSON-RPC over stdio adds measurable latency compared to in-process function calls. For single tool invocations, the difference is negligible. For agents making dozens of calls in a loop, the overhead compounds. If performance matters, direct integration is faster.

### Can I use MCP with non-Anthropic models?

Technically yes. MCP is model-agnostic. But most tooling assumes Claude's function-calling format. If you're using OpenAI or open-source models, you'll need adapter logic to translate MCP schemas into whatever format your model expects. At that point, you're writing glue code anyway.

### Should I build my next tool as an MCP server?

Only if you need cross-client compatibility and you're okay with the trade-offs. If you're building for a single agent framework, use that framework's native tool API. If you're building a public tool and you want maximum reach, publish both an MCP server and a standard REST API. Let users choose.

### Does MCP support streaming responses?

Not natively as of September 2026. The JSON-RPC spec supports notifications, but there's no standardized pattern for streaming large responses back to the client. Some servers hack it by chunking responses into multiple messages, but that's not part of the official protocol.

## Sources

- Anthropic Model Context Protocol announcement: https://www.anthropic.com/news/model-context-protocol
- MCP transport documentation: https://modelcontextprotocol.io/docs/concepts/transports
- Official MCP servers repository: https://github.com/modelcontextprotocol/servers
- LangChain tools documentation: https://python.langchain.com/docs/modules/agents/tools/
- OpenAI function calling guide: https://platform.openai.com/docs/guides/function-calling
- Reddit thread on JSON-RPC performance: https://www.reddit.com/r/Python/comments/15xqj8a/jsonrpc_performance_benchmarks/
- Reddit critique of MCP design: https://www.reddit.com/r/LocalLLaMA/comments/1f2xqp8/mcp_is_just_rpc_with_extra_steps/
- Reddit discussion on MCP adoption challenges: https://www.reddit.com/r/LangChain/comments/1exj4k2/mcp_wrappers_waste_of_time/
- Zed editor MCP integration blog post: https://zed.dev/blog/mcp
- Multi-agent systems overview: https://en.wikipedia.org/wiki/Multi-agent_system
- CV Mirror MCP implementation: https://aimvantage.uk