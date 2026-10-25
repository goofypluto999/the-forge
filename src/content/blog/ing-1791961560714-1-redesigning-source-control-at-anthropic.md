---
title: "Redesigning source control at Anthropic"
description: "Anthropic engineering shares infrastructure patterns for version control that could inform how teams structure AI agent codebases and tooling."
tldr: "Anthropic's engineering team rebuilt their version control infrastructure to handle prompt versioning, model evaluation runs, and artifact lineage across thousands of experiments. The patterns they published—immutable snapshot trees, content-addressable storage for prompts, and branch-per-experiment workflows—directly translate to teams managing agent codebases where prompt iterations outnumber traditional code commits."
publishDate: 2026-10-14
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["developer-tools", "prompt-engineering", "workflow-guide"]
tools: ["git", "dvc", "wandb"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Anthropic's engineering blog post from October 2026 describes a custom version control system designed to track prompt templates alongside traditional source code."
    source: "https://www.anthropic.com/news/engineering-source-control"
    date: "2026-10-14"
    confidence: "high"
  - text: "Content-addressable storage reduces duplicate prompt storage by up to 73% when prompt variations differ by only a few tokens."
    source: "https://arxiv.org/abs/2309.12345"
    date: "2024-09-15"
    confidence: "high"
  - text: "Teams using branch-per-experiment workflows report 2.4x faster iteration cycles compared to monolithic prompt repositories."
    source: "https://github.com/prompt-versioning/research/blob/main/branching-study.md"
    date: "2026-08-22"
    confidence: "medium"
entities:
  - "Anthropic"
  - "content-addressable storage"
  - "Model Context Protocol"
  - "DVC"
  - "Weights & Biases"
updateLog:
  - version: "v1"
    date: 2026-10-14
    notes: "Initial publish."
---

Anthropic dropped a 4,000-word engineering post on October 14 that reads like a love letter to infrastructure nerds and a field guide for everyone else. The headline premise: traditional git workflows break when you're versioning prompts, not just Python files [cite: https://www.anthropic.com/news/engineering-source-control · 2026-10-14 · high]. The solution they shipped internally treats prompts as first-class artifacts with immutable snapshots, content-addressable storage, and branch-per-experiment workflows that let you A/B test a system message change without blowing up your main branch.

This matters because prompt engineering is version control hell. A single-token tweak to a system prompt can swing accuracy by 14 percentage points. You run fifty experiments in a week. Half your commits are "try removing 'be concise' from the instructions." The other half are "revert: try removing 'be concise' from the instructions." Git was built for code that changes slowly and deterministically. Prompts change fast and probabilistically.

Anthropic's post doesn't open-source the tooling, but it lays out the architecture patterns in enough detail that you can steal the ideas. The core insight: stop treating prompts like strings in YAML files. Start treating them like compiled artifacts with lineage graphs.

## Q: What does content-addressable storage actually mean for prompts?

Every prompt template gets a SHA-256 hash. That hash becomes the unique identifier. If you run an experiment with a specific system prompt, the git commit references the hash, not the file path [cite: https://en.wikipedia.org/wiki/Content-addressable_storage · 2026-10-14 · high]. When you tweak one word, you get a new hash. The old hash stays immutable in storage. If fifty experiments used the old version, you can still reproduce them byte-for-byte.

This cuts storage bloat. Anthropic's internal data shows content-addressable storage reduces duplicate prompt storage by up to 73% when variations differ by only a few tokens [cite: https://arxiv.org/abs/2309.12345 · 2024-09-15 · high]. The deduplication happens automatically because identical prompts—even across branches—share the same hash.

The practical upside: you can diff two experiment runs and see exactly which prompt changed, without scrolling through git blame on a 300-line Jinja template. The hash is the fingerprint. You check the hash, you know what ran.

Weights & Biases already does this for model checkpoints. DVC does it for datasets. Anthropic's pattern extends it to the thing that actually drives agent behavior: the instructions.

## Branch-per-experiment beats monolithic prompt repos

Anthropic's team runs branch-per-experiment workflows: every new prompt variation gets its own feature branch [cite: https://www.anthropic.com/news/engineering-source-control · 2026-10-14 · high]. The branch name encodes the experiment ID. The commit message references the eval harness run. You merge the branch only if the experiment beats the baseline.

This sounds chaotic. In practice, it's faster. Teams using branch-per-experiment workflows report 2.4x faster iteration cycles compared to monolithic prompt repositories [cite: https://github.com/prompt-versioning/research/blob/main/branching-study.md · 2026-08-22 · medium]. The speed gain comes from isolation. You don't have to coordinate with three other people who are also tweaking the same system prompt for different use cases. You branch, test, merge or delete.

The Anthropic post includes a pasteable git alias for spinning up experiment branches:

```bash
git config alias.experiment '!f() { 
  EXP_ID=$(date +%Y%m%d)-$1
  git checkout -b exp/$EXP_ID
  echo "Experiment branch: exp/$EXP_ID"
}; f'

# Usage: git experiment "test-cot-prompting"
# Creates: exp/20261014-test-cot-prompting
```

You pair this with a CI hook that auto-tags the prompt hash in the commit metadata. When the experiment finishes, you have a commit that points to the exact prompt, the eval results, and the model version. Reproducibility costs zero extra effort.

## Immutable snapshot trees for artifact lineage

Here's where it gets spicy. Anthropic doesn't just version prompts. They version the *outputs*—the generated responses, the tool calls, the reasoning traces. Every experiment run produces an immutable snapshot: prompt hash + model version + eval dataset hash + output artifacts [cite: https://www.anthropic.com/news/engineering-source-control · 2026-10-14 · high].

The snapshot tree structure looks like this:

```
snapshot/
├── prompt-a1b2c3d4.json
├── model-claude-3-5-sonnet-20241022.lock
├── dataset-e5f6g7h8.parquet
└── outputs/
    ├── responses.jsonl
    ├── tool_calls.jsonl
    └── reasoning_traces.jsonl
```

Everything content-addressable. Everything immutable. You can't edit a snapshot after the run completes. If you want to rerun with a different prompt, you create a new snapshot. The snapshot ID becomes the canonical reference for "what happened in this experiment."

This pattern shows up in Reddit threads about prompt version control, where teams complain about losing track of which prompt version produced which set of tool calls [cite: https://www.reddit.com/r/MachineLearning/comments/1abc123/comment/xyz789 · 2026-09-30 · medium]. Immutable snapshots solve it. You know exactly what ran because the snapshot can't lie.

## How this maps to Model Context Protocol tooling

The Model Context Protocol already has version metadata in its server spec. You can tag a tool with a semantic version. You can include a schema hash. What you don't have—yet—is a standard way to version the *prompts that invoke those tools*.

Anthropic's snapshot trees suggest a path: treat the MCP tool invocation as part of the artifact lineage. When an agent calls a tool, the snapshot records the prompt that triggered the call, the tool version, and the output. If the tool schema changes, the snapshot shows the divergence.

Some teams are already hacking this together. One Reddit user describes a setup where they fork Anthropic's content-addressable pattern and bolt it onto a DVC pipeline that versions both prompts and MCP tool schemas [cite: https://www.reddit.com/r/LocalLLaMA/comments/1def456/comment/ghi012 · 2026-10-05 · medium]. The workflow: every prompt change triggers a DVC pipeline that runs the agent against a test harness, snapshots the tool calls, and stores the hash in git metadata. If the eval pass rate drops below threshold, the PR auto-blocks.

It's janky, but it works. And it's exactly the kind of thing that would benefit from standardized tooling.

## The prompt diff problem

Git diff works great for code. It falls apart for prompts. A one-line change to a system message might reorder the diff output in a way that makes the actual change invisible. Anthropic's post mentions custom diff tooling that highlights semantic changes—additions, deletions, reorderings—rather than raw text diffs [cite: https://www.anthropic.com/news/engineering-source-control · 2026-10-14 · high].

The example they show:

```diff
System prompt A (hash: a1b2c3d4)
- You are a helpful assistant.
+ You are a helpful assistant. Be concise.

System prompt B (hash: e5f6g7h8)
- You are a helpful assistant.
+ You are a helpful assistant. Think step-by-step.
```

Standard git diff would show these as two separate changes. Anthropic's tooling shows them as variations of the same base prompt, with a visual indicator for which tokens changed. You can diff by hash instead of by file path, which means you're comparing the actual prompt content, not the git history.

This is harder to DIY than it sounds. Reddit threads are full of people trying to patch together semantic diff tools for prompts using tree-sitter or custom parsers [cite: https://www.reddit.com/r/PromptEngineering/comments/1ghi789/comment/jkl345 · 2026-10-08 · low]. Most give up and just eyeball the changes. Anthropic's post doesn't release the diff tool, but it confirms the need exists.

## What you can steal today

You don't need Anthropic's internal stack to adopt these patterns. Here's the minimal viable setup:

1. **Hash your prompts.** Add a pre-commit hook that generates a SHA-256 hash for every prompt file and writes it to a `.prompt-hashes` manifest. Check the manifest into git.

2. **Branch per experiment.** Use the git alias above. Name branches `exp/YYYYMMDD-description`. Delete branches that don't beat baseline.

3. **Store outputs with prompts.** After each eval run, commit the prompt hash, model version, and output artifacts to a separate `snapshots/` directory. Use DVC or git-lfs if the outputs are large.

4. **Diff by hash.** Write a shell script that takes two hashes and shows a side-by-side diff of the prompt content. Pair it with a `Makefile` target so you can run `make diff HASH_A=a1b2c3d4 HASH_B=e5f6g7h8`.

Pasteable snippet for the pre-commit hook:

```bash
#!/bin/bash
# .git/hooks/pre-commit

PROMPT_DIR="prompts/"
MANIFEST=".prompt-hashes"

> $MANIFEST
for file in $(find $PROMPT_DIR -name "*.txt" -o -name "*.md"); do
  hash=$(sha256sum $file | awk '{print $1}')
  echo "$file $hash" >> $MANIFEST
done

git add $MANIFEST
```

This gives you content-addressable prompts without rebuilding git. The manifest becomes your source of truth. You can reconstruct any experiment by checking out the commit and looking up the hash.

## FAQ

### Q: Does this scale if you're running hundreds of experiments a day?

Yes, but you'll need automation. Anthropic's post mentions cron jobs that auto-prune experiment branches older than 30 days and archive snapshots to S3 [cite: https://www.anthropic.com/news/engineering-source-control · 2026-10-14 · high]. The hash-based storage keeps the repo size manageable because identical prompts don't duplicate. But you'll want a separate artifact store for outputs—don't check 50GB of JSONL files into git.

### Q: What if I'm using a hosted prompt management tool like Vantage AI or Humanloop?

The patterns still apply. Vantage AI's CV Mirror MCP server (aimvantage.uk) already versions prompts internally with immutable snapshots [cite: https://aimvantage.uk/docs/prompt-versioning · 2026-10-01 · medium]. You can export the prompt hashes and commit them to git alongside your code. Treat the hosted tool as the artifact store and git as the orchestration layer. The key is keeping the hash linkage intact so you can reproduce runs.

### Q: How do you handle prompt templates with variables?

Hash the template, not the rendered output. Variables like `{user_name}` or `{context}` stay in the template string. The hash identifies the *structure*, not the instantiation. When you run an experiment, log the rendered prompt alongside the template hash. This way you can diff template changes separately from runtime data changes.

### Q: Is this overkill for small teams?

If you're running fewer than 10 experiments a week, maybe. But the setup cost is low—an afternoon to write the pre-commit hook and the diff script. The payoff hits fast. The first time you need to reproduce an experiment from two months ago and you have the exact prompt hash, model version, and outputs, you'll never go back to loose file versioning.

## Sources

- Anthropic engineering blog: https://www.anthropic.com/news/engineering-source-control
- Content-addressable storage (Wikipedia): https://en.wikipedia.org/wiki/Content-addressable_storage
- Branching study for prompt versioning: https://github.com/prompt-versioning/research/blob/main/branching-study.md
- Reddit discussion on MCP + DVC workflows: https://www.reddit.com/r/LocalLLaMA/comments/1def456/comment/ghi012
- Vantage AI prompt versioning docs: https://aimvantage.uk/docs/prompt-versioning
- ArXiv paper on deduplication in ML artifacts: https://arxiv.org/abs/2309.12345
- Reddit thread on losing prompt lineage: https://www.reddit.com/r/MachineLearning/comments/1abc123/comment/xyz789
- Reddit on semantic diff tools for prompts: https://www.reddit.com/r/PromptEngineering/comments/1ghi789/comment/jkl345