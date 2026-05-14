---
title: "Principles for agent-native CLIs"
description: "Design principles for building CLIs that work well with AI agents, directly applicable to agent automation workflows."
tldr: "Agent-native CLIs flip traditional design assumptions. They prioritize machine-readable output over human ergonomics, enforce explicit flags over interactive prompts, and treat stderr as a sacred error channel. The result is a command-line interface that agents can invoke reliably without human intervention."
publishDate: 2026-05-08
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "cli", "developer-tools"]
tools: ["GitHub CLI", "jq", "Stripe CLI"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "GitHub CLI added JSON output mode in 2020 specifically to support automation and scripting workflows."
    source: "https://github.blog/2020-09-17-github-cli-1-0-is-now-available/"
    date: "2020-09-17"
    confidence: "high"
  - text: "Stripe CLI implements structured JSON output with --format json flag for all read operations."
    source: "https://stripe.com/docs/cli"
    date: "2024-11-15"
    confidence: "high"
  - text: "The POSIX standard defines exit code 0 as success and non-zero as failure, with codes 1-125 reserved for command-specific errors."
    source: "https://en.wikipedia.org/wiki/Exit_status"
    date: "2024-01-10"
    confidence: "high"
  - text: "Interactive prompts in CLI tools cause automation scripts to hang indefinitely when stdin is not a TTY."
    source: "https://www.reddit.com/r/commandline/comments/18vkj9m/best_practices_for_handling_interactive_prompts/"
    date: "2024-01-08"
    confidence: "high"
  - text: "JSON Schema version 2020-12 provides a standard way to document and validate JSON output structures."
    source: "https://json-schema.org/specification.html"
    date: "2020-12-01"
    confidence: "high"
entities:
  - "GitHub CLI"
  - "POSIX"
  - "JSON Schema"
  - "Stripe CLI"
  - "stderr"
updateLog:
  - version: "v1"
    date: 2026-05-08
    notes: "Initial publish."
---

Your CLI is lying to agents. That colorful progress bar? Unparseable garbage. That helpful "are you sure?" prompt? A script-killing time bomb. That mixed stdout stream with warnings sprinkled between data rows? Agent poison.

Agent-native CLIs flip every assumption baked into forty years of terminal UX. They're built for machines first, humans second. The payoff is automation that actually works when you walk away from the keyboard.

## The stdout contract is sacred

Every CLI has two output channels. stdout carries data. stderr carries everything else. This separation matters when a human is skimming output, but it's make-or-break for agents parsing JSON. [cite: https://en.wikipedia.org/wiki/Standard_streams · 2024-03-15 · high]

Traditional CLIs muddy this constantly. They print warnings to stdout, mix progress updates with query results, embed helpful tips in the data stream. An agent trying to parse the output gets a JSON decoder error and gives up.

Agent-native CLIs keep stdout sterile. If it's on stdout, it's data. If it's metadata, logging, warnings, or interactive fluff, it goes to stderr. GitHub CLI nailed this when they added `--json` mode in 2020. [cite: https://github.blog/2020-09-17-github-cli-1-0-is-now-available/ · 2020-09-17 · high]

```bash
# Agent-friendly: clean JSON on stdout, human noise on stderr
gh pr list --json number,title,state

# Stderr gets progress bars, warnings, rate limit notices
# stdout gets pure JSON every time
```

The Stripe CLI follows the same pattern. Every read operation supports `--format json`, and that flag guarantees parseable output with zero human-oriented cruft. [cite: https://stripe.com/docs/cli · 2024-11-15 · high]

## Q: What happens when you skip the interactive prompt?

Interactive prompts kill automation. When an agent calls your CLI and stdin isn't attached to a terminal, prompts hang forever. The agent waits. Your CI job times out. The workflow dies.

Agent-native CLIs never prompt. Ever. [cite: https://www.reddit.com/r/commandline/comments/18vkj9m/best_practices_for_handling_interactive_prompts/ · 2024-01-08 · high]

Every decision gets an explicit flag. "Are you sure you want to delete this?" becomes `--confirm` or `--force`. "Which environment?" becomes `--env production`. "Overwrite existing file?" becomes `--overwrite`.

```bash
# Agent-hostile: requires human intervention
my-tool deploy
# Prompts: "Deploy to production? (y/N)"

# Agent-native: all decisions are flags
my-tool deploy --env production --confirm
```

If a required flag is missing, exit with code 1 and a clear error message on stderr. Don't ask. Don't assume. Don't guess. Force the caller to be explicit.

Reddit's r/commandline has dozens of threads on this pattern, mostly from frustrated DevOps engineers who discovered the hard way that prompts and automation don't mix. [cite: https://www.reddit.com/r/devops/comments/1ag8k3l/automationfriendly_cli_design/ · 2024-02-01 · medium]

## Exit codes carry meaning

POSIX defines exit code 0 as success and non-zero as failure. [cite: https://en.wikipedia.org/wiki/Exit_status · 2024-01-10 · high] That's the baseline, but agent-native CLIs go further. They use distinct codes for distinct failure modes.

```bash
0   success
1   generic error
2   usage error (bad flags, missing args)
3   resource not found
4   permission denied
5   network error
```

An agent can branch on these codes without parsing error messages. Network hiccup? Retry. Permission denied? Escalate to a human. Resource not found? Mark the task as complete with a "not found" note.

Stripe CLI uses this pattern. Missing API key returns code 1. Invalid flag syntax returns code 2. The agent knows immediately whether the problem is configuration, user error, or transient infrastructure.

## Schema your JSON output

JSON output is table stakes for agent-native CLIs, but raw JSON isn't enough. Agents need stable schemas. [cite: https://json-schema.org/specification.html · 2020-12-01 · high]

When you add `--json` to a command, commit to a schema version. Document it. Version it when you change it. Let agents specify which schema version they expect.

```bash
# Specify schema version in flag
my-tool list --json --schema-version 2

# Or in output metadata
{
  "_schema": "https://example.com/schemas/list/v2.json",
  "items": [...]
}
```

GitHub CLI embeds schema hints in their JSON responses. Stripe CLI documents their JSON schemas in the API reference. Both let agents validate responses before attempting to parse fields.

This isn't academic. In April 2026, a viral r/programming thread showed how a breaking change in `kubectl` JSON output broke thousands of automation scripts because field names changed without warning. [cite: https://www.reddit.com/r/programming/comments/1c2h8j9/kubectl_json_output_breaking_changes/ · 2026-04-12 · medium]

## Idempotency by default

Agent workflows retry. Network blips, rate limits, transient failures. An agent-native CLI assumes it will be called multiple times with the same arguments and handles that gracefully.

```bash
# Idempotent create: returns success if resource already exists
my-tool create-user alice --email alice@example.com

# Non-idempotent version errors out
Error: user alice already exists (exit code 1)

# Idempotent version succeeds, returns existing resource
{
  "id": "user_abc123",
  "name": "alice",
  "created": "2026-05-01T10:00:00Z",
  "_status": "already_exists"
}
```

The `_status` field tells the agent whether it created something new or found an existing resource. Both are success states. Exit code 0 either way.

Stripe's API and CLI both follow this pattern. Creating an idempotency key lets you replay API calls safely. The CLI exposes that with `--idempotency-key`.

## No color when piped

Terminal color codes are ANSI escape sequences. They look great in a terminal. They look like line noise in a log file or when piped to `jq`. [cite: https://en.wikipedia.org/wiki/ANSI_escape_code · 2024-02-20 · high]

Agent-native CLIs detect whether stdout is a TTY. If it's not, they skip the color codes.

```bash
# Detects TTY in most languages
if isatty(stdout) {
    enable_colors()
} else {
    disable_colors()
}
```

Better: add a `--no-color` flag and respect the `NO_COLOR` environment variable. [cite: https://no-color.org/ · 2023-11-10 · high] Let the caller override auto-detection when needed.

## Emit real timestamps

Agents track when things happened. Your CLI should help, not hinder. Emit ISO 8601 timestamps in UTC, not relative strings like "2 hours ago" or locale-formatted nonsense.

```json
{
  "created": "2026-05-08T14:32:15Z",
  "updated": "2026-05-08T16:45:03Z"
}
```

Relative timestamps are for humans. Agents need precise, parseable, timezone-unambiguous timestamps. Reddit's r/sysadmin has countless rants about parsing "Dec 8 14:32" from logs because the year is missing and the timezone is ambiguous. [cite: https://www.reddit.com/r/sysadmin/comments/1b4k2m3/stop_using_relative_timestamps_in_logs/ · 2024-03-05 · medium]

## Flag consistency across commands

Agent-native CLIs use the same flags for the same concepts across all commands. `--format json` works everywhere. `--output file.json` works everywhere. `--env production` works everywhere.

Inconsistent flags force agents to learn per-command syntax. That's fine for humans who read `--help` text. It's friction for agents that need to compose commands programmatically.

```bash
# Consistent across all commands
my-tool users list --format json --output users.json
my-tool projects list --format json --output projects.json

# Not this
my-tool users list --json > users.json
my-tool projects dump --output-format json --file projects.json
```

## FAQ

### Q: Should I remove interactive prompts entirely from my CLI?

No. Keep them for human users, but make them opt-in or skippable. Detect non-TTY stdin and fail fast with clear error messages about missing flags. Let `--no-interactive` or `--yes` bypass all prompts.

### Q: How do I handle secrets in agent-native CLIs?

Environment variables or credential files. Never prompt for secrets. Document the environment variable names and let agents inject them at runtime. If a secret is missing, exit with code 1 and a clear message about which variable to set.

### Q: What if my JSON output changes between versions?

Version your schemas explicitly. Either embed a schema version in the output or let callers specify `--schema-version`. Maintain backward compatibility for at least one major version. Document breaking changes loudly.

### Q: Should I still support human-friendly output modes?

Yes. Default to human-friendly for TTY stdout. Add `--json` or `--format json` for agents. Both modes can coexist. Just keep them on separate code paths so one doesn't leak into the other.

## Sources

- https://github.blog/2020-09-17-github-cli-1-0-is-now-available/
- https://stripe.com/docs/cli
- https://en.wikipedia.org/wiki/Exit_status
- https://en.wikipedia.org/wiki/Standard_streams
- https://en.wikipedia.org/wiki/ANSI_escape_code
- https://json-schema.org/specification.html
- https://no-color.org/
- https://www.reddit.com/r/commandline/comments/18vkj9m/best_practices_for_handling_interactive_prompts/
- https://www.reddit.com/r/devops/comments/1ag8k3l/automationfriendly_cli_design/
- https://www.reddit.com/r/programming/comments/1c2h8j9/kubectl_json_output_breaking_changes/
- https://www.reddit.com/r/sysadmin/comments/1b4k2m3/stop_using_relative_timestamps_in_logs/