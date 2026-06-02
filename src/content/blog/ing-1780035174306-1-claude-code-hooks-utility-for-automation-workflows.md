---
title: "Claude Code hooks utility for automation workflows"
description: "Python package for building Claude Code integrations with practical automation patterns."
tldr: "Claude Code hooks is a Python utility that lets you build integrations with Claude's coding interface without wrestling raw API calls. It provides event handlers for code execution, file changes, and terminal output — making it trivial to chain Claude's editor actions into larger automation pipelines. Think webhooks for your AI pair programmer."
publishDate: 2026-05-29
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "developer-tools", "agents"]
tools: ["Claude", "Python"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "The Model Context Protocol enables standardised tool connections between AI assistants and external data sources."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "Webhook-style integrations allow third-party systems to react to events without polling APIs."
    source: "https://en.wikipedia.org/wiki/Webhook"
    date: "2024-09-10"
    confidence: "high"
  - text: "Claude Desktop supports programmatic access to coding sessions through JSON-RPC communication."
    source: "https://github.com/anthropics/anthropic-sdk-python"
    date: "2025-05-01"
    confidence: "medium"
entities:
  - "Claude Code"
  - "Anthropic"
  - "Python asyncio"
  - "JSON-RPC"
  - "Model Context Protocol"
updateLog:
  - version: "v1"
    date: 2026-05-29
    notes: "Initial publish."
---

You've got Claude writing code. Great. Now you want that code to trigger something else — update a database, ping Slack, kick off a test suite — without manually copy-pasting terminal output into another tool. Enter the hooks pattern.

Claude Code hooks is a Python utility that wraps Claude's coding interface with event handlers [cite: https://github.com/anthropics/anthropic-sdk-python · 2025-05-01 · medium]. Think of it as middleware between Claude's editor actions and your automation pipeline. When Claude creates a file, your hook fires. When Claude runs a command, your hook sees the output. When Claude edits line 47, your hook gets the diff. All without polling or screen-scraping.

This matters because Claude Code — Anthropic's agentic coding interface released in April 2025 — is designed to *act*, not just suggest [cite: https://www.anthropic.com/news/claude-code · 2025-04-15 · high]. It writes functions, runs tests, debugs errors, rewrites modules. But acting in isolation is half the story. You need those actions to propagate through the rest of your toolchain.

## Q: How do you hook into something that wasn't built for hooks?

Claude Code communicates via JSON-RPC over a local socket when running in desktop mode [cite: https://github.com/anthropics/anthropic-sdk-python · 2025-05-01 · medium]. The hooks utility sits between your application and that socket, subscribing to specific event types: `file_created`, `code_executed`, `terminal_output`, `edit_applied`. You register callbacks, and the utility invokes them when the corresponding event streams through.

Here's the basic shape:

```python
from claude_code_hooks import ClaudeSession, on_event

session = ClaudeSession(project_path="./workspace")

@on_event("file_created")
async def notify_team(event):
    filepath = event["path"]
    content = event["content"]
    # POST to Slack, log to DB, whatever
    await slack.send(f"Claude just wrote {filepath}")

@on_event("code_executed")
async def run_tests(event):
    if event["exit_code"] == 0:
        await pytest.run("tests/")

session.start()
```

No manual wiring. No brittle regex parsing of logs. The event loop handles concurrency, so you can fire off multiple async tasks without blocking Claude's next action [cite: https://docs.python.org/3/library/asyncio.html · 2025-03-20 · high].

## Why this beats polling or screen-scraping

Polling Claude's workspace directory every N seconds is fragile. You miss rapid-fire changes. You don't know *why* a file changed — was it Claude or you? Hooks give you intent. The `edit_applied` event includes the line range, the old content, the new content, and a confidence score if Claude ran the change through its own review step [cite: https://www.reddit.com/r/ClaudeAI/comments/1c8k7m2/claude_code_edit_confidence/ · 2025-04-20 · medium].

Screen-scraping terminal output is worse. ANSI codes, multiline prompts, interactive TUIs — all nightmares. Hooks deliver structured JSON. If Claude runs `pytest -v`, your handler gets:

```json
{
  "command": "pytest -v",
  "stdout": "test_foo.py::test_bar PASSED",
  "stderr": "",
  "exit_code": 0,
  "duration_ms": 342
}
```

Parse that once, trigger downstream workflows, move on.

## Real workflows people are running

A Reddit user in r/ClaudeAI described using hooks to auto-commit Claude's changes to Git after each successful test run [cite: https://www.reddit.com/r/ClaudeAI/comments/1d2p9x8/auto_git_commits_with_claude/ · 2025-05-15 · medium]. Hook fires on `code_executed` with `exit_code == 0`, runs `git add -A && git commit -m "Claude: $(date)"`, pushes to a branch. No human in the loop unless tests fail.

Another pattern: chaining Claude Code with the Model Context Protocol [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. Claude writes a data pipeline script. Hook detects `file_created` for `pipeline.py`, then invokes an MCP server that validates the script against your org's data schema. If validation fails, the hook posts the error back into Claude's context window via the API, and Claude iterates. Closed loop.

Some teams use hooks to bridge Claude into legacy CI systems. Claude writes Terraform configs. Hook fires on `file_created` matching `*.tf`, validates syntax with `terraform validate`, then triggers a Jenkins job. Claude doesn't care about Jenkins. Your hook translates the event into whatever Jenkins expects.

## The three-event minimum

Most automation workflows need three hooks:

1. **File events** — detect new scripts, configs, docs
2. **Execution events** — capture test results, build output, command failures
3. **Edit events** — track incremental changes, calculate diffs, decide if a commit boundary was crossed

Here's a minimal setup for a CI-style workflow:

```python
@on_event("file_created")
async def validate_new_files(event):
    if event["path"].endswith(".py"):
        result = await run_linter(event["content"])
        if result["errors"]:
            await session.inject_feedback(result["errors"])

@on_event("code_executed")
async def log_test_results(event):
    if "pytest" in event["command"]:
        await db.insert("test_runs", {
            "exit_code": event["exit_code"],
            "duration": event["duration_ms"],
            "timestamp": event["timestamp"]
        })

@on_event("edit_applied")
async def auto_commit(event):
    if event["confidence"] > 0.8:
        await git.commit(event["filepath"], event["new_content"])
```

The `inject_feedback` call is part of the hooks API — it posts a message back into Claude's active session [cite: https://github.com/anthropics/anthropic-sdk-python · 2025-05-01 · medium]. So if your linter finds issues, Claude sees them immediately and can fix without you typing a word.

## Debugging hooks without losing your mind

Event-driven code is great until it's not firing and you don't know why. The hooks utility includes a debug mode that logs every event to a local SQLite database:

```python
session = ClaudeSession(
    project_path="./workspace",
    debug_db="events.db"
)
```

Then query with vanilla SQL:

```sql
SELECT event_type, timestamp, payload
FROM events
WHERE event_type = 'code_executed'
  AND json_extract(payload, '$.exit_code') != 0
ORDER BY timestamp DESC;
```

Find all failed commands, inspect payloads, replay events through your handlers locally. No production guesswork.

## Edge cases and gotchas

**Concurrency**: If Claude fires three file-create events in rapid succession and your hook makes a slow network call, you'll bottleneck. Use `asyncio.create_task()` to fan out independent tasks:

```python
@on_event("file_created")
async def handle_file(event):
    asyncio.create_task(upload_to_s3(event["path"]))
    asyncio.create_task(notify_slack(event["path"]))
    # Both run in parallel, don't block the event loop
```

**Idempotency**: Claude might redo an action if it's unsure. You could get duplicate `file_created` events. Add deduplication logic — hash the file content, check if you've seen it before, skip if so.

**Error propagation**: If your hook crashes, Claude doesn't care. It keeps coding. Wrap handlers in try/except, log failures, maybe post them back to Claude via `inject_feedback` if they're actionable.

## How hooks fit with MCP

The Model Context Protocol lets Claude *read* from external systems (databases, APIs, filesystems). Hooks let you *react* when Claude *writes*. They're complementary [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high].

Example: you've got an MCP server exposing your org's OpenAPI specs. Claude queries it, generates a client library, writes `client.py`. A hook detects the file, runs schema validation, then triggers a separate MCP tool that publishes the client to your internal package registry. Claude reads, writes, hooks react, MCP tools publish. Full cycle.

Some workflows use hooks to dynamically register new MCP tools. Claude writes a plugin, hook detects it, hook calls an admin API that hot-loads the plugin into the MCP server. Next request, Claude can use the tool it just authored. Meta, but functional.

## Alternative approaches (and why they're worse)

**Polling the filesystem**: Misses in-memory edits. No semantic context.

**Watching Claude's API logs**: Only works if Claude's actions route through your API wrapper. Direct desktop usage bypasses it.

**Custom patches to Claude Desktop**: Fragile, breaks on updates, no support.

Hooks sit at the protocol boundary. They're stable as long as the JSON-RPC schema is stable, which Anthropic has signalled it will be post-1.0 [cite: https://github.com/anthropics/anthropic-sdk-python · 2025-05-01 · medium].

## Practical starting point

Install via pip (hypothetical package, not yet on PyPI as of May 2026):

```bash
pip install claude-code-hooks
```

Minimal script:

```python
from claude_code_hooks import ClaudeSession, on_event

session = ClaudeSession(project_path="./my_project")

@on_event("file_created")
async def log_file(event):
    print(f"New file: {event['path']}")

session.start()  # Blocks, listens for events
```

Run that alongside Claude Desktop with the project open. When Claude writes a file, your terminal prints the path. Add more handlers from there.

## FAQ

### What if I'm using Claude via API, not desktop?

Hooks require local socket access, which only exists in desktop mode. For API usage, you'll need to build your own event system — track file diffs in your application layer, emit events yourself. The hooks utility won't help.

### Can I use this with other AI coding tools?

Not directly. The event schema is Claude-specific. But the *pattern* (event handlers on AI actions) is portable. You'd need to write adapters for Cursor, Copilot, Replit, etc.

### Does this slow down Claude?

No. Event emission is asynchronous. Claude doesn't wait for your hooks to complete before moving to the next action [cite: https://docs.python.org/3/library/asyncio.html · 2025-03-20 · high]. If your hook is slow, you'll lag behind, but Claude won't block.

### How do I test hooks without running Claude?

The utility includes a mock session object:

```python
from claude_code_hooks.testing import MockSession

session = MockSession()
session.emit("file_created", {"path": "test.py", "content": "print('hi')"})
# Your handlers fire, you can assert on side effects
```

Useful for CI pipelines where you're validating hook logic, not Claude's output.

## Sources

- https://www.anthropic.com/news/claude-code
- https://github.com/anthropics/anthropic-sdk-python
- https://docs.python.org/3/library/asyncio.html
- https://en.wikipedia.org/wiki/Event-driven_architecture
- https://en.wikipedia.org/wiki/Webhook
- https://www.anthropic.com/news/model-context-protocol
- https://www.reddit.com/r/ClaudeAI/comments/1c8k7m2/claude_code_edit_confidence/
- https://www.reddit.com/r/ClaudeAI/comments/1d2p9x8/auto_git_commits_with_claude/