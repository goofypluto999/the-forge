---
title: "SQLite Is All You Need for Durable Workflows"
description: "A deep dive on using SQLite as the backbone for persistent, fault-tolerant agent and workflow orchestration systems."
tldr: "Most workflow orchestrators reach for Postgres or Redis, but SQLite delivers durable queues, crash recovery, and ACID guarantees in a single file. No separate database server. No network latency. Just a battle-tested storage engine that survives reboots and handles concurrent writes without fanfare."
publishDate: 2026-05-30
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "developer-tools"]
tools: ["SQLite", "Temporal", "Inngest"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "SQLite can handle hundreds of thousands of transactions per second on modern hardware with proper tuning."
    source: "https://www.sqlite.org/speed.html"
    date: "2026-05-15"
    confidence: "high"
  - text: "Temporal uses PostgreSQL or Cassandra as its persistence layer, requiring separate infrastructure management."
    source: "https://docs.temporal.io/kb/all-the-ways-to-run-a-cluster"
    date: "2026-05-20"
    confidence: "high"
  - text: "SQLite write-ahead logging mode allows multiple concurrent readers and one writer without blocking."
    source: "https://www.sqlite.org/wal.html"
    date: "2026-05-10"
    confidence: "high"
  - text: "Litestream enables continuous SQLite replication to S3-compatible storage with sub-second lag."
    source: "https://litestream.io/"
    date: "2026-05-18"
    confidence: "high"
  - text: "The average SaaS application handles fewer than 1000 concurrent connections, well within SQLite's write capacity."
    source: "https://kerkour.com/sqlite-for-servers"
    date: "2026-04-12"
    confidence: "medium"
entities:
  - "SQLite"
  - "Temporal"
  - "Litestream"
  - "Write-Ahead Logging"
  - "Inngest"
updateLog:
  - version: "v1"
    date: 2026-05-30
    notes: "Initial publish."
---

You don't need Postgres. You don't need Redis. You don't need a three-node Cassandra cluster to keep your agent workflows from losing state when the power blinks.

SQLite is sitting right there. Single file. Zero config. Battle-tested since 2000. It's probably already running on your phone, your browser, your IDE, and half the infrastructure in your stack. Yet the moment developers think "durable workflow orchestration," they instinctively reach for heavier tools [cite: https://news.ycombinator.com/item?id=39084137 · 2024-01-15 · high]. This is backwards.

Here's the truth: SQLite handles concurrent writes, survives crashes, and replicates to cloud storage without breaking a sweat. If your workflow system processes fewer than a few thousand tasks per second, you're walking past the right tool to install something more complicated.

## The persistence problem workflows actually have

Agent workflows fail. APIs timeout. Servers reboot mid-task. LLM providers return 503s. You need state to survive these interruptions without losing track of what's done and what's pending [cite: https://temporal.io/blog/workflow-engine-principles · 2026-03-10 · high].

Traditional orchestrators solve this with external databases. Temporal defaults to Postgres or Cassandra [cite: https://docs.temporal.io/kb/all-the-ways-to-run-a-cluster · 2026-05-20 · high]. Inngest uses Postgres behind the scenes. Prefect does the same. All require you to run, monitor, backup, and tune a separate database server.

SQLite collapses the entire stack into a single `.db` file. No connection pooling. No network round-trips. No schema migrations across distributed nodes. Just a library you link directly into your process that happens to be the [most widely deployed database engine on earth](https://en.wikipedia.org/wiki/SQLite).

The trade-off isn't reliability. It's horizontal scalability you probably don't need yet.

## Q: How do you build a durable queue in SQLite?

Start with a table that tracks task state:

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending','running','completed','failed')),
  payload JSON NOT NULL,
  attempts INTEGER DEFAULT 0,
  scheduled_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  error TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_tasks_status_scheduled 
  ON tasks(status, scheduled_at) 
  WHERE status = 'pending';
```

Enqueue a task:

```sql
INSERT INTO tasks (id, workflow_id, status, payload, scheduled_at)
VALUES (?, ?, 'pending', json(?), unixepoch());
```

Claim the next available task atomically:

```sql
UPDATE tasks 
SET status = 'running', 
    started_at = unixepoch(), 
    attempts = attempts + 1
WHERE id = (
  SELECT id FROM tasks 
  WHERE status = 'pending' 
    AND scheduled_at <= unixepoch()
  ORDER BY scheduled_at 
  LIMIT 1
)
RETURNING *;
```

That `RETURNING` clause gives you the row you just locked. No race conditions. No lost updates. SQLite's write serialization ensures only one worker claims each task [cite: https://www.sqlite.org/wal.html · 2026-05-10 · high].

Mark it done:

```sql
UPDATE tasks 
SET status = 'completed', completed_at = unixepoch() 
WHERE id = ?;
```

Or handle failure with exponential backoff:

```sql
UPDATE tasks 
SET status = 'pending',
    scheduled_at = unixepoch() + (attempts * attempts * 60),
    error = ?
WHERE id = ? AND attempts < 5;
```

This is the entire persistence layer. No ORM. No migration framework. No connection pool tuning. Just SQL that runs in-process at memory speeds.

## WAL mode and the concurrent write myth

Default SQLite locks the entire database on writes. This freaks people out. "Single writer? That can't scale!"

Except WAL mode [changes the game](https://www.sqlite.org/wal.html). Write-Ahead Logging decouples readers from writers by appending changes to a separate log file [cite: https://www.sqlite.org/wal.html · 2026-05-10 · high]. Readers keep reading the snapshot they started with. Writers append new transactions to the WAL. Checkpointing merges the WAL back into the main database file periodically.

Enable it:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

Now you get:
- Multiple concurrent readers with zero blocking
- One writer at a time, but writes queue without erroring
- Crash recovery that replays the WAL on startup

SQLite can handle hundreds of thousands of transactions per second on modern SSDs with this setup [cite: https://www.sqlite.org/speed.html · 2026-05-15 · high]. Your workflow system probably enqueues a few dozen tasks per second. You have headroom.

The actual bottleneck in most agent workflows isn't database writes. It's waiting for the LLM to finish thinking or the external API to respond. SQLite spends more time idle than working.

## Litestream for zero-effort replication

The single-file thing makes people nervous. "What if the disk dies? What if I need to restore to ten minutes ago?"

[Litestream](https://litestream.io/) solves this by streaming SQLite's WAL to S3, GCS, or any S3-compatible storage in real time [cite: https://litestream.io/ · 2026-05-18 · high]. Sub-second replication lag. Automatic point-in-time recovery. No code changes.

Install:

```bash
brew install litestream
```

Config file:

```yaml
dbs:
  - path: /var/data/workflows.db
    replicas:
      - url: s3://my-bucket/workflows
        retention: 168h
```

Run it as a sidecar:

```bash
litestream replicate
```

Your workflow process writes to the local `.db` file. Litestream watches the WAL and uploads every change. If the server explodes, spin up a new instance and restore:

```bash
litestream restore -o /var/data/workflows.db s3://my-bucket/workflows
```

You're back online with state intact. Litestream handles replication, compression, and retention policies. You handle writing SQL.

Some [Reddit threads](https://www.reddit.com/r/selfhosted/comments/16ckg8j/litestream_for_sqlite_replication_is_a_game/) report running production traffic on Litestream-replicated SQLite for years without incident. Others point out that [Cloudflare's D1 product is literally SQLite with replication baked in](https://developers.cloudflare.com/d1/), serving billions of queries per day.

## When SQLite stops being enough

SQLite breaks down when you need:
- True horizontal write scaling across multiple machines
- Distributed transactions spanning several databases
- Hot standby replicas for zero-downtime failover

The average SaaS workflow system hits none of these constraints [cite: https://kerkour.com/sqlite-for-servers · 2026-04-12 · medium]. You scale vertically first. Single-machine SQLite on a decent NVMe can handle tens of thousands of writes per second. By the time you outgrow that, you're already profitable enough to hire a DBA.

If you're orchestrating LLM agents that spend three seconds per task waiting on OpenAI's API, your database is bored. Adding Postgres just spreads the boredom across more machines.

Some tools like [CV Mirror](https://aimvantage.uk/docs/mcp) use SQLite under the hood for local caching of parsed resumes and API responses. No external database. No config. Just a `.db` file in your `~/.config` directory that survives restarts and keeps your LLM agents from re-parsing the same PDFs.

## Q: What about transactions across API calls?

SQLite transactions are ACID. You either commit the whole batch or roll it all back [cite: https://www.sqlite.org/transactional.html · 2026-05-12 · high]. This matters when you're chaining agent steps:

```python
import sqlite3

conn = sqlite3.connect("workflows.db")
conn.execute("PRAGMA journal_mode=WAL")

def run_workflow_step(workflow_id, step_name, api_call):
    with conn:  # Auto-commit or rollback
        # Mark step as started
        conn.execute(
            "INSERT INTO steps (workflow_id, name, status) VALUES (?, ?, 'running')",
            (workflow_id, step_name)
        )
        
        try:
            result = api_call()
            
            # Persist result
            conn.execute(
                "UPDATE steps SET status='completed', result=? WHERE workflow_id=? AND name=?",
                (result, workflow_id, step_name)
            )
            return result
        except Exception as e:
            # Transaction auto-rolls back on exception
            conn.execute(
                "UPDATE steps SET status='failed', error=? WHERE workflow_id=? AND name=?",
                (str(e), workflow_id, step_name)
            )
            raise
```

If the API call fails, SQLite rolls back the "completed" update but keeps the "failed" record. You get consistent state without distributed transaction coordinators.

## Tooling that already uses SQLite this way

Several modern workflow tools quietly rely on SQLite:

- **Dagster** uses SQLite for its local dev mode and single-node deployments [cite: https://docs.dagster.io/deployment/guides/service · 2026-04-22 · high]
- **Prefect** ships SQLite as the default backend for self-hosted instances
- **Apache Airflow** supports SQLite for local testing (though not recommended for production due to concurrency limits in older Airflow versions)

The pattern is proven. The tooling exists. The only missing piece is permission to stop over-engineering.

## FAQ

### Q: Can SQLite handle millions of completed tasks in one table?

Yes, but archive old rows. Partition by month or move completed tasks to a separate `tasks_archive` table after 30 days. SQLite tables can hold billions of rows, but query performance depends on index locality. Keep hot data hot.

### Q: What if I need to query workflows from a separate analytics service?

Mount the `.db` file read-only from your analytics process. WAL mode allows unlimited concurrent readers. Or use Litestream to replicate to a second database that your analytics service owns.

### Q: How do I avoid database-locked errors under high concurrency?

Set `PRAGMA busy_timeout = 5000` so writers retry automatically instead of erroring immediately. Use WAL mode. Batch small writes into larger transactions. Profile with `EXPLAIN QUERY PLAN` to confirm your indexes work.

### Q: Doesn't this tie me to a single machine?

Yes. If you need multi-region writes or sharded workloads, move to Postgres. But most agent workflows are I/O-bound on external APIs, not CPU or storage. Vertical scaling is cheaper and simpler until you're handling truly massive throughput.

## Sources

- SQLite performance benchmarks: https://www.sqlite.org/speed.html
- Write-Ahead Logging documentation: https://www.sqlite.org/wal.html
- Litestream replication guide: https://litestream.io/
- Temporal persistence architecture: https://docs.temporal.io/kb/all-the-ways-to-run-a-cluster
- Transactional guarantees: https://www.sqlite.org/transactional.html
- SQLite for servers (Kerkour): https://kerkour.com/sqlite-for-servers
- Dagster deployment options: https://docs.dagster.io/deployment/guides/service
- Reddit thread on Litestream in production: https://www.reddit.com/r/selfhosted/comments/16ckg8j/litestream_for_sqlite_replication_is_a_game/
- Hacker News discussion on SQLite vs. Postgres: https://news.ycombinator.com/item?id=39084137
- Temporal workflow principles: https://temporal.io/blog/workflow-engine-principles
- Cloudflare D1 (SQLite at scale): https://developers.cloudflare.com/d1/