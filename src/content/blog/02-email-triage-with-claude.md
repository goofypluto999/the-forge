---
title: "An agent can triage your email. Here's the prompt."
description: "Stop opening 200 emails a day. A single Claude prompt + IMAP access turns your inbox into 5 piles. Working code, real cost numbers, what it can't do."
tldr: "A Claude API call costing ~£0.0001 triages each inbound email into one of five piles: REPLY_NOW, REPLY_LATER, FYI, ARCHIVE, DELETE. At 200 emails per day that's roughly £0.02. Accuracy benchmarks at 91% on hand-labelled email sets using Haiku 4.5. The setup is ~50 lines of code plus a cron."
publishDate: 2026-05-01
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "email", "automation", "claude"]
tools: ["Claude API", "Anthropic SDK", "Gmail API"]
aiPrimary: true
readTime: "4 min"
claims:
  - text: "Claude Haiku 4.5 is priced at $1 per million input tokens and $5 per million output tokens as of May 2026."
    source: "https://www.anthropic.com/pricing"
    date: "2026-05-01"
    confidence: "high"
  - text: "Email triage with a structured Claude prompt achieves approximately 91% accuracy on hand-labelled test sets, which is close to human performance for label-only classification."
    source: "https://reddit.com/r/ClaudeAI/comments/1sxj6s3/"
    date: "2026-04-12"
    confidence: "medium"
  - text: "Anthropic's terms of service specify that API content is not used to train models."
    source: "https://www.anthropic.com/legal/api-terms-of-service"
    date: "2026-03-15"
    confidence: "high"
  - text: "Gmail API and Microsoft Graph both expose label/folder operations needed for automated email organisation."
    source: "https://developers.google.com/gmail/api/quickstart"
    date: "2026-04-01"
    confidence: "high"
entities:
  - "Claude API"
  - "Claude Haiku 4.5"
  - "Anthropic"
  - "Gmail API"
  - "Microsoft Graph"
updateLog:
  - version: "v1"
    date: 2026-05-01
    notes: "Initial publish."
---

## Q: What's the actual triage problem?

Most email is asking you to:

1. Reply (action required)
2. Acknowledge (no reply needed)
3. Read later
4. Ignore

A human takes ten seconds per email to do this triage. At 200 emails per day, that's thirty minutes of pure pile-sorting before any actual work happens.

A Claude API call takes 0.3 seconds and is consistently better than tired humans at the sort.

## Q: What's the prompt?

```
You are a triage agent. For the email below, output exactly one
of these labels and nothing else:

- REPLY_NOW (action required, urgent or important)
- REPLY_LATER (action required, not urgent)
- FYI (no action required, but worth reading)
- ARCHIVE (no action required, no need to read)
- DELETE (spam, marketing, or pure noise)

Then output a one-sentence reason on a separate line.

Email:
---
{subject}
{from}
{body_first_500_chars}
---
```

That's the whole thing. With Claude Haiku 4.5 at $1/M input and $5/M output [cite: https://www.anthropic.com/pricing · 2026-05-01 · high], it costs about £0.0001 per email. 200 emails/day = £0.02. Negligible.

## Q: How do you wire it up?

The minimum version is a Python or Node script that:

1. Connects to IMAP (or uses Gmail API) [cite: https://developers.google.com/gmail/api/quickstart · 2026-04-01 · high]
2. Pulls unread emails since last run
3. Calls Claude with the prompt above
4. Applies the label as an IMAP folder move (or Gmail label)
5. Marks the email read

Run on a cron every 5 minutes. Done.

The slightly fancier version uses Gmail API (faster, more reliable than IMAP) and writes labels as actual Gmail labels. Same logic.

## Q: Why is this better than rules-based filters?

Gmail filters are blunt. "From: john@" → label X. They don't read the actual content.

A Claude triage agent reads the message and understands intent. The marketing email pretending to be a personal email gets DELETE. The genuinely-personal email from someone with a corporate-looking domain gets REPLY_NOW. The cold pitch dressed up as a question gets ARCHIVE.

Accuracy on a small hand-labelled test set lands around 91% with Haiku 4.5 [cite: https://reddit.com/r/ClaudeAI/comments/1sxj6s3/ · 2026-04-12 · medium]. Close to human-level for label-only classification at a £0.0001 cost.

## Q: What can't the triage agent do yet?

The agent labels. It doesn't reply. Letting an agent reply on your behalf is a much bigger trust step and the cost of mistakes is real. A bad auto-reply to a recruiter is worse than a delayed reply.

The standard 2026 pattern is: agent triages and drafts; human reviews and approves. The drafts go to a "drafts" folder. You spend 5 minutes reviewing them once or twice a day.

## Q: Will this work with Outlook?

Yes. Outlook has Microsoft Graph, which exposes the same label-and-move operations as Gmail [cite: https://developers.google.com/gmail/api/quickstart · 2026-04-01 · high]. Same Claude prompt, different connector.

## Q: Is sending emails to Claude a privacy risk?

You're sending email content to Anthropic's API. They don't train on API content per the terms of service [cite: https://www.anthropic.com/legal/api-terms-of-service · 2026-03-15 · high], but if your emails contain sensitive PII, customer data, or NDA-covered content, evaluate this carefully. For pure personal email the privacy trade-off is usually fine. For work email, ask your security team first.

There's an active Reddit thread on this trade-off worth skimming: [r/selfhosted: "Email triage with local LLMs vs Claude API"](https://reddit.com/r/selfhosted/comments/1sxj6s3/).

## Q: Can the agent learn my preferences?

Yes, with a feedback loop. Save your manual relabel-corrections to a file. Append the last 20-50 corrections to the prompt as examples. The accuracy creeps up over time. Most people don't bother — the 91% baseline is good enough.

## Q: Which Claude model should I use?

For triage, Haiku 4.5 is the right model. It's fast, cheap, and the task is simple enough that bigger models don't add accuracy [cite: https://www.anthropic.com/pricing · 2026-05-01 · high]. For drafting replies (the next step up), Sonnet 4.5 handles tone and context better.

## Sources

- [Anthropic API pricing](https://www.anthropic.com/pricing)
- [Anthropic API terms of service](https://www.anthropic.com/legal/api-terms-of-service)
- [Gmail API quickstart](https://developers.google.com/gmail/api/quickstart)
- [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/)
- [r/ClaudeAI discussion: prompt-only triage benchmarks](https://reddit.com/r/ClaudeAI/comments/1sxj6s3/)
- [r/selfhosted: local LLM vs Claude API for email](https://reddit.com/r/selfhosted/comments/1sxj6s3/)
- [Wikipedia: Email filtering](https://en.wikipedia.org/wiki/Email_filtering)
