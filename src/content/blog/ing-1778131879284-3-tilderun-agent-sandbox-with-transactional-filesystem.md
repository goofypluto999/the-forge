---
title: "Tilde.run: Agent Sandbox with Transactional Filesystem"
description: "Execution environment for agents with versioning and state management capabilities."
tldr: "Tilde.run isolates agent execution inside a transactional filesystem where every write is versioned and rollback-able. Instead of letting agents trash your disk or leak secrets, each run gets a clean snapshot environment — branch, execute, merge or discard. It's Docker meets Git for agent workflows, solving the 'how do I let this thing run arbitrary code safely' problem."
publishDate: 2026-05-07
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "developer-tools"]
tools: ["tilde.run", "Docker", "Firecracker", "Podman"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Traditional container runtimes like Docker do not natively support filesystem-level transactional semantics or versioned snapshots per execution."
    source: "https://docs.docker.com/storage/storagedriver/"
    date: "2026-04-15"
    confidence: "high"
  - text: "Agent frameworks increasingly require isolated execution environments to prevent state pollution between runs."
    source: "https://www.reddit.com/r/LocalLLaMA/comments/1b8x3yz/how_do_you_safely_let_agents_execute_code/"
    date: "2026-03-22"
    confidence: "high"
  - text: "Firecracker microVMs boot in under 125 milliseconds and consume as little as 5 MB of memory overhead."
    source: "https://github.com/firecracker-microvm/firecracker"
    date: "2026-02-10"
    confidence: "high"
  - text: "Copy-on-write filesystems like Btrfs and ZFS support snapshot and rollback primitives at the block layer."
    source: "https://en.wikipedia.org/wiki/Btrfs"
    date: "2026-04-01"
    confidence: "high"
  - text: "GitHub Actions runners create ephemeral environments for each workflow run to ensure reproducibility."
    source: "https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners"
    date: "2026-03-18"
    confidence: "high"
entities:
  - "Tilde.run"
  - "Firecracker"
  - "Docker"
  - "Btrfs"
  - "GitHub Actions"
  - "copy-on-write filesystem"
updateLog:
  - version: "v1"
    date: 2026-05-07
    notes: "Initial publish."
---

You give an agent a Python interpreter and three hours later your `/tmp` directory is full of half-finished CSVs, your API keys are in a log file somewhere, and you have no idea which writes belong to which run. Agents produce side effects. Lots of them. The question isn't whether to isolate execution — it's how to do it without sacrificing speed, debuggability, or your sanity.

Tilde.run pitches itself as an agent sandbox with a **transactional filesystem**. Every agent execution gets a versioned snapshot environment. Write files, install packages, mutate state — then commit the changes or roll them back wholesale. Think of it as Git semantics applied to an entire filesystem, purpose-built for agent workflows that need to experiment, fail, and retry without leaving debris [cite: https://tilde.run/docs · 2026-04-30 · high].

The core idea borrows from copy-on-write filesystems like Btrfs and ZFS, which support snapshot and rollback primitives at the block layer [cite: https://en.wikipedia.org/wiki/Btrfs · 2026-04-01 · high]. Tilde.run layers transactional semantics on top: each run starts from a known-good snapshot, and you decide post-execution whether to merge the changes back into the mainline state or discard them. For agents that generate unpredictable file trees or need to test destructive operations safely, this is a step up from "spin up a container and hope for the best."

## Q: How does the transactional model actually work?

Tilde.run creates a **branch** for every execution. The filesystem state at the start of the run is the HEAD snapshot. Any writes during execution go into the branch's delta layer — a divergent overlay that doesn't touch the base snapshot. Once the agent finishes, you inspect the diff, then either merge the branch (promoting the new files/edits to HEAD) or discard it (leaving HEAD unchanged) [cite: https://www.reddit.com/r/devops/comments/1bjx8k2/anyone_using_transactional_filesystems_in_prod/ · 2026-04-12 · medium].

Compare this to Docker. Containers layer filesystems via [overlay drivers](https://docs.docker.com/storage/storagedriver/), but those layers are build-time artifacts — not execution-time branches [cite: https://docs.docker.com/storage/storagedriver/ · 2026-04-15 · high]. You can snapshot a container's state with `docker commit`, but that's a manual checkpoint, not an automatic transactional boundary around every run. Tilde.run makes the branch/merge cycle first-class and automatic.

Practically, this means you can:
- Run an agent script that downloads 2 GB of training data, decide the output was garbage, and discard the entire branch without manual cleanup.
- Let an agent experiment with installing system packages or editing config files, then roll back to a clean slate if something breaks.
- Replay the same starting state across 50 parallel agent runs without cross-contamination.

The snapshot overhead depends on how much state diverges. If an agent only touches three files, the delta is tiny. If it rewrites half the filesystem, you pay the storage cost — but you also get perfect auditability of what changed.

## Isolation layer: microVMs vs. containers

Tilde.run reportedly uses [Firecracker](https://github.com/firecracker-microvm/firecracker) microVMs under the hood — the same tech AWS Lambda runs on [cite: https://github.com/firecracker-microvm/firecracker · 2026-02-10 · high]. MicroVMs boot in under 125 ms and add ~5 MB of memory overhead, which splits the difference between heavyweight VMs (slow boot, strong isolation) and containers (fast boot, weaker isolation). For agent workloads that might execute untrusted code or pull from sketchy package repos, the kernel-level boundary is reassuring.

Docker and Podman isolate via namespaces and cgroups, which is usually enough for development workflows. But agents increasingly scrape the web, run arbitrary shell commands from LLM-generated scripts, and install dependencies on the fly. A compromised container can still mess with the host's network stack or shared volumes. Firecracker's virtualization layer makes breakout attacks significantly harder [cite: https://www.reddit.com/r/selfhosted/comments/1c4x9mn/firecracker_vs_docker_for_untrusted_workloads/ · 2026-03-08 · medium].

The tradeoff: microVMs are heavier than bare containers. If you're running 500 parallel agent tasks and care about density, you'll hit resource limits faster than with Docker. But if you're running 5-10 agents concurrently and need to sleep at night knowing they can't nuke each other's state, the overhead is negligible.

## Use case: multi-step agent debugging

You're building an agent that scrapes Hacker News, summarizes threads, and writes Markdown files to disk. On the third iteration, it crashes halfway through because of a malformed HTML entity. Now you have 47 partial Markdown files in `/output`, the log is 12,000 lines long, and you're not sure which files are from the failed run vs. the previous successful one.

With Tilde.run's transactional model, the crash leaves the failed branch intact but separate from HEAD. You can inspect exactly what the agent wrote before it died, diff against the last known-good state, and replay the run from the same snapshot without manually deleting files. The workflow looks like this:

```bash
# Start a new execution branch
tilde exec --branch scrape-hn-v3 -- python scraper.py

# Agent crashes midway, branch state is preserved
tilde diff scrape-hn-v3
# Shows: added 47 .md files, modified config.json

# Discard the failed branch
tilde discard scrape-hn-v3

# Replay from the same starting snapshot
tilde exec --branch scrape-hn-v4 -- python scraper.py

# Success this time — merge the branch
tilde merge scrape-hn-v4
```

This is similar to how [GitHub Actions](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners) creates ephemeral runners for each workflow run to ensure reproducibility [cite: https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners · 2026-03-18 · high]. The difference: Tilde.run keeps the ephemeral state around long enough for you to inspect and decide whether to promote it.

## What it doesn't solve

Tilde.run handles **filesystem state** elegantly. It does not handle:
- **Network side effects**: if your agent sends 1,000 emails or hits an external API, rolling back the filesystem doesn't undo those writes.
- **Database transactions**: unless your agent writes exclusively to SQLite files inside the sandbox, any external DB mutations are outside the transactional boundary.
- **Time-based bugs**: if an agent's behavior depends on wall-clock time or external API responses that change between runs, replaying from the same snapshot won't reproduce the exact same outcome.

For those problems, you still need application-level idempotency, retries, and logging. Tilde.run isn't a magic undo button for the entire universe — just for the filesystem.

## Comparison: Tilde.run vs. Docker + volume snapshots

You could replicate some of Tilde.run's behavior by scripting Docker with [ZFS volume snapshots](https://docs.docker.com/storage/storagedriver/zfs-driver/) or [Btrfs subvolumes](https://btrfs.wiki.kernel.org/index.php/SysadminGuide#Subvolumes). Create a snapshot before each run, mount it into the container, then decide post-execution whether to keep or destroy the delta. That works, but:
- You have to wire up the snapshot/branch/merge logic yourself.
- Volume management gets messy if you're juggling dozens of parallel agent runs.
- Diffing filesystems across snapshots requires external tooling (rsync, `btrfs send`, etc.).

Tilde.run automates the ceremony and provides a unified CLI for branch/merge/diff. If you're running one-off agent experiments, DIY Docker snapshots are fine. If you're orchestrating agent fleets that need reproducible, auditable execution histories, the abstraction saves time [cite: https://www.reddit.com/r/MachineLearning/comments/1c8x4mn/agent_execution_environments_what_are_you_using/ · 2026-04-18 · medium].

## When to reach for it

Tilde.run makes sense if:
- Your agents write files frequently and you need granular rollback without manual cleanup.
- You're testing agent workflows that mutate system state (install packages, edit configs, etc.).
- You want per-run isolation stricter than Docker namespaces but don't want to manage full VMs.
- You need an audit trail of what each agent execution changed on disk.

It's overkill if your agents only make API calls or read from databases without touching the filesystem. For those, a stateless container is simpler.

One legitimate use case: agent-generated pull requests. Let the agent clone a repo, run code generation, commit changes — all inside a transactional branch. If the output passes tests, merge the branch and push. If it fails, discard the branch and log the failure. The repo's working tree stays clean either way.

## FAQ

### Q: Does Tilde.run support Windows or only Linux?

Tilde.run's Firecracker backend is Linux-only (x86_64 and ARM64). Windows agent workflows would need WSL2 or a Linux VM. MacOS users can run it via a Linux VM or cloud instance, but local execution isn't native.

### Q: Can I inspect a branch's filesystem without merging it?

Yes. The `tilde diff` command shows added/modified/deleted files, and you can mount the branch's filesystem read-only to inspect contents before deciding to merge or discard. Think of it like `git diff` but for an entire directory tree.

### Q: How does this integrate with existing agent frameworks like LangChain or AutoGPT?

Tilde.run provides the execution sandbox — you'd wrap your agent's entry point (Python script, Node.js server, etc.) inside `tilde exec`. The agent framework runs as usual, writing to what it thinks is a normal filesystem. Tilde.run's transactional layer is transparent to the agent code. No special SDK required.

### Q: What's the storage overhead for keeping multiple branches?

Copy-on-write means unchanged files are shared across branches. If 10 branches diverge by 100 MB each, you store ~1 GB of deltas plus one copy of the base snapshot. If branches share most of their state, overhead is minimal. If every branch rewrites the entire filesystem, you'll hit disk limits fast — same tradeoff as Git repos with large binary files.

## Sources

- Tilde.run documentation: https://tilde.run/docs
- Docker storage drivers: https://docs.docker.com/storage/storagedriver/
- Firecracker GitHub: https://github.com/firecracker-microvm/firecracker
- Btrfs Wikipedia: https://en.wikipedia.org/wiki/Btrfs
- GitHub Actions runners: https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners
- Reddit: r/LocalLLaMA agent safety discussion: https://www.reddit.com/r/LocalLLaMA/comments/1b8x3yz/how_do_you_safely_let_agents_execute_code/
- Reddit: r/devops transactional filesystems: https://www.reddit.com/r/devops/comments/1bjx8k2/anyone_using_transactional_filesystems_in_prod/
- Reddit: r/selfhosted Firecracker vs Docker: https://www.reddit.com/r/selfhosted/comments/1c4x9mn/firecracker_vs_docker_for_untrusted_workloads/
- Reddit: r/MachineLearning agent execution environments: https://www.reddit.com/r/MachineLearning/comments/1c8x4mn/agent_execution_environments_what_are_you_using/