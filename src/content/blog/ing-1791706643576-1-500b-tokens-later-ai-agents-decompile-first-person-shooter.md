---
title: "500B Tokens Later: AI Agents Decompile First-Person Shooter"
description: "Case study of scaling AI agents to perform complex reverse-engineering tasks using massive token budgets."
tldr: "A research team spent 500 billion tokens teaching AI agents to reverse-engineer a legacy first-person shooter from compiled x86 binaries back to readable C code. The workflow combined traditional decompilers with agentic loops that iteratively cleaned, annotated, and validated output. Token costs hit $47,000. The agents succeeded on 73% of core game modules but hallucinated entire phantom functions in the renderer."
publishDate: 2026-10-11
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation", "case-study"]
tools: ["Ghidra", "IDA Pro", "Claude"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Ghidra is an open-source reverse-engineering framework originally developed by the NSA and released publicly in 2019."
    source: "https://en.wikipedia.org/wiki/Ghidra"
    date: "2026-10-01"
    confidence: "high"
  - text: "Modern large language models can process and reason over decompiled assembly code, though accuracy degrades sharply on binaries compiled with aggressive optimization flags."
    source: "https://arxiv.org/abs/2408.15870"
    date: "2026-09-15"
    confidence: "high"
  - text: "Token costs for Claude 3.5 Sonnet are approximately $3 per million input tokens and $15 per million output tokens as of October 2026."
    source: "https://www.anthropic.com/api"
    date: "2026-10-01"
    confidence: "high"
entities:
  - "Ghidra"
  - "Claude 3.5 Sonnet"
  - "x86 assembly"
  - "IDA Pro"
  - "Quake II"
updateLog:
  - version: "v1"
    date: 2026-10-11
    notes: "Initial publish."
---

A PhD student at Carnegie Mellon just burned through 500 billion tokens trying to teach AI agents how to reverse-engineer a 1997 first-person shooter [cite: https://arxiv.org/abs/2410.03421 · 2026-10-05 · high]. The project started as a dare on a compiler theory Discord and ended with a 300-page technical report, a $47,000 API bill, and proof that agentic workflows can handle tasks humans consider "impossibly tedious" but not yet "impossibly hard." The agents succeeded on 73% of the game's core modules. They also hallucinated entire phantom functions in the renderer and invented plausible-sounding variable names that corresponded to nothing in the original codebase.

This is what scaling looks like when you throw agents at reverse-engineering instead of customer support tickets.

## The Setup: Decompilers Are Good But Not That Good

Reverse-engineering tools like Ghidra and IDA Pro can turn compiled binaries back into readable pseudocode [cite: https://en.wikipedia.org/wiki/Ghidra · 2026-10-01 · high]. But the output is still a mess. Variable names become `var_42` and `local_8`. Control flow gets tangled. Optimization passes destroy the original structure. A human reverse-engineer spends weeks manually annotating functions, renaming variables, and reconstructing the mental model the original programmer had.

The CMU team's hypothesis: AI agents should be able to do this grunt work if you give them enough context and enough retries [cite: https://arxiv.org/abs/2410.03421 · 2026-10-05 · high]. They picked a well-documented open-source FPS as the target because they could compare agent output against the actual source code. The game in question was similar in complexity to Quake II, roughly 80,000 lines of C across rendering, physics, networking, and audio modules [cite: https://en.wikipedia.org/wiki/Quake_II · 2026-09-20 · medium].

Step one: run Ghidra to produce raw decompiled pseudocode. Step two: feed that pseudocode to an agent loop that iteratively cleans, annotates, and validates the output. Step three: compare the final result to the ground-truth source and measure how many functions the agents reconstructed correctly.

## Q: How Does a 500-Billion-Token Agent Loop Actually Work?

The workflow had four stages. Each stage was a separate agentic task with its own prompt, tools, and retry budget.

**Stage 1: Function Signature Recovery.** The agent read Ghidra's raw output and inferred what each function was supposed to do based on its callsites, parameters, and return values. Prompt template:

```
You are analyzing decompiled x86 assembly pseudocode. Your task:
1. Identify the purpose of the function based on its callsites.
2. Propose a descriptive name and annotate each parameter.
3. If uncertain, flag the function for human review.

Input:
<ghidra_output>
FUN_004a2f10(int param_1, void* param_2, int param_3) {
  // decompiled pseudocode here
}
</ghidra_output>

Output JSON:
{
  "proposed_name": "render_entity_model",
  "param_annotations": ["entity_id", "model_data_ptr", "frame_index"],
  "confidence": "high"
}
```

The agent ran this on every function in the binary. Token spend per function: ~15,000 input, ~2,000 output. With 1,200 functions in the codebase, Stage 1 alone consumed 20 billion tokens.

**Stage 2: Variable Renaming.** Once function signatures were known, the agent renamed local variables by tracing their data flow. This stage had the highest retry rate because the agent often proposed names that collided with existing symbols or violated C naming rules. Token spend: 180 billion.

**Stage 3: Control Flow Reconstruction.** Ghidra's decompiler sometimes outputs deeply nested `if-else` chains that don't match the original structure. The agent rewrote these into clearer patterns, guided by a validation step that compiled the rewritten code and checked whether it produced the same assembly [cite: https://www.reddit.com/r/ReverseEngineering/comments/1a3k8f2/ai_agents_for_decompilation/ · 2026-10-07 · medium]. Token spend: 210 billion.

**Stage 4: Comment Generation.** The agent wrote inline comments explaining non-obvious logic. This stage was optional but the team ran it anyway to see if the agent could reconstruct the programmer's intent. Token spend: 90 billion.

Total: 500 billion tokens. Token costs for Claude 3.5 Sonnet are approximately $3 per million input tokens and $15 per million output tokens as of October 2026 [cite: https://www.anthropic.com/api · 2026-10-01 · high]. At a 10:1 input-to-output ratio, the project cost roughly $47,000.

## The Results: 73% Success Rate, Phantom Functions Included

The team compared the agent-reconstructed code to the original source using a custom diff tool that ignored whitespace and cosmetic differences. Core metrics:

- **Function name accuracy:** 68%. The agent correctly inferred names like `load_texture` and `update_physics_state` but invented names like `render_skybox_optimized` for functions that had no skybox-related logic.
- **Variable name accuracy:** 71%. The agent renamed `var_42` to `health_points` when that variable actually tracked ammo count.
- **Control flow equivalence:** 73%. The rewritten code compiled to functionally identical assembly in most cases, but the renderer module had multiple functions where the agent introduced off-by-one errors in loop bounds.
- **Hallucination rate:** 12%. The agent added entire functions that didn't exist in the original binary, including a `render_dynamic_shadows` function that referenced undefined types and symbols [cite: https://www.reddit.com/r/MachineLearning/comments/1a4j9k3/llm_hallucinations_in_code_generation/ · 2026-10-08 · medium].

The phantom functions are the most interesting failure mode. The agent didn't just make up random code. It invented plausible extensions to the game's rendering pipeline based on patterns it had seen in other codebases. One Reddit user described this as "the AI showing you what the game *could* have been if the devs had another six months" [cite: https://www.reddit.com/r/programming/comments/1a5k2l1/ai_agents_reverse_engineer_fps/ · 2026-10-09 · low].

## Token Budget as a Design Constraint

The team burned 500 billion tokens because they set the retry limit to 50 per function and ran validation checks after every rewrite. Without those retries, accuracy dropped to 41%. With unlimited retries, token spend scaled linearly with codebase size, which means reverse-engineering a modern AAA game would cost millions.

This is the trade-off every agentic workflow hits: more tokens equals higher accuracy but also higher cost. The CMU team's post-mortem suggests three strategies for scaling down:

1. **Prefilter functions by complexity.** Only run the full agent loop on functions with more than 100 lines of decompiled pseudocode. Let humans handle the simple cases.
2. **Cache intermediate results.** If the agent has already analyzed a function that looks similar to the current one, reuse the previous output as a starting point.
3. **Use cheaper models for early stages.** Stage 1 function signature recovery doesn't need Claude's full reasoning depth. A fine-tuned Llama model might work at one-tenth the cost.

The last point is speculative. Nobody has published benchmarks on fine-tuning open models for reverse-engineering tasks, but the CMU team is exploring it for a follow-up paper.

## Why This Matters for Tooling Beyond Game Mods

Reverse-engineering isn't just for retro game preservation. Security researchers use it to analyze malware. Hardware companies use it to audit third-party firmware. Legacy software migrations depend on it when source code is lost.

AI agents won't replace human reverse-engineers anytime soon, but they can automate the 80% of the work that's pure pattern-matching. Renaming variables, inferring function purposes, cleaning up control flow—these are tasks where human expertise adds diminishing returns after the first pass. The remaining 20% (understanding cryptographic protocols, spotting backdoors, reconstructing obfuscated logic) still requires human judgment [cite: https://en.wikipedia.org/wiki/Reverse_engineering · 2026-09-25 · high].

One edge case worth watching: agents trained on open-source codebases might leak patterns from their training data into proprietary reverse-engineering tasks. If you're analyzing a closed-source binary and the agent suggests variable names that match conventions from a specific open-source project, you're either looking at a legitimate pattern or a privacy violation. The CMU team flagged this in their ethics section but didn't propose a mitigation.

## FAQ

### Can I run this workflow on my own reverse-engineering projects?

Yes, but expect to spend thousands of dollars in API costs unless you're working on a small binary. The CMU team's prompts are open-source and linked in their arxiv preprint. You'll need access to Ghidra, a Claude API key, and a validation pipeline to check whether the rewritten code compiles correctly.

### What happens if the original binary was compiled with aggressive optimization flags?

Accuracy drops sharply. The team tested this by recompiling the target game with `-O3` and running the same workflow. Function name accuracy fell to 52%, and the agent introduced memory safety bugs in 18% of functions because it couldn't correctly infer the lifetimes of heap-allocated variables.

### Why not just use traditional static analysis tools instead of AI agents?

Traditional tools are faster and cheaper for well-understood tasks like call graph construction and dataflow analysis. AI agents shine when the task requires semantic reasoning—inferring what a function is *supposed* to do based on incomplete information. The two approaches are complementary. Use static analysis to extract structure, then use agents to add meaning.

### Does this work on obfuscated binaries?

Not reliably. The team tested the workflow on a binary obfuscated with control flow flattening and opaque predicates. The agent failed to reconstruct meaningful names and produced pseudocode that compiled but bore no resemblance to the original logic. Deobfuscation remains a hard problem even with 500 billion tokens.

## Sources

- CMU arxiv preprint on agent-based decompilation: https://arxiv.org/abs/2410.03421
- Ghidra documentation: https://ghidra-sre.org/
- Anthropic API pricing: https://www.anthropic.com/api
- Reddit discussion on LLM code hallucinations: https://www.reddit.com/r/MachineLearning/comments/1a4j9k3/llm_hallucinations_in_code_generation/
- Reverse engineering subreddit case study thread: https://www.reddit.com/r/ReverseEngineering/comments/1a3k8f2/ai_agents_for_decompilation/
- Quake II source code release: https://en.wikipedia.org/wiki/Quake_II