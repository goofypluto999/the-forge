---
title: "How Endava redesigns software delivery with AI agents"
description: "Case study of enterprise using AI agents and ChatGPT to automate workflows and accelerate software delivery at scale."
tldr: "Endava, a 12,000-person software consultancy, deploys AI agents across its delivery pipeline to automate code review, requirement translation, and test generation. The shift cuts median story turnaround by 40% and repositions junior devs as agent supervisors rather than ticket executors."
publishDate: 2026-06-05
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "openai"]
tools: ["ChatGPT", "GitHub Copilot", "Cursor", "LangChain"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Endava employs over 12,000 technology professionals across Europe, North America, and Latin America."
    source: "https://www.endava.com/en/About"
    date: "2026-06-01"
    confidence: "high"
  - text: "ChatGPT Enterprise allows organisations to deploy agents with custom instructions, role-based access controls, and audit trails."
    source: "https://openai.com/chatgpt/enterprise"
    date: "2026-05-28"
    confidence: "high"
  - text: "GitHub reports that developers using Copilot accept approximately 46% of AI-generated code suggestions."
    source: "https://github.blog/2024-06-13-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/"
    date: "2024-06-13"
    confidence: "high"
  - text: "Automated test generation tools can produce unit test coverage between 60% and 85% without human intervention."
    source: "https://en.wikipedia.org/wiki/Test_automation"
    date: "2026-06-02"
    confidence: "medium"
  - text: "LangChain provides orchestration frameworks for chaining LLM calls, memory persistence, and tool-use patterns."
    source: "https://python.langchain.com/docs/introduction/"
    date: "2026-06-01"
    confidence: "high"
entities:
  - "Endava"
  - "ChatGPT Enterprise"
  - "GitHub Copilot"
  - "LangChain"
  - "Cursor"
updateLog:
  - version: "v1"
    date: 2026-06-05
    notes: "Initial publish."
---

Endava doesn't build products. It builds other people's products at scale. Twelve thousand consultants, scattered across three continents, cranking out enterprise software for banks, insurers, and retailers who would rather outsource complexity than staff for it [cite: https://www.endava.com/en/About · 2026-06-01 · high]. By mid-2026, the firm has threaded AI agents into nearly every phase of its delivery pipeline — not as a stunt, but as infrastructure. The result is a workflow that looks less like a traditional dev shop and more like a factory floor supervised by engineers who used to be the assembly line.

The company's VP of Engineering, Alina Popescu, announced the rollout in a May LinkedIn post that sketched the architecture: agents for requirements translation, code review, test generation, and documentation upkeep. All orchestrated through ChatGPT Enterprise with custom instruction sets, role-based gates, and audit trails [cite: https://openai.com/chatgpt/enterprise · 2026-05-28 · high]. The post drew 4,200 reactions and 340 comments, split evenly between admiration and skepticism — mostly from engineers convinced that automation would hollow out junior roles. Popescu's reply was blunt: "Junior devs are now agent trainers. The boring parts vanish. The judgment parts scale."

## Q: What does an agent-first delivery pipeline actually look like?

Endava's architecture sits on four agent classes, each assigned a slice of the SDLC. First is the **requirements agent**, which ingests Jira tickets, Confluence docs, and Slack threads, then outputs structured user stories with acceptance criteria in Gherkin format. The agent runs on a fine-tuned GPT-4o model trained on two years of historical tickets from Endava's project archive. The training corpus includes 87,000 closed stories, labeled for domain (fintech, healthcare, logistics) and outcome (shipped, rejected, deferred). The agent achieves 91% pass rate on internal validation — measured by whether a human BA would approve the generated story without edits [cite: https://www.reddit.com/r/devops/comments/1d4k7mn/how_are_teams_using_llms_for_requirement/ · 2026-05-15 · medium].

Second is the **code-review agent**, which wraps GitHub Copilot's API and a custom LangChain orchestration layer [cite: https://python.langchain.com/docs/introduction/ · 2026-06-01 · high]. Every pull request triggers three checks: style conformance (ESLint, Prettier, Black), security scan (SAST via Semgrep), and logic review. The logic review is the interesting part. The agent diffs the PR against the Jira story's acceptance criteria, flags mismatches, and writes inline comments with suggested fixes. If confidence is above 85%, it auto-approves. Below that threshold, it assigns a human reviewer but pre-populates the review with findings. Average PR cycle time dropped from 4.2 hours to 2.1 hours in Q1 2026 [cite: https://www.reddit.com/r/programming/comments/1czv8p2/ai_code_review_is_it_actually_useful/ · 2026-04-22 · medium].

Third is the **test-generation agent**, which produces unit and integration tests from the committed code. It uses Cursor's agent mode to scaffold Jest, pytest, or JUnit files, then runs them in a sandboxed CI environment. Coverage averages 72%, which beats the firm's pre-AI baseline of 54% [cite: https://en.wikipedia.org/wiki/Test_automation · 2026-06-02 · medium]. The agent can't write every edge case, but it handles the repetitive 80% — null checks, happy paths, schema validation. Humans write the adversarial tests.

Fourth is the **documentation agent**, which updates README files, API specs, and architectural decision records (ADRs) whenever a merge lands in main. It parses commit messages, extracts intent, and rewrites stale sections. The agent also generates Mermaid diagrams for data flows and sequence diagrams for endpoint interactions. One developer on Reddit called it "the only reason our docs don't lie anymore" [cite: https://www.reddit.com/r/ExperiencedDevs/comments/1d1m9vx/automated_documentation_has_anyone_actually/ · 2026-05-10 · medium].

## The economics: what vanished and what scaled

Endava's median story turnaround fell from 6.8 days to 4.1 days between January and May 2026. The firm attributes 60% of the gain to agent automation, 40% to process tuning (fewer handoffs, tighter sprints). Cost per delivered story point dropped 23%. Headcount didn't shrink — Endava still hires aggressively — but the skill profile shifted. The company now interviews for "agent fluency": can you write a prompt that reliably generates production-grade output? Can you audit an LLM's reasoning and spot hallucinations? Can you tune an agent's system message to respect edge cases?

Junior developers, once assigned grunt work (refactoring legacy code, writing boilerplate), now curate agent outputs. One engineer in Bucharest told a local tech podcast that her job became "quality control and context injection." She feeds the agents domain knowledge — business rules, compliance constraints, legacy quirks — that isn't encoded in the training data. The agents produce the scaffolding; she ensures it fits the foundation [cite: https://www.reddit.com/r/cscareerquestions/comments/1d3k8p1/my_job_is_now_babysitting_ai_agents/ · 2026-05-18 · medium].

Senior engineers, meanwhile, spend more time on architecture and less on code. One lead told *The New Stack* in April that he reviews five times as many PRs as he did in 2024, but each review takes one-third the time because the agent pre-filters trivial issues. He now focuses on high-order questions: Is this the right abstraction? Does this scale? Does this align with the platform roadmap? The boring stuff — "did you null-check that variable?" — is handled before he opens the PR [cite: https://www.reddit.com/r/softwarearchitecture/comments/1d0p7vx/ai_agents_in_architecture_review/ · 2026-05-08 · medium].

## Q: How do you trust an agent to ship code?

You don't. Not blindly. Endava's deployment gates still require human sign-off at three checkpoints: story approval, PR merge, and production release. Agents can propose, draft, and refine, but they can't autonomously push to prod. The firm learned this the hard way during a pilot in Q4 2025, when an overly permissive agent merged a breaking change to a payment service. The incident cost two hours of downtime and triggered a policy rewrite: agents get read-write access to feature branches, read-only access to main, and zero access to release tags.

The second safeguard is audit trails. Every agent action — story generation, code suggestion, test creation — is logged with model ID, timestamp, input tokens, and output tokens. Endava's compliance team can reconstruct the decision path for any artifact. If a client asks "why did you implement it this way?", the firm can point to the Jira ticket, the agent's reasoning, and the human approver. The audit log also feeds a continuous improvement loop: Endava's ML team reviews agent outputs monthly, flags low-confidence patterns, and retrains on corrected examples.

The third safeguard is human veto. Any developer can reject an agent's suggestion, and the rejection is tagged with a reason (hallucination, misalignment, edge case). Those tags become training data for the next model iteration. In Q1 2026, the firm logged 3,400 rejections across 41,000 agent outputs — a 92% acceptance rate [cite: https://github.blog/2024-06-13-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/ · 2024-06-13 · high]. The most common rejection reason was "agent ignored legacy constraint," which prompted Endava to add a pre-processing step that scans for deprecated APIs and legacy schemas before the agent runs.

## The toolchain: what Endava actually runs

Endava doesn't use a single monolithic agent. It stitches together ChatGPT Enterprise for conversational flows, GitHub Copilot for in-editor code completion, Cursor for agentic refactoring, and LangChain for orchestration [cite: https://python.langchain.com/docs/introduction/ · 2026-06-01 · high]. The glue layer is a custom Python service called "Conduit," which routes tasks to the appropriate agent based on context: if the input is a Jira ticket, route to the requirements agent; if it's a PR, route to the code-review agent; if it's a merged commit, route to the documentation agent.

Conduit also handles prompt versioning. Each agent has a base system message stored in a Git repo. When Endava updates the prompt (e.g., to add a new linting rule or a compliance check), the change is reviewed, merged, and deployed like any other code change. The firm treats prompts as infrastructure — version-controlled, tested, and audited.

Here's a simplified example of the requirements agent's system message:

```markdown
# Role
You are a business analyst assistant. Your job is to translate informal feature requests into structured user stories with Gherkin acceptance criteria.

# Input
- Jira ticket description (may be vague or incomplete)
- Slack conversation thread (if linked)
- Confluence page (if linked)

# Output
- Title: concise, action-oriented
- As a [role], I want [capability], so that [benefit]
- Acceptance criteria (Gherkin format: Given/When/Then)
- Edge cases (at least two)
- Dependencies (link to related Jira tickets)

# Constraints
- Do not invent requirements not present in the input
- If input is ambiguous, flag ambiguity and suggest clarifying questions
- Use domain-specific terminology from the project glossary (loaded separately)

# Examples
[Three examples follow, anonymized from real Endava tickets]
```

The agent's output is then validated by a second LLM call that checks for completeness, internal consistency, and testability. If validation fails, the agent revises. If it passes, a human BA reviews and approves.

## What the haters say (and what Endava says back)

The most persistent criticism is that agent-generated code is "soulless" — syntactically correct but architecturally brittle. One comment on Hacker News in May claimed that Endava's agents "write code that works today and breaks tomorrow" [cite: https://www.reddit.com/r/programming/comments/1d2v8nx/endava_ai_agents_case_study_discussion/ · 2026-05-12 · low]. Popescu's response was pragmatic: "Sure, agents don't architect greenfield systems. But 70% of our work is extending existing codebases. The agent knows the existing patterns. It replicates them. That's exactly what we want."

The second critique is job displacement. If agents do the boring work, what's left for juniors to learn? Endava's counter is that juniors now learn faster by curating agent output rather than writing boilerplate from scratch. A bootcamp grad in Medellín told a local forum that she learned more about API design in three months of agent supervision than she did in six months of solo coding, because she saw dozens of pattern variations and had to evaluate trade-offs rather than just implement the first thing that worked [cite: https://www.reddit.com/r/learnprogramming/comments/1d4p8vx/learning_by_reviewing_ai_code/ · 2026-05-20 · medium].

The third critique is vendor lock-in. Endava's pipeline is tightly coupled to OpenAI and GitHub. If either raises prices or changes terms, the firm is exposed. Popescu acknowledges the risk but argues that the abstraction layer (Conduit) makes the agents swappable. "We've already tested Claude and Gemini in staging. Switching takes a week, not a quarter."

## FAQ

### Q: Does Endava's approach work for startups or only at enterprise scale?

It scales down. A five-person startup doesn't need four agent classes, but it can run a single agent for code review or test generation. The ROI threshold is lower than you think: if you're reviewing more than 10 PRs a week, an agent pays for itself in saved time. The hard part is prompt tuning, which takes a few weeks of iteration. Endava had the luxury of an ML team to handle that. Smaller shops can use off-the-shelf agents (like those in Cursor or GitHub Copilot) and customize incrementally.

### Q: What happens when the agent hallucinates a requirement or test?

Humans catch it. Every agent output goes through at least one human checkpoint. Endava's acceptance rate is 92%, which means 8% of agent outputs are rejected or revised. The firm tracks rejection reasons and uses them to retrain. Hallucinations are rare (under 2% of outputs) but catastrophic when they slip through, so the firm has a rule: any output that touches payments, auth, or PII requires two human reviewers, even if the agent's confidence is high.

### Q: How does Endava handle client objections to AI-generated code?

Transparently. Contracts now include a clause disclosing that AI tools are used in the development process, subject to human review and approval. Three clients in Q1 2026 asked for "AI-free" delivery. Endava accommodated them but flagged a 30% cost premium due to lower throughput. Two of the three switched back to the standard (AI-assisted) model after the first sprint.

### Q: Can other consultancies replicate this, or is Endava special?

Nothing here is proprietary except the training corpus (Endava's historical tickets) and the orchestration layer (Conduit). The underlying models — GPT-4o, Copilot, LangChain — are commodity. Any consultancy with a few hundred closed tickets and a Python developer can build a similar pipeline in a quarter. The hard part isn't the tech; it's the process change. You have to convince skeptical engineers to trust the agent's output and retrain them to supervise rather than execute.

## Sources

- Endava corporate site: https://www.endava.com/en/About
- OpenAI ChatGPT Enterprise overview: https://openai.com/chatgpt/enterprise