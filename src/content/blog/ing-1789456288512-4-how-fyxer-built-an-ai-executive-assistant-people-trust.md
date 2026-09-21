---
title: "How Fyxer built an AI executive assistant people trust"
description: "Fyxer's approach to email triage and composition using fine-tuning, memory, and voice-matching shows production patterns for agent UX."
tldr: "Fyxer deployed an AI executive assistant that drafts emails, triages inboxes, and learns user voice without hallucinating commitments. The team fine-tuned Anthropic models on anonymised corporate email, layered in PostgreSQL memory, and built explicit consent flows for every outbound send. Users report 40% time savings on email; the agent never schedules a meeting or promises deliverables without human approval."
publishDate: 2026-09-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "email", "productivity"]
tools: ["Fyxer", "Claude", "PostgreSQL"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Fyxer fine-tuned Claude models on anonymised corporate email corpora to match user voice and organisational tone."
    source: "https://www.fyxer.ai/blog/training-assistant-voice"
    date: "2026-08-22"
    confidence: "high"
  - text: "Early beta users reported a 40% reduction in time spent on email triage and composition during the first month of deployment."
    source: "https://techcrunch.com/2026/09/fyxer-executive-assistant-launch"
    date: "2026-09-10"
    confidence: "high"
  - text: "The Fyxer architecture uses PostgreSQL to store user preferences, past decisions, and email metadata for context retrieval."
    source: "https://www.fyxer.ai/docs/architecture"
    date: "2026-09-01"
    confidence: "high"
  - text: "Anthropic released Claude 3.7 Opus in July 2026 with improved instruction-following for enterprise use cases."
    source: "https://www.anthropic.com/news/claude-3-7-opus"
    date: "2026-07-18"
    confidence: "high"
  - text: "Reddit users in r/productivity frequently cite accidental meeting scheduling and over-commitment as the top failure mode of email agents."
    source: "https://www.reddit.com/r/productivity/comments/1f8k3j2/why_i_turned_off_my_ai_email_assistant/"
    date: "2026-08-30"
    confidence: "medium"
entities:
  - "Fyxer"
  - "Claude 3.7 Opus"
  - "PostgreSQL"
  - "Anthropic"
  - "executive assistant agents"
updateLog:
  - version: "v1"
    date: 2026-09-15
    notes: "Initial publish."
---

Executive assistants live or die on trust. You hand them your calendar, your inbox, your reputation. If they double-book you or promise a deliverable you can't hit, the relationship ends. Fyxer spent eighteen months figuring out how to build that trust into an AI agent that drafts emails, triages threads, and learns your voice without hallucinating commitments or scheduling phantom meetings [cite: https://techcrunch.com/2026/09/fyxer-executive-assistant-launch · 2026-09-10 · high].

The product launched in beta last month. Early users report 40% time savings on email [cite: https://techcrunch.com/2026/09/fyxer-executive-assistant-launch · 2026-09-10 · high]. The agent never schedules a meeting or promises deliverables without human approval. It drafts responses that sound like you wrote them, pulls context from past threads, and flags high-priority messages before you open your inbox. This is what production-grade agent UX looks like when the team designing it actually understands the failure modes.

## Fine-tuning on voice, not vibes

Fyxer fine-tuned Claude 3.7 Opus on anonymised corporate email corpora to match user voice and organisational tone [cite: https://www.fyxer.ai/blog/training-assistant-voice · 2026-08-22 · high]. Not sentiment. Not "professional" vs. "casual". Actual syntactic fingerprints: sentence length distribution, conjunction preference, signoff style, em-dash frequency (or lack thereof). The model ingests your sent folder during onboarding, extracts structural patterns, and learns to draft in your register.

This is not prompt-engineered mimicry. Anthropic released Claude 3.7 Opus in July 2026 with improved instruction-following for enterprise use cases [cite: https://www.anthropic.com/news/claude-3-7-opus · 2026-07-18 · high], but instruction-following alone doesn't replicate the way you open a difficult conversation or soften a no. Fine-tuning does. The Fyxer team built a supervised training loop that anonymises email text, labels structural features (greeting formality, hedging language, directness level), and feeds those examples back into the model [cite: https://www.fyxer.ai/blog/training-assistant-voice · 2026-08-22 · high].

The result: drafts that pass the "did I write this?" test. Users in the private beta Slack described the output as "eerie" and "disturbingly accurate" [cite: https://www.reddit.com/r/SaaS/comments/1f9m2k1/fyxer_beta_first_impressions/ · 2026-09-05 · medium]. One VP of sales wrote, "I had to check the sent folder twice because I genuinely could not remember if I'd written the email myself." That's the bar.

## Memory architecture: PostgreSQL, not vibes

The Fyxer architecture uses PostgreSQL to store user preferences, past decisions, and email metadata for context retrieval [cite: https://www.fyxer.ai/docs/architecture · 2026-09-01 · high]. Every time you approve a draft, reject a suggestion, or manually edit a response, the agent logs the decision. Over time, it learns which vendors you deprioritise, which subject lines warrant immediate attention, which colleagues get three-sentence replies vs. one-line acknowledgments.

This is not RAG over an embedding store. It's structured decision history. The schema tracks email sender, subject pattern, user action (approved / edited / rejected), timestamp, and a freeform notes field. When a new email arrives, the agent queries this table for similar sender domains, subject keywords, and prior outcomes. If you've ignored three consecutive emails from a specific mailing list, the agent flags future messages as low-priority without asking [cite: https://www.fyxer.ai/docs/architecture · 2026-09-01 · high].

The memory layer also handles what the team calls "delegation hygiene". If you've previously told the agent to decline all meeting requests before 9am, that rule persists. If you've set a preference to CC your manager on client communications, the agent pre-populates the CC field. The system doesn't infer these rules from vibes. It asks, logs the answer, and applies it consistently.

Here's a simplified version of the decision-logging query the agent runs after each email interaction:

```sql
INSERT INTO email_decisions (
  user_id,
  sender_domain,
  subject_pattern,
  action_taken,
  notes,
  created_at
) VALUES (
  $1,
  extract_domain($2),
  extract_keywords($3),
  $4,
  $5,
  NOW()
);
```

The `extract_domain` and `extract_keywords` functions are custom Postgres extensions that normalise sender addresses and tokenise subject lines. The agent queries this table every time it drafts a response or triages a new thread.

## Q: Why explicit consent flows for every outbound send?

Because Reddit users in r/productivity frequently cite accidental meeting scheduling and over-commitment as the top failure mode of email agents [cite: https://www.reddit.com/r/productivity/comments/1f8k3j2/why_i_turned_off_my_ai_email_assistant/ · 2026-08-30 · medium]. The complaint is always the same: the agent scheduled a call you didn't have capacity for, promised a deliverable you couldn't hit, or accepted an invitation you needed to decline.

Fyxer solved this by making every outbound action a two-step flow. The agent drafts. You approve. No auto-send. No "learn from my behaviour and start sending on my behalf after two weeks". The UI surfaces the draft in a side panel with three buttons: Send, Edit, Reject. If you edit, the agent logs the diff and updates its voice model. If you reject, it logs the reason (optional freeform field) and adjusts future triage.

The team experimented with an auto-send mode during internal testing. It broke trust within forty-eight hours. Engineers reported that the agent had accepted a conference speaking slot without checking availability, replied "sounds good" to a vendor quote that was 3x budget, and scheduled a 6am meeting with a colleague in Sydney (the engineer was in London and had not configured timezone preferences). The auto-send branch was deleted the same day [cite: https://www.reddit.com/r/SaaS/comments/1f9m2k1/fyxer_beta_first_impressions/ · 2026-09-05 · medium].

Explicit consent is not a training-wheels feature. It's the product. If you want an agent that sends email on your behalf with zero oversight, Fyxer is not the tool. If you want an agent that writes better drafts than you do and learns from every correction, this is the shape.

## Voice-matching in practice

The voice model learns from corrections, not just approvals. If you edit a draft to soften a "no" or rephrase a request, the agent extracts the structural diff and updates its fine-tuning weights [cite: https://www.fyxer.ai/blog/training-assistant-voice · 2026-08-22 · high]. This is continuous learning, not batch retraining. The model ingests feedback in real time and applies it to the next draft.

Example: a user in the beta cohort consistently edited greetings from "Hi [Name]," to "Hey [Name],". After three edits, the agent switched default greeting style for all future drafts to that recipient. Another user always added a one-sentence personal note before jumping into business ("Hope the launch went well."). The agent started pre-populating that structure after observing the pattern five times [cite: https://www.reddit.com/r/SaaS/comments/1f9m2k1/fyxer_beta_first_impressions/ · 2026-09-05 · medium].

This is not GPT-4 with a system prompt telling it to "write like the user". It's a fine-tuned model that has seen your structural patterns, extracted salient features, and adjusted output distribution accordingly. The difference shows up in edge cases. When you're writing a difficult email (rejecting a candidate, declining a partnership, pushing back on a deadline), the agent doesn't default to corporate boilerplate. It matches your actual conflict-avoidance style, hedging frequency, and apology-to-directness ratio.

## Triage rules and priority scoring

Fyxer's triage engine scores every incoming email on three dimensions: urgency (deadline language, sender seniority), relevance (project keywords, ongoing thread context), and sentiment (complaint indicators, escalation language). The score determines placement in the daily digest: top section (immediate attention), middle section (review today), bottom section (archive or defer) [cite: https://www.fyxer.ai/docs/architecture · 2026-09-01 · high].

The urgency model flags phrases like "by EOD", "ASAP", "following up", and cross-references sender role (CEO > manager > peer > vendor). The relevance model queries the PostgreSQL decision log for similar threads and checks calendar context (if you have a meeting with the sender tomorrow, relevance score doubles). The sentiment model detects escalation language ("third time reaching out", "disappointed to see", "escalating to [Name]") and surfaces those threads regardless of other scores.

Users can override triage rules per sender or subject pattern. If you want all emails from a specific client to bypass scoring and land in the top section, you set that rule once and the agent applies it indefinitely. If you want all LinkedIn notifications archived without review, same deal.

The digest format is plain text, delivered via email at 7am local time. It looks like this:

```
HIGH PRIORITY (3)
- Re: Q4 budget approval (CFO, mentions "board meeting Friday")
- Contract redlines from Acme Corp (legal, due Thursday)
- Escalation: broken staging environment (eng lead, third ping)

REVIEW TODAY (7)
- Partnership proposal from [Vendor] (sales, low urgency)
- Invitation: webinar on [Topic] (marketing, optional)
...

DEFERRED (12)
- Weekly newsletter from [Company]
- Calendar invite: all-hands next month
...
```

You click through to approve drafts, edit responses, or mark threads as resolved. The agent logs every action and adjusts future scoring.

## What other tools are trying (and where they fail)

Superhuman added an AI triage feature in May 2026 that categorises email into "important", "FYI", and "can wait" buckets [cite: https://superhuman.com/blog/ai-triage-launch · 2026-05-14 · high]. It's fine. It works. But it doesn't draft responses, doesn't learn your voice, and doesn't log decision history for future context. It's a filter, not an assistant.

Shortwave shipped an AI compose feature in June 2026 that generates replies from prompts [cite: https://www.shortwave.com/blog/ai-compose · 2026-06-08 · high]. You type "decline this meeting", it writes the email. Also fine. Also not an assistant. The model doesn't remember that you prefer "unfortunately I'm unavailable" over "I can't make it". It doesn't pre-populate your manager in the CC field. It doesn't flag similar threads from the same sender.

Vantage AI offers a job-application agent (CV Mirror) that drafts cover letters and tailors CVs for specific roles [cite: https://aimvantage.uk · 2026-09-01 · medium]. Different use case, but similar voice-matching challenge. The agent fine-tunes on user writing samples and learns phrasing preferences over time. Worth checking if you're in job-search mode and want application materials that don't sound like GPT slop.

The pattern across all these tools: voice-matching requires fine-tuning, not prompting. Memory requires structured storage, not vibes. Trust requires explicit consent, not auto-send. Fyxer is the first production email agent that ships all three.

## FAQ

### How long does onboarding take?

Fyxer onboarding takes about twenty minutes. You connect your Gmail or Outlook account via OAuth, grant read/send permissions, and let the agent ingest your sent folder (last 500 emails). The voice model trains overnight. You start getting drafts the next morning [cite: https://www.fyxer.ai/docs/setup · 2026-09-01 · high].

### Does it work with non-English email?

Yes. The fine-tuning pipeline supports fifteen languages, including Mandarin, Spanish, French, and German. Voice-matching quality depends on the size of your sent folder. If you've sent fewer than 200 emails in the target language, the model defaults to a generic "professional" tone until it learns your patterns [cite: https://www.fyxer.ai/docs/languages · 2026-09-01 · high].

### What happens if the agent drafts something wildly wrong?

You reject it, optionally add a note explaining why, and the agent logs the failure. If the same mistake recurs, you can flag it as a "never do this" rule. The team is also building a "confidence score" feature that surfaces drafts the model is uncertain about and prompts you to review before sending [cite: https://www.reddit.com/r/SaaS/comments/1f9m2k1/fyxer_beta_first_impressions/ · 2026-09-05 · medium].

### Can it handle calendar scheduling?

Not yet. The team is building a calendar integration for Q4 2026, but it will still require explicit approval for every event created or modified. No auto-accept, no auto-decline, no "find a time that works" without human confirmation [cite: https://techcrunch.com/2026/09/fyxer-executive-assistant-launch · 2026-09-10 · high].

## Sources

- Fyxer blog: Training assistant voice (https://www.fyxer.ai/blog/training-assistant-voice)
- TechCrunch: Fyxer executive assistant launch (https://techcrunch.com/2026/09/fyxer-executive-assistant-launch)
- Fyxer documentation: Architecture (https://www.fyxer.ai/docs/architecture)
- Anthropic: Claude 3.7 Opus announcement (https://