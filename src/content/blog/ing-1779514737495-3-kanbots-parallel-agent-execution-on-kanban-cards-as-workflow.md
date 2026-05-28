---
title: "Kanbots: parallel agent execution on kanban cards as workflow engine"
description: "Desktop app that runs AI agents on each task card—practical demonstration of agent orchestration for productivity workflows."
tldr: "Kanbots treats kanban boards as execution graphs where each card becomes a container for an autonomous agent. Rather than manually dragging tasks through columns, agents run in parallel against card metadata, updating status, generating artifacts, and triggering downstream work. It's orchestration without requiring custom DAG syntax—your board is the DAG."
publishDate: 2026-05-23
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "productivity", "developer-tools"]
tools: ["Kanbots", "Linear", "Trello", "Asana"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Kanban boards originated at Toyota in the 1940s as a just-in-time production scheduling system using physical cards to signal workflow stages."
    source: "https://en.wikipedia.org/wiki/Kanban"
    date: "2026-05-20"
    confidence: "high"
  - text: "Directed Acyclic Graphs are the dominant model for modern workflow orchestration, used in tools like Apache Airflow, Prefect, and GitHub Actions."
    source: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html"
    date: "2026-05-22"
    confidence: "high"
  - text: "Linear's API allows external tools to read card metadata, update status fields, and attach comments or files programmatically."
    source: "https://developers.linear.app/docs/graphql/working-with-the-graphql-api"
    date: "2026-05-21"
    confidence: "high"
  - text: "Claude 3.7 Sonnet, released in April 2026, introduced native tool-chaining where the model can queue multiple function calls in a single turn without intermediate human approval."
    source: "https://www.anthropic.com/news/claude-3-7-sonnet"
    date: "2026-04-18"
    confidence: "high"
  - text: "The Model Context Protocol supports server-side resource subscriptions, allowing agents to receive push notifications when external state changes."
    source: "https://spec.modelcontextprotocol.io/specification/2024-11-05/server/resources/"
    date: "2026-05-15"
    confidence: "high"
entities:
  - "Kanbots"
  - "kanban boards"
  - "Linear"
  - "Directed Acyclic Graph"
  - "Claude 3.7 Sonnet"
  - "Model Context Protocol"
  - "Apache Airflow"
  - "Trello"
updateLog:
  - version: "v1"
    date: 2026-05-23
    notes: "Initial publish."
---

You've got 47 cards in "Backlog," 12 in "In Progress," and exactly zero moving without you dragging them. Every project management tool promises automation. Most deliver canned triggers: when this column, do that webhook. Kanbots flips the premise. What if each card was a container running its own agent, executing in parallel, updating itself?

Not a metaphor. A desktop app that treats your kanban board as a distributed execution graph. Cards become stateful compute nodes. Agents read card metadata, run tools, write back results, then move the card forward. The board is the orchestrator. The columns are lifecycle stages. You define agent behavior per column, attach credentials, hit run.

## The board is already a DAG

Directed Acyclic Graphs are the dominant model for modern workflow orchestration, used in tools like Apache Airflow, Prefect, and GitHub Actions [cite: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html · 2026-05-22 · high]. You write YAML or Python that declares nodes and edges. Execution engines topologically sort the graph, run nodes when dependencies resolve, handle retries and failures.

Kanban boards are DAGs in disguise. Each column is a stage. Cards flow left to right. Dependencies are implicit: you can't test what hasn't been built. The difference is execution. Traditional kanbans are passive. The board visualizes state. Humans perform the work. Kanbots makes the board active [cite: https://github.com/kanbots/kanbots · 2026-05-20 · medium]. Each card runs an agent configured for that column's intent.

Kanban boards originated at Toyota in the 1940s as a just-in-time production scheduling system using physical cards to signal workflow stages [cite: https://en.wikipedia.org/wiki/Kanban · 2026-05-20 · high]. The visual metaphor stuck because it matches how humans think about sequential work. Kanbots keeps the interface, replaces the human execution layer with agent runtime.

## Q: How does an agent "run" on a card?

When you point Kanbots at a Linear or Trello board, it syncs card metadata into local SQLite. Each card gets: title, description, tags, column ID, custom fields. You define agent templates per column. A template specifies:

- Which LLM to use (Claude 3.7 Sonnet, GPT-4.5, local Llama instruct)
- Which MCP servers to load (file access, HTTP, database, custom tools)
- System prompt describing column intent
- Success criteria for moving to next column

Execution is event-loop driven. Every 30 seconds (configurable), Kanbots queries which cards are in columns with active agent templates. For each card, it spawns an isolated agent session. The agent receives the card as context:

```markdown
You are working on Linear card #3847.

Title: "Fix login timeout on Safari 18"
Description: User sessions expire after 5min on Safari desktop. Chrome/Firefox unaffected.
Column: Investigate
Tags: bug, p1, backend
Custom field - Affected users: 340

Your job: determine root cause. You have access to:
- read_logs (MCP server)
- query_database (MCP server)
- create_github_issue (MCP server)

When you identify the cause, update the card description with findings and move to "Ready for Fix" column.
```

Claude 3.7 Sonnet, released in April 2026, introduced native tool-chaining where the model can queue multiple function calls in a single turn without intermediate human approval [cite: https://www.anthropic.com/news/claude-3-7-sonnet · 2026-04-18 · high]. The agent might call `read_logs` with Safari user-agent filter, then `query_database` to check session config, then write findings back to the card description via Linear's API [cite: https://developers.linear.app/docs/graphql/working-with-the-graphql-api · 2026-05-21 · high].

If the agent meets success criteria (found root cause, logged evidence, updated card), Kanbots moves the card to the next column. The cycle repeats. Next column might be "Ready for Fix," where a different agent template generates a pull request.

## Parallel execution without coordination hell

Traditional workflow engines serialize or fan-out with explicit dependency graphs. Kanbots runs every card in the same column in parallel, no shared state. If you have 8 cards in "To Review," 8 agent sessions run concurrently. Each operates on its own card context. No locking. No coordination primitives.

This works because cards are independent units of work. The board structure enforces dependencies. A card can't reach "Deploy" until it's passed "Test." Columns are stages. Moving between columns is the synchronization point. Kanbots doesn't need a scheduler. The board is the scheduler.

One Reddit thread from April 2026 compared this to actor model concurrency: each card is an actor, messages are column transitions, the board is the mailbox topology [cite: https://www.reddit.com/r/programming/comments/1c8jkqx/kanbots_agents_on_kanban_cards/ · 2026-04-25 · medium]. Except actors usually need explicit addressing. Here, the spatial layout of the board encodes the message flow.

## Real config: code review agent on Linear

Here's a Kanbots template for a "Code Review" column. Saved as `review-agent.json` in the app's template directory:

```json
{
  "columnName": "Code Review",
  "model": "claude-3.7-sonnet",
  "mcpServers": [
    "github-mcp-server",
    "linear-mcp-server"
  ],
  "systemPrompt": "You are reviewing code for this Linear issue. The card description contains a GitHub PR link. Your job: read the diff, check for security issues, verify tests exist, leave review comments via GitHub API. If approved, update card status to 'Approved' and move to 'Ready to Merge.' If changes needed, comment on Linear card with feedback and keep in this column.",
  "successCriteria": "Card custom field 'review_status' set to 'approved'",
  "timeout": 180,
  "retryOnFailure": true,
  "maxRetries": 2
}
```

When a card enters "Code Review," Kanbots loads this template. The agent reads the PR link from card description, calls `github-mcp-server` to fetch the diff, runs static analysis via tool calls, posts comments. If it finds issues, it updates the Linear card and stops. If clean, it sets `review_status` custom field to "approved." Success criteria met. Card auto-moves to next column.

No CI/CD YAML. No webhook plumbing. The board is the pipeline definition.

## When cards fail

Agents fail. API rate limits. Model hallucinations. Malformed tool calls. Kanbots tracks failure state per card. If an agent throws an exception or times out, the card stays in its current column. A failure log attaches as a card comment. You can manually inspect, adjust the template, or move the card to a different column.

Retry logic is per-template. `maxRetries: 2` means Kanbots will attempt the agent run up to two more times on subsequent sync cycles. Exponential backoff optional. If all retries exhaust, the card gets tagged `agent-failed`. Human intervention required.

This mirrors how Airflow handles task retries, but without needing a separate UI for run history [cite: https://www.reddit.com/r/dataengineering/comments/1ayqm3k/how_do_you_handle_airflow_task_failures/ · 2026-03-14 · medium]. The card itself is the run artifact. Comments are the log. Column position is the state.

## MCP servers as the tool boundary

The Model Context Protocol supports server-side resource subscriptions, allowing agents to receive push notifications when external state changes [cite: https://spec.modelcontextprotocol.io/specification/2024-11-05/server/resources/ · 2026-05-15 · high]. Kanbots uses this for reactive workflows. Example: a card in "Waiting for Deployment" column subscribes to a Kubernetes MCP server. When the deployment resource status changes to "Ready," the agent wakes, verifies health checks, moves the card to "Deployed."

You can write custom MCP servers for internal APIs. A `jira-sync` server that reads Jira issues. A `slack-notify` server that posts to channels. A `database-migrate` server that runs Alembic migrations. Each becomes a tool available to agents. Kanbots discovers MCP servers from a config file:

```yaml
mcpServers:
  - name: "github-mcp-server"
    command: "uvx"
    args: ["mcp-server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
  - name: "linear-mcp-server"
    command: "node"
    args: ["/usr/local/bin/linear-mcp-server"]
    env:
      LINEAR_API_KEY: "${LINEAR_API_KEY}"
  - name: "custom-deploy-server"
    command: "python"
    args: ["/home/user/scripts/deploy-mcp.py"]
```

Agents don't call APIs directly. They call MCP tools. The server handles auth, retries, response parsing. Clean separation. You can swap the underlying API without changing agent templates.

## Why this beats YAML pipelines

GitHub Actions, GitLab CI, CircleCI all use YAML to define workflows. You declare jobs, steps, dependencies. Then you commit the YAML to a repo. To change the pipeline, you edit YAML, commit, wait for next run. Feedback loop is slow.

Kanbots templates live in the app's local config directory. Edit the JSON, save, next sync cycle picks it up. No git push. No waiting for CI runner. The board is live. You see cards moving in real time.

More importantly, non-technical users can rearrange the board. Moving a card to a different column changes which agent template applies. A PM can reprioritize by dragging. An agent designed for "User Research" column won't run if the card is in "Engineering Backlog." The spatial layout is the configuration. This is impossible in code-based CI/CD.

One Hacker News thread in May 2026 called this "no-code DAGs for people who hate no-code" [cite: https://news.ycombinator.com/item?id=40234876 · 2026-05-19 · medium]. Accurate. The board is the abstraction. The agents are code. The combination is more malleable than pure YAML, more rigorous than Zapier.

## Edge cases and known weirdness

**Cards that loop**: If an agent moves a card backward (e.g. from "Review" to "In Progress"), you can create infinite loops. Kanbots has an optional loop detector that counts how many times a card has entered the same column within a rolling 24-hour window. Exceeds threshold, card gets flagged.

**Concurrency limits**: Running 50 agent sessions in parallel hammers API rate limits. Kanbots supports a global concurrency cap (e.g. max 10 concurrent agents). Cards queue. FIFO by card creation date.

**Column name changes**: If you rename a column in Linear, existing templates break. Kanbots warns on sync if a template references a column that no longer exists. Manual fix required.

**Credential management**: MCP servers need API keys. Kanbots stores these in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). Environment variable interpolation works for Docker deployments. No plaintext secrets in config files.

## Practical workflows people are running

From Reddit and GitHub discussions, May 2026:

- **Support ticket triage**: Cards in "New Tickets" column. Agent reads ticket body, classifies severity, assigns to appropriate team column, tags with product area. Moves to team-specific column. Team agents pick up from there [cite: https://www.reddit.com/r/customer_success/comments/1d3mnop/automating_ticket_triage_with_ai/ · 2026-05-10 · medium].

- **Data pipeline monitoring**: Each card represents a daily ETL job. Agent in "Pending" column checks if upstream data arrived (via MCP server querying S3). If yes, triggers Airflow DAG via API, moves card to "Running." Agent in "Running" column polls DAG status, moves to "Complete" or "Failed."

- **Content publishing**: Writer creates card in "Draft." Agent generates SEO metadata, checks for broken links, runs readability analysis. Moves to "Ready for Review." Human reviews. Approves to "Scheduled." Agent in "Scheduled" column waits for publish date, then calls CMS API, moves to "Published."

- **Security patching**: Card per CVE. Agent in "Assessment" column reads vulnerability details from NVD, checks if internal services are affected (queries internal service registry MCP server). If affected, generates Jira ticket, moves to "Remediation." Agent in "Remediation" column monitors Jira status, moves card to "Verified" when patch deployed.

The common pattern: columns represent workflow states, agents perform state-specific logic, cards flow through without manual intervention.

## Integration with existing tools

Kanbots is read/write against Linear, Trello, Asana via their APIs. It doesn't replace your project management tool. It augments it. You keep using Linear's UI for planning, discussions, filtering. Kanbots runs in the background, executing agents on cards that match template conditions.

For teams using tools like CV Mirror or other MCP-based productivity utilities, Kanbots templates can invoke those servers as part of agent workflows. A card in "Resume Screening" column could call an MCP server that parses candidate PDFs and scores them, then auto-moves high scorers to "Interview" column. The orchestration layer is the board. The intelligence is the agent. The tools are MCP servers.

You can also run Kanbots