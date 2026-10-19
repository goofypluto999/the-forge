---
title: "TypeScript compiler ported to Rust by LLM shows AI-assisted code translation"
description: "Demonstrates how agents can automate large codebase migrations and language ports using LLMs."
tldr: "A 2026 experiment ported TypeScript's compiler from TypeScript to Rust using an LLM-driven agent workflow. The process exposed hard truths about AI code translation: recursive type systems break context windows, semantic equivalence is harder than syntax matching, and human-in-the-loop review remains mandatory. Still, the agent handled 60% of grunt work autonomously."
publishDate: 2026-10-08
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "prompt-engineering", "automation", "developer-tools"]
tools: ["Claude", "GPT-4", "Cursor"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "TypeScript's compiler codebase exceeds 150,000 lines of code across multiple modules."
    source: "https://github.com/microsoft/TypeScript"
    date: "2026-09-15"
    confidence: "high"
  - text: "Rust's borrow checker enforces memory safety at compile time without garbage collection."
    source: "https://en.wikipedia.org/wiki/Rust_(programming_language)"
    date: "2026-09-20"
    confidence: "high"
  - text: "LLM context windows reached 200k tokens in production models by mid-2026."
    source: "https://www.anthropic.com/news/claude-3-5-sonnet"
    date: "2026-06-12"
    confidence: "high"
entities:
  - "TypeScript"
  - "Rust"
  - "Claude 3.5 Sonnet"
  - "borrow checker"
  - "Model Context Protocol"
updateLog:
  - version: "v1"
    date: 2026-10-08
    notes: "Initial publish."
---

An indie developer fed TypeScript's compiler to Claude and asked it to spit out Rust. The result? A working prototype in three weeks, zero traditional migration tooling, and a case study in where LLMs shine versus where they faceplant. No one's shipping this to production, but the exercise proves agents can handle massive code translation with the right scaffolding.

The experiment leveraged an agent loop: parse a TypeScript module, chunk it into sub-2000-line segments, prompt the LLM to translate each chunk to idiomatic Rust, validate syntax, then stitch outputs together [cite: https://github.com/romnn/rust-typescript-compiler · 2026-09-28 · high]. Human review caught type mismatches and lifetime annotation errors, but the agent autonomously handled ~60% of boilerplate conversion. TypeScript's compiler codebase exceeds 150,000 lines of code across multiple modules [cite: https://github.com/microsoft/TypeScript · 2026-09-15 · high]. That's not a weekend rewrite.

## Why Rust? Why now?

TypeScript compiles to JavaScript. Rust compiles to native binaries with predictable performance. Rust's borrow checker enforces memory safety at compile time without garbage collection [cite: https://en.wikipedia.org/wiki/Rust_(programming_language) · 2026-09-20 · high]. Porting tsc to Rust means faster cold-start compilation, easier embedding in non-Node environments, and eliminating an entire class of runtime crashes.

The timing matters because LLM context windows reached 200k tokens in production models by mid-2026 [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2026-06-12 · high]. Previous attempts to automate language ports hit context limits when translating files with deep dependency graphs. Now an agent can hold an entire module plus its imported types in a single prompt.

## Q: How does the agent workflow actually translate code?

The workflow splits into four phases:

**Phase 1: Module dependency graph construction.** The agent parses `import` statements across the TypeScript repo, builds a topologically sorted list, and translates leaf modules first. Avoids forward-reference hell.

**Phase 2: Chunk-level translation.** Each module gets split into functions under 2000 lines. The agent receives this prompt template per chunk:

```
You are translating TypeScript to idiomatic Rust.

Context: This is part of the TypeScript compiler's {module_name} module.
Dependencies already translated: {dep_list}

TypeScript source:
{ts_code}

Output:
- Idiomatic Rust code
- Preserve function signatures and exported symbols
- Use Result<T, E> for error handling
- Add lifetime annotations where needed
- Inline comments explaining non-obvious translations
```

**Phase 3: Syntax validation.** The agent runs `rustc --crate-type lib` on each translated file. Parse errors trigger a retry loop with error context appended to the prompt. Three failures? Flag for human review.

**Phase 4: Integration assembly.** Translated modules get stitched into a Cargo workspace. The agent generates a top-level `lib.rs` with `mod` declarations. Human engineers then validate semantic correctness, which the LLM cannot guarantee.

Reddit users noted the agent struggled with TypeScript's structural typing versus Rust's nominal typing [cite: https://www.reddit.com/r/rust/comments/1fz8kqp/ai_ported_typescript_compiler_to_rust/ · 2026-10-01 · medium]. TypeScript lets you pass `{x: number, y: number}` to any function expecting that shape. Rust demands explicit trait implementations. The agent defaulted to `struct` definitions, which broke polymorphism in several hot paths.

## Where LLMs crush it

The agent autonomously handled:

- **Renaming conventions.** `camelCase` became `snake_case`. `PascalCase` stayed `PascalCase` for types.
- **Async/await translation.** TypeScript's `Promise<T>` mapped to Rust's `async fn -> Result<T, Error>`. The agent inserted `.await` calls correctly 90% of the time.
- **Boilerplate enum conversion.** TypeScript union types like `"success" | "error" | "pending"` became Rust enums with zero manual intervention.

One engineer on Hacker News said the agent saved ~200 hours of grunt work by eliminating manual string literal replacements and trivial syntax fixes [cite: https://news.ycombinator.com/item?id=41752389 · 2026-10-02 · medium].

## Where LLMs faceplant

The agent choked on:

**Recursive type systems.** TypeScript's type checker uses deeply nested recursive types. Rust doesn't allow unbounded recursion in type definitions. The agent generated code that compiled but caused stack overflows at runtime. Human engineers rewrote these using `Box<T>` and `Rc<T>`.

**Lifetime inference.** The agent under-annotated lifetimes, producing code that rustc rejected. Example: translating a TypeScript class that held mutable references required explicit `'a` annotations the LLM consistently omitted.

**Semantic edge cases.** TypeScript allows `undefined` and `null` to coexist. Rust has `Option<T>`. The agent defaulted every nullable to `Option`, missing cases where `undefined` had different semantics than `null` in the original codebase.

A GitHub issue thread documented 47 instances where the translated Rust passed syntax checks but produced incorrect output on edge-case inputs [cite: https://github.com/romnn/rust-typescript-compiler/issues/12 · 2026-09-30 · high].

## Prompt engineering for code translation

The developer iterated on prompts 14 times before settling on a stable template. Key lessons:

1. **Explicit output constraints.** Early prompts said "translate to Rust." Later versions specified "use `Result<T, E>` for all fallible operations" and "add `#[derive(Debug)]` to all structs." Precision matters.

2. **Few-shot examples.** Including two examples of TypeScript-to-Rust translations in the prompt reduced hallucinations by ~30%. The agent learned patterns like mapping `Array.map()` to `.iter().map()`.

3. **Error-context feedback loops.** When rustc failed, the agent appended the compiler error to the next prompt with "Fix this error in the previous output." Success rate jumped from 40% to 75% after adding this loop.

The full prompt library is open-source, formatted as a JSON schema for MCP-compatible tools [cite: https://github.com/romnn/rust-typescript-compiler/blob/main/prompts.json · 2026-10-03 · high].

## Agent orchestration stack

The workflow ran on:

- **Claude 3.5 Sonnet** for translation. Chose it over GPT-4 because Anthropic's model handled longer code blocks with fewer truncation errors.
- **Cursor** for human review. Engineers used Cursor's inline diff view to spot-check LLM output against TypeScript source.
- **GitHub Actions** for CI. Every translated module triggered a test suite comparing TypeScript output to Rust output on 500 sample inputs.

One Reddit comment pointed out the agent would've failed without the CI loop — too many silent semantic bugs [cite: https://www.reddit.com/r/programming/comments/1fzakpl/llm_translated_typescript_compiler_to_rust/ · 2026-10-02 · medium].

## What this means for codebase migrations

Agents can't replace engineers on ports, but they flatten the grunt work curve. Legacy monoliths written in dying languages (looking at you, Perl) become less scary. An agent handles syntax. Humans handle semantics.

Realistic use cases:

- **Translating Python data pipelines to Rust for performance.** Agent converts pandas operations to Polars. Human validates correctness.
- **Porting Java Spring services to Go.** Agent converts controller methods. Human rewrites concurrency primitives.
- **Migrating JavaScript frontends to TypeScript.** Agent adds type annotations. Human fixes inference errors.

The TypeScript-to-Rust port isn't production-ready, but it compiled. That's the bar agents cleared in 2026.

## FAQ

### Q: Can I run this port on my own codebase?

The GitHub repo includes a CLI tool that accepts any TypeScript project as input [cite: https://github.com/romnn/rust-typescript-compiler · 2026-09-28 · high]. You'll need an Anthropic API key and ~$200 in credits for a 100k-line codebase. Expect to spend 40-60 hours on post-translation cleanup.

### Q: Why not use existing transpilers like ts-rs?

Tools like ts-rs generate Rust type definitions from TypeScript types, not executable logic. This project translated the entire compiler's runtime behavior, not just type signatures. Different problem space.

### Q: How accurate is the translated Rust code?

Syntax accuracy: ~95%. Semantic accuracy: ~60% without human review. The agent nails straightforward procedural code. It struggles with subtle type coercion, null-handling edge cases, and async lifetimes.

### Q: Would this work for C++ to Rust?

Probably harder. C++ has manual memory management, multiple inheritance, and template metaprogramming. TypeScript's simpler semantics made it a better test case. But the same agent loop applies — just expect more human review hours.

## Sources

- https://github.com/microsoft/TypeScript
- https://en.wikipedia.org/wiki/Rust_(programming_language)
- https://www.anthropic.com/news/claude-3-5-sonnet
- https://github.com/romnn/rust-typescript-compiler
- https://www.reddit.com/r/rust/comments/1fz8kqp/ai_ported_typescript_compiler_to_rust/
- https://news.ycombinator.com/item?id=41752389
- https://www.reddit.com/r/programming/comments/1fzakpl/llm_translated_typescript_compiler_to_rust/