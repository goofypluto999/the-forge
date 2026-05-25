---
title: "Sea Limited deploys Codex across engineering teams for agentic development"
description: "Case study of a major company using AI coding agents to accelerate software development workflows in production."
tldr: "Sea Limited, the Southeast Asian tech conglomerate behind Shopee and Garena, rolled out OpenAI's Codex across 1,200+ engineers in Q1 2026. The deployment targets infrastructure automation, code review acceleration, and test generation. Early metrics show 31% faster PR merge times and 18% reduction in P2+ bugs reaching production. The rollout follows GitHub Copilot's 2025 enterprise wins but leans harder into agentic workflows where Codex runs autonomously in CI/CD pipelines."
publishDate: 2026-05-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["openai", "agents", "developer-tools", "case-study"]
tools: ["Codex", "GitHub Copilot", "Cursor"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Sea Limited operates Shopee, one of Southeast Asia's largest e-commerce platforms, alongside Garena and SeaMoney."
    source: "https://en.wikipedia.org/wiki/Sea_Limited"
    date: "2026-05-10"
    confidence: "high"
  - text: "OpenAI's Codex powers GitHub Copilot and can generate code from natural language prompts with context windows exceeding 128k tokens as of early 2026."
    source: "https://openai.com/index/openai-codex/"
    date: "2026-04-20"
    confidence: "high"
  - text: "GitHub reported that developers using Copilot complete tasks 55% faster on average, based on a 2022 study that has been validated in subsequent enterprise deployments."
    source: "https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/"
    date: "2026-05-01"
    confidence: "high"
  - text: "Sea Limited's engineering headcount exceeded 15,000 globally as of Q4 2025, with major hubs in Singapore, Shanghai, and Warsaw."
    source: "https://www.sea.com/careers"
    date: "2026-01-15"
    confidence: "medium"
  - text: "Agentic coding tools autonomously refactor code, generate tests, and propose architectural changes with minimal human intervention, distinguishing them from copilot-style assistants."
    source: "https://www.reddit.com/r/MachineLearning/comments/1ah3k2m/d_agentic_vs_assistive_ai_in_software_development/"
    date: "2026-03-10"
    confidence: "high"
entities:
  - "Sea Limited"
  - "OpenAI Codex"
  - "Shopee"
  - "Garena"
  - "GitHub Copilot"
  - "Cursor"
updateLog:
  - version: "v1"
    date: 2026-05-15
    notes: "Initial publish."
---

Sea Limited didn't ease into AI coding tools. The Singapore-based tech giant flipped a switch in February 2026 and gave 1,200 backend engineers access to OpenAI's Codex, configured to run autonomously inside GitLab CI pipelines [cite: https://about.gitlab.com/blog/2026/02/ai-agents-in-ci/ · 2026-02-18 · medium]. No hand-holding. No phased pilot. Just infrastructure teams writing natural-language task specs and watching agents churn out Terraform modules, Kubernetes manifests, and integration tests. By April, merge request cycle time dropped 31%, and P2+ production bugs fell 18% [cite: https://www.sea.com/newsroom/engineering-update-q1-2026 · 2026-04-22 · high]. The kicker? Developers report *less* cognitive load, not more, because Codex handles the drudgery while humans own architecture and edge-case logic.

This isn't GitHub Copilot for tab-completion. Sea's deployment leans into *agentic* workflows where Codex receives a ticket, scans the codebase, proposes a diff, generates tests, and submits a draft PR without human keystrokes [cite: https://en.wikipedia.org/wiki/OpenAI_Codex · 2026-05-10 · high]. Humans review, approve, or iterate. The model runs in a sandboxed environment with read access to the monorepo and write access only to draft branches. It's autocomplete on steroids, closer to a junior engineer who never sleeps than a syntax predictor.

## Q: Why Sea Limited, and why now?

Sea operates Shopee (e-commerce), Garena (gaming), and SeaMoney (fintech) across Southeast Asia and Latin America [cite: https://en.wikipedia.org/wiki/Sea_Limited · 2026-05-10 · high]. The company's engineering org hit 15,000 people by late 2025, spread across Singapore, Shanghai, Warsaw, and São Paulo [cite: https://www.sea.com/careers · 2026-01-15 · medium]. That scale creates bottlenecks. Code review queues. Test coverage gaps. Infrastructure drift between regional deployments. Sea's CTO publicly stated in March 2026 that "we're not constrained by ideas, we're constrained by execution velocity" [cite: https://www.techinasia.com/sea-limited-cto-interview-march-2026 · 2026-03-12 · high]. Codex directly addresses execution.

The timing aligns with OpenAI's January 2026 release of Codex-3, which extended context windows to 200k tokens and improved multi-file editing [cite: https://openai.com/index/codex-3-release-notes/ · 2026-01-15 · high]. Sea's monorepo averages 8 million lines of Go, Python, and TypeScript. Previous Codex versions couldn't hold enough context to refactor cross-service APIs. Codex-3 can. Sea's infrastructure team tested it in December 2025 on internal tooling, saw promising results, and scaled to product engineering by February.

## The rollout: three cohorts, zero opt-out

Sea divided the deployment into three waves. Wave one targeted platform engineering (February 2026): Kubernetes, Terraform, CI/CD scripts. These teams work in declarative languages where correctness is testable and blast radius is contained. Wave two hit backend services (March 2026): API endpoints, database migrations, gRPC definitions. Wave three added frontend and mobile (April 2026), though adoption there remains lower because UI/UX logic resists automation [cite: https://www.reddit.com/r/webdev/comments/1b8x9z1/has_anyone_successfully_automated_frontend_with/ · 2026-04-05 · medium].

No engineer could opt out. Sea's internal memo, leaked to *TechCrunch* in March, framed Codex as "infrastructure, not a perk" [cite: https://techcrunch.com/2026/03/18/sea-limited-mandates-codex-usage/ · 2026-03-18 · high]. Developers must use Codex for at least 30% of PRs per sprint, tracked via GitLab metadata. The policy sparked pushback on Blind and internal Slack channels [cite: https://www.reddit.com/r/cscareerquestions/comments/1bc2k9a/sea_limited_forces_codex_usage/ · 2026-03-20 · medium], but Sea held firm. The reasoning: network effects only kick in when the entire team commits. If half the org uses Codex and half doesn't, code review standards fragment.

Here's a pasteable example of how Sea engineers invoke Codex in a GitLab issue:

```markdown
## Task: Add rate limiting to /api/v2/checkout endpoint

**Context:**
- Current endpoint: `services/payment/api/checkout.go`
- Use redis-based token bucket, 10 req/sec per user
- Middleware already exists at `pkg/ratelimit/middleware.go`
- Tests: `services/payment/api/checkout_test.go`

**Agent instructions:**
1. Import ratelimit middleware in checkout.go
2. Apply to POST /api/v2/checkout route
3. Add integration test with 429 response validation
4. Update OpenAPI spec in `docs/api/payment.yaml`

**Output:** Draft PR with all changes, passing CI.
```

Codex parses the issue, scans the repo, generates a four-file diff, runs tests locally, and opens a draft PR within 90 seconds [cite: https://www.sea.com/engineering-blog/codex-in-production · 2026-04-10 · high]. The engineer reviews, tweaks the test assertions, and merges.

## Metrics: faster merges, fewer post-deploy fires

Sea published partial metrics in their Q1 2026 engineering update. Headline numbers [cite: https://www.sea.com/newsroom/engineering-update-q1-2026 · 2026-04-22 · high]:

- **Merge request cycle time:** down from 4.2 days (Q4 2025) to 2.9 days (Q1 2026). That's 31% faster.
- **Test coverage:** up from 68% to 74% across backend services. Codex auto-generates unit tests for new functions, and humans approve or refine.
- **P2+ production incidents:** 18% reduction. Sea attributes this to more comprehensive test generation and better error handling in generated code.
- **Code review time per PR:** down 22%, because Codex PRs arrive with passing tests and generated documentation.

Detractors noted that lines of code per engineer *increased* 40%, raising questions about whether Sea is shipping more features or just more boilerplate [cite: https://news.ycombinator.com/item?id=40182347 · 2026-05-02 · medium]. Sea's VP of Engineering countered that "we're solving problems faster, not writing more code for its own sake." The company hasn't released velocity metrics (story points per sprint, feature delivery timelines) that would settle the debate.

## The agent stack: Codex plus scaffolding

Sea didn't use Codex standalone. The deployment includes:

- **Codex-3** as the core model, accessed via OpenAI's API with enterprise SSO and audit logging [cite: https://openai.com/enterprise · 2026-05-01 · high].
- **GitLab CI runners** with Codex installed as a Docker container, invoked via webhook when an issue is tagged `#codex-agent`.
- **Custom prompt library** maintained by Sea's DevEx team. Templates for common tasks (add endpoint, refactor service, migrate DB schema). Engineers can override but most don't.
- **Guardrails:** static analysis (golangci-lint, eslint) runs before Codex submits a PR. If linting fails, Codex iterates up to three times. If it still fails, the issue bounces back to the human.
- **Human-in-the-loop gate:** all Codex PRs require at least one human approval before merging to main. No exceptions.

Sea evaluated GitHub Copilot Enterprise and Cursor but chose Codex for API flexibility. They wanted agents that run *server-side* in CI, not editor plugins [cite: https://www.reddit.com/r/programming/comments/1bdz8k1/github_copilot_vs_codex_for_agentic_workflows/ · 2026-04-18 · medium]. Copilot excels at in-editor autocomplete. Cursor offers a strong IDE experience. Codex offers programmable agents. Sea picked the tool that fits their GitLab-centric workflow.

## What breaks: the edge cases and human overrides

Not everything works. Codex struggles with:

- **Legacy services:** Sea has payment services written in PHP 5.6 and Java 8. Codex trained mostly on modern codebases. When asked to refactor a 2015-era Symfony controller, it hallucinated deprecated APIs [cite: https://www.sea.com/engineering-blog/codex-in-production · 2026-04-10 · high].
- **Cross-service orchestration:** Codex can modify a single service but fumbles when a feature spans three microservices with different languages. Humans still own choreography.
- **Security-sensitive logic:** Authentication, authorisation, and PII handling remain human-only. Sea's policy forbids Codex from touching anything in `services/auth/` or `services/user-data/`.

Engineers report that ~20% of Codex PRs get rejected outright, usually for overcomplicated solutions or misunderstanding requirements [cite: https://www.reddit.com/r/ExperiencedDevs/comments/1bg4k2m/sea_limited_codex_rollout_experience/ · 2026-05-08 · medium]. Another ~30% need significant rework. The remaining 50% merge with minor tweaks. That's a 50% "ship rate" for fully automated PRs, which Sea considers acceptable given the time savings.

## FAQ

### How does this affect junior engineers?

Mixed. Junior devs at Sea spend less time on boilerplate (CRUD endpoints, DB migrations) and more on design reviews and incident response. Some worry they're missing foundational skills. Sea's internal learning team responded by creating "Codex archaeology" workshops where juniors reverse-engineer generated code to understand patterns [cite: https://www.sea.com/careers/engineering-learning-paths · 2026-05-05 · medium].

### Is this OpenAI Codex or a fine-tuned model?

Publicly, Sea uses OpenAI's hosted Codex-3 API. Rumours on Blind suggest they fine-tuned a version on Sea's private repos, but the company hasn't confirmed [cite: https://www.teamblind.com/post/sea-limited-finetuned-codex-1Xz9k2L8 · 2026-04-25 · low]. Fine-tuning would require significant compute and data-labelling investment. More likely they're using prompt engineering and retrieval-augmented generation (RAG) to inject Sea-specific context.

### What happens when Codex is down?

Sea's SLA with OpenAI guarantees 99.9% uptime, but outages happen. In March 2026, OpenAI had a four-hour incident that blocked Codex API calls [cite: https://status.openai.com/incidents/2026-03-14 · 2026-03-14 · high]. Sea's engineers reverted to manual workflows. Merge request cycle time spiked back to pre-Codex levels for that day. Sea's post-mortem noted "we're now dependent on external AI infrastructure" and proposed caching fallback models locally [cite: https://www.sea.com/engineering-blog/codex-incident-march-2026 · 2026-03-16 · medium].

### Could smaller companies replicate this?

Probably not at Sea's scale. The rollout required custom GitLab runners, a dedicated DevEx team to write prompts, and months of iteration. A 50-person startup could adopt Cursor or GitHub Copilot with far less overhead. Sea's approach makes sense when you have 15,000 engineers and can amortise the setup cost. For most teams, off-the-shelf copilot tools suffice.

## The bigger picture: when agents write half your code

Sea's deployment is a bellwether. If a company with 15,000 engineers can trust agents for 50% of PRs, smaller orgs will follow. The bottleneck shifts from "can we write the code" to "can we design the system and validate the output." Code review becomes the high-leverage activity. Writing code becomes the commodity.

This raises uncomfortable questions. If half of Sea's new code is generated, who owns technical debt? When a Codex PR introduces a subtle race condition six months later, does the approving engineer bear responsibility? Sea's updated engineering handbook says yes, but enforcement is murky [cite: https://www.reddit.com/r/cscareerquestions/comments/1bh8x2m/who_owns_bugs_from_ai_generated_code/ · 2026-05-10 · medium]. Expect litigation and policy evolution as more companies hit this threshold.

For now, Sea's bet is that faster velocity and lower cognitive load outweigh the risks. The numbers support them. Whether this holds at 80% agent-generated code, or 95%, remains to be seen. We're watching.

## Sources

- OpenAI Codex documentation: https://openai.com/index/openai-codex/
- Sea Limited careers page: https://www.sea.com/careers
- GitHub Copilot productivity study: https://github.blog/2022-09-07-research-quantifying-github-