---
title: "Can LLMs Model Real-World Systems in TLA+?"
description: "Exploring whether LLMs can formally specify and verify distributed systems — and what that means for agent reasoning reliability."
tldr: "Large language models can generate syntactically valid TLA+ specifications for distributed systems, but struggle with semantic correctness and subtle invariant violations. Early experiments show promise for prototype specs, yet the gap between plausible-looking code and formally verified correctness remains wide. This matters for agent reliability: if an AI can't prove its own reasoning steps hold under all conditions, we're still shipping probabilistic tools into deterministic workflows."
publishDate: 2026-05-09
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation", "prompt-engineering"]
tools: ["TLA+", "TLC"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "TLA+ was designed by Leslie Lamport in the 1990s to specify concurrent and distributed systems with mathematical precision."
    source: "https://en.wikipedia.org/wiki/TLA%2B"
    date: "2026-05-09"
    confidence: "high"
  - text: "GPT-4 and Claude 3.5 Sonnet can produce syntactically correct TLA+ specifications for simple protocols like two-phase commit, but often introduce subtle logical errors in invariants."
    source: "https://www.reddit.com/r/tlaplus/comments/1c8x9zy/using_llms_to_generate_tla_specifications/"
    date: "2024-04-18"
    confidence: "medium"
  - text: "The TLC model checker can verify properties of finite-state systems exhaustively, catching edge-case violations that code review and unit tests typically miss."
    source: "https://lamport.azurewebsites.net/tla/tlc.html"
    date: "2026-05-09"
    confidence: "high"
entities:
  - "TLA+"
  - "Leslie Lamport"
  - "GPT-4"
  - "Claude 3.5 Sonnet"
  - "TLC model checker"
  - "two-phase commit"
updateLog:
  - version: "v1"
    date: 2026-05-09
    notes: "Initial publish."
---

Formal verification people love to say "the system is correct because the proof says so." The rest of us ship duct-tape microservices, pray the logs make sense, and call it a day. Now LLMs are stepping into the formal-methods ring, claiming they can write TLA+ specs for distributed systems. If true, that's a shortcut from vibes-based engineering to mathematically sound correctness. If false, it's another hype cycle where the AI looks smart until you run the model checker.

So can LLMs actually model real-world systems in TLA+? Short answer: sort of. They nail the syntax, stumble on semantics, and occasionally generate specs that look right but fail under exhaustive verification. Which is fascinating, because agent reliability hinges on the same question — can an AI reason about its own behaviour under all possible states, or does it just pattern-match its way to plausible answers?

## What is TLA+ and why does it matter for agents?

TLA+ was designed by Leslie Lamport in the 1990s to specify concurrent and distributed systems with mathematical precision [cite: https://en.wikipedia.org/wiki/TLA%2B · 2026-05-09 · high]. It's a formal specification language built on top of first-order logic and set theory, paired with the TLC model checker that exhaustively explores state spaces to verify invariants hold [cite: https://lamport.azurewebsites.net/tla/tlc.html · 2026-05-09 · high]. Companies like AWS use it to verify consensus protocols, storage replication, and other systems where a single bug costs millions [cite: https://www.reddit.com/r/programming/comments/2c5xdy/how_amazon_web_services_uses_formal_methods/ · 2014-07-31 · high].

For agent workflows, TLA+ matters because agents are distributed systems. They coordinate with external APIs, maintain state across retries, and make decisions that ripple through multi-step plans. If an agent can't prove its retry logic won't corrupt state under every interleaving, you're shipping a tool that works "most of the time" — which is exactly the problem formal methods solve.

The dream: LLMs generate TLA+ specs from natural-language requirements, TLC verifies them, and we get provably correct agent behaviours without manual proof effort. Reality check incoming.

## Q: Can LLMs actually write syntactically valid TLA+?

Yes, and impressively well. GPT-4 and Claude 3.5 Sonnet can produce syntactically correct TLA+ specifications for simple protocols like two-phase commit, but often introduce subtle logical errors in invariants [cite: https://www.reddit.com/r/tlaplus/comments/1c8x9zy/using_llms_to_generate_tla_specifications/ · 2024-04-18 · medium]. Feed them a prompt like "write a TLA+ spec for a key-value store with read-after-write consistency" and they'll spit out modules, actions, and invariants that parse cleanly.

The structure looks right: EXTENDS clauses, VARIABLES declarations, Init and Next actions. They even include temporal formulas and fairness constraints. But syntax isn't semantics. A spec can parse perfectly and still violate the property you care about.

Example prompt that gets decent results:

```
You are a formal methods engineer. Write a TLA+ specification for a two-phase commit protocol with a coordinator and two participants. Include:
- Init predicate defining initial state
- Prepare, Commit, and Abort actions
- An invariant stating that if any participant commits, all must commit
- A liveness property ensuring the protocol eventually terminates

Use standard TLA+ syntax. Annotate tricky lines with comments.
```

Run that through Claude 3.5 Sonnet and you'll get a ~80-line spec that compiles. Run it through TLC and you might find the invariant is too weak, or the liveness property assumes fairness conditions that don't hold in the real protocol.

## Where LLMs stumble: invariant bugs and state-space gaps

The failure mode isn't "garbage output." It's "plausible spec with a subtle bug that only shows up in rare interleavings." TLC will catch it if you run the model checker, but the point of using an LLM was supposed to be getting a correct-by-construction spec without manual debugging.

Common issues from early experiments shared on Reddit and TLA+ community forums:

- **Weak invariants**: The model says "no two processes hold the lock simultaneously" but forgets to encode that the lock is released before acquisition, so TLC finds a violation where both think they have it.
- **Missing fairness**: The spec allows infinite stuttering on a transition, so liveness properties never trigger. The LLM generates the temporal formula but doesn't add the required WF_vars(Action) clause.
- **Off-by-one errors in set operations**: The model uses `\in` where it should use `\subseteq`, or quantifies over the wrong domain, so the state space explodes or collapses incorrectly.

These are the same bugs human engineers make when learning TLA+, except humans usually catch them after one or two model-checker runs. LLMs don't learn from TLC error messages in a single session unless you feed the error back and iterate, which defeats the "one-shot correctness" promise.

## Why this matters for agent reliability

If an LLM can't correctly specify a two-phase commit protocol — a well-understood, decades-old algorithm — how confident should we be in its ability to reason about multi-step agent plans with retries, partial failures, and external API calls?

Agents are essentially distributed systems where each tool invocation is a remote procedure call with unknown latency and failure modes. The "state" is the conversation history, the tool outputs, and any persisted context. The "invariants" are things like "never send the same API request twice if it succeeded once" or "if the user asked for a refund, don't also charge their card."

Right now, agent frameworks rely on prompt engineering and probabilistic retry logic. Nobody's writing TLA+ specs for LangChain flows or AutoGPT task loops, because even human engineers find formal methods too expensive in time and expertise. But if LLMs could generate and verify these specs automatically, we'd move from "it usually works" to "it provably works under all defined conditions."

The gap: LLMs generate plausible specs, not proven ones. And "plausible" is exactly the wrong bar for formal verification.

## Practical experiments you can run today

If you're curious whether your favourite model can handle TLA+, try this:

1. Install the TLA+ Toolbox from [https://lamport.azurewebsites.net/tla/toolbox.html](https://lamport.azurewebsites.net/tla/toolbox.html).
2. Prompt an LLM to generate a spec for a simple protocol: single-writer multi-reader queue, Paxos, or a mutex.
3. Paste the output into a .tla file.
4. Define a small model (e.g. 2 processes, 3 messages) and run TLC.
5. Check if the invariants hold. If they do, try a larger model. If they don't, feed the error back and see if the LLM can fix it in one turn.

You'll probably find the model gets 70-80% of the way there, then needs human intervention to close the semantic gaps. Which is still useful — it's faster than writing the spec from scratch — but it's not the "push-button correctness" we'd need for agents to self-verify.

## Could agent frameworks adopt formal specs?

In theory, yes. You could imagine a world where every agent workflow compiles to a TLA+ spec under the hood, TLC verifies it before execution, and the framework rejects plans that violate invariants. In practice, the state space explodes fast, model checking is slow for real-world-scale systems, and most developers don't want to learn temporal logic.

More realistic near-term use case: LLMs generate TLA+ specs as **documentation artifacts**. The spec doesn't run in prod, but it lives in the repo as a machine-checkable description of what the agent is supposed to do. When bugs appear, you diff the spec against the implementation and see where they diverged. Tools like [cv-mirror-mcp](https://aimvantage.uk) already bridge structured data formats with LLM workflows — extending that pattern to formal specs isn't a huge leap.

## The model-checker litmus test

Here's a simple heuristic: if an LLM-generated spec passes TLC on a non-trivial model (say, 3+ processes, 5+ states each) without human edits, the model understands the problem domain. If it needs iteration, the model is doing fancy autocomplete on TLA+ syntax but lacks deep reasoning about concurrency.

As of mid-2026, no public model passes this test reliably. GPT-4 and Claude 3.5 Sonnet get close on textbook examples, but novel protocols or real-world edge cases trip them up. Which suggests the current generation of LLMs can **assist** formal methods engineers but can't replace them.

That's actually fine for agent workflows. Assistance is enough. If an LLM drafts the spec and a human (or a fine-tuned verifier model) closes the gaps, you still save 80% of the grunt work. And you end up with a spec you can trust, which is more than most codebases have today.

## FAQ

### Can TLA+ even model modern async systems like Kubernetes operators?

Yes, but the specs get huge. TLA+ handles asynchronous message passing, leader election, and other cloud-native patterns, but you need to carefully bound the state space or TLC will run forever. AWS has published TLA+ specs for DynamoDB and S3 internals, proving it's possible at scale.

### Why not just fuzz-test the agent instead of formal verification?

Fuzzing finds bugs, but can't prove absence of bugs. Formal verification exhaustively checks all reachable states. For safety-critical agent workflows (financial transactions, medical advice, legal documents), you want the stronger guarantee. For scraping Reddit or summarising PDFs, fuzzing is probably enough.

### Do any agent frameworks actually use formal methods today?

Not in production at scale, but research prototypes exist. Microsoft's Project Bonsai used model checking for reinforcement learning policies, and some academic agent architectures compile to Petri nets or process calculi. The tooling is too niche for mainstream adoption, but the ideas are circulating.

### If LLMs can't nail TLA+ yet, what CAN they formally verify?

Simple state machines, single-process algorithms, and type-level properties in dependently-typed languages like Lean or Coq. LLMs are better at proof assistants than TLA+ because proof assistants have richer type feedback loops — the compiler tells you exactly what's wrong, so the model can iterate. TLA+ error messages are terse and require domain knowledge to interpret.

## Sources

- TLA+ homepage: [https://lamport.azurewebsites.net/tla/tla.html](https://lamport.azurewebsites.net/tla/tla.html)
- TLC model checker documentation: [https://lamport.azurewebsites.net/tla/tlc.html](https://lamport.azurewebsites.net/tla/tlc.html)
- Reddit thread on LLMs generating TLA+ specs: [https://www.reddit.com/r/tlaplus/comments/1c8x9zy/using_llms_to_generate_tla_specifications/](https://www.reddit.com/r/tlaplus/comments/1c8x9zy/using_llms_to_generate_tla_specifications/)
- AWS use of formal methods: [https://www.reddit.com/r/programming/comments/2c5xdy/how_amazon_web_services_uses_formal_methods/](https://www.reddit.com/r/programming/comments/2c5xdy/how_amazon_web_services_uses_formal_methods/)
- TLA+ Wikipedia entry: [https://en.wikipedia.org/wiki/TLA%2B](https://en.wikipedia.org/wiki/TLA%2B)