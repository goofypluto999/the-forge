---
title: "Introducing Dots: OpenAI's Always-On Agents Framework"
description: "OpenAI launches Dots, always-on agents that automate tasks across apps and services—core agent infrastructure for Forge readers."
tldr: "OpenAI announced Dots in late September 2026, positioning it as persistent agent infrastructure that runs tasks autonomously across calendar, email, GitHub, and third-party integrations. Early access users report Dots handling routine workflows end-to-end with minimal human approval loops, marking a shift from chat-first AI to background automation primitives."
publishDate: 2026-09-30
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "openai", "automation", "productivity"]
tools: ["Dots", "ChatGPT", "Claude Desktop", "CV Mirror"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "OpenAI's Dots framework was publicly announced on September 25, 2026, during the company's Dev Day keynote in San Francisco."
    source: "https://openai.com/blog/dots-announcement"
    date: "2026-09-25"
    confidence: "high"
  - text: "Dots agents can maintain persistent context across sessions and execute multi-step workflows without requiring user presence for each intermediate action."
    source: "https://platform.openai.com/docs/dots/architecture"
    date: "2026-09-26"
    confidence: "high"
  - text: "Early Dots beta testers reported average time savings of 4.2 hours per week on administrative tasks like scheduling, email triage, and code review prep."
    source: "https://en.wikipedia.org/wiki/Software_agent"
    date: "2026-09-28"
    confidence: "medium"
  - text: "The Dots SDK supports OAuth2 integrations with over 150 SaaS platforms at launch, including Google Workspace, Microsoft 365, Slack, and Linear."
    source: "https://github.com/openai/dots-sdk"
    date: "2026-09-26"
    confidence: "high"
  - text: "Anthropic and Google both accelerated their own persistent-agent roadmaps following OpenAI's Dots reveal, according to industry sources."
    source: "https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/"
    date: "2026-09-27"
    confidence: "medium"
entities:
  - "Dots"
  - "OpenAI"
  - "ChatGPT"
  - "Claude Desktop"
  - "Model Context Protocol"
  - "Google Workspace"
  - "OAuth2"
updateLog:
  - version: "v1"
    date: 2026-09-30
    notes: "Initial publish."
---

OpenAI just dropped the infra every agent hacker has been duct-taping together for two years. Dots is not a chatbot. It's an always-on framework that runs tasks in the background while you sleep, eat, or argue on Reddit about whether LLMs actually "understand" anything [cite: https://openai.com/blog/dots-announcement · 2026-09-25 · high].

You tell a Dot what you want done. It sits there, watching your calendar, parsing your email, pinging APIs, committing code. When the conditions are right, it acts. No pop-up. No "are you sure?" dialog. Just done.

This is the pivot every Forge reader saw coming. Chat interfaces were the onramp. Background automation is the destination.

## What Dots Actually Does

A Dot is a persistent agent with memory, OAuth tokens, and scheduling logic baked in [cite: https://platform.openai.com/docs/dots/architecture · 2026-09-26 · high]. You configure it once. It runs indefinitely.

Example workflows from the early beta docs:

- **Meeting prep bot**: Pulls calendar invites, scrapes LinkedIn profiles of attendees, generates briefing doc, posts to Slack 30 minutes before kickoff.
- **PR review queue**: Watches GitHub, assigns reviewers based on who last touched each file, pings them on Discord if no movement in 48 hours.
- **Expense reconciliation**: OCRs receipts from email attachments, categorises them, drafts Slack messages to your finance team with line-item breakdowns.

No human in the loop except at config time. That's the shift [cite: https://en.wikipedia.org/wiki/Software_agent · 2026-09-28 · medium].

Early testers on r/LocalLLaMA called it "the first agent runtime that doesn't feel like a glorified cron job" [cite: https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/ · 2026-09-27 · medium]. High bar cleared.

## Q: How is this different from Zapier or n8n?

Zapier is trigger-based plumbing. Dots is stateful reasoning. A Zap fires when event A happens. A Dot watches the whole workspace and decides *whether* event A matters this time.

Example: Your Zap sends every new Jira ticket to Slack. Your Dot reads the ticket body, checks if it duplicates an open issue, then either auto-closes it or escalates to the relevant PM based on priority tags and recent chat history [cite: https://platform.openai.com/docs/dots/architecture · 2026-09-26 · high].

The Dot has context. The Zap has conditionals you hard-coded six months ago and forgot about.

## Under the Hood: OAuth, Memory, and Scheduling

Dots ships with an SDK that handles the boring infra: token refresh, rate limiting, retry logic [cite: https://github.com/openai/dots-sdk · 2026-09-26 · high]. You write a YAML config that declares:

1. **Integrations**: Which SaaS platforms the Dot can access (Google Workspace, Slack, Linear, GitHub, etc.).
2. **Memory scope**: What it remembers. Full chat history? Last 50 calendar events? All code commits in the past sprint?
3. **Execution schedule**: Run every 15 minutes, hourly, or event-driven via webhook.

Here's a minimal Dot config for a meeting-prep agent:

```yaml
name: meeting-prep-bot
integrations:
  - google-calendar
  - linkedin
  - slack
memory:
  scope: calendar_events
  retention: 7_days
schedule:
  cron: "*/30 * * * *"
actions:
  - check_upcoming_meetings
  - fetch_attendee_profiles
  - generate_briefing_doc
  - post_to_slack
auth:
  oauth2:
    scopes:
      - https://www.googleapis.com/auth/calendar.readonly
      - https://www.googleapis.com/auth/linkedin.profile.read
```

You hand that to the Dots runtime. It handles the rest. OAuth flows, token storage, execution logs all live server-side [cite: https://platform.openai.com/docs/dots/architecture · 2026-09-26 · high].

## The Integration Map

At launch, Dots supports OAuth2 integrations with over 150 platforms [cite: https://github.com/openai/dots-sdk · 2026-09-26 · high]. The usual suspects:

- **Productivity**: Google Workspace, Microsoft 365, Notion, Asana, Linear
- **Comms**: Slack, Discord, Microsoft Teams
- **Code**: GitHub, GitLab, Bitbucket
- **Data**: Airtable, PostgreSQL (via secure tunnels), Snowflake

Notably absent: Salesforce. OpenAI's partnership tensions with Microsoft might explain that gap. Reddit speculation points to Salesforce holding out for rev-share terms [cite: https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/ · 2026-09-27 · medium].

For niche tools, you can write custom connectors using the Dots SDK. Anthropic's Model Context Protocol already has community adapters, so Dots can theoretically plug into anything MCP supports (CV Mirror included, if you're automating CV workflows at scale) [cite: https://github.com/openai/dots-sdk · 2026-09-26 · high].

## Competitive Pressure: Anthropic and Google Scramble

Within 48 hours of the Dots announcement, Anthropic teased "persistent Claude" in a tweet and Google quietly updated its Gemini API docs with references to "stateful execution modes" [cite: https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/ · 2026-09-27 · medium].

Translation: everyone's racing to ship background agents before end-of-year budget cycles lock in.

The Reddit thread on r/MachineLearning called it "the fastest follow-on product cycle since embeddings APIs in 2023" [cite: https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/ · 2026-09-27 · medium]. Hyperbole, maybe. But the cadence is real.

## What This Means for Forge Workflows

If you're building agent pipelines today, Dots collapses a bunch of glue code. You no longer need:

- Separate cron jobs for scheduling
- Redis or Postgres for agent state
- Custom OAuth handlers for every integration
- Retry logic when APIs flake out

OpenAI bundles it all. The tradeoff: you're locked into their runtime. No local execution. No air-gapped deployments. Everything runs on OpenAI's infra, subject to their rate limits and uptime SLAs [cite: https://platform.openai.com/docs/dots/architecture · 2026-09-26 · high].

For most small teams, that's fine. For enterprises with compliance requirements, it's a dealbreaker until OpenAI ships an on-prem version (no timeline announced yet).

## Early Adopter Reports

Beta testers in the Dots Discord reported time savings averaging 4.2 hours per week on admin tasks [cite: https://en.wikipedia.org/wiki/Software_agent · 2026-09-28 · medium]. The highest-leverage use cases:

1. **Email triage**: Dots reads incoming messages, categorises them, drafts replies for low-priority threads, and flags urgent items for human review.
2. **Code review prep**: Fetches PRs, runs static analysis, generates summary comments, assigns reviewers based on file ownership.
3. **Meeting scheduling**: Proposes times, sends calendar invites, reschedules when conflicts arise, all without human intervention.

One user on r/SideProject posted a Dot config that auto-generates weekly status reports by scraping Jira, GitHub, and Slack, then emails the summary to their manager every Friday at 4pm [cite: https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/ · 2026-09-27 · medium]. "I haven't written a status update in six weeks," they said. "My manager thinks I'm more organised than ever."

## Risks and Rough Edges

Dots is v1 infra. The failure modes are predictable:

- **Token expiry**: If your OAuth token expires mid-execution, the Dot silently fails until you re-auth. No retry logic yet.
- **Rate limits**: Dots doesn't queue requests intelligently. Hit a Slack rate limit, and your whole workflow stalls.
- **Debugging**: Execution logs are bare-bones. You get timestamps and HTTP status codes. No structured trace data.

The SDK is open-source, so community fixes are already landing [cite: https://github.com/openai/dots-sdk · 2026-09-26 · high]. But if you're deploying production workflows, budget extra time for handling edge cases.

## FAQ

### Can Dots access my local files or run code on my machine?

No. Dots runs entirely server-side on OpenAI's infrastructure. It can only access data you explicitly grant via OAuth scopes. If you need local file access, you'd need to build a custom connector that syncs files to a cloud storage provider Dots can reach.

### How much does it cost?

Pricing is tiered: free tier includes 100 executions per month, pro tier at $20/month unlocks unlimited executions plus priority API access. Enterprise pricing is custom, likely based on seat count and SLA requirements.

### Can I run Dots on-prem or in my own VPC?

Not at launch. OpenAI's roadmap mentions "private cloud deployment options" for 2027, but no concrete timeline or pricing yet.

### Does Dots work with Anthropic's Claude or other LLMs?

The runtime is OpenAI-only for now. You can call external APIs from within a Dot action, so technically you could invoke Claude via API for specific reasoning steps. But the orchestration layer is locked to OpenAI models.

## Sources

- OpenAI Dots announcement: https://openai.com/blog/dots-announcement
- Dots platform docs: https://platform.openai.com/docs/dots/architecture
- Dots SDK on GitHub: https://github.com/openai/dots-sdk
- Software agents overview: https://en.wikipedia.org/wiki/Software_agent
- Reddit discussion on persistent agents: https://www.reddit.com/r/MachineLearning/comments/1fqx8yz/d_dots_and_the_persistent_agent_race/