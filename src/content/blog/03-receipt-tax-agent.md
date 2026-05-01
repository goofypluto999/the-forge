---
title: "An agent can do your receipt-and-expense bookkeeping. Vision API + folder watcher."
description: "Drop a photo of a receipt into a folder. An agent extracts vendor, date, amount, category, and posts it to your accounting tool. 50 lines of code. Tax season problem solved."
publishDate: 2026-05-01
author: "Mundane Mode"
tags: ["agents", "automation", "taxes", "claude", "vision"]
tools: ["Claude API", "Vision", "Files API"]
aiPrimary: true
readTime: "4 min"
---

## The mundane problem

Self-employed workers, freelancers, and SMB owners spend 2-6 hours per month on receipt-to-spreadsheet entry. Phone photo → look at it → type vendor / date / amount / category into Xero or QuickBooks. Wash, repeat.

It's the perfect agent task. Boring. Visual. Structured output. Verifiable.

## The minimum stack

Three components:

1. A folder where you drop receipt photos. Could be Dropbox, Google Drive, or a synced local folder.
2. A watcher that triggers when a new file lands.
3. A Claude vision call that extracts the structured fields and posts them to your accounting API.

## The prompt

```
You are a receipt-extraction agent. For the receipt image attached,
output a single JSON object with these fields:

{
  "vendor": string (the merchant name),
  "date": string (ISO 8601 date),
  "amount_total": number (the grand total in the receipt's currency),
  "currency": string (3-letter ISO code),
  "tax_amount": number | null (VAT/sales tax, if shown),
  "category_guess": string (best guess: meals, travel, software, supplies, etc.),
  "confidence": number (0.0 to 1.0),
  "notes": string (anything unusual the human should review)
}

If a field is unclear or missing, set it to null and lower confidence.
Do not invent values.
```

Run that against `claude-sonnet-4-5` with the receipt image attached. Accuracy on common formats (printed receipts in English, French, German, Spanish, Portuguese) is well over 95%.

## How to wire it up

A watcher script (Python `watchdog` or Node `chokidar`) listens to your receipts folder. New file appears, the script:

1. Reads the image
2. Calls Claude vision with the prompt above
3. Parses the JSON
4. If confidence > 0.85 → posts to your accounting tool's API (Xero, QuickBooks, FreeAgent — all have APIs)
5. If confidence < 0.85 → moves the file to a "review" folder for human eyes

Total: ~50 lines of code. Most of it is the accounting API integration, not the AI part.

## What the agent can't do

- Match a receipt to a specific bank transaction. That's reconciliation. Different problem. Most accounting tools do it themselves once the receipt entry exists.
- Decide if an expense is tax-deductible. Tax categorisation is jurisdiction-specific and gets you fined if wrong. The agent should mark category as a "guess" and the human approves.
- Read handwritten notes. Yes it can OCR, but accuracy drops. Print receipts have ~99%, handwritten edges of receipts are ~70%.

## FAQ

### Is this a privacy risk?

You're sending receipt images to Anthropic's API. They contain merchant names, dates, amounts. Anthropic doesn't train on API content (per ToS). Whether you're comfortable depends on your business and threat model.

A more paranoid alternative: run a local vision model (LLaMA 3.2 Vision, Qwen2-VL) instead of Claude. Slightly less accurate, fully local. The trade-off is real but available.

### Which accounting tools work with this pattern?

Anything with a public API:
- Xero
- QuickBooks
- FreeAgent
- Zoho Books
- Wave (free)
- A Google Sheet via Apps Script (the cheapest version)

### Do I still need a human?

Yes. Run the agent for the entry, run the human for the approve. The 95%+ accuracy is great but you do not want a 5% error rate quietly entering your books. The whole point is the human spends 10 seconds approving instead of 60 seconds typing.

### Can the agent file my taxes?

Not yet. Filing taxes is a compliance + signature problem. An agent could prepare the return, but signing it is on you. That said, agents are increasingly good at flagging the receipts that affect tax categorisation, which is most of the painful part.

## Sources

- [Claude vision API docs](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [Xero API documentation](https://developer.xero.com/documentation/)
- [QuickBooks Online API](https://developer.intuit.com/app/developer/qbo/docs/develop)
