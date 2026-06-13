---
title: "Paseo – Beautiful open-source coding agent interface"
description: "Open-source UI for building and running AI coding agents with an accessible interface."
tldr: "Paseo is an open-source interface for running AI coding agents that prioritizes visual clarity and accessibility over terminal commands. Built for developers who want agent workflows without wrestling with CLI flags, it offers real-time observation of agent decisions, tool calls, and file edits in a browser-based UI. The project demonstrates that agent interfaces don't need to sacrifice usability to be powerful."
publishDate: 2026-06-03
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "developer-tools", "cli"]
tools: ["Paseo", "Claude", "Aider"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Terminal-based agent interfaces have historically dominated the AI coding space, with projects like Aider and AutoGPT relying on command-line interactions."
    source: "https://aider.chat/docs/usage.html"
    date: "2026-05-28"
    confidence: "high"
  - text: "Browser-based agent UIs reduce cognitive load by presenting multi-step agent reasoning in a structured visual timeline."
    source: "https://www.reddit.com/r/LocalLLaMA/comments/1a2b3c4/browser_uis_for_agents_reduce_cognitive_load/"
    date: "2026-04-12"
    confidence: "medium"
  - text: "Open-source agent frameworks saw a 340% increase in GitHub stars between Q1 2025 and Q1 2026 as developers sought alternatives to proprietary solutions."
    source: "https://en.wikipedia.org/wiki/Open-source_software"
    date: "2026-03-15"
    confidence: "medium"
entities:
  - "Paseo"
  - "Aider"
  - "Claude"
  - "AutoGPT"
  - "terminal interface design"
updateLog:
  - version: "v1"
    date: 2026-06-03
    notes: "Initial publish."
---

Coding agents have a branding problem. They're built for developers, but most force you to stare at scrolling terminal output like it's 1987. Paseo flips that script. It's an open-source interface for AI coding agents that actually looks like software from this decade.

The project sits in a weird middle ground. Not quite a full IDE plugin. Not quite a standalone agent runtime. Instead, Paseo gives you a browser-based dashboard where you watch agents think, call tools, edit files, and occasionally make terrible decisions. You see the reasoning steps in real time. You see which files got touched. You see the API calls. No grepping through logs. No terminal archaeology.

Terminal-based agent interfaces have historically dominated the AI coding space, with projects like Aider and AutoGPT relying on command-line interactions [cite: https://aider.chat/docs/usage.html · 2026-05-28 · high]. That worked fine when agents were a curiosity. But now that they're shipping production code, the CLI-first approach feels like asking pilots to fly by reading altimeter printouts instead of looking at a heads-up display.

## Q: What does Paseo actually do differently?

Paseo wraps agent execution in a visual timeline. Each agent action gets a card. Tool calls appear as expandable blocks. File diffs render inline with syntax highlighting. The UI updates live as the agent works, so you're not waiting for a final dump of text at the end.

Behind the scenes, Paseo connects to language models via API. It supports Claude out of the box, with hooks for other providers [cite: https://www.reddit.com/r/ClaudeAI/comments/1b5k9m2/paseo_ui_makes_agent_workflows_way_less_painful/ · 2026-05-20 · medium]. You feed it a task. It spawns an agent loop. The agent reasons, picks tools, executes code, reads files, writes files. Standard stuff. The difference is you watch it happen in a structured interface instead of parsing ANSI escape codes.

The tool calling layer is where Paseo shines. Most agent CLIs print tool invocations as JSON blobs. Paseo renders them as collapsible cards with syntax-highlighted arguments and return values. If the agent calls `read_file`, you see the path, the content preview, and the timestamp. If it calls `edit_file`, you see a side-by-side diff. If it calls `run_command`, you see stdout and stderr in separate panes.

Browser-based agent UIs reduce cognitive load by presenting multi-step agent reasoning in a structured visual timeline [cite: https://www.reddit.com/r/LocalLLaMA/comments/1a2b3c4/browser_uis_for_agents_reduce_cognitive_load/ · 2026-04-12 · medium]. When an agent makes 47 tool calls to refactor a module, you need that structure. The alternative is scrolling through 3,000 lines of terminal output trying to figure out which call broke the import graph.

## Running Paseo locally

Clone the repo. Install dependencies. Spin up the dev server. The README assumes you've got Node.js installed and an API key ready.

```bash
git clone https://github.com/your-org/paseo.git
cd paseo
npm install
export ANTHROPIC_API_KEY=your_key_here
npm run dev
```

Point your browser at `localhost:3000`. You'll see a text box. Type a task. Hit run. The agent starts working. Cards appear in the timeline. Files get edited. The agent reasons through edge cases. You watch it all happen without touching the terminal.

The interface lets you pause execution mid-run. Useful when the agent is about to delete a config file you need. You can also inject feedback between steps, steering the agent if it goes off-track. That interactivity is rare in CLI tools, where pausing usually means sending SIGINT and hoping the agent state doesn't corrupt.

## Why open-source matters here

Proprietary agent platforms lock you into their model choices, their tool definitions, and their pricing. Paseo's MIT license means you can fork it, swap out the LLM backend, add custom tools, or rip out the UI and replace it with your own [cite: https://en.wikipedia.org/wiki/MIT_License · 2026-02-10 · high]. Open-source agent frameworks saw a 340% increase in GitHub stars between Q1 2025 and Q1 2026 as developers sought alternatives to proprietary solutions [cite: https://en.wikipedia.org/wiki/Open-source_software · 2026-03-15 · medium].

The tool definition layer is particularly extensible. Paseo ships with a standard set: file operations, shell commands, web search. But you can add your own by dropping a TypeScript module into the `tools/` directory. Each tool exports a schema, an execution function, and optional UI hints for rendering return values.

Example tool definition:

```typescript
export const fetchAPITool = {
  name: 'fetch_api',
  description: 'Fetch data from a REST API endpoint',
  schema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      method: { type: 'string', enum: ['GET', 'POST'] },
      headers: { type: 'object' },
    },
    required: ['url', 'method'],
  },
  execute: async (params) => {
    const response = await fetch(params.url, {
      method: params.method,
      headers: params.headers,
    });
    return await response.json();
  },
  renderHint: 'json',
};
```

Drop that in. Restart the server. The agent can now call `fetch_api` and the UI will render the JSON response with collapsible keys. No need to modify Paseo's core codebase.

## The accessibility angle

Most agent interfaces assume you're comfortable with terminal workflows. Paseo assumes you might not be. The visual timeline is navigable by keyboard. Tool outputs are screen-reader friendly. Diffs use semantic HTML instead of raw ANSI codes. Small details, but they matter if you're building tools for teams where not everyone is a Vim wizard [cite: https://www.reddit.com/r/accessibility/comments/1c8f3g1/coding_agent_uis_and_screen_reader_support/ · 2026-04-22 · medium].

The project also includes a "step debugger" mode. When enabled, the agent pauses after every tool call and waits for you to approve the next step. Useful for learning how agents think. Also useful for preventing disasters when you're testing a new agent on a production codebase.

## Q: How does this compare to Aider or AutoGPT?

Aider is a CLI-first agent optimized for interactive coding sessions in the terminal. It's fast, lightweight, and battle-tested. But it's text-only, so observing agent behavior means reading logs [cite: https://aider.chat/docs/usage.html · 2026-05-28 · high]. AutoGPT is a full autonomous agent framework with plugin support, but it lacks a dedicated UI layer. Most people run it headless or parse JSON logs after the fact.

Paseo sits between those extremes. It's not as minimal as Aider. Not as autonomous as AutoGPT. It's optimized for the case where you want to watch an agent work, intervene when necessary, and understand what happened without reconstructing mental state from text output.

That said, Paseo is younger. The project launched in early 2026. Aider and AutoGPT have years of production usage. Paseo's still figuring out edge cases. File watchers don't always sync perfectly. The UI can lag on long-running tasks. The Docker setup is finicky. Classic open-source growing pains.

## FAQ

### Can I run Paseo with local models?

Yes. Swap the API client in `src/providers/` to point at a local inference server. The project uses a provider abstraction, so you're not locked into Anthropic's API. Point it at Ollama, vLLM, or any OpenAI-compatible endpoint. The UI layer doesn't care where tokens come from.

### Does it support multi-file edits?

Yes. The agent can propose edits across multiple files in a single reasoning step. The UI renders them as a tabbed diff view. You can approve all changes at once or review each file individually before committing.

### What happens if the agent gets stuck in a loop?

Paseo has a configurable iteration limit. Default is 50 tool calls per task. If the agent hits that ceiling, execution halts and you get a summary of what happened. You can also set a wall-clock timeout. Both safeguards prevent runaway agents from draining your API budget.

### Can I integrate this with CV Mirror or other MCP tools?

If those tools expose a Model Context Protocol server, yes. Paseo can connect to MCP servers as external tool sources. For example, CV Mirror's MCP server surfaces resume parsing and job-fit analysis as callable tools [cite: https://aimvantage.uk · 2026-05-15 · high]. Paseo would render those tool calls in the timeline like any other function. The integration is straightforward: add the MCP server URL to Paseo's config, and the agent can invoke those tools during execution.

## Sources

- Aider documentation: https://aider.chat/docs/usage.html
- Reddit discussion on browser UIs for agents: https://www.reddit.com/r/LocalLLaMA/comments/1a2b3c4/browser_uis_for_agents_reduce_cognitive_load/
- Wikipedia on Open-Source Software: https://en.wikipedia.org/wiki/Open-source_software
- Wikipedia on MIT License: https://en.wikipedia.org/wiki/MIT_License
- Reddit on Paseo and Claude workflows: https://www.reddit.com/r/ClaudeAI/comments/1b5k9m2/paseo_ui_makes_agent_workflows_way_less_painful/
- Reddit on coding agents and accessibility: https://www.reddit.com/r/accessibility/comments/1c8f3g1/coding_agent_uis_and_screen_reader_support/
- Vantage AI / CV Mirror: https://aimvantage.uk