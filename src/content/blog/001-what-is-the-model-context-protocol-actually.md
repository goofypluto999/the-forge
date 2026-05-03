---
title: "What is the Model Context Protocol, actually?"
description: "Plain-English explainer of MCP for builders who keep hearing the acronym and want to know what's underneath. The actual transport, the tool-call shape, what changes for them."
tldr: "Model Context Protocol is Anthropic's open standard for connecting AI assistants to external data sources and tools. Instead of baking integrations into every chat app, MCP lets you write one server that any MCP-compliant client can talk to over stdio or SSE. Think language server protocol, but for giving Claude (or any LLM) access to your Postgres database, your Slack history, or your filesystem."
publishDate: 2026-02-01
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["mcp", "beginner", "claude"]
tools: ["Claude Desktop", "Anthropic SDK"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Anthropic released the Model Context Protocol specification as open-source in November 2024."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "MCP servers communicate with clients over JSON-RPC 2.0, using either stdio or server-sent events as the transport layer."
    source: "https://spec.modelcontextprotocol.io/specification/basic/transports/"
    date: "2025-01-15"
    confidence: "high"
  - text: "Claude Desktop added native MCP support in its 0.7.0 release, allowing users to connect local MCP servers via a JSON configuration file."
    source: "https://github.com/modelcontextprotocol/servers"
    date: "2024-12-10"
    confidence: "high"
  - text: "The MCP specification defines three primitive types: resources, prompts, and tools, each with distinct JSON-RPC method signatures."
    source: "https://spec.modelcontextprotocol.io/specification/basic/primitives/"
    date: "2025-01-20"
    confidence: "high"
  - text: "Over 40 community-built MCP servers were published to the official registry within the first two months of the protocol's release."
    source: "https://github.com/modelcontextprotocol/servers"
    date: "2026-01-28"
    confidence: "high"
entities:
  - "Model Context Protocol"
  - "Claude Desktop"
  - "Anthropic"
  - "JSON-RPC 2.0"
  - "Language Server Protocol"
updateLog:
  - version: "v1"
    date: 2026-02-01
    notes: "Initial publish."
---

You keep seeing "MCP" in Discord threads and GitHub issues. Everyone talks like it's the future of agent tooling. But what _is_ it? Not the marketing pitch. The actual wire protocol, the thing your code has to speak.

Model Context Protocol is Anthropic's answer to a messy problem: every AI chat app reinvents the wheel when it connects to Notion, Slack, or your company's Postgres instance [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. Instead of baking fifty integrations into Claude Desktop and fifty more into every competitor's app, MCP defines one standard that any client can use to talk to any server. The server exposes resources (read-only data), tools (functions the LLM can call), and prompts (reusable templates). The client sends JSON-RPC 2.0 messages over stdio or server-sent events [cite: https://spec.modelcontextprotocol.io/specification/basic/transports/ · 2025-01-15 · high].

Think of it like the [Language Server Protocol](https://en.wikipedia.org/wiki/Language_Server_Protocol) for VS Code. LSP let editor developers stop writing bespoke Python parsers and Rust linters. MCP does the same thing for LLM context. Write one filesystem server, and it works in Claude Desktop, in your custom agent framework, in whatever Obsidian plugin decides to adopt the spec next month.

## Q: What does an MCP server actually do?

It sits between the AI and your data. You run it as a separate process. Claude Desktop (or any MCP client) spawns it, talks to it over stdin/stdout, and asks it questions in JSON-RPC [cite: https://spec.modelcontextprotocol.io/specification/basic/transports/ · 2025-01-15 · high].

The server advertises three kinds of things:

**Resources** are read-only blobs. A file, a database row, a Slack thread. The client asks for `file:///home/you/notes.md`, the server returns the content plus a MIME type. Resources don't mutate state. They're just context the LLM can read.

**Tools** are functions. The LLM can call `create_jira_ticket` or `run_sql_query`. The server validates the arguments, does the work, returns a result. Tools _do_ mutate state. This is where the agent actually acts on the world.

**Prompts** are pre-baked templates. "Summarise this document" or "Debug this error log." The server can inject arguments into the prompt before sending it back to the client. Useful for packaging domain-specific workflows [cite: https://spec.modelcontextprotocol.io/specification/basic/primitives/ · 2025-01-20 · high].

Here's what the JSON looks like when Claude calls a tool. The client sends:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": {
      "sql": "SELECT * FROM users WHERE created_at > '2026-01-01' LIMIT 10"
    }
  }
}
```

The server responds:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 10 users:\n1. alice@example.com\n2. bob@example.com\n..."
      }
    ]
  }
}
```

No magic. Just JSON-RPC over a pipe.

## Why stdio instead of HTTP?

Because spawning a local process is simpler than managing auth tokens and CORS headers [cite: https://www.reddit.com/r/ClaudeAI/comments/1h4x8yz/model_context_protocol_is_actually_genius/ · 2024-12-01 · medium]. Claude Desktop can start your MCP server when it launches, kill it when it quits. No port collisions, no firewall rules. The stdio transport is mandatory. SSE (server-sent events over HTTP) is optional for remote servers, but most people start with stdio.

If you've configured Claude Desktop, you've edited `claude_desktop_config.json`. It looks like this:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"]
    },
    "postgres": {
      "command": "uvx",
      "args": ["mcp-server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

Claude spawns `npx -y @modelcontextprotocol/server-filesystem /Users/you/Documents`, talks to it over stdin/stdout, and now you can ask "What's in my Documents folder?" [cite: https://github.com/modelcontextprotocol/servers · 2024-12-10 · high]. The server lists files, reads content, passes it back as resources. No API key, no OAuth dance.

## Q: What changes for me as a builder?

If you're writing agent tooling today, you're probably doing one of two things. Either you're cramming tool definitions into your prompt and parsing structured output, or you're using a framework that abstracts it (LangChain tool decorators, OpenAI function calling). MCP doesn't replace those. It standardises the _connection_ between the agent runtime and the external system.

Concretely: instead of writing a bespoke "Notion integration" inside your agent codebase, you write (or install) an MCP server that exposes Notion pages as resources and Notion API calls as tools. Your agent runtime becomes an MCP client. Now any other agent that speaks MCP can use the same Notion server. You've decoupled the integration from the agent [cite: https://www.reddit.com/r/LocalLLaMA/comments/1h5a3kt/anthropics_model_context_protocol_mcp_is/ · 2024-12-02 · medium].

The Anthropic SDK for Python and TypeScript ships with MCP client libraries. If you're building on Claude, you get this almost for free. If you're using a different LLM, you'll need to either adopt an MCP client library or build your own JSON-RPC dispatcher. The spec is only a few dozen pages. People have already written clients in Rust, Go, Elixir.

## The ecosystem two months in

Anthropic released the spec in late November 2024 [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. By late January 2026, the official registry has over 40 community servers [cite: https://github.com/modelcontextprotocol/servers · 2026-01-28 · high]. There's a Slack server, a Google Drive server, a Spotify server, a server that wraps Puppeteer for browser automation. Most are JavaScript or Python. Most are under 300 lines.

The quality is uneven. Some are production-grade (the Postgres server, the filesystem server). Some are weekend hacks that break on edge cases. The spec is stable, but tooling around authentication, rate limiting, and error recovery is still maturing. You'll see GitHub issues titled "How do I handle OAuth refresh tokens in an MCP server?" with long threads and no consensus [cite: https://www.reddit.com/r/ClaudeAI/comments/1h6y9xz/struggling_with_mcp_oauth_flow/ · 2024-12-15 · low].

If you're evaluating whether to adopt MCP today, the answer depends on your tolerance for rough edges. If you're building internal tooling and you control the client and server, it's already useful. If you're shipping a commercial product that needs to work across arbitrary MCP clients, wait a few months for the ecosystem to stabilise.

## What about other LLM providers?

OpenAI hasn't adopted MCP. Neither has Google. Anthropic built the spec, so Claude Desktop is the reference client. That doesn't mean other providers _can't_ adopt it. The protocol is open. But right now, if you want to use MCP, you're in the Anthropic ecosystem or you're writing your own client.

Some people on [Reddit](https://www.reddit.com/r/OpenAI/comments/1h7k3pl/will_openai_ever_support_mcp/) are salty about this. They want OpenAI to bless a universal standard. Others point out that OpenAI already has function calling, Assistants API, and a plugin marketplace. Why would they adopt a competitor's protocol? The cynical take is that MCP will remain an Anthropic thing unless someone builds an abstraction layer that works with OpenAI's function calling _and_ MCP. Then developers can write once, run anywhere. That abstraction doesn't exist yet, but it's inevitable.

## A worked example: connecting CV Mirror

Let's say you're using [CV Mirror](https://www.aimvantage.uk/), a tool that parses your CV into structured JSON. You want Claude Desktop to read your CV data without you pasting it into the chat every time. You write a tiny MCP server:

```python
from mcp.server import Server
from mcp.types import Resource, TextContent
import json

app = Server("cv-mirror")

@app.list_resources()
async def list_resources():
    return [Resource(uri="cv://profile", name="My CV Profile", mimeType="application/json")]

@app.read_resource()
async def read_resource(uri: str):
    if uri == "cv://profile":
        with open("/path/to/cv_data.json") as f:
            data = json.load(f)
        return TextContent(type="text", text=json.dumps(data, indent=2))
    raise ValueError("Unknown resource")

if __name__ == "__main__":
    app.run()
```

Add it to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cv-mirror": {
      "command": "python",
      "args": ["/path/to/cv_server.py"]
    }
  }
}
```

Now you can ask Claude, "What's my most recent job?" It calls `resources/read` with `cv://profile`, gets the JSON, parses it, answers. No copy-paste. No manual upload. The CV data is always fresh because the server reads the file on every request.

## FAQ

### Can I use MCP with non-Anthropic models?

Yes, but you'll need to implement (or find) an MCP client for your runtime. The protocol itself is model-agnostic. It's JSON-RPC, not Claude-specific. But right now, the only batteries-included client is in Anthropic's SDK.

### Do MCP servers run in the cloud or locally?

Usually locally. The stdio transport assumes the server is on the same machine as the client. You _can_ run a remote MCP server over HTTP with SSE, but that's less common. Most people start with local servers because it's simpler.

### What's the performance overhead?

Minimal. JSON-RPC over stdio is fast. The bottleneck is usually the tool itself (database query, API call) not the protocol. If you're worried about latency, profile the actual work, not the MCP layer.

### Is MCP production-ready?

For internal tools, yes. For customer-facing products, maybe. The spec is stable. The ecosystem is young. Expect breaking changes in community servers, not in the core protocol.

## Sources

- Anthropic's Model Context Protocol announcement: https://www.anthropic.com/news/model-context-protocol
- Official MCP specification: https://spec.modelcontextprotocol.io/
- Community MCP servers repository: https://github.com/modelcontextprotocol/servers
- Reddit discussion on MCP design tradeoffs: https://www.reddit.com/r/ClaudeAI/comments/1h4x8yz/model_context_protocol_is_actually_genius/
- Reddit thread on MCP vs OpenAI function calling: https://www.reddit.com/r/LocalLLaMA/comments/1h5a3kt/anthropics_model_context_protocol_mcp_is/
- Language Server Protocol (Wikipedia): https://en.wikipedia.org/wiki/Language_Server_Protocol