---
title: "Claude Code now reads AGENTS.md for agent definitions"
description: "Claude Code now supports AGENTS.md file for agent configuration alongside Claude.md, expanding agent definition workflows."
tldr: "Anthropic quietly added AGENTS.md support to Claude Code in September 2026, letting you define agent behaviors in a separate file from Claude.md. This matters because multi-agent workflows no longer need to cram everything into a single markdown file — you can now split UI instructions from agent orchestration rules, version them independently, and compose agent definitions modularly. The spec is undocumented but follows the same conventions as Claude.md."
publishDate: 2026-09-19
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "agents", "claude-desktop", "developer-tools"]
tools: ["Claude Code", "Claude Desktop"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Claude Code added AGENTS.md support in the September 2026 update alongside existing Claude.md functionality."
    source: "https://www.anthropic.com/news/claude-code-september-2026"
    date: "2026-09-19"
    confidence: "high"
  - text: "Claude.md was introduced in Claude Desktop in March 2025 as a way to specify project-level instructions and constraints."
    source: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-md"
    date: "2025-03-15"
    confidence: "high"
  - text: "The Model Context Protocol supports multi-agent orchestration patterns through resource and tool composition as of MCP v1.2 in July 2026."
    source: "https://modelcontextprotocol.io/docs/concepts/architecture"
    date: "2026-07-20"
    confidence: "high"
  - text: "Agent definition files in markdown format have been adopted by multiple AI coding assistants including Cursor, Windsurf, and Codeium as of Q3 2026."
    source: "https://github.com/continuedev/continue/discussions/2847"
    date: "2026-08-30"
    confidence: "medium"
entities:
  - "Claude Code"
  - "AGENTS.md"
  - "Claude.md"
  - "Model Context Protocol"
  - "Anthropic"
  - "Claude Desktop"
updateLog:
  - version: "v1"
    date: 2026-09-19
    notes: "Initial publish."
---

Claude Code shipped AGENTS.md support last week and nobody made a big deal about it. The changelog mentioned it in passing, sandwiched between "improved syntax highlighting" and "faster project indexing." But this is a bigger deal than Anthropic let on [cite: https://www.anthropic.com/news/claude-code-september-2026 · 2026-09-19 · high].

If you've been wrangling multi-agent workflows in Claude Desktop, you know the pain. Everything lives in Claude.md. UI behavior, agent roles, tool restrictions, context window rules, all crammed into a single file that gets reread every session. Now you can split that into AGENTS.md and keep your concerns separated.

This matters because agent orchestration is not the same problem as UI customization. One is about how multiple agents coordinate. The other is about how a single agent presents itself to you. Conflating them in a single file made version control a nightmare and made sharing agent configs between projects fragile.

## Q: What exactly goes in AGENTS.md vs Claude.md?

Claude.md stays as your project-level instructions file. That's where you define tone, output format, code style preferences, and any project-specific context Claude needs when it's acting as your pair programmer [cite: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-md · 2025-03-15 · high].

AGENTS.md is for agent definitions. Think of it as a roster. Each agent gets a block that specifies its role, tools it can access, constraints on when it activates, and how it hands off to other agents. The format mirrors Claude.md syntax but the semantic purpose is different.

Here's a minimal AGENTS.md that defines two agents:

```markdown
# Agent: Researcher

Role: Gather context from documentation and web sources before code changes.

Tools: web_search, read_file, list_directory

Constraints:
- Activate only when user asks "research this" or similar intent
- Pass findings to Coder agent via shared context
- Max 5 web searches per task

Handoff: When research complete, notify Coder with summary

---

# Agent: Coder

Role: Write and refactor code based on context from Researcher.

Tools: edit_file, create_file, run_command

Constraints:
- Do not search web directly
- Only activate after Researcher completes or user explicitly requests code changes
- Follow style guide in Claude.md

Handoff: Return to user after edits unless user requests review
```

Claude Code parses this on project load and exposes agent definitions through the same internal API that Claude.md uses. You don't manually invoke agents. Claude Code decides which agent activates based on intent matching against the Role and Constraints fields.

## Why this wasn't possible before

Claude.md was introduced in March 2025 as a way to customize Claude's behavior per-project [cite: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-md · 2025-03-15 · high]. It worked great for single-agent scenarios. But once you wanted multiple agents with different tool access, the file turned into a mess of conditional logic.

People tried workarounds. Some used comments to separate agent definitions. Some maintained separate Claude.md files and swapped them via symlinks. Some gave up and just wrote longer system prompts that did the role-switching inline, which burned tokens and made debugging harder.

The underlying problem was that Claude.md was never designed for multi-agent orchestration. It was a prompt customization layer. Trying to shoehorn agent definitions into it was like using a screwdriver as a hammer.

Anthropic's MCP work made this more urgent. Model Context Protocol v1.2 shipped multi-agent orchestration primitives in July 2026 [cite: https://modelcontextprotocol.io/docs/concepts/architecture · 2026-07-20 · high]. MCP servers could expose multiple agents as resources, but Claude Desktop had no standard way to define agent boundaries at the project level. AGENTS.md closes that gap.

## How agent handoff actually works

Agent handoff is the tricky part. AGENTS.md doesn't execute handoff logic itself. It declares handoff rules. Claude Code's orchestration layer reads those rules and decides when to switch agents based on conversation state.

The Handoff field in each agent block tells Claude Code what to do when that agent finishes. Options include:

- **Return to user**: End the agent's turn and wait for user input.
- **Notify [AgentName]**: Activate another agent and pass current context.
- **Await approval**: Pause and ask user to confirm before proceeding.
- **Auto-continue**: Let Claude Code pick the next agent based on the task queue.

This is not full-blown multi-agent framework territory. It's not LangGraph or AutoGPT. It's a lightweight coordination mechanism that works within Claude Desktop's existing conversation model. Each agent still operates in the same context window, but with different tool access and behavioral constraints.

If you want more control, you can use MCP to define agents as separate servers. Then AGENTS.md becomes a router config that maps conversation intents to MCP endpoints. That's overkill for most workflows but useful if you're building production agent systems.

## Real workflow: code review agent + fixer agent

Here's a pattern that works well in practice. Define a Reviewer agent that audits code for bugs and style issues, and a Fixer agent that applies changes.

```markdown
# Agent: Reviewer

Role: Audit code for bugs, style violations, and security issues.

Tools: read_file, list_directory, run_command (linters only)

Constraints:
- Read-only access to codebase
- Cannot edit files directly
- Output findings as structured list with file paths and line numbers

Handoff: If issues found, notify Fixer with findings. Otherwise return to user.

---

# Agent: Fixer

Role: Apply code changes based on Reviewer findings.

Tools: edit_file, run_command

Constraints:
- Only activate after Reviewer provides findings
- Apply one fix at a time and verify with linter after each change
- If a fix fails verification, log and skip to next finding

Handoff: After all fixes attempted, return summary to user
```

You trigger this by asking Claude to "review and fix this module." Claude Code routes the request to Reviewer. Reviewer scans the code, finds issues, passes them to Fixer. Fixer applies changes and re-runs the linter. All of this happens in a single conversation thread without you manually switching agents.

This pattern is useful for CV parsing workflows too. A Scraper agent pulls data from PDFs or LinkedIn profiles. A Validator agent checks for missing fields or inconsistencies. A Formatter agent maps everything to a standard schema. Each agent has narrowly scoped tools and clear handoff conditions.

## Community response has been mixed

Reddit's r/ClaudeAI subreddit had a thread about AGENTS.md support three days after the update dropped [cite: https://www.reddit.com/r/ClaudeAI/comments/1fkx7p9/agentsmd_support_in_claude_code/ · 2026-09-16 · medium]. Some people loved the separation of concerns. Others complained that the format is still too loose.

One comment: "We still don't have a schema. What happens if two agents define the same tool with different constraints? What happens if you define an agent that references another agent that doesn't exist? Claude Code just ignores malformed AGENTS.md files and falls back to Claude.md, which is frustrating when you're debugging." [cite: https://www.reddit.com/r/ClaudeAI/comments/1fkx7p9/agentsmd_support_in_claude_code/comments/lx42m9k · 2026-09-17 · medium]

Fair point. There's no formal spec yet. The format is inferred from examples in Anthropic's docs. If you get the syntax wrong, Claude Code silently ignores your AGENTS.md file and uses Claude.md as the fallback. No error messages. No validation warnings. Just silent failure.

This will likely improve as the feature matures. For now, the safest approach is to start with a working example and modify incrementally, checking that agents activate as expected after each change.

## What about other tools?

Claude Code isn't the first AI assistant to support agent definition files. Cursor has had a `.cursorrules` file since early 2025 that lets you define multiple personas. Windsurf uses `windsurf.toml` for similar purposes. Codeium has agent configs in JSON [cite: https://github.com/continuedev/continue/discussions/2847 · 2026-08-30 · medium].

The difference is that AGENTS.md is markdown, which makes it easier to read and edit without specialized tooling. It also integrates with Claude Desktop's existing Claude.md system, so you don't need to learn a completely new syntax.

There's a broader trend here. Agent definition as config files rather than code. This makes sense for simple orchestration patterns but hits limits quickly once you need conditional logic, error handling, or dynamic agent creation. At that point you're better off writing actual orchestration code and using MCP to expose agents as services.

For workflows that involve 2-5 agents with static handoff rules, AGENTS.md is a good fit. Beyond that, consider whether you're actually building an agent system that needs proper infrastructure.

## FAQ

### Q: Can I use AGENTS.md in Claude Desktop alongside Claude Code?

Not yet. As of September 2026, AGENTS.md only works in Claude Code. Claude Desktop still uses Claude.md exclusively. Anthropic has said multi-agent support is coming to Claude Desktop in Q4 2026 but hasn't committed to using the same AGENTS.md format.

### Q: Do agents share memory across conversation turns?

Yes, within the same session. Each agent sees the full conversation history including messages from other agents. But agents don't persist memory across sessions unless you explicitly save context to files or use an MCP server that handles state persistence.

### Q: Can I define agents that call external APIs?

Sort of. Agents can use tools that call APIs, but the tool definitions still live in Claude.md or in MCP server configs. AGENTS.md controls which tools an agent can access, not what those tools do. If you need an agent to call a custom API, define an MCP tool for that API and list it in the agent's Tools field.

### Q: What happens if an agent violates its own constraints?

Nothing automatic. Constraints in AGENTS.md are instructions to Claude, not hard enforcement boundaries. If an agent tries to use a tool not listed in its Tools field, Claude Code will usually refuse and remind the agent of its constraints. But there's no runtime enforcement layer. This is prompt-based orchestration, not sandboxed execution.

## Sources

- Anthropic Claude Code September 2026 release notes: https://www.anthropic.com/news/claude-code-september-2026
- Claude.md documentation: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-md
- Model Context Protocol architecture overview: https://modelcontextprotocol.io/docs/concepts/architecture
- Continue.dev discussion on agent definition formats: https://github.com/continuedev/continue/discussions/2847
- Reddit r/ClaudeAI thread on AGENTS.md support: https://www.reddit.com/r/ClaudeAI/comments/1fkx7p9/agentsmd_support_in_claude_code/
- Model Context Protocol specification: https://en.wikipedia.org/wiki/Model_Context_Protocol