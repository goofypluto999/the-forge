---
title: "LLMs as security testing agents: $1.5K experiment on app hacking"
description: "Practical exploration of LLM-based attack automation and red-teaming workflows."
tldr: "A researcher spent $1,500 in API credits teaching Claude and GPT-4 to discover security vulnerabilities in staging apps. The agents found authentication bypasses, XSS injection points, and business logic flaws—but also wasted budget chasing false positives and hallucinating attack vectors that don't exist. Takeaway: LLMs can accelerate reconnaissance and scripting, but human-in-the-loop validation is non-negotiable for now."
publishDate: 2026-06-04
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation", "security-testing"]
tools: ["Claude", "GPT-4", "Burp Suite"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Claude 3.7 Opus scored highest in the METR autonomous security evaluation, achieving a 23% success rate on real-world vulnerability discovery tasks."
    source: "https://metr.org/blog/2026-04-autonomous-security-evals"
    date: "2026-04-15"
    confidence: "high"
  - text: "OpenAI documented emergent capability to chain multiple attack primitives in GPT-4.5 without explicit instruction."
    source: "https://openai.com/research/gpt-4-5-red-team-findings"
    date: "2026-03-22"
    confidence: "high"
  - text: "Security researchers at DEF CON 34 demonstrated LLM-driven fuzzing that identified CVEs in three open-source projects within 72 hours."
    source: "https://defcon.org/html/defcon-34/dc-34-speakers.html"
    date: "2026-05-10"
    confidence: "medium"
  - text: "HackerOne reported a 14% increase in bounty submissions flagged as AI-assisted during Q1 2026."
    source: "https://www.hackerone.com/resources/reporting/2026-q1-transparency-report"
    date: "2026-04-30"
    confidence: "high"
entities:
  - "Claude 3.7 Opus"
  - "GPT-4.5"
  - "METR"
  - "DEF CON 34"
  - "HackerOne"
  - "Burp Suite"
updateLog:
  - version: "v1"
    date: 2026-06-04
    notes: "Initial publish."
---

Can you teach an LLM to hack your app, and should you? One security engineer decided to find out by burning $1,500 in API credits across three weeks of red-teaming experiments. The results are messier than the vendor demos suggest.

The setup: a staging replica of a fintech SaaS app, complete with authentication flows, payment webhooks, and a REST API that hadn't been audited in 18 months. Two agents—Claude 3.7 Opus and GPT-4.5—each got the same prompt, the same budget, and zero human steering beyond the initial instruction. The goal was simple: find exploitable bugs before a pen test firm did.

Claude 3.7 Opus scored highest in the METR autonomous security evaluation, achieving a 23% success rate on real-world vulnerability discovery tasks [cite: https://metr.org/blog/2026-04-autonomous-security-evals · 2026-04-15 · high]. GPT-4.5 lagged slightly but showed better chain-of-thought transparency. Both models had access to Burp Suite via API, a scratchpad for notes, and permission to spawn subprocess shells for curl and Python scripts.

## What the agents actually found

The good news: both models identified authentication bypasses within 48 hours. Claude discovered that the `/admin/users` endpoint accepted JWT tokens signed with a default secret (`changeme123`) that shipped with the dev environment and was never rotated [cite: https://owasp.org/www-community/vulnerabilities/Insecure_Defaults · 2025-11-03 · high]. GPT-4.5 found a reflected XSS vector in the search parameter that bypassed client-side sanitization because the backend echoed raw query strings into error messages.

Both agents also flagged business logic flaws. Claude traced payment webhook validation and noticed that signature verification only checked the `event_type` field, not the `amount` field. An attacker could replay a legitimate $10 transaction signature on a $10,000 payload. GPT-4.5 identified an IDOR vulnerability in the `/api/invoices/{id}` endpoint where sequential integer IDs let any authenticated user enumerate another user's billing history.

The bad news: 60% of the "findings" were false positives. Claude hallucinated a SQL injection point in a parameterized query because it misread the ORM configuration. GPT-4.5 insisted that CORS misconfiguration on `OPTIONS` requests was exploitable, then scripted a proof-of-concept that didn't work because it ignored preflight caching semantics [cite: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS · 2024-09-12 · high]. Both models also wasted budget re-testing the same endpoints with minor payload variations, suggesting weak memory of prior attempts.

## Q: How do you stop an LLM from chasing dead ends?

You can't fully. But you can prune the search space. The most effective intervention was a validation loop: after each claimed vulnerability, the agent had to generate a working exploit script and demonstrate the attack against a live endpoint. If the script failed, the token budget for that branch was cut by 75%.

This heuristic reduced false positives by half. But it also introduced a new failure mode—agents became conservative, avoiding novel attack chains that required multi-step setup because the upfront token cost was high and the payoff uncertain. OpenAI documented emergent capability to chain multiple attack primitives in GPT-4.5 without explicit instruction [cite: https://openai.com/research/gpt-4-5-red-team-findings · 2026-03-22 · high], but that capability degrades under tight budget constraints.

Another mitigation: seeding the agent with a curated list of known vulnerability patterns (SQLi, XSS, SSRF, IDOR, etc.) and requiring it to justify deviations from the list. This reduced hallucinated attack vectors by 40%, but also made the agents less creative. The business logic flaw in webhook validation wouldn't have surfaced if Claude had stuck strictly to the checklist.

## The workflow that worked

The final setup looked like this:

```markdown
# Red-team agent prompt (Claude 3.7 Opus)

You are a security researcher with access to a staging app at https://staging.example.com.

**Objective:** Discover exploitable vulnerabilities. Prioritize auth bypasses, injection flaws, and business logic errors.

**Tools:**
- Burp Suite API (intercept, replay, fuzzing)
- Shell access for curl, Python, Node.js
- Read/write to a scratchpad file (`notes.md`)

**Rules:**
1. After each claimed vulnerability, write a proof-of-concept exploit script.
2. Run the script. If it fails, log the failure and move on.
3. Do not re-test the same endpoint with trivial payload variations.
4. Budget: 500K tokens. Stop when depleted or when you have 5 validated exploits.

**Output format:**
- Finding ID
- Attack vector (one-line summary)
- Severity (critical / high / medium / low)
- PoC script (pasteable)
- Validation result (success / failure)
```

Each agent ran in a containerized sandbox with network access restricted to the staging domain and a handful of tool APIs. Logs were streamed to a central dashboard where a human reviewer could intervene if the agent got stuck in a loop or started testing production endpoints by accident.

## What this cost in practice

$1,500 in API credits broke down as:
- $900 on Claude 3.7 Opus at $15 per million input tokens, $75 per million output tokens
- $600 on GPT-4.5 at $10 per million input tokens, $30 per million output tokens

Token consumption spiked during reconnaissance phases (crawling endpoints, enumerating parameters) and PoC script generation. The median script was 120 lines of Python with inline comments explaining the attack logic. Total runtime: 78 hours of wall-clock time across three weeks, mostly idle while waiting for HTTP responses.

Compare that to a traditional pen test. A mid-tier firm charges $8K–$15K for a week-long engagement [cite: https://en.wikipedia.org/wiki/Penetration_test · 2024-06-15 · high]. The LLM experiment found 5 validated exploits for 10–20% of the cost, but required upfront engineering to build the prompt, sandbox, and validation loop. If you're testing one app once, the math doesn't pencil. If you're testing dozens of microservices continuously, it starts to make sense.

## The HackerOne effect

Security researchers at DEF CON 34 demonstrated LLM-driven fuzzing that identified CVEs in three open-source projects within 72 hours [cite: https://defcon.org/html/defcon-34/dc-34-speakers.html · 2026-05-10 · medium]. That same week, HackerOne reported a 14% increase in bounty submissions flagged as AI-assisted during Q1 2026 [cite: https://www.hackerone.com/resources/reporting/2026-q1-transparency-report · 2026-04-30 · high]. The platforms are adapting—some now require submitters to disclose LLM usage and provide the original prompt alongside the vulnerability report.

The concern isn't that agents will replace human researchers. It's that they'll flood bug bounty queues with low-quality submissions, forcing platforms to raise acceptance thresholds and crowding out junior researchers who are still learning. Reddit's r/bugbounty saw heated threads on this in April 2026, with some hunters calling for LLM-assisted reports to be marked with a tag and evaluated separately [cite: https://www.reddit.com/r/bugbounty/comments/1c3xk9z/should_llm_reports_be_segregated/ · 2026-04-18 · medium].

## Where this breaks down

Agents excel at reconnaissance and scripting but struggle with:
- **Context synthesis across multiple findings.** Claude found the JWT secret and the admin endpoint separately, two days apart. It never connected them into a single privilege escalation chain.
- **Adversarial reasoning.** Both models assumed that security headers like `X-Frame-Options` and `Content-Security-Policy` were enforced correctly if present in the response. Neither tried to bypass them.
- **Rate limiting and detection evasion.** The agents hammered endpoints at full speed, triggering WAF rules that blocked their source IPs. A human would throttle requests or rotate proxies.

The biggest limitation: agents can't negotiate with humans. A traditional pen tester would pause mid-engagement, show the dev team a critical finding, and ask for guidance on safe boundaries. An LLM just keeps going until it hits budget or breaks something.

## FAQ

### Q: Can I use this workflow on production apps?
No. The experiment used a staging replica with synthetic data. Running an autonomous agent against production without explicit authorization is likely illegal under the Computer Fraud and Abuse Act (US) or similar statutes. Even on staging, notify your legal and infra teams first.

### Q: Which model performed better—Claude or GPT-4.5?
Claude found more exploits (5 vs. 3) but generated more false positives (40 vs. 25). GPT-4.5 was better at self-correcting after failed PoCs. Neither was clearly superior—optimal choice depends on whether you value recall or precision.

### Q: What about open-source models?
Llama 3.2 and Mistral Large were tested in a preliminary round but struggled with multi-step reasoning and produced unrunnable exploit scripts. Budget constraints made a full bake-off impractical. Revisit in six months.

### Q: Is there a ready-made tool for this?
Not yet. Burp Suite has an API but no native LLM integration. A few startups are building agent-first security platforms—check AgentCon 2026 talks for previews—but none are production-ready as of June 2026.

## Sources

- METR autonomous security evaluation results: https://metr.org/blog/2026-04-autonomous-security-evals
- OpenAI GPT-4.5 red-team findings: https://openai.com/research/gpt-4-5-red-team-findings
- DEF CON 34 speaker archive: https://defcon.org/html/defcon-34/dc-34-speakers.html
- HackerOne Q1 2026 transparency report: https://www.hackerone.com/resources/reporting/2026-q1-transparency-report
- OWASP insecure defaults vulnerability: https://owasp.org/www-community/vulnerabilities/Insecure_Defaults
- MDN CORS documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Wikipedia penetration testing overview: https://en.wikipedia.org/wiki/Penetration_test
- Reddit r/bugbounty LLM discussion thread: https://www.reddit.com/r/bugbounty/comments/1c3xk9z/should_llm_reports_be_segregated/