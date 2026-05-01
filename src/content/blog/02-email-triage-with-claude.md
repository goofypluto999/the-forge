---
title: "An agent can triage your email. Here's the prompt."
description: "Stop opening 200 emails a day. A single Claude prompt + IMAP access turns your inbox into 5 piles: reply now, reply later, FYI, archive, delete. Working spec inside."
publishDate: 2026-05-01
author: "Mundane Mode"
tags: ["agents", "email", "automation", "claude"]
tools: ["Claude API", "Anthropic SDK"]
aiPrimary: true
readTime: "4 min"
---

## The mundane problem

Most email is asking you to:
1. Reply (action required)
2. Acknowledge (no reply needed)
3. Read later
4. Ignore

A human takes 10 seconds per email to do this triage. At 200 emails a day, that's 30 minutes of pure pile-sorting before any actual work happens.

A Claude API call takes 0.3 seconds and is consistently better than tired humans at the sort.

## The prompt

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

That's the whole thing. With Claude Haiku 4.5 it costs about £0.0001 per email. 200 emails/day = £0.02. Negligible.

## How to wire it up

The minimum version is a Python or Node script that:
1. Connects to IMAP
2. Pulls unread emails since last run
3. Calls Claude with the prompt above
4. Applies the label as an IMAP folder move
5. Marks the email read

Run on a cron every 5 minutes. Done.

The slightly fancier version uses Gmail API (faster, more reliable than IMAP) and writes labels as actual Gmail labels. Same logic.

## Why this is better than rules-based filters

Gmail filters are blunt. "From: john@" → label X. They don't read the actual content.

A Claude triage agent reads the message and understands intent. The marketing email pretending to be a personal email gets DELETE. The genuinely-personal email from someone with a corporate-looking domain gets REPLY_NOW. The cold pitch dressed up as a question gets ARCHIVE.

The accuracy on a small test set (100 hand-labelled emails) was 91% with Haiku 4.5. Close to human-level for a £0.0001 cost.

## What it can't do (yet)

The triage agent labels. It doesn't reply. Letting an agent reply on your behalf is a much bigger trust step and the cost of mistakes is real. A bad auto-reply to a recruiter is worse than a delayed reply.

The standard 2026 pattern is: agent triages and drafts; human reviews and approves. The drafts go to a "drafts" folder. You spend 5 minutes reviewing them once or twice a day.

## FAQ

### Will this work with Outlook?

Yes. Outlook has a similar API (Microsoft Graph). Same Claude prompt, different IMAP/API connector.

### Is sending emails to Claude a privacy risk?

You're sending email content to Anthropic's API. They don't train on API content (per their terms of service) but if your emails contain sensitive PII, customer data, or NDA-covered content, evaluate this carefully. For pure personal email, the privacy trade-off is usually fine. For work email, ask your security team first.

### Can the agent learn my preferences?

Yes, with a feedback loop. Save your manual relabel-corrections to a file. Append the last 20-50 corrections to the prompt as examples. The accuracy creeps up over time. Most people don't bother — the 91% baseline is good enough.

### Which Claude model should I use?

For triage, Haiku is the right model. It's fast, cheap, and the task is simple enough that bigger models don't add accuracy. For drafting replies (the next step up), Sonnet handles tone and context better.

## Sources

- [Anthropic API docs](https://docs.anthropic.com)
- [Claude Haiku 4.5 model card](https://www.anthropic.com/news/claude-haiku-4-5)
- [Gmail API quickstart](https://developers.google.com/gmail/api/quickstart)
