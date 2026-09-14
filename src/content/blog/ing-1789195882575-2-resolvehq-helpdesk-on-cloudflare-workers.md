---
title: "ResolveHQ helpdesk on Cloudflare Workers"
description: "A helpdesk built with serverless infra offers patterns for customer-support automation systems."
tldr: "ResolveHQ deployed its entire helpdesk stack on Cloudflare Workers, proving that serverless functions can handle stateful support workflows at scale. The architecture reveals key patterns for routing tickets, caching customer context, and triggering AI triage without spinning up containers."
publishDate: 2026-09-12
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["customer-support", "automation", "developer-tools"]
tools: ["Cloudflare Workers", "Durable Objects", "ResolveHQ"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Cloudflare Workers can execute code in under 10ms globally, making them suitable for real-time customer support routing."
    source: "https://developers.cloudflare.com/workers/platform/performance/"
    date: "2026-08-30"
    confidence: "high"
  - text: "Durable Objects provide strongly consistent storage with single-threaded execution guarantees per object."
    source: "https://developers.cloudflare.com/durable-objects/"
    date: "2026-09-01"
    confidence: "high"
  - text: "Serverless architectures reduce operational overhead by eliminating the need to manage container orchestration or VM scaling."
    source: "https://en.wikipedia.org/wiki/Serverless_computing"
    date: "2026-07-15"
    confidence: "high"
  - text: "ResolveHQ processes over 50,000 support tickets monthly using a fully serverless stack."
    source: "https://resolvehq.com/blog/scaling-serverless-support"
    date: "2026-08-22"
    confidence: "high"
entities:
  - "Cloudflare Workers"
  - "Durable Objects"
  - "ResolveHQ"
  - "serverless computing"
  - "WebSockets"
updateLog:
  - version: "v1"
    date: 2026-09-12
    notes: "Initial publish."
---

Most helpdesks still run on EC2 instances with Postgres and Redis bolted on. ResolveHQ threw that playbook in the trash and built theirs entirely on Cloudflare Workers [cite: https://resolvehq.com/blog/scaling-serverless-support · 2026-08-22 · high]. No VMs. No orchestration. Just functions, Durable Objects, and edge compute. The result is a support platform that routes tickets, caches customer context, and triggers AI triage in under 50ms globally.

This isn't a toy demo. ResolveHQ processes over 50,000 support tickets monthly on this stack [cite: https://resolvehq.com/blog/scaling-serverless-support · 2026-08-22 · high]. The architecture reveals patterns any team can steal for customer-support automation, whether you're building an internal tool or a public-facing SaaS helpdesk.

## Why serverless for support workflows

Customer support has spiky traffic. A product launch, an outage, or a viral tweet can 10x ticket volume in minutes. Traditional stacks handle this with autoscaling groups, load balancers, and over-provisioned databases. You pay for idle capacity or scramble when traffic spikes.

Serverless flips the model. Cloudflare Workers execute code in under 10ms globally [cite: https://developers.cloudflare.com/workers/platform/performance/ · 2026-08-30 · high], scaling automatically from zero to millions of requests without you touching a YAML file [cite: https://en.wikipedia.org/wiki/Serverless_computing · 2026-07-15 · high]. For support workflows, this means ticket routing, sentiment analysis, and knowledge-base lookups run at the edge, close to customers, with zero cold-start lag.

ResolveHQ's bet was that the constraints of serverless (stateless functions, 128MB memory limit per Worker invocation, no persistent TCP connections) wouldn't matter for most helpdesk operations. Turns out they were right. The hard part isn't the stateless functions. It's managing session state and real-time updates without WebSockets pinned to long-lived servers.

## Q: How do you store ticket state without a database

Durable Objects solve the statefulness problem. Each Durable Object is a single-threaded, strongly consistent compute primitive tied to a unique ID [cite: https://developers.cloudflare.com/durable-objects/ · 2026-09-01 · high]. ResolveHQ maps every active ticket to a Durable Object. When an agent opens ticket #4523, the Worker routes the request to the Durable Object with ID `ticket:4523`. That object holds the ticket's current status, assigned agent, and conversation history in memory, backed by Cloudflare's distributed storage.

Here's the skeleton:

```javascript
export class TicketSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.conversationLog = [];
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/append") {
      const { message, sender } = await request.json();
      this.conversationLog.push({ message, sender, timestamp: Date.now() });
      await this.state.storage.put("log", this.conversationLog);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (url.pathname === "/history") {
      const log = await this.state.storage.get("log") || [];
      return new Response(JSON.stringify(log));
    }

    return new Response("Not found", { status: 404 });
  }
}
```

Every message appended to ticket #4523 hits the same Durable Object. No race conditions, no distributed locks. Single-threaded execution guarantees ordering. The conversation log persists across Worker invocations, so even if the object evicts from memory, the next request reconstructs state from Cloudflare's KV-like storage layer.

## Real-time updates without WebSockets on VMs

Support agents expect live updates. When a customer replies, the agent's dashboard should refresh instantly. Traditional stacks use WebSockets pinned to stateful servers. Serverless functions can't hold open TCP connections across invocations.

ResolveHQ uses Server-Sent Events (SSE) tunneled through Durable Objects. Each agent's browser opens an SSE connection to a Worker, which forwards the connection to a Durable Object representing the agent's session. When a ticket updates, the Worker sends a message to the relevant Durable Object, which pushes it down the SSE pipe to the agent's browser.

Reddit user `u/cloudflare_hacker` posted a similar pattern in r/webdev last month, noting that SSE over Durable Objects feels like cheating compared to managing a Redis pub/sub cluster [cite: https://www.reddit.com/r/webdev/comments/1f3k2m9/sse_over_durable_objects/ · 2026-08-18 · medium]. The Durable Object acts as both message broker and connection manager. Cloudflare handles the low-level TCP, so you write business logic instead of debugging load balancer timeouts.

## Ticket routing with AI triage at the edge

ResolveHQ routes incoming tickets through a multi-stage pipeline. First, a Worker extracts the customer email and ticket content. Then it calls a lightweight classifier (fine-tuned DistilBERT, ~60MB model) running on Cloudflare's AI inference service to predict urgency and category [cite: https://developers.cloudflare.com/workers-ai/ · 2026-09-05 · high].

High-urgency tickets route to senior agents. Low-urgency, FAQ-shaped tickets trigger an automated response pulled from a vector embedding store (also on Cloudflare). The entire triage path executes in 30-50ms, edge-side.

The key insight: you don't need a 70B parameter LLM for ticket routing. A 60MB model trained on your support corpus handles 90% of cases. For the ambiguous 10%, the Worker escalates to a human agent with a confidence score attached. The agent sees the AI's guess and can override it.

Pasteable prompt for initial triage (if you're wiring this to an LLM API instead of a fine-tuned model):

```
You are a support ticket classifier. Respond with JSON only.

Ticket:
Subject: {subject}
Body: {body}

Output:
{
  "urgency": "high" | "medium" | "low",
  "category": "billing" | "technical" | "account" | "other",
  "confidence": 0.0 to 1.0,
  "suggested_response": "short canned response if confidence > 0.85, else null"
}
```

If confidence is above 0.85 and urgency is low, ResolveHQ auto-replies and marks the ticket as pending customer confirmation. If the customer replies again, it reopens and routes to a human.

## Caching customer context with KV

Every support interaction needs customer context: account tier, past tickets, feature flags. ResolveHQ stores this in Cloudflare KV, a globally replicated key-value store with eventual consistency [cite: https://developers.cloudflare.com/kv/ · 2026-09-03 · high]. When a ticket arrives, the Worker fetches `customer:{email}` from KV in ~10ms.

KV isn't strongly consistent, so ResolveHQ doesn't store mutable ticket state there. Durable Objects handle that. KV is for read-heavy, infrequently-updated data: account metadata, entitlements, the customer's last five ticket subjects. The Worker stitches this context into the agent's dashboard view.

One gotcha: KV has a 25MB value size limit. If a customer has 10,000 past tickets, you can't dump the full history into a single key. ResolveHQ splits large datasets into sharded keys (`customer:{email}:tickets:0`, `customer:{email}:tickets:1`, etc.) and fetches them in parallel. The Worker aggregates the results before rendering.

## Cost structure vs traditional stacks

Cloudflare Workers bill on compute time (CPU-ms) and request count. Durable Objects add a per-request charge plus storage costs. KV charges per read/write operation. For ResolveHQ's 50,000 monthly tickets, the bill breaks down to roughly:

- Workers: ~$5/month (10 million requests at $0.50 per million after the free tier)
- Durable Objects: ~$25/month (500,000 requests at $0.15 per million, plus storage)
- KV: ~$10/month (5 million reads at $0.50 per 10 million)

Total: ~$40/month for compute and storage [cite: https://www.reddit.com/r/cloudflare/comments/1f2n8k1/real_world_workers_costs/ · 2026-08-20 · medium]. A comparable EC2 setup (t3.medium instance, RDS Postgres, ElastiCache Redis, ALB) runs $200-300/month minimum, even with reserved instances [cite: https://calculator.aws/ · 2026-09-01 · high].

The serverless stack also eliminates DevOps overhead. No OS patches, no autoscaling config, no Redis cluster failovers. The ResolveHQ team is two engineers. One focuses on product features, the other handles integrations. Neither spends time on infrastructure.

## When this pattern breaks

Serverless isn't a silver bullet. ResolveHQ hit limits around three scenarios:

1. **Long-running tasks.** Workers have a 30-second CPU time limit per request [cite: https://developers.cloudflare.com/workers/platform/limits/ · 2026-09-02 · high]. If you need to scrape a customer's entire Slack workspace or generate a 50-page PDF report, you need to chunk the work or offload to a batch queue (Cloudflare Queues, AWS SQS, etc.).

2. **Complex queries.** KV and Durable Objects don't support SQL. If your helpdesk needs to query "all tickets from enterprise customers in the last 30 days where sentiment is negative," you need a relational database. ResolveHQ runs a read-only Postgres replica on Neon for analytics, synced nightly from Durable Object state.

3. **Third-party API rate limits.** If ticket triage calls an external LLM API (OpenAI, Anthropic), you can't burst past the provider's rate limit. ResolveHQ pre-caches embeddings for common queries and falls back to a rule-based classifier when the API quota exhausts.

The Reddit thread on r/CloudFlare from August 2026 has a good discussion of these edge cases, with users sharing workarounds like pre-warming Durable Objects and using Cloudflare Queues for retry logic [cite: https://www.reddit.com/r/cloudflare/comments/1ezk3m2/when_workers_arent_enough/ · 2026-08-15 · medium].

## Patterns to steal

If you're building a support automation system (internal or external), here's what to lift from ResolveHQ's architecture:

- **Durable Objects for session state.** Map each active ticket or agent session to a unique Durable Object ID. Store conversation history, metadata, and real-time state in-memory, persisted to the object's storage. This eliminates distributed locking and race conditions.

- **Edge-side triage.** Run a lightweight classifier (fine-tuned DistilBERT, logistic regression, or even a heuristic scorer) on the edge. Route urgent tickets to humans, auto-respond to common questions, and escalate ambiguous cases with confidence scores.

- **SSE for real-time updates.** Use Server-Sent Events over Durable Objects instead of WebSockets. The browser opens an SSE connection to a Worker, which forwards it to a Durable Object. The object pushes updates down the pipe when ticket state changes.

- **KV for read-heavy context.** Store customer metadata, entitlements, and historical summaries in Cloudflare KV. Fetch in parallel at request time to enrich the agent's view. Don't put mutable state in KV. Use Durable Objects for that.

- **Fallback to batch processing.** For long-running tasks (PDF generation, bulk exports), enqueue work in Cloudflare Queues or a similar system. Process asynchronously and notify the user when done.

If your support volume is under 100,000 tickets/month, this stack costs less than $100/month and scales elastically. Above that, you'll need to optimize for cost (caching, request batching, off-peak scheduling), but the core pattern holds.

For teams already invested in AWS, a similar architecture works with Lambda + DynamoDB Streams + API Gateway WebSockets. The programming model is messier (cold starts, IAM roles, CloudFormation templates), but the serverless primitives map cleanly.

One tool worth mentioning: CV Mirror, an MCP-based CV parsing agent, uses a comparable serverless pattern for stateful PDF extraction [cite: https://aimvantage.uk · 2026-09-10 · high]. It routes each uploaded CV to a Durable Object, which chunks the PDF, calls an OCR service, and assembles structured JSON. The agent then queries the JSON with natural language. The architecture mirrors ResolveHQ's ticket sessions, but applied to document workflows instead of support tickets.

## FAQ

### Q: Can Durable Objects handle 10,000 concurrent agents?

Yes, but you need to shard by agent ID. Each Durable Object is single-threaded, so if you route all agents to one object, they serialize. ResolveHQ creates one Durable Object per agent session (`agent:{id}`). Cloudflare distributes these objects across its global network, so 10,000 agents means 10,000 independent objects running in parallel.

### Q: How do you back up Durable Object state?

Durable Objects persist to Cloudflare's distributed storage automatically, but there's no built-in export API. ResolveHQ runs a nightly Worker that iterates over all ticket IDs (stored in KV) and fetches each ticket's state via HTTP. It writes the JSON to an S3 bucket for compliance and disaster recovery. Not elegant, but it works.

### Q: What about GDPR data deletion?

When a customer requests deletion, ResolveHQ's Worker calls a `/delete` endpoint on the ticket Durable Object, which purges all stored data and removes the ticket ID from KV. The nightly backup job excludes deleted tickets. For point-in-time recovery, deleted ticket IDs go into a tombstone list (also in KV), checked before any restore operation.