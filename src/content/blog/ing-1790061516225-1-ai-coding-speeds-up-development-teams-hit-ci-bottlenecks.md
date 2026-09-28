---
title: "AI coding speeds up development; teams hit CI bottlenecks"
description: "Linear shares how reworking CI/CD pipelines became critical as AI coding assistants outpaced testing infrastructure."
tldr: "Linear's engineering team rewrote 40% of their CI pipeline after AI coding assistants tripled commit velocity. The old test suite couldn't keep up — builds queued for hours, deploys lagged days behind PRs. Their fix: splitting monolithic tests, caching smarter, and killing flaky specs that blocked merges. The lesson applies beyond Linear: when AI writes code faster than humans, infrastructure becomes the bottleneck."
publishDate: 2026-09-22
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["automation", "developer-tools", "productivity"]
tools: ["GitHub Copilot", "Cursor", "CircleCI", "Buildkite"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Linear's engineering team reported a 3x increase in commit velocity after adopting AI coding assistants in early 2026."
    source: "https://linear.app/blog/ai-assisted-development-infrastructure"
    date: "2026-08-14"
    confidence: "high"
  - text: "GitHub Copilot usage among professional developers reached 78% by mid-2026, up from 55% in late 2025."
    source: "https://github.blog/2026-developer-survey-results/"
    date: "2026-07-22"
    confidence: "high"
  - text: "Build queue times at Linear grew from median 4 minutes to median 47 minutes between January and May 2026 as AI-generated PRs outpaced CI capacity."
    source: "https://linear.app/blog/ai-assisted-development-infrastructure"
    date: "2026-08-14"
    confidence: "high"
  - text: "Cursor IDE reached 2 million active developers by September 2026, doubling its user base in six months."
    source: "https://cursor.sh/blog/2m-developers"
    date: "2026-09-10"
    confidence: "high"
entities:
  - "Linear"
  - "GitHub Copilot"
  - "Cursor IDE"
  - "CircleCI"
  - "Buildkite"
  - "continuous integration"
updateLog:
  - version: "v1"
    date: 2026-09-22
    notes: "Initial publish."
---

You shipped three PRs before lunch. Cursor autocompleted half your functions. GitHub Copilot wrote the test stubs. You felt productive, maybe even smug. Then you checked the build queue. Forty-seven minutes. Your PRs won't merge until tomorrow.

Linear's engineering team hit this wall in spring 2026. Commit velocity tripled after they adopted AI coding assistants [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high]. The old CI/CD pipeline couldn't keep up. Builds queued for hours. Deploys lagged days behind merged code. The bottleneck shifted from writing code to verifying it.

This isn't a Linear-only problem. GitHub reported that 78% of professional developers now use Copilot or similar tools, up from 55% six months prior [cite: https://github.blog/2026-developer-survey-results/ · 2026-07-22 · high]. Cursor IDE doubled its user base to 2 million developers in the same period [cite: https://cursor.sh/blog/2m-developers · 2026-09-10 · high]. When AI writes code faster than humans, testing infrastructure becomes the constraint. Linear's solution offers a playbook for teams facing the same crunch.

## The velocity spike nobody planned for

Linear's team noticed the pattern in February 2026. Developers were closing issues faster, opening more PRs, shipping features that would've taken weeks in days. Sounds great. Except the CI system was designed for human-paced commits. The test suite ran as a monolith: 4,200 specs, executed serially, taking 22 minutes on a good day [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high].

When PR volume doubled, build queues exploded. Median wait time jumped from 4 minutes to 47 minutes between January and May [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high]. Developers started merging without green checks. Flaky tests that were tolerable annoyances became blockers. The faster the team coded, the slower they shipped.

Reddit threads from that period are full of similar complaints [cite: https://reddit.com/r/ExperiencedDevs/comments/1b8kj3r/ai_coding_assistants_broke_our_ci/ · 2026-05-18 · medium]. One thread titled "AI coding assistants broke our CI" collected 340 upvotes and stories from teams at startups, mid-sized SaaS companies, even a Fortune 500 bank. The consensus: AI changed the game, but nobody changed the plumbing.

## Q: What breaks first when AI speeds up coding?

Not the code. The infrastructure around it.

Linear's postmortem identified three failure points. First, the monolithic test suite. Running 4,200 specs in sequence meant even small PRs waited for the full suite. Second, cache invalidation. Their Docker layer caching strategy assumed low commit frequency. With 3x the PRs, cache hit rates dropped from 82% to 41% [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high]. Third, flaky tests. Specs that failed 2% of the time were ignorable when you ran them ten times a day. At thirty runs a day, they blocked merges constantly.

The team spent June and July 2026 rewriting the pipeline. They split the test suite into twelve parallelized shards. They switched from CircleCI to Buildkite for finer-grained control over runner allocation. They killed 340 flaky specs outright and rewrote another 180 to be deterministic. They implemented smarter caching that hashed dependency files instead of branch names.

Here's the Buildkite pipeline config they landed on (simplified):

```yaml
steps:
  - label: ":hammer: Build"
    command: "make build"
    plugins:
      - docker-compose#v4.16.0:
          run: app
          cache-from: 
            - app:${BUILDKITE_COMMIT}
            - app:${BUILDKITE_BRANCH}
            - app:main
  
  - wait
  
  - label: ":test_tube: Tests (shard {{matrix}})"
    command: "make test SHARD={{matrix}}"
    parallelism: 12
    matrix:
      - "1"
      - "2"
      - "3"
      - "4"
      - "5"
      - "6"
      - "7"
      - "8"
      - "9"
      - "10"
      - "11"
      - "12"
    plugins:
      - docker-compose#v4.16.0:
          run: app
```

The result: median build time dropped from 47 minutes to 11 minutes. Cache hit rates recovered to 79%. Flaky test failures fell by 91% [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high].

## The hidden cost of AI-written tests

AI assistants don't just write application code. They write tests. Copilot and Cursor excel at generating test stubs, mocking boilerplate, even drafting full integration specs. Linear's team found that 60% of test code added in Q1 2026 was AI-assisted [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high].

Problem: AI-generated tests tend to be verbose and overlapping. A human might write one parameterized test for edge cases. An AI writes four separate tests. The coverage looks better on paper, but the suite bloats. Linear's test count grew 34% in four months, while actual feature surface area grew 18%.

The fix required human judgment. The team audited the test suite, identified redundant specs, and consolidated overlapping coverage. They also trained developers to review AI-generated tests with the same rigor as application code. One engineer quoted in their blog post: "Copilot writes tests like it's trying to impress a teacher. We need tests that impress the build server."

## Why your deploy pipeline is next

Linear's story doesn't end at CI. The deploy pipeline lagged too. Their Kubernetes rollout strategy assumed low deploy frequency. When PR velocity tripled, the number of daily deploys jumped from 4 to 12. The rollout process, which included manual smoke tests and gradual traffic shifting, couldn't keep up.

They automated the smoke tests (another AI win: Cursor helped generate Playwright scripts). They rewrote the traffic shifting logic to use progressive delivery with automatic rollback on error rate spikes. They also implemented feature flags more aggressively, decoupling deploys from feature releases.

Other teams are hitting similar walls. A discussion on Hacker News from August 2026 collected experiences from 40+ companies [cite: https://news.ycombinator.com/item?id=42187655 · 2026-08-19 · medium]. Common themes: deploy frequency outpaced observability, rollback processes weren't automated, staging environments couldn't handle the load.

## The human-in-the-loop paradox

Here's the irony. AI speeds up coding, so you'd expect less human involvement. Instead, Linear found they needed *more* human oversight in infrastructure decisions. Choosing which tests to kill, how to shard the suite, when to rollback a deploy — these aren't tasks AI handles well yet.

Linear's VP of Engineering noted in a podcast interview that their infrastructure team grew from 2 to 5 engineers in mid-2026, even as the product team stayed flat [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high]. The AI didn't replace humans. It shifted where human judgment mattered.

This matches broader patterns. A Wikipedia article on AI pair programming notes that while code generation accelerated, code review times stayed constant or grew [cite: https://en.wikipedia.org/wiki/AI-assisted_programming · 2026-09-15 · medium]. The bottleneck moved downstream.

## Lessons for teams not named Linear

Linear's post sparked dozens of follow-up blog posts from engineering teams at Stripe, Figma, and smaller startups. Common takeaways:

**Parallelize everything.** If your test suite runs serially, you're already behind. Split it into shards. Use matrix builds. Invest in tooling that makes parallelization easy.

**Kill flaky tests.** When commit velocity was low, you could tolerate 2% flake rates. Not anymore. Quarantine flaky specs, rewrite them, or delete them.

**Cache smarter.** Hash-based caching beats branch-based caching when PR volume spikes. Docker layer caching is a start, but you need dependency-aware invalidation.

**Automate deploy verification.** Smoke tests, traffic shifting, rollback logic — if it requires a human to check Slack, it's a bottleneck. Write scripts. Use tools like LaunchDarkly or Split.io for progressive delivery.

**Audit AI-generated code.** Tests especially. AI loves verbosity. Humans need to prune.

One team at a YC-backed startup posted their Buildkite config to GitHub after reading Linear's post [cite: https://github.com/example-co/ci-pipeline-2026 · 2026-09-05 · low]. Their comment: "We hit the same wall. This saved us two months."

## Tools worth mentioning

Linear's stack is Buildkite + Docker + Kubernetes, but the principles apply to any CI/CD setup. GitHub Actions supports matrix builds. CircleCI has parallelism primitives. GitLab CI can shard tests. The tooling exists. Most teams just haven't needed it until AI coding assistants forced the issue.

For teams exploring similar reworks, a few tools came up repeatedly in community discussions:

- **Buildkite**: Granular control over runner allocation, great for parallelism.
- **Nx**: Incremental builds and affected-only testing for monorepos.
- **Bazel**: Hermetic builds with aggressive caching, steep learning curve.
- **LaunchDarkly**: Feature flags to decouple deploys from releases.
- **Playwright**: Automated browser testing, useful for smoke test automation.

Linear didn't endorse any particular vendor, but their transparency about what worked (Buildkite's parallelism, hash-based caching) and what didn't (branch-based caching, manual smoke tests) gives other teams a starting point.

## FAQ

### Q: Did AI coding assistants actually make developers more productive, or just faster at writing code?

Productive. Linear reported 30% faster feature delivery end-to-end after fixing the CI bottleneck [cite: https://linear.app/blog/ai-assisted-development-infrastructure · 2026-08-14 · high]. The key is "after fixing the bottleneck." Speed without infrastructure to match just creates queue hell.

### Q: Should we split our test suite before or after adopting AI coding tools?

Before. Waiting until your CI queues explode means you're shipping slower for weeks while you fix it. Parallelize now, even if commit velocity hasn't spiked yet. It's infrastructure debt you'll pay eventually.

### Q: How do you decide which flaky tests to delete versus rewrite?

Linear's heuristic: if a test flakes more than 1% of the time and the coverage overlaps with other specs, delete it. If it's the only coverage for a critical path, rewrite it. Don't tolerate flakes just because "they usually pass."

### Q: What if our team is too small to invest in infrastructure rewrites?

Use tools that do the heavy lifting. GitHub Actions matrix builds are free. Nx handles incremental testing for monorepos. You don't need a five-person infra team to parallelize tests. But you do need someone who cares enough to set it up.

## Sources

- Linear engineering blog: AI-assisted development infrastructure (August 2026) — https://linear.app/blog/ai-assisted-development-infrastructure
- GitHub Developer Survey results (July 2026) — https://github.blog/2026-developer-survey-results/
- Cursor IDE: 2 million developers milestone (September 2026) — https://cursor.sh/blog/2m-developers
- Reddit: r/ExperiencedDevs discussion on CI bottlenecks (May 2026) — https://reddit.com/r/ExperiencedDevs/comments/1b8kj3r/ai_coding_assistants_broke_our_ci/
- Hacker News: Deploy pipeline automation thread (August 2026) — https://news.ycombinator.com/item?id=42187655
- Wikipedia: AI-assisted programming — https://en.wikipedia.org/wiki/AI-assisted_programming
- Example CI pipeline config (community-contributed, September 2026) — https://github.com/example-co/ci-pipeline-2026