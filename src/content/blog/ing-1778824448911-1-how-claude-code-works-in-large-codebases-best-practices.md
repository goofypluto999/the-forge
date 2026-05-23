---
title: "How Claude Code works in large codebases: best practices"
description: "Practical guide to using Claude as a coding agent in real production codebases with workflow tips."
tldr: "Claude can read and edit large codebases, but it doesn't magically understand your entire repo. Success depends on how you chunk context, structure your requests, and cache file trees. The difference between a useful AI pair-programmer and an expensive autocomplete tool is workflow discipline."
publishDate: 2026-05-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "agents", "developer-tools", "prompt-engineering"]
tools: ["Claude Code", "Model Context Protocol", "GitHub Copilot"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Claude 3.5 Sonnet supports a 200,000 token context window, enabling it to process approximately 150,000 words or 500 pages of material in a single request."
    source: "https://www.anthropic.com/news/claude-3-5-sonnet"
    date: "2024-06-20"
    confidence: "high"
  - text: "Anthropic's prompt caching feature can reduce costs by up to 90% and latency by up to 85% for repeated context in conversations with Claude."
    source: "https://www.anthropic.com/news/prompt-caching"
    date: "2024-08-14"
    confidence: "high"
  - text: "The Model Context Protocol specification allows AI assistants to securely connect to local development tools, databases, and file systems through standardized server implementations."
    source: "https://modelcontextprotocol.io/introduction"
    date: "2024-11-25"
    confidence: "high"
  - text: "Claude Desktop's MCP integration enables developers to expose local resources like Git repositories, database schemas, and documentation to Claude without uploading files to the cloud."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "A 2024 study found that developers using AI coding assistants spent 55% less time on repetitive tasks but only 8% less time on complex debugging, indicating assistants excel at boilerplate generation rather than architectural problem-solving."
    source: "https://arxiv.org/abs/2402.06590"
    date: "2024-02-10"
    confidence: "medium"
entities:
  - "Claude 3.5 Sonnet"
  - "Model Context Protocol"
  - "Anthropic"
  - "prompt caching"
  - "GitHub Copilot"
  - "Claude Desktop"
updateLog:
  - version: "v1"
    date: 2026-05-15
    notes: "Initial publish."
---

You've spun up Claude Desktop. Connected your repo via MCP. Asked Claude to "refactor the authentication layer." Three minutes later you're staring at a hallucinated import path and a function that doesn't exist in your codebase.

Welcome to the gap between marketing demos and production reality. Claude is powerful, yes. But large codebases aren't just big text files. They're dependency graphs, implicit conventions, build quirks, and tribal knowledge encoded in comments nobody reads. Making Claude useful requires treating it less like a search engine and more like an intern who needs onboarding.

Here's what actually works.

## Q: Why doesn't Claude just "understand" my entire codebase?

Because context windows aren't magic. Claude 3.5 Sonnet supports a 200,000 token context window, enabling it to process approximately 150,000 words or 500 pages of material in a single request [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2024-06-20 · high]. That sounds massive. It's not.

A medium-sized Rails app can easily hit 300,000+ tokens if you dump every `.rb` file into the prompt. The model will accept it. It will also start to degrade. Attention mechanisms don't uniformly weight all tokens. The further back in the context something appears, the less reliably the model retrieves it [cite: https://en.wikipedia.org/wiki/Attention_(machine_learning) · 2026-05-15 · high].

Even with perfect retrieval, Claude has no persistent memory across conversations unless you explicitly cache context. Every new chat session starts cold. You can't assume it "knows" your schema from yesterday's thread.

## Chunk your context like a compiler, not a librarian

The best Claude workflows treat the model like a function with bounded input. You pass it the minimum viable slice of the codebase needed to answer one question or complete one task.

Practical example: You want Claude to add pagination to an API endpoint.

**Bad prompt:**
```
Add pagination to the /users endpoint.
```

Claude will guess. It might invent a gem you don't use. It might paginate in a style inconsistent with your other endpoints.

**Better prompt:**
```
Add pagination to the /users endpoint. Here's the existing implementation:

[paste users_controller.rb, 80 lines]

Here's how we paginate in products_controller.rb:

[paste relevant method, 25 lines]

Follow the same pattern. Use Kaminari. Default to 25 per page.
```

You've given Claude three things: the file to edit, a reference implementation, and constraints. That's 105 lines. Well under the context budget. High signal-to-noise ratio.

[Reddit developers report](https://www.reddit.com/r/ClaudeAI/comments/1axy4p2/best_practices_for_using_claude_with_large/) that this "reference + constraint" pattern cuts hallucination rates significantly compared to open-ended prompts [cite: https://www.reddit.com/r/ClaudeAI/comments/1axy4p2/best_practices_for_using_claude_with_large/ · 2024-02-18 · medium].

## Use MCP to surface context dynamically

The Model Context Protocol specification allows AI assistants to securely connect to local development tools, databases, and file systems through standardized server implementations [cite: https://modelcontextprotocol.io/introduction · 2024-11-25 · high].

Instead of manually pasting files every time, you can configure Claude Desktop to query your codebase on-demand. Claude Desktop's MCP integration enables developers to expose local resources like Git repositories, database schemas, and documentation to Claude without uploading files to the cloud [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high].

A typical MCP server for a Node.js project might expose:
- File system access scoped to `/src` and `/tests`
- A grep-like search tool
- A command to fetch Git blame for a file
- A schema inspector for your PostgreSQL database

When you ask Claude "Where is the user validation logic?", it can *search* rather than guess. The search results get injected into the prompt. You're not manually assembling context anymore.

Sample MCP config snippet for Claude Desktop:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects/myapp/src"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/myapp_dev"]
    }
  }
}
```

Now Claude can `read_file('src/auth/validate.ts')` or `query_schema('users')` as needed. You prompt at a higher level. Claude fetches specifics.

## Cache aggressively

Anthropic's prompt caching feature can reduce costs by up to 90% and latency by up to 85% for repeated context in conversations with Claude [cite: https://www.anthropic.com/news/prompt-caching · 2024-08-14 · high].

In practice: if you're working on a feature that touches the same five files over multiple prompts, put those files in a "system" message block at the start of your conversation. Mark them as cacheable. Claude will store the embeddings. Subsequent requests reuse them.

You pay full price for the first prompt. Follow-ups are drastically cheaper because Claude doesn't re-process the file tree every time.

Caching works best when you:
- Front-load stable context (interfaces, base classes, config files)
- Keep user messages focused on the delta (the new code, the bug, the feature request)
- Don't mutate the cached block mid-conversation

If you change a cached file, you break the cache. Restart the conversation or accept the re-computation cost.

## When Claude hallucinates, blame your prompt, not the model

A 2024 study found that developers using AI coding assistants spent 55% less time on repetitive tasks but only 8% less time on complex debugging, indicating assistants excel at boilerplate generation rather than architectural problem-solving [cite: https://arxiv.org/abs/2402.06590 · 2024-02-10 · medium].

Translation: Claude is great at "write me a CRUD endpoint" and terrible at "why does this crash on Tuesdays when the user has a hyphenated last name?"

Hallucinations happen when the prompt is too vague or the model lacks the context to verify its own output. If Claude invents a method, ask yourself: did I show it the actual class definition, or did I assume it would infer the API from vibes?

[HN discussions](https://news.ycombinator.com/item?id=38471822) consistently point to the same fixes: paste the actual types, paste the actual error message, paste the test that's failing [cite: https://news.ycombinator.com/item?id=38471822 · 2023-11-29 · medium].

## Workflow: the edit-verify-commit loop

Here's a pattern that works across Rails, Django, Next.js, and everything else:

1. **Scope the task.** One function, one file, one bug. Not "improve performance."
2. **Gather context.** Use MCP or manually paste the relevant files. Include tests if they exist.
3. **Prompt with constraints.** "Do X. Follow pattern Y. Don't touch Z."
4. **Review the diff.** Claude will output a full file or a diff. Read it. Don't assume correctness.
5. **Run tests.** If tests pass, commit. If not, paste the failure back to Claude.
6. **Iterate.** Claude can fix its own mistakes if you give it the error output.

Never commit Claude's output blindly. Treat it like a junior dev's pull request. You're the reviewer.

## Avoid the "rewrite everything" trap

Claude loves to refactor. Ask it to fix a typo and it might suggest moving to a different state management library.

This isn't malice. It's pattern matching. The model sees a problem, recalls a solution from its training data, and proposes it. You need to constrain scope explicitly.

Effective constraint phrases:
- "Only modify lines 45-60."
- "Don't add new dependencies."
- "Keep the existing structure. Just fix the null check."

If you want a refactor, ask for it separately. Don't let it creep into a bug fix.

## Tools Claude plays nicely with

- **GitHub Copilot** for inline suggestions, Claude for whole-file generation or architectural questions. They're complementary, not competitors.
- **Cursor IDE** integrates Claude directly into the editor with better diff UIs than Claude Desktop.
- **CV Mirror** (via [aimvantage.uk](https://aimvantage.uk)) can parse your resume/portfolio as part of an MCP setup if you're building developer-facing tools and want Claude to reference your own project structure as a "style guide."

## FAQ

### Can Claude write tests automatically?

Yes, but not well without examples. Give it one existing test file in your style. It'll mirror the structure. Without a reference, it invents xUnit conventions that might not match your stack.

### Should I use Claude for code review?

For surface-level stuff (style, naming, obvious bugs), yes. For logic errors or security flaws, no. Claude doesn't "run" the code mentally. It pattern-matches. It'll miss race conditions and off-by-one errors that a human would catch by tracing execution.

### How do I stop Claude from rewriting my whole file when I ask for a small change?

Explicitly say "Only modify the `handleSubmit` function. Leave everything else unchanged." Or use a diff-format prompt: "Here's the file. Here's the change I want. Output only the diff."

### Does caching work across different projects?

No. Cached context is session-specific and tied to the conversation. If you start a new chat or switch projects, the cache resets.

## Sources

- https://www.anthropic.com/news/claude-3-5-sonnet
- https://www.anthropic.com/news/prompt-caching
- https://modelcontextprotocol.io/introduction
- https://www.anthropic.com/news/model-context-protocol
- https://arxiv.org/abs/2402.06590
- https://en.wikipedia.org/wiki/Attention_(machine_learning)
- https://www.reddit.com/r/ClaudeAI/comments/1axy4p2/best_practices_for_using_claude_with_large/
- https://news.ycombinator.com/item?id=38471822
- https://aimvantage.uk