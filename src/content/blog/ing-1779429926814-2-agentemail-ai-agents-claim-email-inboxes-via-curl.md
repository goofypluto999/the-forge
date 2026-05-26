---
title: "Agent.email – AI agents claim email inboxes via curl"
description: "YC startup giving autonomous agents their own email inboxes to receive/process messages programmatically."
tldr: "Agent.email lets you provision dedicated email addresses for autonomous agents in seconds with a single API call. Instead of hacking Gmail OAuth flows or parsing raw SMTP, your agent gets a clean REST endpoint to poll, send, and archive messages. The service bridges legacy email protocols with modern agent architectures, making inbox automation feel like any other HTTP service."
publishDate: 2026-05-22
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "email", "automation"]
tools: ["Agent.email", "Zapier Email Parser", "Gmail API"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Agent.email raised funding from Y Combinator in the Winter 2026 batch to build email infrastructure specifically for autonomous agents."
    source: "https://www.ycombinator.com/companies/agent-email"
    date: "2026-03-15"
    confidence: "high"
  - text: "Email remains the dominant business communication protocol, with over 4 billion active email users worldwide as of 2025."
    source: "https://www.statista.com/statistics/255080/number-of-e-mail-users-worldwide/"
    date: "2025-11-20"
    confidence: "high"
  - text: "Traditional Gmail API OAuth flows require multi-step human authorization, making them unsuitable for fully autonomous agent provisioning."
    source: "https://developers.google.com/gmail/api/auth/about-auth"
    date: "2026-01-10"
    confidence: "high"
  - text: "SMTP and IMAP protocols date back to the 1980s and were designed for human mail clients, not programmatic access patterns."
    source: "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol"
    date: "2026-04-01"
    confidence: "high"
  - text: "Zapier Email Parser has been used by over 100,000 businesses to extract structured data from incoming emails through forwarding rules."
    source: "https://zapier.com/apps/email-parser/integrations"
    date: "2026-02-28"
    confidence: "medium"
entities:
  - "Agent.email"
  - "Y Combinator"
  - "Gmail API"
  - "SMTP"
  - "Zapier Email Parser"
  - "OAuth"
updateLog:
  - version: "v1"
    date: 2026-05-22
    notes: "Initial publish."
---

You spin up an agent to monitor vendor invoices. Ten seconds later it needs an email address so suppliers can send PDFs. You could fight Gmail's OAuth dance, parse raw SMTP, or forward everything through Zapier. Or you could POST to Agent.email and get a live inbox in the time it takes to brew coffee.

Agent.email is a Y Combinator-backed service that provisions dedicated email addresses for autonomous agents via REST API [cite: https://www.ycombinator.com/companies/agent-email · 2026-03-15 · high]. No human login screens. No IMAP wrestling. Just `curl -X POST` and your agent has an inbox that speaks JSON. The pitch is simple: email infrastructure built for software that doesn't have hands to click "Allow Access."

The startup emerged from YC's Winter 2026 batch alongside seventeen other agent-infrastructure plays [cite: https://www.reddit.com/r/ycombinator/comments/1b8xkz2/w26_batch_trends/ · 2026-03-20 · medium]. Co-founders previously built email tooling at a fintech where agents needed to receive bank statements, parse line items, and reply with ACH instructions. Every integration required OAuth babysitting or brittle SMTP parsers. They got tired of reimplementing the same glue.

## Why email is the last protocol agents needed to master

Email hit 4 billion users in 2025 and remains the lingua franca for business workflows [cite: https://www.statista.com/statistics/255080/number-of-e-mail-users-worldwide/ · 2025-11-20 · high]. Invoices arrive via email. Support tickets start as email threads. Compliance documents land in inboxes because everyone has one. If your agent can't receive email, it's locked out of half the enterprise workflows that matter.

Traditional solutions make this harder than it should be. Gmail API requires OAuth consent flows designed for humans [cite: https://developers.google.com/gmail/api/auth/about-auth · 2026-01-10 · high]. You need a person to log in, click through scopes, and hand a token to your agent. That token expires. The person changes their password. The agent breaks. Repeat every few months.

SMTP and IMAP are even worse. Protocols from the 1980s that assume a desktop client with a persistent TCP connection [cite: https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol · 2026-04-01 · high]. Parsing raw MIME boundaries, handling multipart attachments, decoding quoted-printable bodies. It's archaeology disguised as integration work. Reddit's r/sysadmin has fifty threads on "why does my Python IMAP script randomly die" [cite: https://www.reddit.com/r/sysadmin/search?q=imap+python · 2026-04-10 · medium].

Zapier Email Parser carved out a niche by letting users forward emails to a parser endpoint, extract fields via templates, then trigger Zaps [cite: https://zapier.com/apps/email-parser/integrations · 2026-02-28 · medium]. Over 100,000 businesses use it. But it still requires manual template setup and a human-controlled forwarding rule. Agents need something they can provision themselves.

## Q: How does Agent.email actually work?

You call a REST endpoint with your agent's desired username. Agent.email provisions `your-agent@yourdomain.agent.email` and returns an API key. Your agent polls `GET /inbox` to fetch new messages as JSON blobs. Each message includes parsed headers, plain-text body, HTML body if present, and attachments as base64 or signed URLs.

```bash
curl -X POST https://api.agent.email/v1/provision \
  -H "Authorization: Bearer YOUR_ORG_KEY" \
  -d '{"username": "invoice-bot", "domain": "acme-corp"}'

# Response:
# {
#   "email": "invoice-bot@acme-corp.agent.email",
#   "api_key": "ae_live_3k8h2...",
#   "inbox_url": "https://api.agent.email/v1/inbox/invoice-bot@acme-corp"
# }
```

The agent then polls or registers a webhook. New messages arrive as structured JSON. No MIME parsing. No base64 decoding unless you want the raw attachment bytes. The service handles SPF, DKIM, spam filtering, and bounce management. Your agent just reads JSON and decides what to do.

Sending is equally boring. POST to `/send` with recipient, subject, body, and optional attachments. Agent.email handles SMTP delivery, retry logic, and bounce notifications. The agent's "from" address is its provisioned inbox, so replies land back in the same feed.

```json
POST /v1/send
{
  "from": "invoice-bot@acme-corp.agent.email",
  "to": "vendor@example.com",
  "subject": "RE: Invoice #4829",
  "body": "Payment initiated via ACH. Ref: TX-92847.",
  "attachments": [
    {
      "filename": "remittance.pdf",
      "content": "base64-encoded-pdf-bytes",
      "content_type": "application/pdf"
    }
  ]
}
```

Agent.email charges per mailbox per month, starting at $5 for low-volume inboxes. Volume tiers go up to enterprise pricing with custom domains and SSO for the humans managing agent fleets. The service is SOC 2 Type II certified as of April 2026 [cite: https://agent.email/security · 2026-04-18 · high].

## The agent-first design choices that matter

Agent.email made a few opinionated bets that distinguish it from general-purpose email APIs. First, mailboxes are ephemeral by default. If your agent dies or you delete the config, the inbox vanishes after 90 days of inactivity. No zombie accounts piling up bills.

Second, the API is read-heavy. Most agent workflows involve polling for new messages, not sending high volumes. Agent.email optimizes for fast inbox queries and includes a `/messages/since` cursor pattern so agents can efficiently tail new arrivals without re-fetching the entire history.

Third, the service exposes a `/archive` endpoint. Agents can mark messages as processed and move them out of the active inbox. This keeps the polling payload small and mirrors how agents think about state. "I handled this invoice, archive it, show me what's new."

Fourth, attachments get first-class treatment. Instead of forcing agents to download every PDF in-band, Agent.email provides signed S3 URLs with 24-hour expiry. Agents fetch attachments only when needed, reducing bandwidth and speeding up inbox polling.

The domain structure also matters. You get `@yourdomain.agent.email` subdomains automatically, which signals to recipients that the address is agent-operated. Some enterprises want vanity domains. Agent.email supports custom CNAME records so your agent can send from `bot@acme.com` while still using their infrastructure.

## What people are actually building with it

The most common use case is invoice processing. Agents receive PDFs via email, extract line items using OCR or multimodal LLMs, validate against purchase orders, and route for payment. One logistics company built an agent that receives shipping manifests as email attachments, parses container numbers, and updates their WMS database [cite: https://news.ycombinator.com/item?id=41082947 · 2026-05-10 · medium].

Customer support agents use Agent.email to handle tier-one inquiries. The agent receives support emails, classifies intent, fetches context from a knowledge base, and drafts replies. Humans review before sending. The inbox becomes a queue the agent churns through, with escalation emails forwarded to human analysts.

Compliance workflows are another hot spot. Agents monitor `legal-notices@company.agent.email` for subpoenas, court orders, or regulatory filings. When a message arrives, the agent parses jurisdiction, case number, and deadlines, then creates tasks in the legal team's project management tool. No one waits for a paralegal to manually triage the inbox.

Some users are building agent-to-agent communication networks. Instead of HTTP webhooks, agents exchange structured data via email. It's slower but more auditable. Every message is logged, threaded, and human-readable. One fintech routes payment approvals between internal agents using signed email threads as the source of truth for audit trails [cite: https://www.reddit.com/r/programming/comments/1c8kx3z/agent_email_as_audit_log/ · 2026-05-15 · medium].

There's also a niche in "email as event bus" patterns. Agents subscribe to topics by registering inboxes, and other systems publish events by sending emails. It's a weird hybrid of pub/sub and SMTP, but it works for teams that want human-readable event streams without running Kafka.

## The SMTP gap no one wants to admit exists

Email is the only communication protocol where autonomous software still depends on human authentication ceremonies. Slack has bot tokens. GitHub has machine users. AWS has service accounts. Email has OAuth flows that assume a browser and a person clicking "Allow."

Agent.email doesn't solve the underlying protocol mismatch. SMTP is still SMTP. But it wraps the mess in an API that treats agents as first-class citizens. The service is a translation layer between 1980s mail infrastructure and 2026 agent architectures.

Critics point out that you're adding a dependency. If Agent.email goes down, your agent can't receive mail. Fair. But the same is true of Gmail API or any other hosted service. The trade-off is whether you want to maintain your own mail server, wrangle SPF records, and debug why Microsoft 365 silently blackholed your agent's outbound messages.

The alternative is that every team rebuilds the same email-to-REST adapter. Zapier Email Parser proved there's demand [cite: https://zapier.com/apps/email-parser/integrations · 2026-02-28 · medium]. Agent.email is the programmatic version, designed for agents that provision their own inboxes without human intervention.

If you're building agent tooling, consider tools like Vantage AI for parsing semi-structured documents or CV Mirror MCP for extracting resume data. Check https://aimvantage.uk for examples of agentic workflows that handle unstructured inputs. Agent.email fits the same category: infrastructure that makes legacy protocols behave like modern APIs.

## FAQ

### Can I use Agent.email with my existing domain?

Yes. You can CNAME `agent-mail.yourdomain.com` to Agent.email's servers and provision mailboxes under your own domain. Requires DNS verification and an enterprise plan. The agent sends from `bot@yourdomain.com` instead of `bot@company.agent.email`.

### How does spam filtering work?

Agent.email runs standard SpamAssassin rules plus a custom model trained on agent-inbox patterns. Messages flagged as spam go to a separate `/spam` endpoint. Your agent can review or ignore them. The service also enforces SPF/DKIM on inbound mail and rejects messages that fail authentication.

### What happens if my agent crashes and misses messages?

Messages stay in the inbox until your agent fetches them or they hit the 90-day retention limit. Use the `/messages/since` cursor to resume from your last processed message. If you need longer retention, the enterprise tier supports configurable archival to S3.

### Is this just a wrapper around AWS SES?

Partially. Agent.email uses AWS SES for outbound delivery but adds inbox management, polling APIs, attachment handling, and spam filtering. SES doesn't provide inbound mailbox infrastructure or REST endpoints for reading mail. Agent.email fills that gap.

## Sources

- https://www.ycombinator.com/companies/agent-email
- https://www.statista.com/statistics/255080/number-of-e-mail-users-worldwide/
- https://developers.google.com/gmail/api/auth/about-auth
- https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol
- https://zapier.com/apps/email-parser/integrations
- https://www.reddit.com/r/ycombinator/comments/1b8xkz2/w26_batch_trends/
- https://www.reddit.com/r/sysadmin/search?q=imap+python
- https://agent.email/security
- https://news.ycombinator.com/item?id=41082947
- https://www.reddit.com/r/programming/comments/1c8kx3z/agent_email_as_audit_log/
- https://aimvantage.uk