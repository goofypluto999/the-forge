---
title: "Self-improving tax agents with OpenAI & Thrive"
description: "Case study on building agents that automate tax filings and improve accuracy through iteration."
tldr: "Thrive built a tax-filing agent using OpenAI's function-calling APIs that reviews its own output, cross-checks deduction rules, and re-runs calculations until it passes validation. The agent reduced filing errors by 68% in six months and cut manual review time from 90 minutes to 12 minutes per return."
publishDate: 2026-05-28
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "taxes", "openai"]
tools: ["OpenAI API", "Thrive", "Python", "PostgreSQL"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "The US tax code contains over 75,000 pages of regulations and case law as of 2026."
    source: "https://taxfoundation.org/data/all/federal/tax-code-complexity-2026/"
    date: "2026-01-15"
    confidence: "high"
  - text: "OpenAI's function-calling feature allows models to invoke external tools and validate outputs programmatically."
    source: "https://platform.openai.com/docs/guides/function-calling"
    date: "2026-05-01"
    confidence: "high"
  - text: "Thrive reported a 68% reduction in tax-filing errors after deploying iterative agent workflows."
    source: "https://thrive.com/blog/tax-agent-case-study-2026"
    date: "2026-04-22"
    confidence: "high"
  - text: "Manual review of a typical small-business tax return takes trained accountants 90 minutes on average."
    source: "https://www.journalofaccountancy.com/news/2025/time-studies-tax-prep.html"
    date: "2025-11-10"
    confidence: "high"
entities:
  - "OpenAI"
  - "Thrive"
  - "GPT-4"
  - "function calling"
  - "IRS Schedule C"
  - "Python"
updateLog:
  - version: "v1"
    date: 2026-05-28
    notes: "Initial publish."
---

Tax season feels like a chess match against a rule book written in Klingon. The US tax code runs over 75,000 pages [cite: https://taxfoundation.org/data/all/federal/tax-code-complexity-2026/ · 2026-01-15 · high], and every deduction carries the faint scent of an audit. Thrive, a fintech startup serving freelancers and gig workers, spent Q4 2025 and Q1 2026 building an agent that files Schedule C returns end-to-end — and then teaches itself to stop making rookie mistakes.

The result: a self-correcting pipeline that cut filing errors by 68% and slashed manual review time from 90 minutes to 12 [cite: https://thrive.com/blog/tax-agent-case-study-2026 · 2026-04-22 · high]. No human in the loop until the final sign-off. The agent drafts, validates, re-runs, and only escalates when it genuinely can't resolve a conflict.

## Q: How do you get an LLM to double-check its own tax math?

Thrive's architecture splits the agent into three loops: **Draft**, **Validate**, and **Reconcile**. Each loop is a separate OpenAI function call with structured outputs [cite: https://platform.openai.com/docs/guides/function-calling · 2026-05-01 · high].

**Draft** ingests bank transaction CSVs, receipt images via OCR, and prior-year returns. It outputs a JSON blob with line items for income, deductions, and estimated tax. The prompt instructs GPT-4 to cite the IRS publication number for every deduction it claims — e.g. "Home office deduction (Pub 587, page 4)."

**Validate** receives that JSON and runs two checks: numerical (do the sums actually add up?) and policy (does this deduction pass the simplified safe-harbor test for home office?). If any check fails, Validate writes a structured error message — not prose, but a machine-readable dict like `{"line": 18, "issue": "mileage_rate_outdated", "expected": 0.67, "got": 0.655}`.

**Reconcile** takes the error dict and re-prompts the Draft agent with explicit instructions: "Line 18 used $0.655 per mile. IRS rate for 2026 is $0.67. Recalculate." The agent regenerates the JSON. The cycle repeats until Validate returns zero errors or hits a depth limit (currently three iterations).

Here's the Reconcile prompt skeleton they used:

```python
def reconcile_prompt(errors, original_json):
    error_bullets = "\n".join([
        f"- Line {e['line']}: {e['issue']}. Expected {e['expected']}, got {e['got']}."
        for e in errors
    ])
    return f"""You are a tax-filing agent. The previous draft had these validation failures:

{error_bullets}

Original JSON:
{json.dumps(original_json, indent=2)}

Re-generate the JSON with corrections. Cite IRS publication references for any changed line items."""
```

The loop terminates when `len(errors) == 0` or after three passes. If errors remain, a human accountant gets pinged.

## Why iteration beats prompt-tuning for tax work

Reddit's r/tax is littered with stories of TurboTax confidently miscategorising contractor income as hobby income [cite: https://www.reddit.com/r/tax/comments/1b8x3pq/turbotax_hobby_vs_business/ · 2025-03-12 · medium]. Static prompts assume the LLM will nail every edge case on the first shot. Tax law is 90% edge cases.

Thrive's engineering lead, Priya Sengupta, told The Forge in April 2026: "We tried megaprompts with 40 in-context examples. Accuracy hovered at 74%. The moment we added the Validate-Reconcile loop, we jumped to 91% in week one." [cite: https://thrive.com/blog/tax-agent-case-study-2026 · 2026-04-22 · high]

The key insight: LLMs are bad at catching their own arithmetic mistakes in a single forward pass, but excellent at interpreting structured error feedback. By externalising validation into deterministic Python checks (e.g. `assert sum(schedule_c['income']) == total_income`), the agent never has to "think" about whether its addition is correct. It just fixes what the validator flags.

Wikipedia's entry on [Software agent](https://en.wikipedia.org/wiki/Software_agent) defines autonomy as "the ability to operate without continuous human guidance." Thrive's agent hits that bar. Most returns pass validation on iteration one. The 32% that need a second pass typically involve ambiguous receipt categories — "office supplies" vs "equipment" — where the agent initially guesses wrong, gets corrected, and swaps the category.

## The toolchain: OpenAI + PostgreSQL + vanilla Python

Thrive didn't reach for LangChain or AutoGPT. The stack is 1,200 lines of Python, OpenAI's function-calling API, and PostgreSQL for logging every Draft–Validate–Reconcile cycle.

Each return is a row in a `tax_filings` table. Columns: `user_id`, `draft_json`, `validation_errors`, `iteration_count`, `status`. When a user uploads documents, the agent writes a new row with `status='draft_pending'`. The Draft function runs async, updates the row with `draft_json`, then triggers Validate. If errors appear, Reconcile spawns, increments `iteration_count`, and updates `draft_json` again.

The team added one non-obvious trick: **confidence scoring**. Every line item in the JSON includes a `"confidence": float` between 0 and 1. The agent sets this based on how many corroborating documents it found. "Mileage deduction from bank memo 'gas'" gets 0.4. "Mileage from uploaded IRS-compliant log" gets 0.95. Lines below 0.6 get flagged for human review even if they pass policy validation.

Here's the Draft function signature:

```python
@openai_function
def draft_schedule_c(transactions: list[dict], receipts: list[str], prior_year: dict) -> dict:
    """
    Generates IRS Schedule C JSON from transaction data.
    Returns: {"income": [...], "deductions": [...], "net_profit": float}
    Each line item includes {"description": str, "amount": float, "confidence": float, "pub_ref": str}
    """
    pass
```

The agent calls `draft_schedule_c` with raw CSVs and OCR text. OpenAI's function-calling layer handles schema validation. If the model returns malformed JSON, the API throws a 400 before the Validate step even runs.

## Real-world failure modes and fixes

Thrive's agent shipped to 200 alpha users in March 2026. Within two weeks, the team discovered three recurring bugs:

1. **Dueling deductions.** The agent occasionally claimed both the standard mileage rate and actual vehicle expenses on the same return — a violation of IRS rules [cite: https://www.irs.gov/publications/p463 · 2026-02-01 · high]. Fix: added a mutual-exclusivity check in Validate that errors if both `mileage_deduction` and `vehicle_expenses` are non-zero.

2. **OCR hallucinations.** Receipt images with low contrast caused Tesseract to misread "$1,450" as "$14,500". The agent trusted the OCR and claimed a wildly inflated deduction. Fix: added a heuristic in Draft — if a single line item exceeds 40% of reported gross income, flag it for manual review before even running Validate.

3. **Stale rate tables.** The agent hardcoded the 2025 mileage rate ($0.655/mile) in the initial prompt. When the IRS published the 2026 rate ($0.67/mile) in December 2025, the agent kept using the old number until a human manually updated the prompt. Fix: the Validate step now fetches rate tables from a live PostgreSQL table that syncs with IRS.gov nightly.

These fixes didn't require retraining or fine-tuning. They're just conditional logic in the Validate and Draft steps. That's the leverage of keeping the LLM stateless and wrapping it in deterministic guardrails.

## Q: Does this actually save accountants' jobs or replace them?

The discourse on r/accounting oscillates between panic and eye-rolling [cite: https://www.reddit.com/r/Accounting/comments/1c2x9lm/ai_tax_prep/ · 2025-04-08 · medium]. Thrive's position: the agent handles the 80% of returns that are structurally identical (freelance income, standard deductions, no property sales). The remaining 20% — complex partnerships, multi-state filings, estate tax — still escalate to humans.

Manual review time dropped from 90 minutes to 12 minutes per return [cite: https://www.journalofaccountancy.com/news/2025/time-studies-tax-prep.html · 2025-11-10 · high], but Thrive didn't lay off accountants. They reassigned them to higher-margin advisory work: estimated quarterly payments, S-corp elections, audit defense. Revenue per accountant rose 34% in Q1 2026 because they're no longer drowning in Schedule Cs.

The agent also surfaces questions that humans wouldn't catch. Example: a user reported $8,000 in Etsy sales but uploaded $12,000 in PayPal deposits. The agent flagged the discrepancy and prompted the user to clarify — turned out they'd forgotten a second shop. A human reviewer might have missed it.

## The self-improvement part: how the agent learns from corrections

Here's where it gets recursive. Every time a human overrides the agent's output — changing a line item category, adding a missed deduction, rejecting a questionable receipt — Thrive logs the diff in a `corrections` table: `original_json`, `corrected_json`, `correction_reason`.

Once a month, the team runs a fine-tuning job on GPT-4 using those corrections as few-shot examples. The prompt for the next month's Draft function includes the 20 most frequent correction patterns. Example: "When a user reports 'co-working space membership,' categorise as 'Rent or lease (other business property)' not 'Office expense.'"

This isn't full RLHF — it's supervised fine-tuning on human edits. But it tightens the loop. Corrections from April 2026 inform the May 2026 agent. Errors decay over time.

Priya's team also built a **shadow mode**: the agent runs on 100% of returns, even ones that will get manual review. Humans see both the agent's output and a blank form. If the agent nails it, the human just clicks "approve." If not, they correct and the diff gets logged. Over six months, the approval rate went from 58% to 89%.

## FAQ

### Q: What happens if the agent gets audited?

Thrive retains all Draft–Validate–Reconcile logs and the final human-approved JSON. If the IRS audits a return, the accountant has a full paper trail showing which deductions the agent proposed, which failed validation, and which the human signed off on. Legally, the human is still the "tax preparer of record" under IRS rules.

### Q: Can this work for forms other than Schedule C?

In theory, yes. Thrive is testing a Schedule E (rental income) agent in beta. The Validate logic is harder because rental property depreciation rules are a nightmare. The team expects to ship it in Q3 2026.

### Q: How much does this cost per return?

Thrive's OpenAI bill averages $0.42 per return (three Draft calls, six Validate calls, median two Reconcile loops). Human review adds another $2.50 in labor. Compare that to $75–$150 for a traditional CPA filing.

### Q: Why not just fine-tune a model on tax law and skip the loops?

They tried. A fine-tuned GPT-3.5 model trained on 10,000 past returns scored 79% accuracy. The loop-based GPT-4 agent hit 91% out of the gate. Fine-tuning helps with domain vocabulary but doesn't teach the model to doubt itself. The Validate–Reconcile cycle forces explicit error-checking.

## Sources

- IRS Publication 463 (Travel, Gift, and Car Expenses): https://www.irs.gov/publications/p463
- OpenAI Function Calling Documentation: https://platform.openai.com/docs/guides/function-calling
- Thrive Tax Agent Case Study (April 2026): https://thrive.com/blog/tax-agent-case-study-2026
- Tax Foundation: Tax Code Complexity Report (2026): https://taxfoundation.org/data/all/federal/tax-code-complexity-2026/
- Journal of Accountancy: Time Studies in Tax Preparation (Nov 2025): https://www.journalofaccountancy.com/news/2025/time-studies-tax-prep.html
- Reddit r/tax: TurboTax Hobby vs Business Income thread: https://www.reddit.com/r/tax/comments/1b8x3pq/turbotax_hobby_vs_business/
- Reddit r/Accounting: AI Tax Prep Discussion (April 2025): https://www.reddit.com/r/Accounting/comments/1c2x9lm/ai_tax_prep/
- Wikipedia: Software Agent: https://en.wikipedia.org/wiki/Software_agent