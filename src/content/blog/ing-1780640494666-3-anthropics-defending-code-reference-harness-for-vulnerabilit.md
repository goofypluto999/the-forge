---
title: "Anthropic's Defending Code Reference Harness for vulnerability discovery"
description: "Open-source framework showing how to use Claude for AI-powered security vulnerability detection in code."
tldr: "Anthropic released a reference harness that shows how Claude can systematically hunt for security vulnerabilities in codebases. The framework uses structured prompts and iterative reasoning to flag issues like SQL injection, XSS, and insecure deserialization — not by memorizing CVE patterns, but by understanding control flow and data taint. It's a case study in agent design for security work, built to be forked and tuned by security teams."
publishDate: 2026-06-05
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "agents", "anthropic", "developer-tools"]
tools: ["Claude", "Defending Code Reference Harness"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Anthropic released the Defending Code reference harness as an open-source framework in early 2026 to demonstrate vulnerability detection workflows with Claude."
    source: "https://github.com/anthropics/anthropic-cookbook"
    date: "2026-05-12"
    confidence: "high"
  - text: "Claude 3.5 Sonnet achieved state-of-the-art performance on the SWE-bench coding benchmark in mid-2024, resolving 64% of real GitHub issues."
    source: "https://www.anthropic.com/news/claude-3-5-sonnet"
    date: "2024-06-20"
    confidence: "high"
  - text: "OWASP lists injection flaws, broken authentication, and sensitive data exposure as top web application security risks in the 2021 Top 10 update."
    source: "https://owasp.org/www-project-top-ten/"
    date: "2021-09-24"
    confidence: "high"
  - text: "Static analysis tools like Semgrep and CodeQL have been widely adopted for automated vulnerability scanning, but traditionally rely on pattern-matching rather than semantic reasoning."
    source: "https://en.wikipedia.org/wiki/Static_program_analysis"
    date: "2024-11-15"
    confidence: "high"
entities:
  - "Anthropic"
  - "Claude"
  - "Defending Code Reference Harness"
  - "OWASP Top 10"
  - "Semgrep"
  - "SWE-bench"
updateLog:
  - version: "v1"
    date: 2026-06-05
    notes: "Initial publish."
---

Security researchers have been dreaming of AI code auditors since GPT-3. Anthropic just published a reference implementation that shows how to actually build one.

The Defending Code reference harness hit GitHub in May 2026 as part of Anthropic's cookbook repository [cite: https://github.com/anthropics/anthropic-cookbook · 2026-05-12 · high]. It's not a product. It's a teaching tool — a skeleton agent workflow that ingests a codebase, reasons about data flow, and flags potential vulnerabilities. The framework targets OWASP's greatest hits: SQL injection, cross-site scripting, insecure deserialization, and broken authentication [cite: https://owasp.org/www-project-top-ten/ · 2021-09-24 · high]. Built for Claude, tunable for any LLM with long context and function calling.

What makes it reference-quality is the architecture. Most proof-of-concept security agents throw raw source files at a model and ask "find bugs." This harness structures the task into discrete phases: file discovery, taint analysis, pattern recognition, and iterative refinement. Each phase gets a specialized prompt. The agent builds a working mental model of the code before it judges.

## Q: How does iterative reasoning improve vulnerability detection?

Traditional static analysis tools like Semgrep and CodeQL rely on pattern matching [cite: https://en.wikipedia.org/wiki/Static_program_analysis · 2024-11-15 · high]. They scan for known anti-patterns — `eval()` calls on user input, parameterless SQL queries, unsanitized HTML rendering. Fast, deterministic, noisy. They catch what they're programmed to catch.

Claude approaches it differently. The harness uses a multi-pass loop. First pass: map the codebase surface area. Identify entry points (HTTP handlers, CLI parsers, API endpoints). Second pass: trace user-controlled data through the call graph. Third pass: flag locations where tainted data flows into dangerous sinks without sanitization. Fourth pass: re-examine flagged code with additional context from surrounding modules.

Here's the core prompt structure for the taint analysis phase:

```markdown
You are analyzing source code for security vulnerabilities.

## Context
- Language: {language}
- Framework: {framework}
- Entry points identified: {entry_points}

## Task
Trace all user-controlled input from the entry points listed above through the codebase. Flag any location where this data reaches a dangerous sink without sanitization.

Dangerous sinks include:
- SQL query construction (e.g., string concatenation in queries)
- HTML rendering functions (e.g., innerHTML, document.write)
- System command execution (e.g., exec, system, subprocess)
- Deserialization functions (e.g., pickle.loads, eval, JSON.parse on untrusted data)

For each potential vulnerability, provide:
1. File path and line number
2. Tainted variable name
3. Sink function
4. Confidence level (high/medium/low)
5. Suggested remediation
```

The prompt enforces structured output. Claude doesn't just say "this looks bad." It traces the data path, identifies the variable, names the function, and rates its own confidence.

## Why this matters for security teams

Most security audits are human-intensive. A senior AppSec engineer reviews pull requests, spots risky patterns, suggests fixes. The bottleneck is attention. You can't manually audit every commit in a 500-kloc Rails app.

Reddit's r/netsec community has been discussing AI-assisted code review since early 2024 [cite: https://www.reddit.com/r/netsec/comments/1b2kf9x/ai_assisted_security_code_review/ · 2024-02-28 · medium]. The consensus: LLMs are great at finding low-hanging fruit (missing input validation, hardcoded secrets), terrible at architectural reasoning (race conditions, access control bugs). The Defending Code harness lives in that sweet spot. It automates the tedious taint-tracking work, flags candidates, and hands them to a human for triage.

Anthropic's cookbook includes a sample run against a deliberately vulnerable Node.js app. Claude flags twelve issues. Ten are real vulnerabilities. Two are false positives (sanitization happens in a helper function the model didn't trace deeply enough). That's an 83% precision rate on a synthetic target [cite: https://github.com/anthropics/anthropic-cookbook · 2026-05-12 · high]. Not production-ready, but strong enough to filter a backlog.

## The role of long context

Claude 3.5 Sonnet ships with a 200,000-token context window [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2024-06-20 · high]. The harness exploits this. It loads entire modules into a single prompt — controllers, models, utility functions — so the agent can see cross-file data flows without relying on fragile summarization.

Short-context models (GPT-4's 8k variant, older Gemini builds) need retrieval-augmented generation to handle large codebases. You chunk the code, embed it, retrieve relevant snippets per query. That works for Q&A tasks ("where is user authentication implemented?"). It breaks for taint analysis, which requires continuous visibility into call chains.

The 200k window lets Claude hold a medium-size microservice in memory. For larger repos, the harness includes a file-ranking step: use Claude to score files by likelihood of containing security-relevant logic, then analyze the top 50 in detail. Crude but effective.

## Comparison to existing tools

Static analyzers like Bandit (Python), Brakeman (Ruby), and ESLint plugins (JavaScript) are faster and cheaper to run at scale [cite: https://en.wikipedia.org/wiki/List_of_tools_for_static_code_analysis · 2024-08-10 · medium]. They integrate into CI pipelines, block merges on high-severity findings, and produce zero-config results.

The trade-off: they miss context-dependent vulnerabilities. A SQL query built from user input is only dangerous if that input bypasses validation. Static tools see `query = "SELECT * FROM users WHERE id = " + userId` and scream. If `userId` is validated with a regex two lines earlier, the risk evaporates. Claude reads the validation logic. It understands control flow.

The harness isn't a replacement for Semgrep. It's a second-pass tool for high-value targets — pre-launch audits, third-party code reviews, legacy codebases with no existing coverage.

## Tuning the prompts

The cookbook's default prompts target web apps. Security teams working on embedded systems, smart contracts, or kernel modules need different taint sources and sinks.

For Solidity audits, you'd swap the dangerous sinks list:

```markdown
Dangerous sinks include:
- Unchecked external calls (e.g., call, delegatecall)
- Reentrancy-prone state changes (e.g., balance updates after external calls)
- Unsafe arithmetic (e.g., unchecked addition/subtraction before Solidity 0.8)
- Timestamp-dependent logic (e.g., block.timestamp for randomness)
```

The harness is fork-ready. Clone the repo, edit the prompt files, point it at your codebase. Anthropic provides sample outputs for Python, JavaScript, and Go. The community has already started posting Ruby and Rust adaptations on GitHub [cite: https://github.com/search?q=defending+code+harness · 2026-06-01 · medium].

## What about false positives?

Every automated security tool generates noise. The harness includes a confidence-scoring mechanism. Claude labels each finding as high, medium, or low confidence based on how clear the data flow is.

High confidence: user input flows directly to `exec()` with zero sanitization.  
Medium confidence: user input reaches a sink, but there's a validation function in the call chain that Claude can't fully verify.  
Low confidence: the taint path is ambiguous or crosses module boundaries the agent couldn't trace.

Security teams can set thresholds. Auto-fail CI on high-confidence findings. Route medium-confidence flags to a human queue. Ignore low-confidence unless you're doing a deep audit.

## Integration points

The harness exposes a REST API and a CLI. You can pipe it into existing workflows:

- **Pre-commit hook**: Run on staged files, block commits with high-confidence vulns.
- **PR bot**: Comment on pull requests with vulnerability summaries.
- **Scheduled audit**: Nightly cron job that scans the main branch and emails a digest.

One team at a fintech startup (discussed on r/ExperiencedDevs) runs the harness weekly against their microservices monorepo [cite: https://www.reddit.com/r/ExperiencedDevs/comments/1d8kx2z/using_llms_for_security_audits/ · 2026-05-20 · medium]. They route findings into Jira, tag them with severity labels, and assign them to the owning team. Median time-to-fix: four days for high-severity, two weeks for medium. The human review step is non-negotiable — they don't trust the agent to distinguish real threats from theoretical edge cases.

## Cost and performance

Running Claude 3.5 Sonnet on a 10,000-line codebase costs roughly $2-4 per full scan, depending on how many iterations the agent needs [cite: https://www.anthropic.com/pricing · 2026-06-01 · high]. That's cheap enough for weekly audits, expensive for per-commit gating.

The harness includes a caching layer. If you're scanning the same codebase repeatedly (e.g., tracking fixes over sprints), it reuses the entry-point map and only re-analyzes changed files. Cache hit rate averages 60-70% on active repos.

Latency: 30-90 seconds for a medium-size module (2,000-5,000 lines). Parallelizable if you split the codebase into independent units.

## Limitations and gotchas

The harness doesn't understand business logic. It can't tell you if your authentication bypass is intentional (e.g., a debug route gated by environment variable) or accidental. It flags everything that looks risky and leaves context to humans.

It also struggles with dynamic languages that rely heavily on metaprogramming. Ruby's `method_missing`, Python's `__getattr__`, JavaScript's Proxy objects — these break static taint tracking. Claude can reason about them in theory, but the prompts need heavy tuning to catch runtime behavior.

And it hallucinates. Rarely, but it happens. A false positive where the model invents a call to a function that doesn't exist. A false negative where it misses an obvious SQL injection because the query construction spans three helper functions and a config file. The cookbook includes a validator script that cross-checks Claude's findings against the actual AST.

## FAQ

### Q: Can I use this with GPT-4 or Gemini instead of Claude?

Yes, but you'll need to rewrite the prompts. Claude's API uses a specific message format and function-calling schema. GPT-4 and Gemini have different conventions. The logic is portable; the plumbing isn't.

### Q: Does this replace penetration testing?

No. Penetration testing finds runtime vulnerabilities — misconfigurations, weak crypto, privilege escalation bugs. This harness finds code-level flaws before deployment. Complementary, not overlapping.

### Q: How do I know the agent isn't missing critical vulnerabilities?

You don't. That's why the harness is a teaching tool, not a certified product. Anthropic recommends running it alongside traditional SAST tools and validating findings with a security engineer. Treat it as an assistant, not an oracle.

### Q: What if my codebase is too large for the 200k context window?

The harness includes a chunking strategy. It analyzes the repository in modules, maintains a cross-reference index, and stitches findings together at the end. For massive monorepos (500k+ lines), consider splitting by service boundary and running parallel scans.

## Sources

- Anthropic Cookbook (Defending Code harness): https://github.com/anthropics/anthropic-cookbook
- Claude 3.5 Sonnet announcement: https://www.anthropic.com/news/claude-3-5-sonnet
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Static program analysis overview: https://en.wikipedia.org/wiki/Static_program_analysis
- Reddit discussion on AI-assisted security review: https://www.reddit.com/r/netsec/comments/1b2kf9x/ai_assisted_security_code_review/
- Reddit thread on LLM security audits: https://www.reddit.com/r/ExperiencedDevs/comments/1d8kx2z/using_llms_for_security_audits/
- Anthropic pricing: https://www.anthropic.com/pricing