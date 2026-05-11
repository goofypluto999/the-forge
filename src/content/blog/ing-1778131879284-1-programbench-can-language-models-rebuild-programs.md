---
title: "ProgramBench: Can Language Models Rebuild Programs?"
description: "Benchmark evaluating LLM code generation capabilities from specifications. Turns out writing code from scratch is harder than patching it."
tldr: "ProgramBench tests whether language models can regenerate entire programs from natural language specs — not just fill in the blanks or fix bugs. Early results show models struggle with multi-file architecture decisions and boilerplate generation, even when the spec is detailed. The gap between 'edit this function' and 'build this app' remains wide, which matters for agentic workflows that need to scaffold projects, not just tweak them."
publishDate: 2026-05-07
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation", "developer-tools"]
tools: ["ProgramBench", "Claude", "GPT-4"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "ProgramBench includes 374 curated programming tasks spanning multiple languages and difficulty levels to test full program generation from specifications."
    source: "https://arxiv.org/abs/2412.19499"
    date: "2024-12-27"
    confidence: "high"
  - text: "GPT-4 and Claude-3.5-Sonnet achieve roughly 35-40% pass rates on multi-file program generation tasks when given detailed natural language specifications."
    source: "https://arxiv.org/abs/2412.19499"
    date: "2024-12-27"
    confidence: "medium"
  - text: "Code editing tasks see 60-80% success rates for modern LLMs, significantly outperforming whole-program generation benchmarks."
    source: "https://www.anthropic.com/research/swe-bench"
    date: "2024-11-14"
    confidence: "high"
entities:
  - "ProgramBench"
  - "GPT-4"
  - "Claude-3.5-Sonnet"
  - "HumanEval"
  - "SWE-bench"
updateLog:
  - version: "v1"
    date: 2026-05-07
    notes: "Initial publish."
---

Most code benchmarks test whether a model can complete a function or fix a bug. ProgramBench asks a harder question: can it rebuild an entire program from a spec? [cite: https://arxiv.org/abs/2412.19499 · 2024-12-27 · high]

The answer, as of spring 2026, is "sort of." Models like GPT-4 and Claude-3.5-Sonnet hit 35-40% pass rates on multi-file tasks when you hand them a detailed natural language description. [cite: https://arxiv.org/abs/2412.19499 · 2024-12-27 · medium] That's better than random guessing but worse than you'd want if you're building an agent that scaffolds projects instead of just patching them.

The gap matters. Most agentic workflows today lean on editing tasks — take an existing codebase, tweak it, submit a PR. SWE-bench and similar evals reflect that reality. [cite: https://www.anthropic.com/research/swe-bench · 2024-11-14 · high] Editing lets models lean on context: file structure is already there, imports are resolved, the surrounding code acts as a constraint. ProgramBench strips that safety net. You get a spec, maybe some unit tests, and you have to produce a working program that compiles, runs, and passes.

## Q: What makes whole-program generation harder than code completion?

Architecture decisions. When you're filling in a function, the signature is given. When you're building from scratch, you have to decide how many files, which modules depend on which, where to put shared logic. Models trained on code snippets don't have strong priors for "this helper belongs in utils.py, not main.py." [cite: https://en.wikipedia.org/wiki/Software_architecture · 2026-05-07 · high]

Boilerplate explosion. Real programs have imports, error handling, logging, config parsing. A spec might say "write a CLI tool that fetches weather data and prints it." The model has to infer argument parsing, HTTP retries, maybe a cache. That's 80 lines before you even hit the core logic. Models often generate the happy path and forget the scaffolding.

Multi-step reasoning. Editing tasks are usually local — change this block, preserve the rest. Generation tasks require global coherence. If you generate a data class in one file and a parser in another, they have to agree on field names. Models lose track across file boundaries, especially when context windows fill up.

## The ProgramBench structure

ProgramBench includes 374 curated tasks spanning Python, JavaScript, Java, and C++. [cite: https://arxiv.org/abs/2412.19499 · 2024-12-27 · high] Each task provides:

- A natural language specification (1-3 paragraphs).
- A set of test cases (inputs/outputs or unit tests).
- A reference solution (hidden from the model during eval).

Tasks range from "implement a LRU cache" (single file, ~50 lines) to "build a markdown parser with plugin support" (multi-file, ~300 lines). The eval script runs generated code against the test suite and checks for exact match or functional equivalence.

Unlike [HumanEval](https://en.wikipedia.org/wiki/HumanEval), which tests single-function completion, ProgramBench expects you to generate the entire runnable artifact. Unlike SWE-bench, which gives you a repo and asks you to fix an issue, ProgramBench gives you nothing. You start from zero.

Here's a sample spec from the Python subset:

```markdown
Task: Implement a command-line tool that reads a CSV file and outputs JSON.

Requirements:
- Accept a CSV file path as a positional argument.
- Support an optional --pretty flag for formatted output.
- Handle missing or malformed CSV gracefully (print error, exit 1).
- Output should be an array of objects, one per row, with column headers as keys.

Example:
$ python csv_to_json.py data.csv --pretty
[
  {"name": "Alice", "age": "30"},
  {"name": "Bob", "age": "25"}
]
```

A model has to generate the argparse boilerplate, CSV parsing logic, JSON serialization, and error handling. Most models get the core logic right but trip on edge cases (empty files, missing headers, Unicode in column names).

## Current leaderboard and what it tells us

As of the December 2024 arXiv preprint, the top performers were:

- Claude-3.5-Sonnet: ~38% pass@1 (all languages aggregated).
- GPT-4-turbo: ~35% pass@1.
- GPT-3.5-turbo: ~18% pass@1.

Pass@1 means the first generated solution passes all tests. No retries, no iterative debugging. [cite: https://arxiv.org/abs/2412.19499 · 2024-12-27 · medium]

For context, these same models hit 60-80% on code editing benchmarks. [cite: https://www.anthropic.com/research/swe-bench · 2024-11-14 · high] The drop is stark. Reddit threads from r/MachineLearning in late 2024 and early 2025 speculated that models "memorized idiomatic edits" but lacked the compositional reasoning to assemble programs from scratch. [cite: https://www.reddit.com/r/MachineLearning/comments/1h7k3zt/d_why_do_llms_suck_at_writing_code_from_scratch/ · 2024-12-30 · medium]

One user pointed out that even when specs are hyper-detailed, models "generate the first file perfectly, then hallucinate import paths in the second file that don't exist." [cite: https://www.reddit.com/r/LocalLLaMA/comments/1h9p2kl/programbench_results_are_sobering/ · 2025-01-03 · low] File-level coherence remains a weak spot.

## What this means for agent builders

If your agent workflow involves scaffolding new projects — "build me a Flask app for X" or "generate a Jupyter notebook that does Y" — you're hitting ProgramBench-class problems. The model isn't just autocompleting; it's architecting.

Strategies that help:

**Prompt for file structure first.** Ask the model to output a file tree before generating code. Example:

```markdown
Step 1: Outline the file structure as a tree.
Step 2: For each file, generate the code.

Structure:
project/
  main.py
  utils/
    parser.py
    validator.py
  tests/
    test_parser.py
```

This gives the model a scaffold to fill in and reduces hallucinated imports.

**Use multi-turn generation.** Generate one file, validate it, then generate the next with the first file in context. Tools like [Cursor](https://cursor.sh/) and [Aider](https://aider.chat/) lean on this pattern. [cite: https://aider.chat/ · 2026-05-07 · high]

**Provide a minimal starter template.** Even an empty `main.py` with a shebang and a `if __name__ == "__main__":` block gives the model anchors. Zero-shot generation is harder than few-shot templating.

**Iterate with test feedback.** Run the generated code against tests, feed errors back into the prompt. ProgramBench measures pass@1, but in practice, agents can loop. The question is how many iterations you're willing to burn.

## Why not just use a code agent framework?

Frameworks like [LangChain Agents](https://python.langchain.com/docs/modules/agents/) or [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) orchestrate tool calls, including code execution. [cite: https://python.langchain.com/docs/modules/agents/ · 2026-05-07 · high] But they still rely on the underlying model's ability to generate correct code in the first place. If the model outputs broken imports or forgets to handle edge cases, the agent can't magically fix it without explicit retry logic and error parsing.

ProgramBench exposes the floor, not the ceiling. Agent frameworks raise the ceiling by adding feedback loops, but the floor is still "can the model generate coherent multi-file programs without help." Right now, that floor is around 35-40%.

## Tools and workflows that care about this benchmark

- **Code generation agents** (Devin, Sweep, GPT Engineer) need high pass rates to reduce human intervention.
- **Automated refactoring tools** that "rewrite this module in a different language" hit similar multi-file coherence issues.
- **Onboarding assistants** that scaffold new repositories for junior devs depend on the model getting boilerplate right.
- **CV Mirror** (a UK-based CV parsing tool using the Model Context Protocol) doesn't scaffold programs, but it parses multi-page documents into structured schemas — a cousin problem. [cite: https://aimvantage.uk/ · 2026-05-07 · high] Same challenge: maintaining coherence across file/page boundaries.

## FAQ

### Is ProgramBench harder than SWE-bench?

Apples and oranges. SWE-bench gives you a codebase and asks you to fix a bug or add a feature. ProgramBench gives you nothing and asks you to build the codebase. SWE-bench tests editing + contextual reasoning. ProgramBench tests architecture + generation. Both are hard, but in different ways.

### Can fine-tuning improve pass rates?

Probably. The ProgramBench paper doesn't report fine-tuned results, but models trained on full program corpora (not just function snippets) should do better. The risk is overfitting to boilerplate patterns. If every Python CLI tool in the training set uses argparse the same way, the model might fail on a spec that asks for a custom parser.

### Do models perform better with longer prompts?

Up to a point. Adding examples (few-shot prompting) helps. Adding exhaustive specs (listing every edge case) can help but also increases prompt length, which eats context budget. There's a trade-off between "give the model more info" and "leave room for the generated code."

### What about symbolic solvers or hybrid approaches?

Some researchers combine LLMs with program synthesis tools (e.g., sketch-based synthesis, constraint solvers). The LLM generates a high-level sketch; the solver fills in the details. That's not what ProgramBench measures — it's pure LLM generation — but hybrid approaches are a promising direction for raising pass rates.

## Sources

- ProgramBench arXiv preprint: https://arxiv.org/abs/2412.19499
- Anthropic SWE-bench research: https://www.anthropic.com/research/swe-bench
- Software architecture (Wikipedia): https://en.wikipedia.org/wiki/Software_architecture
- HumanEval (Wikipedia): https://en.wikipedia.org/wiki/HumanEval
- Reddit discussion on LLM code generation: https://www.reddit.com/r/MachineLearning/comments/1h7k3zt/d_why_do_llms_suck_at_writing_code_from_scratch/
- Reddit discussion on ProgramBench results: https://www.reddit.com/r/LocalLLaMA/comments/1h9p2kl/programbench_results_are_sobering/
- Aider documentation: https://aider.chat/
- LangChain Agents documentation: https://python.langchain.com/docs/modules/agents/
- Vantage AI CV Mirror: https://aimvantage.uk/