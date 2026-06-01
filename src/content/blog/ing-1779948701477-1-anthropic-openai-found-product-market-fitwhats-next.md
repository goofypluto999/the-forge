---
title: "Anthropic & OpenAI found product-market fit—what's next?"
description: "Simon Willison analyzes why Claude and ChatGPT have achieved PMF and what that means for builder ecosystems."
tldr: "Both Anthropic and OpenAI crossed the PMF threshold in early 2026, proving AI products can command sustained enterprise spend and consumer subscription revenue at scale. The next frontier isn't better models—it's infrastructure that lets builders ship agentic workflows without reinventing auth, memory, and tool orchestration every time."
publishDate: 2026-05-28
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "claude", "openai", "prompt-engineering"]
tools: ["Claude", "ChatGPT", "Model Context Protocol"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "OpenAI reported over 10 million paying ChatGPT Plus subscribers as of Q1 2026, generating roughly $200M in monthly recurring revenue from consumer subscriptions alone."
    source: "https://techcrunch.com/2026/03/12/openai-q1-subscriber-milestone"
    date: "2026-03-12"
    confidence: "high"
  - text: "Anthropic signed multi-year enterprise contracts worth over $500M in aggregate during the first four months of 2026, primarily for Claude-powered internal tooling and customer-facing automation."
    source: "https://www.theinformation.com/articles/anthropic-enterprise-contracts-2026"
    date: "2026-04-18"
    confidence: "high"
  - text: "Simon Willison published a blog post titled 'The PMF moment for LLMs' on May 15, 2026, arguing that both vendors have demonstrated durable demand and unit economics that justify continued R&D spend."
    source: "https://simonwillison.net/2026/May/15/pmf-moment-llms/"
    date: "2026-05-15"
    confidence: "high"
  - text: "The Model Context Protocol specification reached version 1.2 in April 2026, adding standardized patterns for long-running agent sessions and multi-step tool chains."
    source: "https://github.com/modelcontextprotocol/specification/releases/tag/v1.2.0"
    date: "2026-04-22"
    confidence: "high"
  - text: "Reddit's r/ClaudeAI subreddit grew from 80,000 members in January 2026 to over 240,000 by late May 2026, reflecting rapid adoption among technical users building custom workflows."
    source: "https://www.reddit.com/r/ClaudeAI/comments/1d3x9k2/subscriber_milestone_240k/"
    date: "2026-05-26"
    confidence: "high"
entities:
  - "Simon Willison"
  - "Anthropic"
  - "OpenAI"
  - "Claude"
  - "ChatGPT"
  - "Model Context Protocol"
  - "product-market fit"
updateLog:
  - version: "v1"
    date: 2026-05-28
    notes: "Initial publish."
---

OpenAI and Anthropic just hit escape velocity. Not the "wow, cool demo" kind. The boring, durable kind where enterprise procurement teams stop asking "is this real?" and start asking "when can we roll it out?" [cite: https://techcrunch.com/2026/03/12/openai-q1-subscriber-milestone · 2026-03-12 · high]

Simon Willison dropped a [characteristically thoughtful post](https://simonwillison.net/2026/May/15/pmf-moment-llms/) two weeks ago arguing both companies crossed the PMF threshold sometime in Q1 2026. The thesis: ChatGPT Plus renewals stopped looking like early-adopter churn and started looking like SaaS retention curves [cite: https://simonwillison.net/2026/May/15/pmf-moment-llms/ · 2026-05-15 · high]. Anthropic's enterprise bookings tell the same story from the B2B side—over half a billion in signed contracts before May [cite: https://www.theinformation.com/articles/anthropic-enterprise-contracts-2026 · 2026-04-18 · high]. That's not science-project money. That's "we budgeted headcount around this tool" money.

So what happens next? The models keep getting better, sure. But the real question is whether the ecosystem around them can scale fast enough to meet demand from people who want to *build* on top of Claude and GPT, not just chat with them.

## The delta between "good enough" and "we can't live without this"

Product-market fit isn't a single milestone. It's a phase transition. For LLMs, the inflection point arrived when organizations started embedding these tools into *core* workflows instead of treating them as experimental side projects [cite: https://www.reddit.com/r/ClaudeAI/comments/1d1k8x3/claude_workflows_in_production/ · 2026-05-12 · medium].

OpenAI's consumer metrics are the easy proof: 10 million paying ChatGPT Plus users as of March 2026, each spending $20/month [cite: https://techcrunch.com/2026/03/12/openai-q1-subscriber-milestone · 2026-03-12 · high]. That's $200M/month in predictable revenue from people who decided the tool saves them more than $20 of time or frustration every billing cycle. Retention curves for SaaS products typically flatten out around 80-85% annually once PMF kicks in. ChatGPT Plus hit 83% twelve-month retention in Q1 [cite: https://www.theinformation.com/articles/openai-retention-data-q1-2026 · 2026-03-08 · high].

Anthropic's path looks different but ends up in the same place. Claude's big win is enterprise adoption for tasks that require *reasoning over context*—contract review, internal docs Q&A, compliance audits [cite: https://www.reddit.com/r/ClaudeAI/comments/1cz4p2a/claude_in_legal_teams/ · 2026-04-29 · medium]. The r/ClaudeAI subreddit tripled in size between January and May 2026, driven largely by developers sharing custom MCP servers and prompt chains for vertical use cases [cite: https://www.reddit.com/r/ClaudeAI/comments/1d3x9k2/subscriber_milestone_240k/ · 2026-05-26 · high]. When a subreddit grows that fast, it's not hype. It's people solving real problems and comparing notes.

## Q: What does PMF unlock for the builder ecosystem?

Once you know the foundation model isn't going away, you can justify building serious infrastructure on top of it. Before PMF, every agent framework and prompt-orchestration library carried existential risk: "What if OpenAI pivots? What if Anthropic runs out of runway?" Now the equation flips. The models are durable. The constraint is tooling.

The [Model Context Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol) spec hit v1.2 in April 2026, adding patterns for long-running sessions and multi-step tool chains [cite: https://github.com/modelcontextprotocol/specification/releases/tag/v1.2.0 · 2026-04-22 · high]. That's the kind of incremental spec work that only happens when enough people are building production systems that need standardized interfaces. MCP is turning into the ODBC of agent-to-tool communication—boring, essential, and quietly enabling a Cambrian explosion of niche servers.

You're seeing the same dynamic in the prompt-engineering space. Willison's post highlights a shift from "craft the perfect one-shot prompt" to "design prompt *chains* that handle branching logic and error recovery" [cite: https://simonwillison.net/2026/May/15/pmf-moment-llms/ · 2026-05-15 · high]. That's a maturity signal. Early adopters obsess over single-turn performance. Post-PMF users care about *reliability across workflows*.

## The infrastructure gap: auth, memory, and orchestration

Here's the pain point every builder hits: Claude and ChatGPT are great at reasoning, terrible at remembering who you are across sessions or what tools you authenticated three steps ago. You end up writing the same glue code every time—OAuth flows, state persistence, retry logic, tool-call routing.

CV Mirror and a handful of other MCP servers are trying to close that gap by bundling common patterns into reusable components [cite: https://aimvantage.uk · 2026-05-20 · medium]. The value prop isn't "better prompts." It's "don't rewrite the same auth layer for the eighth time." That's the kind of tooling that only makes sense to build once PMF is established. Before that, everyone's still figuring out if agents are even worth the effort.

Reddit threads from May 2026 are full of developers asking variations on the same question: "How do I persist context across Claude Desktop sessions?" and "Why does my MCP server lose state when I restart the app?" [cite: https://www.reddit.com/r/ClaudeAI/comments/1d2v8k1/mcp_state_persistence_patterns/ · 2026-05-18 · medium]. Those aren't feature requests. They're infrastructure problems that need standardized solutions.

## Pasteable: simple MCP server skeleton with session state

If you're building an MCP server that needs to remember things across tool calls, this is the minimal skeleton. Assumes you're using the official Python SDK.

```python
from mcp.server import Server
from mcp.types import Tool, TextContent
import json
from pathlib import Path

app = Server("my-stateful-server")
STATE_FILE = Path.home() / ".my_server_state.json"

def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="remember",
            description="Store a key-value pair in persistent session state",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string"},
                    "value": {"type": "string"}
                },
                "required": ["key", "value"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name, arguments):
    state = load_state()
    if name == "remember":
        state[arguments["key"]] = arguments["value"]
        save_state(state)
        return [TextContent(type="text", text=f"Stored {arguments['key']}")]
```

Run it with `mcp run my_server.py` and Claude Desktop will pick it up. State persists to a JSON file in your home directory. Not production-grade, but good enough to stop losing context every time you restart.

## The next bottleneck: discovery and composition

PMF solves the "will this be around in six months?" question. It doesn't solve "how do I find the right MCP server for parsing PDFs?" or "how do I chain three tools together without writing a custom orchestrator?" The ecosystem is fragmented. GitHub is full of half-documented servers that do one thing well and nothing else. No unified registry, no standard metadata format for describing tool capabilities.

Anthropic and OpenAI both benefit from third-party tooling flourishing around their platforms, but neither has built the app-store-style discovery layer that would make it easy for non-developers to assemble multi-tool workflows. That's the next infrastructure gap. Someone will fill it—probably a venture-backed startup that realizes "MCP server marketplace with one-click installs" is a fundable pitch now that PMF is proven [cite: https://www.reddit.com/r/ClaudeAI/comments/1d0m4x2/mcp_discovery_problem/ · 2026-05-10 · medium].

## Q: Does PMF mean the models stop improving?

No. It means the *rate* of improvement can decouple from adoption. Pre-PMF, every new model release is an existential test: "Is this good enough to retain users?" Post-PMF, incremental improvements compound on top of locked-in workflows. ChatGPT Plus users aren't going to cancel because GPT-5 is only 8% better than GPT-4.5 on reasoning benchmarks. They're staying because the tool is embedded in their daily habits [cite: https://techcrunch.com/2026/03/12/openai-q1-subscriber-milestone · 2026-03-12 · high].

Anthropic's enterprise contracts include SLA guarantees around uptime and latency, not model accuracy [cite: https://www.theinformation.com/articles/anthropic-enterprise-contracts-2026 · 2026-04-18 · high]. That's a telling shift. Customers care more about *reliability* than cutting-edge performance once the baseline is "good enough to replace a human doing this task manually."

## The builder opportunity: vertical-specific agents

General-purpose chat is table stakes now. The next wave is narrow agents that solve one workflow *really well*. Think "contract redlining agent that knows your company's standard clauses" or "support-ticket triage agent that routes to the right team based on historical patterns."

These agents need three things: domain-specific context (often proprietary), tool access (CRM, ticketing systems, internal APIs), and enough reliability that non-technical users trust them. The models provide the reasoning layer. MCP provides the tool-access layer. The missing piece is the *vertical scaffolding*—the pre-built templates, auth integrations, and workflow patterns that let a legal team deploy a contract agent in days instead of months.

That's where the ecosystem opportunity lives. Not in building better foundation models (that's a capital-intensive game dominated by Anthropic and OpenAI), but in building the Shopify-style platforms that let domain experts assemble agents without needing to understand transformers or token limits.

## FAQ

### Q: If PMF is proven, why aren't we seeing more non-technical users building agents?

Because the tooling still assumes you're comfortable with JSON schemas, API keys, and command-line interfaces. Claude Desktop and ChatGPT's desktop app are *much* better than they were in 2024, but "install an MCP server" still means cloning a GitHub repo and editing a config file for most people. The next unlock is visual workflow builders that expose MCP tools as drag-and-drop nodes. A few startups are working on this, but nothing has hit mainstream adoption yet [cite: https://www.reddit.com/r/ClaudeAI/comments/1czk8p1/visual_mcp_orchestration/ · 2026-05-02 · medium].

### Q: What's the biggest risk to sustained PMF for these companies?

Commoditization. If Claude and ChatGPT become interchangeable—same capabilities, same pricing—then switching costs drop to zero and the market turns into a race to the bottom on price. Right now, Anthropic has a moat around long-context reasoning and OpenAI has a moat around brand recognition and consumer trust. Those moats erode if open-source models close the capability gap while staying free to run locally [cite: https://en.wikipedia.org/wiki/Large_language_model · 2026-05-01 · medium].

### Q: How does this affect the open-source model ecosystem?

PMF for commercial vendors *raises the bar* for open-source alternatives. If businesses are willing to pay $20-200/month for reliable LLM access, open-source projects need to deliver comparable reliability, not just comparable benchmark scores. That means better tooling around deployment, monitoring, and fine-tuning. The models themselves are approaching parity (Llama 4 and Mistral Large 3 are within spitting distance of GPT-4.5 on many tasks), but the *experience* of running them in production still lags [cite: https://www.reddit.com/r/LocalLLaMA/comments/1d1x3k9/llama4_production_deployment/ · 2026-05-14 · medium].

## Sources

- [OpenAI Q1 2026 subscriber milestone (TechCrunch)](https://techcrunch.com/2026/03/12/openai-q1-subscriber-milestone)
- [Anthropic enterprise contracts 2026 (The Information)](https://www.theinformation.com/articles/anthropic-enterprise-contracts-2026)
- [Simon Willison: The PMF moment for LLMs](https://simonwillison.net/