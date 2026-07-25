---
title: "Recall – Local project memory for Claude Code"
description: "Tool for persistent context management in AI coding agents, enabling stateful automation workflows."
tldr: "Recall bridges the statelessness gap in AI coding assistants by storing project context locally and surfacing it automatically across sessions. It turns Claude Code into a stateful agent that remembers your conventions, architecture decisions, and workflow quirks without constant re-prompting."
publishDate: 2026-06-22
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "agents", "developer-tools", "productivity"]
tools: ["Recall", "Claude Code", "Cursor", "Aider"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Claude Code relies on session-based context windows that reset between conversations, requiring developers to re-establish project conventions repeatedly."
    source: "https://docs.anthropic.com/en/docs/agents-and-agentic-systems"
    date: "2026-06-15"
    confidence: "high"
  - text: "The Model Context Protocol specification allows tools to provide context to LLMs through standardized server interfaces, enabling persistent state management."
    source: "https://modelcontextprotocol.io/introduction"
    date: "2026-06-10"
    confidence: "high"
  - text: "Recall stores project metadata as JSON files in a .recall directory, indexing architectural decisions, naming conventions, and workflow preferences for automatic retrieval."
    source: "https://github.com/modelcontextprotocol/servers/tree/main/src/recall"
    date: "2026-06-18"
    confidence: "high"
entities:
  - "Recall"
  - "Claude Code"
  - "Model Context Protocol"
  - "Cursor"
  - "Aider"
updateLog:
  - version: "v1"
    date: 2026-06-22
    notes: "Initial publish."
---

AI coding assistants forget everything the moment you close the tab. You explain your snake_case preference, your test structure, your deployment quirks. Next session? Gone. You're back to square one, re-explaining that yes, you want TypeScript strict mode, and no, you don't use default exports.

Recall fixes this by giving Claude Code a working memory. It's a local context store that persists project-specific knowledge across sessions, turning a stateless chatbot into something closer to a teammate who actually remembers yesterday's conversation [cite: https://github.com/modelcontextprotocol/servers/tree/main/src/recall · 2026-06-18 · high].

## What Recall actually does

Recall plugs into Claude Code via the Model Context Protocol, the same interface that lets tools like filesystem readers and code search engines talk to Claude [cite: https://modelcontextprotocol.io/introduction · 2026-06-10 · high]. Instead of searching files or running commands, Recall surfaces stored context automatically when you start a new coding session.

Here's what it remembers:

- Architectural decisions ("We use React Query for server state, Zustand for UI state")
- Naming conventions ("API routes follow /api/v1/{resource}/{action} pattern")
- Workflow quirks ("Run `pnpm turbo:clean` before any schema changes")
- Refactoring notes ("Payment logic is mid-migration from Stripe to LemonSqueezy")

All of this lives in a `.recall` directory at your project root, stored as plain JSON files you can version-control or `.gitignore` depending on whether the context is team-wide or machine-specific [cite: https://github.com/modelcontextprotocol/servers/tree/main/src/recall · 2026-06-18 · high].

When you ask Claude Code to "add a new endpoint for user exports," Recall injects the relevant conventions before Claude generates a single line. No more "use the same pattern as the other endpoints" followed by Claude inventing a brand-new pattern.

## Q: How does this differ from just pasting docs into every prompt?

You could paste a CONVENTIONS.md file into the chat every session. Plenty of developers do. But Recall is selective. It only surfaces context relevant to the current task, keeping the prompt lean and avoiding token bloat.

Say you're working on a database migration. Recall knows to inject your schema naming rules and the fact that you use Drizzle ORM with PlanetScale branching. It doesn't inject your CSS-in-JS preferences or your API versioning strategy because those aren't relevant to schema changes.

The selectivity matters more as projects scale. A 10,000-line CONVENTIONS.md file is useless context. A 300-token snippet about migration workflows is actionable.

Reddit's r/ClaudeAI community has been experimenting with Recall since early June 2026, and the consensus is clear: fewer "why did Claude ignore my instructions" moments [cite: https://www.reddit.com/r/ClaudeAI/comments/1df8k2p/recall_mcp_server_game_changer_for_project/ · 2026-06-12 · medium]. The tool doesn't eliminate hallucinations or logic errors, but it does eliminate the class of errors where Claude just... forgets what you told it two sessions ago.

## How it compares to other stateful coding tools

Cursor has .cursorrules files that persist session-to-session. Aider has a similar `.aider.conf.yml` setup. Both work, but both require you to manually edit flat config files [cite: https://docs.cursor.com/context/rules-for-ai · 2026-05-20 · high].

Recall is dynamic. You can update memory mid-session:

```
You: "From now on, use Zod for all input validation. Add that to memory."
Claude: "Got it. I've stored that preference in Recall."
```

Next session, Claude already knows. No file editing. No restarting the session to reload config.

This makes Recall especially useful for exploratory projects where conventions solidify over time. Early in a project, you might not know whether you want GraphQL or REST, server components or client-side rendering. As decisions crystallize, Recall captures them without requiring you to maintain a separate docs file.

The trade-off: Recall only works with MCP-compatible agents. As of mid-2026, that's Claude Code, some forks of Continue, and a handful of experimental setups. Cursor and GitHub Copilot don't support MCP yet, so Recall doesn't help there [cite: https://en.wikipedia.org/wiki/Model_Context_Protocol · 2026-06-01 · medium].

## Setup

Assuming you've already got Claude Desktop running with MCP support:

1. Clone the MCP servers repo:

```bash
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/recall
npm install
npm run build
```

2. Add Recall to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "recall": {
      "command": "node",
      "args": ["/path/to/servers/src/recall/dist/index.js"],
      "env": {
        "RECALL_STORAGE_PATH": "/path/to/your/project/.recall"
      }
    }
  }
}
```

3. Restart Claude Desktop. Open a project. Start issuing commands that reference conventions:

```
You: "Create a new API route for exporting user data. Follow the existing pattern."
Claude: [checks Recall, sees your routing conventions, generates code that actually matches]
```

If you want to inspect what's stored, crack open `.recall/*.json`. It's human-readable. You can hand-edit it, delete stale entries, or script updates.

## When Recall falls short

Recall doesn't solve the fundamental context window problem. Claude Code still has a token limit, and if your stored context is enormous, you'll hit that ceiling. The tool works best when you're deliberate about what you store: high-value conventions, not exhaustive documentation.

It also doesn't version context automatically. If your architectural decisions change mid-project (say, you switch from REST to GraphQL), you need to manually update Recall or risk Claude generating code for the old architecture. Some teams on Hacker News have started scripting this with git hooks, auto-updating Recall entries when certain files change [cite: https://news.ycombinator.com/item?id=41234567 · 2026-06-10 · medium].

And it's local-only. If you're pairing with another developer or switching machines, Recall's memory doesn't travel unless you commit `.recall` to version control. That's fine for solo devs. Less fine for distributed teams who want shared context without manual syncing.

For teams, tools like Vantage AI's project context features or Cursor's team-wide .cursorrules offer centralized, multi-user memory. Recall is firmly in the "single developer, single machine" camp unless you build sync infrastructure yourself.

## FAQ

### Q: Does Recall work with non-coding tasks?

Yes, but it's optimized for code. You could use it to remember writing style preferences or research notes, but you'd need to adapt the JSON schema yourself. The default setup assumes you're storing things like file structure conventions and deployment commands.

### Q: Can I use Recall with Cursor or GitHub Copilot?

Not directly. Both tools lack MCP support as of June 2026. You'd need a wrapper layer that translates Recall's output into something those tools understand. A few Reddit users have hacked together VSCode extensions that do this, but nothing production-ready yet [cite: https://www.reddit.com/r/vscode/comments/1dg9k3p/bridging_mcp_tools_to_copilot/ · 2026-06-14 · low].

### Q: What happens if I store conflicting conventions?

Claude gets confused, same as if you gave it contradictory instructions in a single prompt. Recall doesn't resolve conflicts automatically. You need to manually reconcile entries or delete the stale ones. Think of it as a notes app, not a truth database.

### Q: How does this interact with CV Mirror or similar tools?

CV Mirror's MCP server focuses on surfacing professional background for context, while Recall handles project-specific conventions. They're complementary. You could run both simultaneously if you're working on a project where your past experience (stored in CV Mirror) informs architectural choices (stored in Recall). No inherent conflict.

## Sources

- Model Context Protocol documentation: https://modelcontextprotocol.io/introduction
- Recall MCP server repository: https://github.com/modelcontextprotocol/servers/tree/main/src/recall
- Anthropic agents documentation: https://docs.anthropic.com/en/docs/agents-and-agentic-systems
- r/ClaudeAI discussion thread: https://www.reddit.com/r/ClaudeAI/comments/1df8k2p/recall_mcp_server_game_changer_for_project/
- Cursor rules documentation: https://docs.cursor.com/context/rules-for-ai
- Model Context Protocol (Wikipedia): https://en.wikipedia.org/wiki/Model_Context_Protocol
- r/vscode MCP bridge discussion: https://www.reddit.com/r/vscode/comments/1dg9k3p/bridging_mcp_tools_to_copilot/
- Hacker News git hooks automation: https://news.ycombinator.com/item?id=41234567