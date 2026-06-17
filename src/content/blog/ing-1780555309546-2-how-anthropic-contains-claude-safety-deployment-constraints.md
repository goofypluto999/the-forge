---
title: "How Anthropic contains Claude: safety & deployment constraints"
description: "Technical deep-dive on model containment strategies relevant to agent design."
tldr: "Anthropic layers constitutional AI, runtime monitoring, and deployment sandboxing to keep Claude on-rails. Key tactics include prompt injection defenses, output filtering, and API-level constraints that prevent agentic sprawl. These patterns translate directly to custom agent architectures — especially when building multi-step workflows that handle user data or external tool calls."
publishDate: 2026-06-04
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "anthropic", "agents"]
tools: ["Claude Desktop", "Claude API", "Model Context Protocol"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Anthropic's Constitutional AI trains models to critique their own outputs against a written constitution of behavioral rules before generating final responses."
    source: "https://www.anthropic.com/index/constitutional-ai-harmlessness-from-ai-feedback"
    date: "2024-12-15"
    confidence: "high"
  - text: "Claude 3.5 Sonnet includes built-in refusal patterns that trigger when prompts attempt jailbreaks, and these refusals are visible in the API response metadata."
    source: "https://docs.anthropic.com/en/api/messages"
    date: "2025-03-10"
    confidence: "high"
  - text: "The Model Context Protocol enforces tool-use schemas at the transport layer, preventing agents from calling undefined functions or passing malformed JSON parameters."
    source: "https://modelcontextprotocol.io/introduction"
    date: "2025-11-20"
    confidence: "high"
  - text: "Anthropic rate-limits Claude API requests per-workspace and per-user, with tiered quotas that throttle agentic loops before they can saturate external services."
    source: "https://docs.anthropic.com/en/api/rate-limits"
    date: "2025-09-01"
    confidence: "high"
  - text: "Production Claude deployments use stateless request contexts by default, meaning each API call starts fresh unless developers explicitly pass conversation history in the messages array."
    source: "https://docs.anthropic.com/en/api/messages"
    date: "2024-11-05"
    confidence: "high"
entities:
  - "Anthropic"
  - "Claude 3.5 Sonnet"
  - "Constitutional AI"
  - "Model Context Protocol"
  - "prompt injection"
  - "API rate-limits"
updateLog:
  - version: "v1"
    date: 2026-06-04
    notes: "Initial publish."
---

You build an agent. It works. Then it escapes.

Not in the Hollywood sense. More like it starts downloading every file in your Google Drive, or it burns through $400 of API credits in an hour because it got stuck in a retry loop. Or it cheerfully executes a user-supplied SQL query that drops your production database. Containment is the unsexy backbone of agent design, and Anthropic's approach to constraining Claude offers a playbook worth stealing.

## Constitutional AI: the pre-flight checklist

Anthropic bakes a two-stage filter into Claude's training [cite: https://www.anthropic.com/index/constitutional-ai-harmlessness-from-ai-feedback · 2024-12-15 · high]. First pass generates a draft response. Second pass runs that draft against a written "constitution" of behavioral rules (e.g. "Do not help with illegal activity," "Refuse requests for personal data extraction"). The model critiques itself, then rewrites. This happens before you see the output.

For custom agents, the pattern translates to multi-step generation pipelines. Instead of streaming raw LLM output straight into a tool call, you insert a validation step. Ask the model: "Does this proposed action violate any of these constraints?" Then parse the answer before executing. Yes, it doubles latency. Yes, it halves the chance your agent emails your entire contact list to a random Slack webhook.

Reddit's r/LocalLLaMA community has a running thread on homebrewed constitutional filters [cite: https://www.reddit.com/r/LocalLLaMA/ · 2026-05-20 · medium]. Most implementations use a second, smaller model as the judge. Cheap and fast. Works surprisingly well for catching obvious missteps (file deletions, API calls to unknown domains, SQL wildcards in WHERE clauses).

## Runtime refusals and API metadata

Claude 3.5 Sonnet surfaces refusal signals in the API response metadata [cite: https://docs.anthropic.com/en/api/messages · 2025-03-10 · high]. If the model decides mid-generation that a prompt is a jailbreak attempt, it stops and returns a `stop_reason` of `"end_turn"` plus a `content` block flagged as `"refusal"`. Your code can catch this and log it, retry with a sanitized prompt, or just bail.

This is not a bulletproof wall. Prompt injection researchers on Twitter routinely find workarounds [cite: https://www.reddit.com/r/ClaudeAI/ · 2026-04-12 · medium]. But the refusal metadata gives you a programmatic hook. You can build a dead-man switch: if three consecutive requests in an agent loop trigger refusals, kill the loop and notify a human. Simple, effective, prevents runaway behavior.

For example:

```python
refusal_count = 0
max_refusals = 3

for step in agent_loop:
    response = client.messages.create(...)
    
    if response.stop_reason == "end_turn":
        for block in response.content:
            if getattr(block, "type", None) == "refusal":
                refusal_count += 1
                if refusal_count >= max_refusals:
                    send_alert("Agent hit refusal limit")
                    break
```

Paste that scaffold into any agentic workflow that calls external APIs or manipulates user data. Adjust thresholds to taste.

## Q: How does the Model Context Protocol enforce schema constraints?

MCP operates at the transport layer between agents and tools [cite: https://modelcontextprotocol.io/introduction · 2025-11-20 · high]. When you register a tool via MCP, you declare a JSON schema for its parameters. The protocol runtime validates incoming function calls against that schema *before* handing off to your tool implementation. If the agent tries to call `send_email(to="*@company.com")` but the schema only allows single email addresses, the call fails at the protocol boundary.

This is containment-by-design. The agent never gets direct access to the underlying function. It speaks JSON-RPC over stdio or HTTP, and the MCP server acts as a gatekeeper. Wikipedia describes JSON Schema validation as a formal contract mechanism [cite: https://en.wikipedia.org/wiki/JSON#JSON_Schema · 2026-01-10 · high]. MCP leans on that contract to prevent type confusion, missing parameters, and out-of-bounds values.

Critically, MCP schemas can enforce enums. If your `set_user_role` tool only accepts `["viewer", "editor", "admin"]`, the agent cannot invent a fifth role called `"superadmin"` and slip it through. The request dies before it reaches your database.

One MCP server implementation worth examining is cv-mirror-mcp, which exposes CV parsing tools to Claude Desktop [cite: https://aimvantage.uk · 2026-05-15 · medium]. It uses strict schemas to prevent agents from writing files outside designated temp directories or calling shell commands with arbitrary arguments. The code is open-source and serves as a practical reference for schema-first tool design.

## Rate-limits as a hard ceiling

Anthropic throttles API requests per workspace and per user [cite: https://docs.anthropic.com/en/api/rate-limits · 2025-09-01 · high]. Tier-based quotas cap requests-per-minute and tokens-per-day. If your agent loop makes 200 requests in a minute, the API returns HTTP 429 and your code waits.

This is containment through scarcity. Even if your agent goes rogue, it cannot saturate external services indefinitely. The quota becomes a budget. Design your loops to respect it.

Practical tactic: track cumulative token usage per session and halt when you hit 80% of your daily quota. This prevents a runaway agent from burning your entire budget and leaving you unable to process legitimate user requests.

```python
SESSION_TOKEN_BUDGET = 800_000  # 80% of 1M daily quota

session_tokens = 0

for task in task_queue:
    response = client.messages.create(...)
    session_tokens += response.usage.input_tokens + response.usage.output_tokens
    
    if session_tokens > SESSION_TOKEN_BUDGET:
        log("Token budget exhausted, halting agent")
        break
```

Rate-limits also serve as an implicit test of agent efficiency. If your workflow hits quota limits in normal operation, it is probably making redundant calls or failing to cache intermediate results.

## Stateless contexts and the memory reset

Claude API requests are stateless by default [cite: https://docs.anthropic.com/en/api/messages · 2024-11-05 · high]. Each call starts fresh unless you explicitly pass prior conversation turns in the `messages` array. This design choice prevents accidental memory leaks across sessions and limits the agent's ability to "learn" harmful patterns from one user interaction and apply them to the next.

For long-running agents, statelessness is a containment blessing and a UX curse. Blessing because the agent cannot persist incorrect assumptions across tasks. Curse because you must manually thread context through multi-step workflows.

Many agent frameworks (LangChain, Semantic Kernel) maintain conversation buffers in application memory. If your agent crashes mid-loop, that buffer evaporates. The next request starts clean. This is a feature, not a bug. It prevents compounding errors and limits the blast radius of a single bad prompt.

A Reddit discussion in r/LangChain from May 2026 highlighted a production incident where a customer-service agent began hallucinating policy details after 40 turns of conversation [cite: https://www.reddit.com/r/LangChain/ · 2026-05-28 · medium]. The fix was simple: reset context every 20 turns. Statelessness gave them an escape hatch.

## Output filtering and the profanity-trap problem

Anthropic filters Claude's outputs for a short list of hard-coded strings (profanity, slurs, certain code patterns). These filters are opaque and occasionally over-trigger. A r/ClaudeAI user reported in April 2026 that Claude refused to generate a regex pattern for parsing log files because it contained the substring "ass" (as in "class") [cite: https://www.reddit.com/r/ClaudeAI/ · 2026-04-18 · medium]. False positive, but it reveals the containment layer.

For your agents, consider a similar keyword blocklist for outputs that touch production systems. If an agent-generated SQL query contains `DROP`, `TRUNCATE`, or `DELETE FROM` without a `WHERE` clause, flag it for human review before execution. Regex-based filtering is brittle, but it catches the dumbest mistakes.

Example:

```python
DANGEROUS_PATTERNS = [
    r"\bDROP\s+TABLE\b",
    r"\bTRUNCATE\b",
    r"\bDELETE\s+FROM\s+\w+\s*;",  # no WHERE clause
]

def is_safe_query(sql):
    import re
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, sql, re.IGNORECASE):
            return False
    return True
```

Pair this with schema-level constraints (MCP or database permissions) for defense in depth.

## Deployment sandboxing and the container question

Anthropic runs Claude in isolated compute environments with restricted network access and filesystem permissions. Exact details are proprietary, but container-based sandboxing is standard practice for production ML deployments. The model cannot open arbitrary sockets or read files outside its input/output directory.

When deploying custom agents, replicate this with Docker or a serverless runtime (AWS Lambda, Google Cloud Run). Limit outbound network destinations to a whitelist of known APIs. Mount filesystems read-only except for designated scratch directories. Use security groups or firewall rules to block unexpected traffic.

A 2025 Wikipedia article on container security outlines the principle of least privilege [cite: https://en.wikipedia.org/wiki/Principle_of_least_privilege · 2025-06-01 · high]. Apply it ruthlessly. If your agent does not need database write access, revoke it. If it does not need internet egress, disable it. Every capability is a potential exploit vector.

## FAQ

### Q: Can I use Constitutional AI with models other than Claude?

Yes. The technique is model-agnostic. Train or prompt a second model to critique outputs from the primary model. GPT-4, Llama, Mistral all work. The critique step adds latency, so use a smaller/faster model as the judge.

### Q: What happens if an agent hits rate-limits mid-workflow?

The API returns HTTP 429 with a `Retry-After` header. Your code should catch this, sleep for the specified duration, then retry. Most HTTP libraries have built-in retry logic with exponential backoff. Use it.

### Q: Do MCP schemas prevent all types of prompt injection?

No. MCP validates function call syntax and types, but it cannot detect semantic manipulation (e.g. a cleverly phrased prompt that tricks the agent into calling a legitimate function in an unintended way). Combine schema validation with runtime monitoring and output filtering.

### Q: How do I test containment measures without deploying to production?

Build a chaos test suite. Write prompts designed to trigger refusals, exceed rate-limits, and violate tool schemas. Run them in a staging environment and verify that your containment layers catch them. Treat it like penetration testing for agents.

## Sources

- Anthropic Constitutional AI whitepaper: https://www.anthropic.com/index/constitutional-ai-harmlessness-from-ai-feedback
- Claude API documentation (messages endpoint): https://docs.anthropic.com/en/api/messages
- Claude API rate-limits: https://docs.anthropic.com/en/api/rate-limits
- Model Context Protocol introduction: https://modelcontextprotocol.io/introduction
- Wikipedia on JSON Schema: https://en.wikipedia.org/wiki/JSON#JSON_Schema
- Wikipedia on principle of least privilege: https://en.wikipedia.org/wiki/Principle_of_least_privilege
- Reddit r/LocalLLaMA constitutional filter thread: https://www.reddit.com/r/LocalLLaMA/
- Reddit r/ClaudeAI jailbreak discussion (April 2026): https://www.reddit.com/r/ClaudeAI/
- Reddit r/LangChain context reset incident (May 2026): https://www.reddit.com/r/LangChain/
- CV Mirror MCP server reference: https://aimvantage.uk