---
title: "Build your first Claude Skill in 30 minutes (with the actual file)."
description: "Skills are markdown files Claude reads at runtime. The shape, the front-matter, where they live, and how to test them. Working example included."
tldr: "A Claude Skill is a markdown file with front-matter that lives in your Skills folder. Claude reads it when triggered and follows the instructions. The minimum: a name, a description, a body of instructions. 30 minutes from zero to a working Skill that wraps a prompt template you reuse. Working example below covers the canonical 'commit message generator' Skill."
publishDate: 2026-04-22
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "claude-desktop", "developer-tools", "beginner"]
tools: ["Claude Code", "Claude Desktop"]
aiPrimary: true
readTime: "5 min"
claims:
  - text: "Anthropic shipped Claude Skills as a feature of Claude Code, allowing markdown-based extension of Claude's instructions at runtime."
    source: "https://docs.anthropic.com/en/docs/claude-code/skills"
    date: "2026-04-15"
    confidence: "high"
  - text: "Claude Skills are stored in the user's Skills folder and discovered automatically by Claude Code at startup."
    source: "https://docs.anthropic.com/en/docs/claude-code/skills"
    date: "2026-04-15"
    confidence: "high"
  - text: "Reddit r/ClaudeAI has documented multiple practical Skill examples including commit message generation, code review checklists, and meeting summarisation."
    source: "https://reddit.com/r/ClaudeAI/comments/1sxj6s3/"
    date: "2026-04-15"
    confidence: "medium"
entities:
  - "Claude Skills"
  - "Claude Code"
  - "Anthropic"
  - "Markdown"
updateLog:
  - version: "v1"
    date: 2026-04-22
    notes: "Initial publish."
---

## Q: What is a Claude Skill, in 30 seconds?

A markdown file. Claude reads it. Claude follows the instructions [cite: https://docs.anthropic.com/en/docs/claude-code/skills · 2026-04-15 · high].

That's the entire idea. You write a Skill once. You can reuse it across sessions. You can share it with teammates by sending the file. There's no build step, no deploy, no API.

## Q: Where do Skills live?

By default in `~/.claude/skills/` for global Skills, or `<project>/.claude/skills/` for project-local Skills. Claude Code discovers them at startup [cite: https://docs.anthropic.com/en/docs/claude-code/skills · 2026-04-15 · high].

Each Skill is a single `.md` file. The filename becomes part of the trigger phrase.

## Q: What's the minimum file structure?

Three things in YAML front-matter (name, description, allowed-tools), then markdown body of instructions. Like this:

```markdown
---
name: commit-message-generator
description: Generate a conventional-commit-format commit message based on staged changes. Use after running git diff --staged.
allowed-tools: ["Bash"]
---

When the user invokes this Skill, generate a commit message following these rules:

1. Read the staged diff using `git diff --staged`. If empty, ask the user to stage their changes first.
2. Identify the most significant change. Group related changes if there are multiple.
3. Format the message as: `<type>(<scope>): <subject>` where:
   - type: feat | fix | refactor | docs | chore | test | style | perf
   - scope: the affected module / area, lowercase, no spaces (e.g. `auth`, `landing`, `api`)
   - subject: imperative, present-tense, lowercase, no trailing period
4. If the change is non-trivial, add a body paragraph after a blank line explaining the why (not the what — the diff shows what).
5. Keep the subject under 72 characters.
6. Output the commit message in a code block, ready to paste into `git commit -m`.

Example output:
```
feat(landing): add cohort announcement bar to homepage

Surfaces /laid-off to every visitor. Closes the discovery gap for the
April 2026 layoff cohort cluster.
```
```

Save that as `~/.claude/skills/commit-message-generator.md`. Restart Claude Code. The Skill is now available.

## Q: How do you trigger a Skill?

Two paths:

1. **Explicit**: ask Claude "use the commit-message-generator skill". Claude finds it by name and loads it.
2. **Implicit**: ask "write me a commit message for these changes". Claude looks at active Skills, sees one with a description matching your intent, applies it.

The description field matters more than people think. Claude uses it to decide whether the Skill is relevant. Write descriptions that clearly state both the trigger condition and the expected behaviour.

## Q: What's the difference vs a system prompt?

A system prompt is per-session. A Skill is a reusable, named, file-based instruction set that Claude loads on demand.

Practically:
- System prompts are good for whole-session shaping ("you're a senior code reviewer")
- Skills are good for specific tasks within a session ("generate a commit message")
- You can have many Skills installed; you typically have one system prompt

## Q: Can a Skill call tools?

Yes. The `allowed-tools` field in the front-matter declares which tools the Skill can use. Common tools for Skills:

- `Bash` — run shell commands
- `Read`, `Write`, `Edit` — file operations
- `Glob`, `Grep` — search
- Any MCP tools you have configured

Be conservative with `allowed-tools`. A Skill that calls `Bash` can do anything your shell can. A Skill that only uses `Read` is much safer.

## Q: How do you test a Skill?

Three layers:

1. **Manual**: invoke the Skill in Claude Code, give it a representative input, eyeball the output.
2. **Eval set**: write 5-10 test cases for the Skill. Run them periodically. Check that pass-rate stays above your bar. (See [our agent evaluation post](/10-agent-evaluation-2026/) for the discipline.)
3. **Production**: ship the Skill to your team. Watch which inputs cause confusion. Refine the description / instructions.

Don't skip the manual layer. Skills can have subtle issues (the description doesn't trigger, the tool permissions are wrong, the instructions are ambiguous) that show up only when you actually try to use them.

## Q: What are good first Skills to build?

Starter Skills that pay back quickly:

- **commit-message-generator** — the example above
- **code-review-checklist** — invokes a structured review pass with your team's specific rules
- **changelog-entry** — turns a PR into a draft changelog entry
- **meeting-summary** — turns a transcript into action items + decisions
- **PR-description** — generates a PR description from the diff
- **release-notes** — aggregates commits into release notes

Each is ~50 lines of markdown. None require code. All compound: you build them once, you use them dozens of times, your teammates copy them.

## Q: How do Skills relate to MCP servers?

Different abstraction. A Skill shapes Claude's behaviour. An MCP server gives Claude new tools to call. Most workflows benefit from both. See our [Claude Skills vs MCP servers post](/04-claude-skills-vs-mcp/) for the full decision tree.

## Q: Where to find good Skills shared by others?

Reddit r/ClaudeAI has accumulated practical Skills people share publicly [cite: https://reddit.com/r/ClaudeAI/comments/1sxj6s3/ · 2026-04-15 · medium]. The pattern: someone shares a Skill that worked for their workflow, others fork and adapt.

There's no central registry yet. Like MCP servers in 2024, Skills in 2026 are still in the "github-readme" discovery era.

## Sources

- [Anthropic Claude Code Skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Wikipedia: Markdown](https://en.wikipedia.org/wiki/Markdown)
- [r/ClaudeAI: Skills examples thread](https://reddit.com/r/ClaudeAI/comments/1sxj6s3/)
- [r/programming: Claude Code workflow patterns](https://reddit.com/r/programming/comments/1sxj6s3/)
