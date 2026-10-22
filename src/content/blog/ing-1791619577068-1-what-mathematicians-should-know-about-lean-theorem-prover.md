---
title: "What Mathematicians Should Know About Lean Theorem Prover"
description: "Terry Tao explores Lean's reliability and AI applications in formal proof verification."
tldr: "Lean is a theorem prover forcing mathematicians to write machine-checkable proofs. Terry Tao and other working mathematicians increasingly use it to verify complex results. The kicker: AI models now generate Lean code, but the verifier catches their hallucinations. This creates a feedback loop where LLMs learn formal reasoning patterns humans struggle to teach directly."
publishDate: 2026-10-10
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["ai", "evaluation", "developer-tools"]
tools: ["Lean", "AlphaProof", "mathlib"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Lean 4 was released in 2021 with a complete rewrite of the underlying type theory and metaprogramming system."
    source: "https://leanprover.github.io/lean4/doc/"
    date: "2021-09-08"
    confidence: "high"
  - text: "Terry Tao formalized the Polynomial Freiman-Ruzsa conjecture proof in Lean alongside collaborators in 2024."
    source: "https://terrytao.wordpress.com/2024/01/03/machine-assisted-proofs/"
    date: "2024-01-03"
    confidence: "high"
  - text: "AlphaProof solved 4 out of 6 problems at the 2024 International Mathematical Olympiad using Lean as its formal verification backend."
    source: "https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/"
    date: "2024-07-25"
    confidence: "high"
  - text: "Mathlib, Lean's mathematics library, contained over 1.5 million lines of formal proof as of mid-2024."
    source: "https://leanprover-community.github.io/mathlib_stats.html"
    date: "2024-06-15"
    confidence: "high"
  - text: "The Liquid Tensor Experiment formalized a condensed mathematics theorem in Lean, completed in July 2022."
    source: "https://xenaproject.wordpress.com/2022/07/14/the-liquid-tensor-experiment/"
    date: "2022-07-14"
    confidence: "high"
entities:
  - "Lean theorem prover"
  - "Terry Tao"
  - "AlphaProof"
  - "mathlib"
  - "Polynomial Freiman-Ruzsa conjecture"
  - "International Mathematical Olympiad"
updateLog:
  - version: "v1"
    date: 2026-10-10
    notes: "Initial publish."
---

Mathematicians don't trust each other's proofs. They trust the social process around proofs—peer review, replication attempts, the grad student who spots the gap on page 47. Lean changes the trust model entirely. You write a proof, Lean checks every logical step, and if it compiles, the result is correct within Lean's type theory. No appeals to authority. No "the details are straightforward."

The tool matters now because AI is generating mathematical content at scale. Models hallucinate proofs constantly. But when those hallucinations get piped into Lean, the verifier rejects them immediately. This creates a training signal: the model learns what formal rigor actually looks like, not what sounds convincing to a tired reviewer at 11 PM.

## What Lean actually does

Lean is a proof assistant based on dependent type theory [cite: https://leanprover.github.io/lean4/doc/ · 2021-09-08 · high]. You write mathematical statements and their proofs in a programming language. The Lean kernel—a small, auditable piece of code—verifies that each proof step follows from the axioms and prior results. If your proof has a logical gap, Lean refuses to compile it.

The difference from informal math: you can't wave your hands. Every "clearly" and "without loss of generality" must become explicit code. Every definition must be computationally precise. Mathematicians hate this at first. Then they realize it catches errors they'd have published otherwise [cite: https://terrytao.wordpress.com/2024/01/03/machine-assisted-proofs/ · 2024-01-03 · high].

Lean 4 shipped in 2021 with a total rewrite of the metaprogramming layer, making it feasible to write tactics—automated reasoning procedures—in Lean itself [cite: https://leanprover.github.io/lean4/doc/ · 2021-09-08 · high]. This matters because tactics are how you avoid writing 10,000 lines of proof for a one-line theorem. A good tactic library lets you work at the abstraction level of normal mathematics.

## Terry Tao's proof formalization experiment

In early 2024, Terry Tao formalized a proof of the Polynomial Freiman-Ruzsa conjecture in Lean alongside Timothy Gowers, Ben Green, and Freddie Manners [cite: https://terrytao.wordpress.com/2024/01/03/machine-assisted-proofs/ · 2024-01-03 · high]. The informal proof was already published. The formalization took months and required ~20,000 lines of Lean code. They found no errors in the original proof, but the process forced them to make every implicit step explicit.

Tao's [blog post](https://terrytao.wordpress.com/2024/01/03/machine-assisted-proofs/) describes the experience as "surprisingly addictive." Once you start formalizing, Lean guides you through the proof. You can't skip steps. You can't rely on geometric intuition unless you've formalized the geometry. The type checker becomes a collaborator that never gets tired and never accepts sloppy reasoning.

The formalization lives in mathlib, Lean's community-maintained mathematics library. Mathlib crossed 1.5 million lines of formal proof in mid-2024 [cite: https://leanprover-community.github.io/mathlib_stats.html · 2024-06-15 · high]. It includes everything from undergraduate calculus to advanced algebraic geometry. When you formalize a new result, you build on this foundation, and others build on yours.

Reddit's [r/math](https://www.reddit.com/r/math/) community has been tracking formalization projects closely. Users report that the barrier to entry is dropping as tutorials improve and AI tools start generating Lean boilerplate.

## Q: How does AI use Lean for training?

Lean's verifier provides binary feedback: the proof compiles or it doesn't. This makes it a near-perfect training environment for reinforcement learning. DeepMind's AlphaProof used Lean as its formal backend to solve IMO problems in 2024, scoring 4 out of 6 at silver medal level [cite: https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/ · 2024-07-25 · high].

Here's the loop. The model generates a Lean proof. The verifier checks it. If it fails, the model gets immediate feedback about where the reasoning broke down. If it succeeds, the proof becomes part of the training corpus. Over millions of attempts, the model learns which reasoning patterns actually hold up under formal scrutiny.

This is radically different from training on natural-language proofs scraped from arXiv. Natural-language proofs contain errors, ambiguities, and informal leaps. The model learns to mimic those flaws. Lean-verified proofs are guaranteed correct (within the axioms of Lean's type theory). The model learns actual mathematics, not the social performance of mathematics.

You can see this in practice with a simple example. Here's a Lean proof that addition is commutative for natural numbers:

```lean
theorem add_comm (n m : ℕ) : n + m = m + n := by
  induction n with
  | zero => simp
  | succ n ih => simp [Nat.add_succ, ih]
```

An LLM trained on informal proofs might write "addition is commutative by the properties of natural numbers." Lean forces it to construct the proof step-by-step using induction and simplification tactics. The verifier rejects anything that doesn't logically follow.

## The Liquid Tensor Experiment precedent

Before AlphaProof, before Tao's formalization, the Liquid Tensor Experiment proved that complex modern mathematics could be formalized in Lean at all. In December 2020, Peter Scholze challenged the Lean community to formalize a key theorem from condensed mathematics within six months. The community completed it in 18 months, finishing in July 2022 [cite: https://xenaproject.wordpress.com/2022/07/14/the-liquid-tensor-experiment/ · 2022-07-14 · high].

The experiment demonstrated that Lean's mathlib infrastructure could scale to research-level mathematics. It also showed that distributed formalization works. Dozens of contributors added pieces of the proof, building on each other's work without coordination bottlenecks. The final result was a machine-verified proof of a theorem most mathematicians couldn't check by hand.

[Wikipedia's article on formal proof](https://en.wikipedia.org/wiki/Formal_proof) barely mentions this milestone, but it changed how working mathematicians think about verification. If condensed mathematics can be formalized, anything can.

## Why this matters for agent workflows

Formal verification creates a ground truth for reasoning tasks. Agents that generate code, legal arguments, or financial models currently have no reliable way to check their own output. Lean-style verification for those domains would mean agents could iterate toward correctness without human oversight.

The pattern: generate, verify, refine. The agent proposes a solution. The verifier checks it against formal rules. If it fails, the verifier returns a specific error. The agent adjusts and tries again. This works for mathematics because the rules are well-defined. It could work for contracts, medical protocols, or infrastructure configuration if those domains had comparable formal specifications.

Some domains already have formal specs. [TLA+](https://en.wikipedia.org/wiki/TLA%2B) specifies distributed systems. Dafny verifies imperative programs. Coq verifies operating system kernels. The missing piece is tight integration between LLMs and these verifiers, so models learn from verification failures in real time.

## Objections mathematicians raise

Formalization is slow. True. The Polynomial Freiman-Ruzsa proof took months to formalize after the informal proof was done. But the time investment pays off in reusability. Once a theorem is in mathlib, every future proof can invoke it without re-proving it. The cost is front-loaded.

Formalization doesn't discover new mathematics. Also true. Lean doesn't generate conjectures or intuitions. It verifies them. But verification is half the work. If an LLM generates a plausible conjecture and Lean verifies it, you've discovered something new via collaboration between heuristic search and formal proof.

The biggest objection: formalization changes what counts as mathematics. Some mathematicians argue that the informal process—sketches, diagrams, appeals to geometric intuition—is the real mathematics. Formalization is just bureaucracy. Maybe. But bureaucracy catches errors. And when AI is generating thousands of plausible-sounding arguments per second, bureaucracy is the only defense.

## FAQ

### Can I start using Lean without a math PhD?

Yes. The [Lean community](https://leanprover-community.github.io/) maintains a textbook called "Mathematics in Lean" that assumes undergraduate-level math. The learning curve is steep but manageable if you're comfortable with programming. Natural language tutorials on [r/learnmath](https://www.reddit.com/r/learnmath/) help bridge the gap.

### Does Lean work for applied math and engineering?

Partially. Mathlib focuses on pure mathematics, but Lean 4's improved metaprogramming makes it feasible to build domain-specific verification tools. The control theory and differential equations libraries are growing. Expect more applied content as AI researchers push Lean into reinforcement learning verification.

### How reliable is Lean's kernel?

The kernel is ~5,000 lines of code, small enough to audit by hand [cite: https://leanprover.github.io/lean4/doc/ · 2021-09-08 · medium]. It's been scrutinized by type theorists and proof engineers for years. No verified theorem in Lean has been shown incorrect due to a kernel bug. The axioms you choose (classical logic vs. constructive, choice vs. no choice) affect what you can prove, but the verifier itself is rock solid.

### What's the relationship between Lean and Coq?

Both are proof assistants based on dependent type theory. Coq has been around since 1989 and has a larger formalized corpus overall. Lean is newer, faster to compile, and easier to extend via metaprogramming. Many mathematicians find Lean's syntax more natural. Coq has stronger ties to computer science verification. Pick based on your domain and community.

## Sources

- Lean 4 documentation: https://leanprover.github.io/lean4/doc/
- Terry Tao's blog on formalization: https://terrytao.wordpress.com/2024/01/03/machine-assisted-proofs/
- DeepMind AlphaProof announcement: https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/
- Mathlib statistics: https://leanprover-community.github.io/mathlib_stats.html
- Liquid Tensor Experiment completion: https://xenaproject.wordpress.com/2022/07/14/the-liquid-tensor-experiment/
- Lean community resources: https://leanprover-community.github.io/
- Wikipedia on formal proof: https://en.wikipedia.org/wiki/Formal_proof
- Reddit r/math discussion: https://www.reddit.com/r/math/
- Reddit r/learnmath resources: https://www.reddit.com/r/learnmath/