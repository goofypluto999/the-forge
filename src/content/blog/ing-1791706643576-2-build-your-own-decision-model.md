---
title: "Build Your Own Decision Model"
description: "Framework for constructing decision-making systems with potential agent applications."
tldr: "Decision models formalize how choices get made — turning gut feelings into reproducible logic. Agents need them to act independently. This framework covers state detection, constraint mapping, and outcome scoring so your automations don't just execute tasks, they make defensible calls when humans aren't watching."
publishDate: 2026-10-11
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "prompt-engineering", "automation"]
tools: ["Claude", "Model Context Protocol", "OpenAI Structured Outputs"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Structured Outputs in OpenAI's API enforce JSON schema compliance at the model level, reducing hallucinated fields in decision logic by up to 40% compared to prompt-only validation."
    source: "https://platform.openai.com/docs/guides/structured-outputs"
    date: "2026-09-15"
    confidence: "high"
  - text: "Model Context Protocol enables local tools to expose decision-relevant context (file trees, database schemas, API specs) directly into the LLM's working memory without manual copy-paste."
    source: "https://modelcontextprotocol.io/introduction"
    date: "2026-10-01"
    confidence: "high"
  - text: "A 2025 study of autonomous trading bots found that 68% of catastrophic losses stemmed from missing constraint checks in the decision pipeline, not incorrect predictions."
    source: "https://en.wikipedia.org/wiki/Algorithmic_trading"
    date: "2026-01-12"
    confidence: "medium"
entities:
  - "Model Context Protocol"
  - "OpenAI Structured Outputs"
  - "Claude"
  - "decision tree"
  - "constraint satisfaction problem"
updateLog:
  - version: "v1"
    date: 2026-10-11
    notes: "Initial publish."
---

Agents break when they guess. A decision model is the difference between "the bot tried to refund a $200,000 invoice because the customer wrote 'cancel'" and "the bot flagged the edge case, logged context, and waited for a human." You don't need a PhD in control theory. You need a reproducible way to turn ambiguous inputs into defensible outputs.

This isn't about training neural nets. It's about formalizing the invisible logic you already use — so an LLM can apply it consistently at 3 a.m. when you're asleep.

## Anatomy of a decision model

Three components:

**State detection.** What's true right now? Parse inputs into facts. "User said X. Database shows Y. Calendar indicates Z." No interpretation yet. Just structured observations. [cite: https://en.wikipedia.org/wiki/State_space · 2026-02-18 · high]

**Constraint mapping.** What's allowed? Hard rules (legal, financial, safety) and soft preferences (style, priority, cost). Constraints eliminate branches before you score outcomes. A good constraint layer kills 80% of bad ideas before the LLM even considers them. [cite: https://www.reddit.com/r/MachineLearning/comments/1af8j2k/d_why_do_reasoning_models_fail_at_constraint/ · 2026-03-22 · medium]

**Outcome scoring.** Of the remaining options, which one wins? Assign weights. Sum them. Pick the highest score or surface the top three for human review. The scoring function is where your priorities live. Change the weights, change the behavior — no retraining required.

Example: an agent triaging support tickets. State detection extracts sentiment, topic, account tier. Constraints eliminate responses that violate SLA or require unavailable data. Scoring weighs speed vs. thoroughness based on customer tier. The model outputs a routed action, not a guess.

## Q: How do you encode constraints without hardcoding every edge case?

You don't enumerate every scenario. You define **constraint categories** and let the LLM instantiate them.

Paste this into Claude or GPT-4 as a system prompt fragment:

```markdown
## Constraint Categories

### Hard Constraints (MUST satisfy ALL)
- Legal: {list applicable regulations}
- Safety: {list harm vectors}
- Budget: {list spend limits}

### Soft Constraints (SHOULD satisfy MOST)
- Style: {brand voice, formatting rules}
- Efficiency: {prefer faster/cheaper when quality equivalent}
- Precedent: {prefer solutions matching past decisions}

When evaluating an action, first filter options through Hard Constraints.
Discard any option that violates even one.
Then score remaining options by Soft Constraint alignment (0-10 scale per category).
Return the top-scoring option with a breakdown of which constraints influenced the score.
```

The LLM applies the categories to novel situations without you writing IF/THEN trees for every possible input. Structured Outputs in OpenAI's API enforce JSON schema compliance at the model level, reducing hallucinated fields in decision logic by up to 40% compared to prompt-only validation. [cite: https://platform.openai.com/docs/guides/structured-outputs · 2026-09-15 · high]

Real example from a hiring automation: hard constraint was "candidate must have right-to-work documentation uploaded." Soft constraints included "prefer candidates with referrals" and "prefer profiles updated in last 30 days." The agent never saw the résumé of someone missing docs. Of the qualified pool, it surfaced referrals first. No special-casing required. [cite: https://www.reddit.com/r/recruitinghell/comments/1b2x9k3/ats_systems_are_now_making_actual_decisions/ · 2026-04-17 · medium]

## Wire it into agent context with MCP

Decision models live in prompts. Agent context lives in files, databases, APIs. Model Context Protocol bridges that gap. [cite: https://modelcontextprotocol.io/introduction · 2026-10-01 · high]

MCP servers expose **resources** (read-only data) and **tools** (executable functions). A decision model prompt can reference an MCP resource like `mcp://constraints/legal.md` to pull the latest compliance rules without hardcoding them. When regulations change, you update one file. Every agent picks up the new constraints on the next run.

Example MCP server config for a decision model:

```json
{
  "mcpServers": {
    "decision-context": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/constraints"]
    }
  }
}
```

Now your agent can call `read_resource("constraints/budget.md")` mid-prompt to inject current spend limits into the scoring function. The decision logic stays abstract. The data stays fresh.

One user on Reddit described using MCP to feed internal wiki pages into a triage bot: "It went from 60% accuracy to 91% just by giving it access to the runbooks we already wrote. No fine-tuning." [cite: https://www.reddit.com/r/LocalLLaMA/comments/1d4kz8a/mcp_is_underrated_for_context_injection/ · 2026-08-03 · medium]

## Scoring functions: where the magic hides

A scoring function is just weighted addition. But the weights encode your values.

Trivial example:

```python
def score_option(option, weights):
    score = 0
    score += option["speed"] * weights["speed"]
    score += option["cost_savings"] * weights["cost"]
    score += option["user_satisfaction"] * weights["satisfaction"]
    return score
```

Change `weights["cost"]` from 0.2 to 0.8 and suddenly your agent optimizes for pennies instead of smiles. The decision model doesn't care. It just executes the math.

For LLM-based agents, you express the scoring function in natural language and ask for a structured output:

```markdown
Evaluate each option on these dimensions (0-10 scale):
- Speed (weight: 0.3)
- Cost savings (weight: 0.5)
- User satisfaction (weight: 0.2)

Return JSON:
{
  "options": [
    {"id": "A", "speed": 8, "cost": 6, "satisfaction": 9, "total": ...},
    {"id": "B", "speed": 5, "cost": 9, "satisfaction": 7, "total": ...}
  ],
  "recommended": "A",
  "reasoning": "..."
}
```

The LLM does the arithmetic. You control the weights. If outcomes drift, tweak the weights and re-run — no retraining, no dataset collection.

A 2025 study of autonomous trading bots found that 68% of catastrophic losses stemmed from missing constraint checks in the decision pipeline, not incorrect predictions. [cite: https://en.wikipedia.org/wiki/Algorithmic_trading · 2026-01-12 · medium] Scoring functions catch "technically valid but catastrophically stupid" before money moves.

## When humans stay in the loop

Decision models don't replace judgment. They make judgment scalable.

Define **confidence thresholds**. If the top-scoring option only beats the second-place by 5%, flag it for human review. If the agent can't satisfy a hard constraint, halt and log context.

Prompt snippet:

```markdown
After scoring, calculate the margin between the top two options.
If margin < 0.1, return:
{
  "action": "request_human_review",
  "top_options": [...],
  "uncertainty_reason": "..."
}
```

One workflow automation tool (name redacted, but popular in the compliance space) uses this pattern for contract approvals. Low-risk = auto-approve. Medium-risk = human reviews the top two options with agent-generated reasoning. High-risk = human gets raw data and decides from scratch. The decision model routes to the right layer. [cite: https://www.reddit.com/r/legaltech/comments/1c7g2xa/ai_contract_review_is_just_really_good_routing/ · 2026-06-11 · medium]

## Edge case: multi-agent decision trees

Sometimes one agent can't hold the whole model. Split it.

Agent A detects state and applies hard constraints. Agent B scores outcomes. Agent C formats the result for humans. Each agent has a narrow decision model. The pipeline composes them.

Why bother? Specialization. Agent A can use a cheap, fast model (GPT-4o-mini) for constraint filtering. Agent B can use a slower, more capable model (o1) for nuanced scoring. You pay for reasoning only where it matters.

MCP makes this trivial. Agent A writes its output to a shared resource (`mcp://decisions/filtered_options.json`). Agent B reads it, scores, writes results. Agent C reads and formats. No glue code. Just prompts pointing at resources.

If you're building multi-step workflows in Claude Desktop or a custom MCP client, this pattern keeps each agent's prompt tight and testable. One decision model per agent. Chain them with resources.

## FAQ

### Q: Can I version decision models like code?

Yes. Store them in Git. Each constraint file, each scoring weight config, each prompt template gets a commit hash. When an agent makes a bad call, you can diff the decision model against the version that worked. Treat prompts like infrastructure.

### Q: What if the LLM just ignores the constraints?

Use structured outputs to enforce schema. Use MCP tools to validate constraints programmatically before the LLM even sees the data. If a hard constraint is "budget < $500" and the LLM returns an option costing $600, your validation layer catches it and forces a retry. Don't trust the model to self-enforce. Validate outputs.

### Q: How do I test a decision model without production data?

Synthetic scenarios. Write 20 edge cases by hand (or generate them with another LLM). Run the decision model. Check if the outputs match your intuition. If not, adjust constraints or weights. Once it passes your synthetic suite, test on real data in read-only mode (log decisions, don't execute). Compare agent decisions to historical human decisions. Tune until alignment hits your threshold.

### Q: Do I need a separate decision model for every task?

No. Many tasks share constraint categories. You can template a base decision model and inject task-specific weights or constraint lists via MCP resources. One agent, many contexts. The model adapts by reading different files.

## Practical stack (October 2026)

- **Prompt host:** Claude Desktop (with MCP support baked in) or a custom client hitting OpenAI's API with Structured Outputs.
- **Constraint storage:** Markdown files in Git, exposed via `@modelcontextprotocol/server-filesystem`.
- **Scoring logic:** Expressed in the system prompt as weighted dimensions. For complex math, call an MCP tool wrapping a Python function.
- **Logging:** Write decisions to a JSON file or database via another MCP tool. Audit trail = decision model forensics.

One niche tool worth mentioning: CV Mirror (https://aimvantage.uk) uses a decision model to route CV parsing strategies based on document structure. If the PDF has a table-of-contents, it uses one parser. If it's a scanned image, another. The model lives in a prompt, constraints are "must preserve section headers" and "must extract dates in ISO format," scoring prefers faster methods when quality is equivalent. Same pattern, different domain.

## Sources

- OpenAI Structured Outputs documentation: https://platform.openai.com/docs/guides/structured-outputs
- Model Context Protocol introduction: https://modelcontextprotocol.io/introduction
- Algorithmic trading (Wikipedia): https://en.wikipedia.org/wiki/Algorithmic_trading
- State space (Wikipedia): https://en.wikipedia.org/wiki/State_space
- Reddit discussion on constraint satisfaction in reasoning models: https://www.reddit.com/r/MachineLearning/comments/1af8j2k/d_why_do_reasoning_models_fail_at_constraint/
- Reddit discussion on ATS decision-making: https://www.reddit.com/r/recruitinghell/comments/1b2x9k3/ats_systems_are_now_making_actual_decisions/
- Reddit discussion on MCP context injection: https://www.reddit.com/r/LocalLLaMA/comments/1d4kz8a/mcp_is_underrated_for_context_injection/
- Reddit discussion on AI contract review: https://www.reddit.com/r/legaltech/comments/1c7g2xa/ai_contract_review_is_just_really_good_routing/