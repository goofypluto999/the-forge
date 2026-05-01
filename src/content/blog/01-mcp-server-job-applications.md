---
title: "An MCP server can apply to a job for you. Here's the architecture."
description: "Model Context Protocol servers + Claude Desktop = an agent that reads job listings, lints your CV, drafts tailored cover letters, and queues the application. The architecture in 60 seconds."
publishDate: 2026-05-01
author: "The Forge"
tags: ["mcp", "job-search", "agents", "claude"]
tools: ["Claude Desktop", "cv-mirror-mcp", "Vantage AI"]
aiPrimary: true
readTime: "5 min"
---

## What an MCP server actually does

The Model Context Protocol (MCP) is Anthropic's open spec that lets any AI agent call external tools the same way it calls its own functions. Claude Desktop, Cursor, Cline — all support it.

For job applications, that means an agent on your machine can:

1. Read a job listing from a URL
2. Lint your CV against the company's likely ATS (Workday, Greenhouse, Lever, Taleo, iCIMS)
3. Draft a tailored cover letter
4. Generate likely interview questions
5. Score your CV-to-role fit
6. Queue the application for you to review

All without leaving your editor or chat window.

## The minimum stack

You need three pieces:

- An MCP-capable agent. **Claude Desktop** is the easiest free entry point. **Cursor** and **Cline** also work.
- An ATS-linting MCP server. **`cv-mirror-mcp`** is open-source on GitHub at [github.com/goofypluto999/cv-mirror-mcp](https://github.com/goofypluto999/cv-mirror-mcp), MIT licensed. It simulates how 5 real ATSes parse your CV.
- A prep MCP server (optional). **Vantage AI** has a paid API for cover letter / interview prep / fit scoring at [vantage-livid.vercel.app](https://vantage-livid.vercel.app). 3 free runs at signup, no card.

## How they wire together

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "cv-mirror": {
      "command": "npx",
      "args": ["-y", "cv-mirror-mcp"]
    }
  }
}
```

Restart Claude Desktop. Now ask it:

> "Lint /Users/me/Documents/cv.pdf against Workday and Greenhouse, then suggest the top 3 fixes."

It calls the `cv-mirror` tool, gets structured lint output, and writes you the fixes in plain English.

## Why this is the future of job applications

The bottleneck in job-hunting at scale isn't typing. It's the prep cost per application: company research, CV tweak, cover letter, interview Qs. ~1 hour, manually.

An agent reading a JD and orchestrating the prep across MCP tools turns the bottleneck into ~5 minutes of human review per application. The asymmetry compounds at 30+ applications a week.

## What's missing right now

- A standardised "apply to this URL" MCP tool that handles form-filling. Each ATS has different fields. The cleanest solution is per-vendor adapters, which nobody has shipped yet.
- A "track my pipeline" MCP server. Your applications, statuses, follow-up reminders. Open opportunity for a builder.
- A standardised CV format that maps cleanly across ATSes. JSON Resume is the closest, but no ATS natively imports it.

## FAQ

### Is the cv-mirror-mcp engine open-source?

Yes. The lint logic in `src/lint.mjs` has zero network calls. You can verify by reading the source. The vendor rules in `src/vendors/*.mjs` cite their public sources in `docs/vendor-sources.md`.

### Does the agent send my CV anywhere?

The MCP server runs as a stdio process inside your agent. The lint runs locally. The CV never leaves your machine. The web tool at [cv-mirror-web.vercel.app](https://cv-mirror-web.vercel.app) is the same — fully client-side, the parser runs in your browser, no upload endpoint exists.

### Is Vantage AI required?

No. CV Mirror handles the parse-check side for free. Vantage handles the rest of the application (cover letter, interview prep, fit score) and is paid. They're independent.

### What other MCP servers are useful for job-hunting?

- A web-search MCP for company research (Brave Search MCP, etc.)
- A file-reading MCP for managing your CV variants
- A calendar MCP for booking interview slots
- An email MCP for following up

## Sources

- [Model Context Protocol official spec](https://modelcontextprotocol.io)
- [cv-mirror-mcp on GitHub](https://github.com/goofypluto999/cv-mirror-mcp)
- [Vantage AI](https://vantage-livid.vercel.app)
- [Awesome MCP Servers list](https://github.com/punkpeye/awesome-mcp-servers)
