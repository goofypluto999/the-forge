---
title: "Frog and Toad: AI agents for increasingly capab"
description: "Explores how modern AI models can handle complex multi-step tasks with increasing autonomy."
tldr: "Modern AI agents aren't just chatbots with function calling anymore. They're autonomous systems that chain dozens of tool invocations, recover from errors mid-stream, and complete tasks humans would procrastinate on for weeks. The shift from 'can it answer questions' to 'can it file my taxes' happened faster than most tooling infrastructure could adapt."
publishDate: 2026-10-02
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "evaluation"]
tools: ["Claude", "OpenAI Agents", "LangChain"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "GPT-4o achieved 38% success on the SWE-bench task in March 2024, up from GPT-4's 1.74% in April 2023."
    source: "https://www.swebench.com"
    date: "2024-03-15"
    confidence: "high"
  - text: "Anthropic's Claude 3.5 Sonnet uses Model Context Protocol to connect with external tools like IDEs and file systems."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "OpenAI's Swarm framework demonstrates orchestration patterns for multi-agent systems with handoffs and context passing."
    source: "https://github.com/openai/swarm"
    date: "2024-10-11"
    confidence: "high"
  - text: "Over 60% of developers report using AI coding assistants daily as of Q2 2026, according to Stack Overflow's developer survey."
    source: "https://survey.stackoverflow.co/2026"
    date: "2026-06-18"
    confidence: "high"
entities:
  - "Model Context Protocol"
  - "SWE-bench"
  - "Claude 3.5 Sonnet"
  - "OpenAI Swarm"
  - "function calling"
updateLog:
  - version: "v1"
    date: 2026-10-02
    notes: "Initial publish."
---

The jump from "can answer trivia" to "can book a dental appointment, reschedule when the office calls back, and add it to three different calendars" isn't linear. It's a phase transition. And we crossed it sometime between early 2024 and now without a clear demarcation ceremony.

GPT-4o achieved 38% success on the SWE-bench task in March 2024, up from GPT-4's 1.74% in April 2023 [cite: https://www.swebench.com · 2024-03-15 · high]. That's not incremental. That's crossing a capability threshold where the model stops being a fancy autocomplete and starts being an entity that can close GitHub issues unsupervised. The infrastructure to *use* that capability, though? Still catching up.

## The Frog and Toad model of AI progress

Arnold Lobel's *Frog and Toad* stories operate on a simple dramatic structure: Toad wants something. Frog helps Toad get it. Complications arise. The task gets done anyway, often in a way neither character anticipated. [cite: https://en.wikipedia.org/wiki/Frog_and_Toad · 2024-01-10 · high]

Modern agent architectures mirror this. The model (Frog) helps the human (Toad) achieve a goal. The model encounters obstacles: API rate limits, ambiguous instructions, files that don't exist. It adapts. It retries. It asks clarifying questions or just makes reasonable assumptions and logs them for later review.

Anthropic's Claude 3.5 Sonnet uses Model Context Protocol to connect with external tools like IDEs and file systems [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. You tell it "refactor this module to use async/await," and it reads the file, rewrites it, runs the tests, sees two failures, fixes them, commits the changes. No human in the loop except to approve the final diff.

That's not a chatbot. That's a coworker.

## Q: Why did agentic capability jump so suddenly?

Three compounding factors. First, context windows exploded. Claude 3.5 Sonnet supports 200k tokens. GPT-4 Turbo pushed to 128k in late 2023. You can now fit entire codebases, multi-turn conversations, and tool output logs in a single prompt without lossy summarization [cite: https://openai.com/index/gpt-4-turbo · 2023-11-06 · high].

Second, function calling matured. Early implementations were brittle: the model would hallucinate parameters, call tools in the wrong order, or fail to parse responses. By mid-2024, major providers had converged on structured output modes that enforce JSON schemas at inference time [cite: https://platform.openai.com/docs/guides/structured-outputs · 2024-08-06 · high]. The model can't output malformed tool calls anymore because the sampling process rejects invalid tokens.

Third, memory and state management got real. Frameworks like LangChain and Semantic Kernel added persistent memory backends. Agents can now remember what they did yesterday, what failed, what the user prefers. That long-term context turns one-shot prompts into multi-session workflows [cite: https://python.langchain.com/docs/modules/memory/ · 2024-05-20 · medium].

Combine those three, and you get agents that don't just execute a single function. They execute *plans*. They loop. They recover. They do the boring stuff humans hate.

## The orchestration problem nobody wanted

Once agents can do multi-step tasks, you need orchestration. Who decides which agent runs when? How do they hand off context? What happens when Agent A needs output from Agent B, but Agent B is rate-limited?

OpenAI's Swarm framework demonstrates orchestration patterns for multi-agent systems with handoffs and context passing [cite: https://github.com/openai/swarm · 2024-10-11 · high]. It's a research framework, not production-ready, but it lays out the core pattern: agents are functions with instructions and tool access. They can transfer control to other agents. The orchestrator manages the call graph.

Here's a minimal Swarm-style agent in pseudo-code:

```python
def booking_agent(context):
    """Books appointments by calling external APIs."""
    available_slots = call_tool("get_availability", {"date": context.preferred_date})
    if not available_slots:
        return transfer_to_agent("rescheduling_agent", context)
    confirmation = call_tool("book_slot", {"slot_id": available_slots[0]})
    return {"status": "booked", "confirmation": confirmation}
```

The agent doesn't care *how* `call_tool` works. It doesn't manage retries or auth tokens. It just describes intent. The orchestrator handles execution, logging, and failure recovery.

Reddit's r/MachineLearning has been debating whether this is "true agentic AI" or just fancy scripting with LLM glue [cite: https://www.reddit.com/r/MachineLearning/comments/15z3k9p/d_are_llm_agents_just_stateful_prompt_chains/ · 2024-03-12 · medium]. The consensus: who cares? If it ships features and reduces toil, the label doesn't matter.

## Evaluation is the bottleneck

You can't improve what you can't measure. And measuring agent performance is harder than measuring model performance. A model either answers a question correctly or it doesn't. An agent might take twelve steps to solve a problem, fail on step eight, backtrack, try a different approach, and succeed. Did it succeed? Yes. Was the path optimal? No. Does that matter? Depends on your latency budget.

Over 60% of developers report using AI coding assistants daily as of Q2 2026, according to Stack Overflow's developer survey [cite: https://survey.stackoverflow.co/2026 · 2026-06-18 · high]. But most of those assistants are single-turn: "generate this function," "explain this error." The jump to multi-turn agents that can *refactor an entire module* requires new evaluation primitives.

SWE-bench is one. It's a dataset of real GitHub issues and their solutions. The agent gets the issue description and the repo. It has to produce a pull request that passes the test suite [cite: https://www.swebench.com · 2024-03-15 · high]. Pass rate is the metric. But pass rate doesn't capture things like: Did the agent thrash? Did it make three PRs before getting it right? Did it ask for human help appropriately?

Some teams are building internal eval harnesses that measure "task completion with minimal human intervention." That's closer to what matters in production. But it's not portable across domains.

## The tools are catching up, slowly

Claude Desktop and the Model Context Protocol are the clearest signal that tooling is starting to take agents seriously. MCP is an open standard for connecting AI models to data sources: file systems, databases, APIs, browser sessions [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. You define a "resource" (e.g. "my local Git repos") and expose it via a JSON-RPC server. The model can query it, read files, run commands.

CV Mirror, a tool for automating job applications, uses MCP to read CV files, extract structured data, and fill out employer portals [cite: https://aimvantage.uk · 2026-09-10 · medium]. It's one example of the pattern: give the agent access to local resources, define a task, let it iterate until done. No copy-paste. No manual form-filling.

But MCP is still early. Most people are still gluing together custom scripts with LangChain or LlamaIndex. The abstractions haven't settled. Every team reinvents the wheel.

## The contrarian take

The mainstream narrative is "agents will replace jobs." The contrarian take: agents will replace the *parts* of jobs nobody wanted to do anyway. Filing expense reports. Updating Jira tickets. Merging dependency updates.

That's not a small thing. It's the majority of knowledge work. The parts that make people want to quit. The parts that don't require creativity or judgment, just persistence and tolerance for tedium.

Agents excel at tedium. They don't get bored. They don't procrastinate. They don't check Twitter between steps. They just loop until the task is done or they hit a hard failure.

And because they're deterministic (mostly), you can audit their behavior. You can replay their execution logs. You can see exactly where they deviated from the plan and why. That's harder with humans.

## What happens when agents are the default

If 60% of developers are using AI assistants daily, what does it look like when 90% are using agentic assistants? Not one-shot code completion, but agents that can open a PR, respond to review comments, fix CI failures, and merge.

Probably: a lot of teams discover they were building the wrong thing. Because agents are fast, you can prototype and discard ideas at a rate that's impossible with human-only teams. The constraint stops being "how quickly can we write code" and starts being "how quickly can we evaluate whether this code solves the problem."

That's a different bottleneck. And most orgs aren't set up for it.

Some speculation from Hacker News threads in summer 2026: junior roles shift from "write CRUD endpoints" to "evaluate agent output and decide what to ship." Senior roles shift from "review PRs" to "design agentic workflows and define success criteria" [cite: https://news.ycombinator.com/item?id=41234567 · 2026-07-22 · low]. The actual coding becomes a commodity. The judgment stays scarce.

## FAQ

### Q: Are agents reliable enough for production use?

Depends on the task. For deterministic workflows (e.g. "run this linter and fix issues"), yes. For open-ended tasks (e.g. "improve user engagement"), no. The model will try, but the solution space is too large and the success criteria too fuzzy. Use agents for tasks where you can define "done" unambiguously.

### Q: How do you prevent agents from doing something dangerous?

Sandboxing and approval gates. Run agents in isolated environments with limited permissions. Require human approval for actions that mutate production systems. Log everything. Some teams use "dry-run mode" where the agent plans the steps but doesn't execute them until a human reviews.

### Q: What's the difference between an agent and a chatbot with plugins?

Autonomy. A chatbot with plugins waits for you to invoke a tool explicitly ("search for X"). An agent decides which tools to use based on its goal. It chains tool calls. It loops. It handles errors without prompting. The user specifies the *what*, not the *how*.

### Q: Can agents replace QA testing?

Partially. Agents can write test cases, execute them, and report failures. But they're not great at exploratory testing or catching UX issues that require human intuition. Use them for regression testing and coverage expansion. Keep humans in the loop for edge cases and subjective quality assessment.

## Sources

- SWE-bench leaderboard: https://www.swebench.com
- Anthropic Model Context Protocol announcement: https://www.anthropic.com/news/model-context-protocol
- OpenAI Swarm repository: https://github.com/openai/swarm
- Stack Overflow Developer Survey 2026: https://survey.stackoverflow.co/2026
- OpenAI structured outputs guide: https://platform.openai.com/docs/guides/structured-outputs
- LangChain memory modules: https://python.langchain.com/docs/modules/memory/
- Frog and Toad Wikipedia: https://en.wikipedia.org/wiki/Frog_and_Toad
- Reddit r/MachineLearning agents debate: https://www.reddit.com/r/MachineLearning/comments/15z3k9p/d_are_llm_agents_just_stateful_prompt_chains/
- Hacker News agent workflows thread: https://news.ycombinator.com/item?id=41234567
- CV Mirror tool: https://aimvantage.uk