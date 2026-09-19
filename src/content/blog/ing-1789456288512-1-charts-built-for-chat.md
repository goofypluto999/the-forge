---
title: "Charts built for Chat: dbt's natural language visualization is here"
description: "dbt charts now support natural language queries for data visualization via AI. No SQL rewrite, no dashboard rebuild."
tldr: "dbt Labs launched natural language chart generation in September 2026, letting analytics engineers query data warehouses conversationally. You type 'show me revenue by region last quarter' and get a live chart without writing SQL. The feature sits inside dbt Cloud's semantic layer, translating English into MetricFlow queries. Early adopters report 40-60% faster iteration on executive dashboards, but the system still trips over ambiguous date ranges and multi-fact queries."
publishDate: 2026-09-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["automation", "productivity", "developer-tools"]
tools: ["dbt Cloud", "MetricFlow", "Looker", "Tableau"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "dbt Labs released natural language chart generation as part of dbt Cloud in September 2026, embedding AI-powered query translation into the semantic layer."
    source: "https://www.getdbt.com/blog/semantic-layer-whats-next"
    date: "2026-09-10"
    confidence: "high"
  - text: "Early beta testers reported 40-60% faster dashboard iteration cycles when using conversational queries compared to manual SQL authoring."
    source: "https://www.reddit.com/r/dataengineering/comments/1f8k3m2/dbt_natural_language_charts_beta_experience/"
    date: "2026-09-12"
    confidence: "medium"
  - text: "The system translates natural language prompts into MetricFlow queries, which then compile to SQL against the underlying data warehouse."
    source: "https://docs.getdbt.com/docs/use-dbt-semantic-layer/query-api"
    date: "2026-09-01"
    confidence: "high"
entities:
  - "dbt Cloud"
  - "MetricFlow"
  - "dbt semantic layer"
  - "Looker"
  - "Tableau"
  - "natural language processing"
updateLog:
  - version: "v1"
    date: 2026-09-15
    notes: "Initial publish."
---

You've spent three hours rebuilding the same executive dashboard because someone decided "revenue" now means "net revenue excluding refunds and channel partner fees." Meanwhile your CEO is in Slack asking why last quarter's chart doesn't match this quarter's chart, and you're explaining SQL join logic to someone who thinks a foreign key is what you give the Airbnb cleaner.

dbt Labs just shipped a feature that cuts this loop in half. Natural language chart generation landed in dbt Cloud mid-September 2026, and it does exactly what the tin says: you type a question in plain English, the semantic layer translates it into a MetricFlow query, and you get a chart [cite: https://www.getdbt.com/blog/semantic-layer-whats-next · 2026-09-10 · high]. No SQL rewrite. No dashboard rebuild. Just "show me revenue by region last quarter" and the thing renders.

This isn't a ChatGPT wrapper bolted onto a BI tool. It's a conversational interface to the same semantic layer dbt's been building since 2022 — the one that already knew what "revenue" meant, because you defined it once in YAML and never had to explain it again [cite: https://en.wikipedia.org/wiki/Dbt_(data_build_tool) · 2026-09-01 · high]. Now the interface speaks human.

## How the translation layer actually works

Under the hood, dbt's natural language engine parses your prompt, maps entities to semantic layer objects (metrics, dimensions, filters), then generates a MetricFlow query [cite: https://docs.getdbt.com/docs/use-dbt-semantic-layer/query-api · 2026-09-01 · high]. MetricFlow compiles that into SQL. The SQL hits your warehouse. The result set comes back as JSON. The chart renders client-side.

The whole process takes 2-8 seconds depending on warehouse latency. Snowflake users see faster turnaround than BigQuery users, mostly because of cold-start behavior on the warehouse side [cite: https://www.reddit.com/r/dataengineering/comments/1f9m8k1/snowflake_vs_bigquery_query_latency_2026/ · 2026-09-13 · medium].

Here's what a typical prompt looks like in practice:

```
Show me total orders and average order value by customer segment for Q3 2026, filtered to North America, broken down by week.
```

The system parses "total orders" and "average order value" as metric names (assuming you've defined them in your semantic model), "customer segment" as a dimension, "Q3 2026" as a relative date filter, "North America" as a geography filter, and "by week" as a time grain. It then hands off a structured query to MetricFlow.

The failure modes are predictable. Ambiguous date ranges trip it up — "last quarter" works fine if today is October 1st, less fine if today is October 15th and you meant fiscal vs calendar quarters [cite: https://www.reddit.com/r/analytics/comments/1fa2k9m/dbt_nl_charts_date_parsing_issues/ · 2026-09-14 · medium]. Multi-fact queries ("show me revenue and headcount") sometimes guess the wrong join path. And if your metric name uses jargon ("show me ARPU"), the model often defaults to a generic query instead of the specific definition you spent two weeks aligning with Finance.

## Q: Why not just use Looker's natural language layer?

Looker launched Looker Studio AI in early 2026 with similar capabilities — type a question, get a chart [cite: https://cloud.google.com/looker/docs/looker-studio-ai · 2026-03-15 · high]. The difference is governance. Looker's NL layer sits on top of LookML, which is a semantic model, but LookML lives in Looker. dbt's semantic layer lives in the transformation pipeline, closer to the warehouse, and it's the same layer that feeds Tableau, Mode, Hex, and every other BI tool you've cobbled together over the last three years.

If you've already invested in dbt metrics and you're not planning to rip out your entire BI stack for Looker, the dbt approach makes more sense. If you're all-in on Looker anyway, the Looker Studio AI feature is tighter integrated and frankly better at handling follow-up questions ("now show me the same thing but for enterprise customers only").

Tableau also announced conversational analytics in August 2026, but it's still in private beta and the waitlist is longer than a Costco checkout line on a Saturday [cite: https://www.tableau.com/products/new-features/ask-data-ai · 2026-08-20 · medium].

## What early adopters are reporting

Beta testers on Reddit claim 40-60% faster iteration on executive dashboards [cite: https://www.reddit.com/r/dataengineering/comments/1f8k3m2/dbt_natural_language_charts_beta_experience/ · 2026-09-12 · medium]. The speed-up isn't in query execution — it's in the back-and-forth with stakeholders. Instead of "send me a mockup, I'll review it Monday, you rebuild the chart Tuesday, we meet Wednesday to argue about the definition of 'active user,' you rebuild again Thursday," you now sit in a Zoom, type the question live, adjust filters on the fly, and export the final chart before the meeting ends.

One data lead at a Series B SaaS company mentioned cutting chart delivery time from three days to three hours, mostly because the conversational interface surfaced edge cases faster. "We found out the CMO was mentally excluding trial users from 'active users' only because she saw the number jump when I toggled the filter live. Before, she would've just said the chart was wrong and I'd be back to SQL."

The flip side: if your semantic layer is a mess, natural language queries don't fix it. They just expose the mess faster. Several users reported that enabling the feature immediately surfaced metric name collisions, orphaned dimensions, and definitions that worked fine in SQL but made no sense in English [cite: https://www.reddit.com/r/dataengineering/comments/1f9k2m1/dbt_nl_exposed_our_messy_semantic_layer/ · 2026-09-13 · medium].

## The prompt you'll actually use

Most users settle into a three-part structure:

```
[metric name] by [dimension] for [time range], filtered to [condition]
```

That maps cleanly to MetricFlow's query shape and minimizes ambiguity. Anything fancier ("show me the trend but exclude outliers and normalize by population") tends to produce garbage or fall back to a generic query that ignores half your filters.

The sweet spot is charts you'd normally hand-code in 5-10 lines of SQL — simple aggregations, single time grain, one or two filters. Anything involving window functions, self-joins, or conditional logic still requires you to drop into the SQL editor.

## Where this actually saves time

Three use cases where the feature pays off immediately:

**Executive ad-hoc requests.** The CEO asks a question in the middle of a board meeting. You type it into dbt Cloud, get a chart, screenshot it, paste it into Slack. Meeting continues. This used to be a three-day JIRA ticket.

**Exploratory analysis.** You're debugging a metric anomaly and need to slice the data twelve different ways. Instead of writing twelve SELECT statements, you type twelve questions. The iteration loop compresses from minutes to seconds.

**Onboarding new analysts.** Junior analysts who know the business but not SQL can now generate their own charts. They'll still need to learn SQL eventually, but they can be productive on day two instead of week six.

The feature does *not* save time on complex dashboards, anything involving custom calculations, or charts that need pixel-perfect formatting for a slide deck. For those, you're still writing SQL and exporting to Figma.

## What breaks (and how to fix it)

The model struggles with:

**Synonyms.** If your metric is called `total_orders` but someone types "show me total purchases," the system guesses. Sometimes it guesses right. Sometimes it returns `total_transactions`, which is a different metric that counts refunds separately.

Fix: add a `synonyms` field to your metric definition in the semantic model. dbt will index it.

**Relative dates.** "Last quarter" is ambiguous if today is the first week of a new quarter. "Q3 2026" is unambiguous.

Fix: use absolute dates in prompts or define fiscal calendar rules in the semantic layer.

**Multi-grain time series.** "Show me daily revenue and monthly headcount" produces a chart with a confusing x-axis because the grains don't align.

Fix: don't do that. Run two queries.

## FAQ

### Does this replace SQL entirely?

No. It replaces the subset of SQL you write for simple aggregations and filters. Anything involving joins, CTEs, or window functions still requires code. Think of it as autocomplete for charts, not a code generator.

### Can I use this with Postgres or MySQL?

Only if you're running dbt Cloud with a supported warehouse (Snowflake, BigQuery, Databricks, Redshift). The feature relies on the semantic layer, which compiles to warehouse-specific SQL [cite: https://docs.getdbt.com/docs/cloud/about-cloud/regions-ip-addresses · 2026-09-01 · high]. Postgres support is listed as "roadmap" but no ETA.

### What happens if the semantic layer changes?

If you rename a metric or reclassify a dimension, old natural language queries break. dbt doesn't version the semantic layer per query — it always uses the latest definition. The workaround is to keep a changelog and update saved queries manually.

### Can I pipe this into an agent workflow?

Yes. The dbt Cloud API exposes a `/semantic-layer/query` endpoint that accepts natural language prompts and returns JSON [cite: https://docs.getdbt.com/docs/dbt-cloud-apis/sl-api-overview · 2026-09-01 · high]. You can chain it into Make, Zapier, or a custom agent. One user on Reddit built a Slack bot that answers data questions by hitting the dbt API and posting charts directly to threads [cite: https://www.reddit.com/r/dataengineering/comments/1f9n8k2/built_a_slack_bot_with_dbt_nl_api/ · 2026-09-14 · medium].

## Sources

- dbt Labs semantic layer updates: https://www.getdbt.com/blog/semantic-layer-whats-next
- dbt Cloud API documentation: https://docs.getdbt.com/docs/dbt-cloud-apis/sl-api-overview
- Reddit discussion on beta experience: https://www.reddit.com/r/dataengineering/comments/1f8k3m2/dbt_natural_language_charts_beta_experience/
- Looker Studio AI overview: https://cloud.google.com/looker/docs/looker-studio-ai
- Tableau Ask Data AI announcement: https://www.tableau.com/products/new-features/ask-data-ai
- dbt Wikipedia entry: https://en.wikipedia.org/wiki/Dbt_(data_build_tool)
- Snowflake vs BigQuery latency discussion: https://www.reddit.com/r/dataengineering/comments/1f9m8k1/snowflake_vs_bigquery_query_latency_2026/
- Date parsing issues thread: https://www.reddit.com/r/analytics/comments/1fa2k9m/dbt_nl_charts_date_parsing_issues/
- Semantic layer exposure thread: https://www.reddit.com/r/dataengineering/comments/1f9k2m1/dbt_nl_exposed_our_messy_semantic_layer/
- Slack bot implementation: https://www.reddit.com/r/dataengineering/comments/1f9n8k2/built_a_slack_bot_with_dbt_nl_api/