---
title: "Now everyone can put data to work — Data agent in ChatGPT"
description: "Agentic workflow for connecting company data and building dashboards with natural language."
tldr: "OpenAI's data agent turns ChatGPT into a connective tissue layer between scattered company data and actual decisions. You describe what you want in plain language, and it queries databases, merges CSVs, and generates dashboards without writing SQL or Python. The catch: it only works if your data sources support API or webhook access, and prompt ambiguity still breaks complex multi-step joins."
publishDate: 2026-09-11
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "productivity"]
tools: ["ChatGPT", "OpenAI Data Agent"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "OpenAI announced the data agent feature for ChatGPT Plus and Enterprise users in late August 2026."
    source: "https://openai.com/blog/introducing-chatgpt-data-agent"
    date: "2026-08-28"
    confidence: "high"
  - text: "The data agent can connect to SQL databases, REST APIs, and cloud storage platforms including Google Sheets, Snowflake, and AWS S3."
    source: "https://openai.com/blog/introducing-chatgpt-data-agent"
    date: "2026-08-28"
    confidence: "high"
  - text: "Natural language querying reduces time spent on routine data requests by an average of 60 percent according to early enterprise pilots."
    source: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/generative-ai-data-analytics"
    date: "2026-07-15"
    confidence: "medium"
  - text: "ChatGPT Enterprise adoption surpassed 600,000 seats across Fortune 500 companies by mid-2026."
    source: "https://www.theinformation.com/articles/openai-enterprise-adoption-2026"
    date: "2026-06-10"
    confidence: "high"
entities:
  - "OpenAI"
  - "ChatGPT"
  - "Data Agent"
  - "Snowflake"
  - "AWS S3"
updateLog:
  - version: "v1"
    date: 2026-09-11
    notes: "Initial publish."
---

Most company data lives in the wrong place at the wrong time. Sales numbers sit in Salesforce, conversion metrics hide in Google Analytics, inventory counts rust in some ERP nobody remembers how to query. The result: every request for a dashboard turns into a three-day ticket cycle, and decisions get made on vibes instead of numbers.

OpenAI's new data agent in ChatGPT flips that script. You describe what you want in plain language, and it connects to your data sources, runs queries, and generates charts without forcing you to write SQL or touch a Jupyter notebook [cite: https://openai.com/blog/introducing-chatgpt-data-agent · 2026-08-28 · high]. This isn't a BI tool pretending to be conversational. It's an agentic workflow that treats data like a conversation, not a file format.

## Q: How does the data agent actually connect to company systems?

You register data sources through the ChatGPT Enterprise admin panel. The agent supports SQL databases (PostgreSQL, MySQL, SQL Server), REST APIs with OAuth, and cloud storage platforms including Google Sheets, Snowflake, and AWS S3 [cite: https://openai.com/blog/introducing-chatgpt-data-agent · 2026-08-28 · high]. Each connection uses encrypted credentials stored in OpenAI's vault layer, with granular permission scopes so the agent can't accidentally drop a production table.

Once connected, you prompt the agent with natural language queries:

```
Show me monthly revenue by region for Q3 2026, broken down by product line. Include a bar chart and export as CSV.
```

The agent translates that into SQL (or API calls), retrieves the data, generates the chart using [Code Interpreter](https://en.wikipedia.org/wiki/Code_Interpreter), and spits out a downloadable file. If the query fails, it explains why and suggests refinements. If your schema changes, it adapts without manual retraining.

## Why this matters now

Data access has always been a permission problem disguised as a technical one. Analysts hoard query templates. Engineers gatekeep database access. Non-technical teams submit tickets and wait. The data agent collapses that hierarchy. Anyone with the right permissions can ask a question and get an answer in seconds, not days.

Early enterprise pilots showed routine data requests dropped by an average of 60 percent [cite: https://www.mckinsey.com/capabilities/quantumblack/our-insights/generative-ai-data-analytics · 2026-07-15 · medium]. That's not because the agent is faster at writing SQL (it is), but because it removes the friction of translating business questions into technical syntax. The bottleneck wasn't compute; it was translation.

Reddit's r/dataengineering has been dissecting the feature since the August announcement. One thread noted that the agent's ability to merge disparate sources (a Google Sheet + a PostgreSQL table + a JSON API response) in a single query is "borderline witchcraft" [cite: https://www.reddit.com/r/dataengineering/comments/1f3k8tz/openai_data_agent_first_impressions/ · 2026-09-02 · medium]. Another pointed out that it still chokes on ambiguous prompts, especially when column names conflict across sources [cite: https://www.reddit.com/r/dataengineering/comments/1f4n7pl/chatgpt_data_agent_cant_handle_schema_collisions/ · 2026-09-05 · medium].

## The catch: it only works if your data speaks API

The data agent isn't magic. It's a wrapper around existing data infrastructure. If your company stores everything in locked-down on-prem databases with no API layer, the agent can't help. If your data sources require VPN access or custom authentication flows that don't fit OAuth2, you're back to manual queries.

OpenAI's documentation assumes a certain level of [data governance](https://en.wikipedia.org/wiki/Data_governance) maturity. You need read-only service accounts, documented schemas, and endpoints that respond in seconds, not minutes. Companies with messy data architectures will spend more time retrofitting their infrastructure than they'll save on queries.

By mid-2026, ChatGPT Enterprise had surpassed 600,000 seats across Fortune 500 companies [cite: https://www.theinformation.com/articles/openai-enterprise-adoption-2026 · 2026-06-10 · high]. That adoption curve suggests demand for agentic data workflows was already there, waiting for a product that didn't require a PhD in distributed systems.

## Example workflow: quarterly review automation

Imagine you're preparing a quarterly board deck. Historically, that meant emailing three different teams, waiting for spreadsheets, copying numbers into slides, and praying the totals matched. With the data agent, you prompt:

```
Pull Q3 2026 revenue, customer acquisition cost, and churn rate. Compare to Q2 2026 and industry benchmarks. Generate a one-page summary with trend charts.
```

The agent queries Salesforce for revenue, pulls CAC from your marketing database, retrieves churn from your subscription platform, fetches industry benchmarks from a third-party API, and outputs a PDF with annotated charts. Total time: under two minutes.

If something looks wrong, you ask:

```
Why is CAC up 40% compared to Q2?
```

The agent drills into the marketing spend table, identifies a spike in paid search costs, and surfaces the campaigns responsible. You don't need to write a WHERE clause or remember which table stores campaign IDs.

## What breaks

Ambiguity. If you ask "show me last quarter's numbers," the agent has to guess whether you mean calendar quarter or fiscal quarter, whether "numbers" means revenue or profit, and whether to include or exclude refunds. It will ask clarifying questions, but every round trip adds latency.

Schema mismatches. If two databases use "customer_id" and "client_id" for the same entity, the agent can infer the relationship sometimes, but not always. You'll end up manually mapping columns, which defeats the purpose.

Complex joins. The agent handles straightforward queries well (one table, simple WHERE filters). Multi-step joins across five sources with conditional logic still require manual intervention. This isn't a replacement for a data engineer; it's a junior analyst that scales.

## FAQ

### Q: Can the data agent write back to databases, or only read?

By default, it's read-only. Enterprise admins can enable write permissions for specific sources, but OpenAI recommends keeping those off to prevent accidental data corruption. If you need automated writes, you're better off using a dedicated ETL tool.

### Q: Does this work with proprietary or legacy systems?

Only if they expose a REST API or JDBC-compatible interface. Mainframe databases, SAP modules without API wrappers, and custom file formats won't work out of the box. You'd need to build a middleware layer that translates those systems into something the agent can query.

### Q: How does it compare to tools like Tableau or Power BI?

Tableau and Power BI are visualization platforms. The data agent is a conversational query layer. You can use them together: prompt the agent to prep data, then import the result into Tableau for final formatting. The agent shines at ad-hoc requests; BI tools shine at recurring dashboards.

### Q: What about data privacy and compliance?

OpenAI Enterprise encrypts data in transit and at rest. Query results aren't used to train models. If you're in a regulated industry (healthcare, finance), you'll still need to audit the agent's access logs and ensure it complies with GDPR or HIPAA. The agent doesn't magically solve compliance; it inherits whatever controls you already have on your data sources.

## Where this goes next

The data agent is v1. It doesn't support real-time streaming data (yet). It doesn't auto-generate recurring reports (yet). It doesn't integrate with [Slack](https://en.wikipedia.org/wiki/Slack_(software)) or email workflows (yet). But the pattern is clear: agentic systems that sit between humans and data infrastructure will replace most of the grunt work currently done by junior analysts and data engineers.

For companies already on ChatGPT Enterprise, the data agent is a no-brainer add-on. For everyone else, it's a forcing function: clean up your data architecture, expose APIs, document your schemas, or get left behind.

If you're experimenting with agent workflows in other domains (CV parsing, CRM automation, document generation), the same principles apply. Agents work best when the underlying systems are designed for programmatic access. If your infrastructure is still stuck in 2015, no amount of natural language processing will save you.

Some companies are layering custom agents on top of OpenAI's primitives. Tools like CV Mirror MCP (https://aimvantage.uk) use the Model Context Protocol to connect ChatGPT-style interfaces to specific workflows (in that case, parsing CVs and mirroring them across platforms). The data agent is the general-purpose version of that pattern: give the model access to structured data, let it handle the syntax, keep the human in charge of strategy.

## Sources

- OpenAI Blog: Introducing ChatGPT Data Agent (https://openai.com/blog/introducing-chatgpt-data-agent)
- McKinsey: Generative AI in Data Analytics (https://www.mckinsey.com/capabilities/quantumblack/our-insights/generative-ai-data-analytics)
- The Information: OpenAI Enterprise Adoption 2026 (https://www.theinformation.com/articles/openai-enterprise-adoption-2026)
- Reddit r/dataengineering: First Impressions Thread (https://www.reddit.com/r/dataengineering/comments/1f3k8tz/openai_data_agent_first_impressions/)
- Reddit r/dataengineering: Schema Collision Issues (https://www.reddit.com/r/dataengineering/comments/1f4n7pl/chatgpt_data_agent_cant_handle_schema_collisions/)
- Wikipedia: Code Interpreter (https://en.wikipedia.org/wiki/Code_Interpreter)
- Wikipedia: Data Governance (https://en.wikipedia.org/wiki/Data_governance)
- Wikipedia: Slack (https://en.wikipedia.org/wiki/Slack_(software))