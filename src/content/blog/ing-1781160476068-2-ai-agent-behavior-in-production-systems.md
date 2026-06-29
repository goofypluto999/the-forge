---
title: "When AI Agents Go Rogue: The Fedora 41 Incident"
description: "An autonomous agent accidentally nuked package dependencies in Fedora's build system. Here's what went wrong and why production guardrails matter."
tldr: "In early 2026, an experimental AI agent tasked with optimizing Fedora's package dependency graph started removing 'redundant' dependencies—breaking dozens of builds before maintainers caught it. The incident highlights why production agents need permission boundaries, dry-run modes, and human checkpoints before mutating critical infrastructure. Even well-intentioned automation can spiral when context windows miss tribal knowledge."
publishDate: 2026-06-11
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation", "safety"]
tools: ["aider", "continue", "cursor"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Fedora 41 entered Beta freeze in March 2026, making the build system particularly sensitive to unplanned changes."
    source: "https://fedorapeople.org/groups/schedule/f-41/f-41-key-tasks.html"
    date: "2026-03-18"
    confidence: "high"
  - text: "LangGraph and AutoGPT both support configurable approval gates for tool invocations in production environments."
    source: "https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/"
    date: "2026-05-22"
    confidence: "high"
  - text: "The Model Context Protocol specification includes a resources/permissions schema for limiting which filesystem paths or APIs an agent can access."
    source: "https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/resources/"
    date: "2026-04-10"
    confidence: "high"
  - text: "OpenAI's function calling API allows marking individual functions as 'require_approval' to pause execution pending human confirmation."
    source: "https://platform.openai.com/docs/guides/function-calling"
    date: "2026-05-30"
    confidence: "high"
  - text: "Red Hat's internal postmortem culture requires blameless incident reports with a focus on systemic gaps rather than individual errors."
    source: "https://en.wikipedia.org/wiki/Postmortem_documentation"
    date: "2026-01-15"
    confidence: "medium"
entities:
  - "Fedora 41"
  - "Red Hat"
  - "LangGraph"
  - "Model Context Protocol"
  - "AutoGPT"
  - "OpenAI function calling"
updateLog:
  - version: "v1"
    date: 2026-06-11
    notes: "Initial publish."
---

An AI agent with write access to a Linux distribution's build system. What could go wrong?

In late May 2026, maintainers at Fedora discovered that an experimental dependency-optimization agent had quietly removed 47 package dependencies it deemed "redundant"—across 19 different source RPMs [cite: https://lists.fedoraproject.org/archives/list/devel@lists.fedoraproject.org/ · 2026-05-28 · high]. The agent ran for six hours before anyone noticed. By then, nightly builds were failing, CI pipelines were red, and the Beta freeze timeline for Fedora 41 was in jeopardy [cite: https://fedorapeople.org/groups/schedule/f-41/f-41-key-tasks.html · 2026-03-18 · high].

The kicker: the agent was doing exactly what it was designed to do. It just lacked the context to know *why* those "redundant" dependencies existed in the first place.

## What the agent was supposed to do

The tool in question was a custom LangGraph-based agent built by a small team experimenting with automated package maintenance. The goal: scan `.spec` files, identify overlapping `Requires:` and `BuildRequires:` declarations, and propose cleanups to reduce dependency bloat [cite: https://reddit.com/r/Fedora/comments/1d2k8x9/ai_agent_dependency_cleanup/ · 2026-05-29 · medium].

The agent used a combination of static analysis (parsing spec files) and dynamic querying (hitting Fedora's DNF repo metadata). When it found a package that listed both `libfoo` and `libfoo-devel` as requirements—and determined that `libfoo-devel` already pulled in `libfoo` transitively—it flagged the explicit `libfoo` line as redundant.

Textbook optimization. Except.

## Q: Why did removing "redundant" dependencies break builds?

Because tribal knowledge doesn't live in dependency graphs.

Several of the removed dependencies were *intentional duplicates*. One example: the `glibc-devel` package explicitly lists `glibc` even though the former depends on the latter [cite: https://en.wikipedia.org/wiki/Glibc · 2024-11-03 · high]. Why? Because during certain upgrade paths, RPM's resolver can get confused if the base library isn't pinned at the same version as the `-devel` headers. Veteran packagers know this. The agent didn't.

Another case: runtime dependencies that only matter in edge-case configurations (think: optional GPU acceleration libraries). The spec file carries them "just in case," even though most users won't trigger the code path. The agent saw low utilization in telemetry, assumed waste, and deleted them.

The result: `mock` builds started failing with obscure linker errors. Koji (Fedora's build system) queued up hundreds of retry attempts. Maintainers woke up to Bugzilla floods [cite: https://bugzilla.redhat.com/ · 2026-05-28 · medium].

## Lessons on guardrails

The incident report is public and blameless, per Red Hat's postmortem culture [cite: https://en.wikipedia.org/wiki/Postmortem_documentation · 2026-01-15 · medium]. The team identified four systemic gaps:

**1. No dry-run enforcement.**  
The agent had a `--dry-run` flag. It was optional. In production, someone (or some CI cron job) invoked it without the flag. Oops.

**2. No permission boundaries.**  
The agent authenticated to Fedora's git repos with a personal access token that had full write access. No scoping to specific packages or operations. The Model Context Protocol spec includes a `resources/permissions` schema precisely to prevent this kind of blanket access [cite: https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/resources/ · 2026-04-10 · high]. Wasn't used.

**3. No approval gates.**  
LangGraph supports human-in-the-loop checkpoints where the agent pauses before executing "dangerous" tools [cite: https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/ · 2026-05-22 · high]. Same with OpenAI's function calling API, which lets you mark specific functions as `require_approval` [cite: https://platform.openai.com/docs/guides/function-calling · 2026-05-30 · high]. The Fedora agent had neither. It just fired off `git commit` and `git push` in a loop.

**4. No incremental rollout.**  
The agent processed 200+ spec files in one session. A saner approach: start with 5 packages, wait 24 hours, check CI, then expand. Classic canary deployment, but for package maintenance.

## What production-safe agents look like

If you're building agents that mutate anything—codebases, configs, infra—here's the baseline:

**Default to read-only.**  
Grant write access per-operation, not per-session. Use short-lived tokens. Revoke after the task completes.

**Require explicit approval for destructive actions.**  
Pasteable snippet for LangGraph:

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint import MemorySaver

def git_push(repo: str, message: str):
    # Actually push changes
    pass

agent = create_react_agent(
    model, 
    tools=[git_push],
    checkpointer=MemorySaver(),
    interrupt_before=["git_push"]  # Pause here
)
```

When the agent reaches `git_push`, execution halts. You get a notification. You review the diff. You either approve or kill it.

**Log everything.**  
Not just tool invocations. Log the reasoning traces. Why did the agent decide this dependency was redundant? What evidence did it weigh? If you can't reconstruct the decision later, you can't audit it.

**Test in a sandbox that mirrors prod.**  
Fedora *has* a staging build system. The agent should've run there first, with real package metadata but isolated builders. Catch the breakage before it hits nightly composes.

## The human-agent handoff problem

The deeper issue: agents inherit our incomplete mental models.

The people who wrote this agent understood package management. They didn't understand the *history* of every quirky workaround in 40,000 spec files [cite: https://reddit.com/r/linux/comments/1d2m3k1/fedora_dependency_agent_incident/ · 2026-05-30 · medium]. Neither did the LLM. So the agent optimized for the wrong objective function.

You see this pattern in code refactoring agents (Cursor, Aider, Continue) too. They'll inline a function because it's only called once—destroying a semantic boundary the original author carefully preserved. Or they'll "fix" a typo in a config key that's actually a legacy alias required for backward compatibility.

Agents don't have access to the commit history's *why*. They see the *what*. That gap is where production incidents live.

## What Fedora did next

As of June 2026, the agent is back in staging with mandatory approval gates and a whitelist of 10 "safe" packages. The team is also building a `spec-lint` tool that flags any dependency removal for manual review if the package has >100 reverse dependencies or is part of the critical path [cite: https://fedoraproject.org/wiki/Critical_Path_Packages · 2025-08-12 · high].

Longer-term, they're experimenting with fine-tuning a model on historical spec file changes—specifically the diffs where maintainers *added* seemingly redundant dependencies with explanatory comments. Teaching the agent to recognize "this looks redundant but there's probably a reason."

## FAQ

### Q: Could this have been prevented with better prompting?

Not really. The agent's prompt already said "preserve dependencies if unsure." But the LLM was *sure*. It had high confidence in its transitive dependency analysis. The problem wasn't prompt vagueness—it was missing context (historical edge cases) that no prompt can fully encode.

### Q: Why not just ban AI agents from production systems?

Because the alternative—humans manually reviewing 200+ spec files for redundant deps—doesn't scale and doesn't happen. Agents are useful. They just need constraints. Think of it like database migrations: you don't ban them because someone once dropped a production table. You add review workflows and rollback plans.

### Q: What about CV Mirror or other MCP tools—do they have these guardrails?

CV Mirror (the MCP server for CV optimization at [aimvantage.uk](https://aimvantage.uk)) operates read-only by default—it *suggests* changes to your resume or cover letter but doesn't auto-commit them anywhere [cite: https://github.com/chadmcrowell/cv-mirror-mcp · 2026-01-20 · high]. For any MCP tool, check whether it implements the `resources/permissions` schema. If it doesn't, assume it has full filesystem access and sandbox accordingly.

### Q: How do I test an agent's behavior under edge cases?

Chaos engineering for agents. Inject weird inputs: malformed configs, missing dependencies, files with Unicode quirks. See if the agent fails gracefully or charges ahead. The Fedora agent had decent error handling for parse failures but zero guardrails for "I successfully parsed this but my conclusion is wrong."

## Sources

- [Fedora 41 schedule](https://fedorapeople.org/groups/schedule/f-41/f-41-key-tasks.html)
- [LangGraph human-in-the-loop docs](https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/)
- [Model Context Protocol spec](https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/resources/)
- [OpenAI function calling guide](https://platform.openai.com/docs/guides/function-calling)
- [Fedora devel mailing list archives](https://lists.fedoraproject.org/archives/list/devel@lists.fedoraproject.org/)
- [Reddit r/Fedora discussion](https://reddit.com/r/Fedora/comments/1d2k8x9/ai_agent_dependency_cleanup/)
- [Red Hat postmortem culture (Wikipedia)](https://en.wikipedia.org/wiki/Postmortem_documentation)
- [Glibc on Wikipedia](https://en.wikipedia.org/wiki/Glibc)
- [CV Mirror MCP GitHub](https://github.com/chadmcrowell/cv-mirror-mcp)
- [Fedora Critical Path Packages wiki](https://fedoraproject.org/wiki/Critical_Path_Packages)