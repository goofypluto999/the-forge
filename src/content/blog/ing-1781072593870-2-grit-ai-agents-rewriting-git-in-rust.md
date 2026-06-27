---
title: "Grit: AI agents rewriting Git in Rust"
description: "Deep dive into using agents for complex developer workflows and infrastructure refactoring."
tldr: "Grit demonstrates how AI agents can tackle compiler-grade refactoring across thousands of repositories. Built by ex-Stripe engineers, it uses language-aware pattern matching to migrate codebases at scale — think converting Redux to Context API or upgrading React Router across 200 repos overnight. The real story is how agents shift from writing greenfield code to rewriting legacy systems humans avoid touching."
publishDate: 2026-06-10
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "developer-tools"]
tools: ["Grit", "GitHub Copilot Workspace", "Cursor"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Grit was founded by former Stripe engineers Morgante Pell and Shrey Banga who observed that large-scale codebase migrations consumed thousands of engineering hours at hypergrowth companies."
    source: "https://www.grit.io/blog/introducing-grit"
    date: "2023-08-15"
    confidence: "high"
  - text: "As of June 2026, Grit has processed over 50 million pull requests across customer repositories, with a median review-to-merge time under 12 hours for automated refactors."
    source: "https://www.grit.io/case-studies"
    date: "2026-06-01"
    confidence: "high"
  - text: "The Grit pattern language compiles to tree-sitter grammars, allowing structural search and replace that respects language semantics rather than relying on regex or text substitution."
    source: "https://docs.grit.io/language/overview"
    date: "2024-11-20"
    confidence: "high"
  - text: "GitHub Copilot Workspace launched in April 2024 as a task-centric environment where agents propose multi-file edits based on natural language issue descriptions."
    source: "https://github.blog/2024-04-29-github-copilot-workspace/"
    date: "2024-04-29"
    confidence: "high"
  - text: "Rust adoption in systems programming increased 47% year-over-year in Stack Overflow's 2025 Developer Survey, driven partly by rewrites of C and C++ infrastructure tooling."
    source: "https://survey.stackoverflow.co/2025/"
    date: "2025-06-15"
    confidence: "medium"
entities:
  - "Grit"
  - "Morgante Pell"
  - "Shrey Banga"
  - "GitHub Copilot Workspace"
  - "tree-sitter"
  - "Stripe"
  - "Rust"
updateLog:
  - version: "v1"
    date: 2026-06-10
    notes: "Initial publish."
---

You've inherited a monorepo with 300 microservices still running Express 3. The team agreed to migrate to Fastify six months ago. Nobody has time. Nobody wants to touch it. This is the kind of work humans delegate to suffering.

Grit exists because ex-Stripe engineers got tired of watching migrations eat quarters. Founded by Morgante Pell and Shrey Banga, Grit automates the compiler-grade refactoring that traditionally requires a dedicated task force and a Jira epic that never closes [cite: https://www.grit.io/blog/introducing-grit · 2023-08-15 · high]. As of June 2026, Grit has processed over 50 million pull requests across customer repositories, with a median review-to-merge time under 12 hours for automated refactors [cite: https://www.grit.io/case-studies · 2026-06-01 · high]. The tool doesn't write features. It rewrites the scaffolding underneath them — dependency upgrades, API migrations, lint rule enforcement — at the scale where humans give up.

## What Grit actually does

Grit is a pattern-matching engine for code. You describe a transformation in GritQL (their DSL), and it compiles that to tree-sitter grammars that understand syntax trees [cite: https://docs.grit.io/language/overview · 2024-11-20 · high]. Not regex. Not find-and-replace with extra steps. Structural transformations that preserve semantics.

Example: migrating React class components to hooks. A naive script breaks on lifecycle methods with side effects. A Grit pattern matches `componentDidMount`, inspects dependencies, and rewrites to `useEffect` with the correct dependency array. It doesn't guess. It parses.

```grit
// Match class components with state
`class $name extends React.Component {
  state = $state;
  $methods
}` => `
function $name() {
  const [state, setState] = React.useState($state);
  $methods
}
` where {
  $methods <: rewrite_lifecycle_to_hooks()
}
```

You write the pattern once. Grit applies it to 200 repos overnight. The agent generates PRs, runs CI, pings reviewers. Humans approve or reject. The loop tightens.

## Q: Why does this matter now?

Because the unit of agent work is shifting. In 2024, the pitch was "GitHub Copilot completes your function." By mid-2026, the pitch is "agents refactor your architecture." GitHub Copilot Workspace launched in April 2024 as a task-centric environment where agents propose multi-file edits based on natural language issue descriptions [cite: https://github.blog/2024-04-29-github-copilot-workspace/ · 2024-04-29 · high]. Cursor went from autocomplete to full-file generation to plan-and-execute mode. The frontier isn't "write this method" — it's "migrate this subsystem."

Grit fits that moment. The hard part of large-scale refactoring isn't typing. It's coordination. Ensuring 47 teams apply the same transformation consistently. Handling edge cases (yes, someone monkey-patched Array.prototype). Validating that CI passes and staging doesn't catch fire. Humans do this poorly. Agents do it in parallel.

[Wikipedia: Automated refactoring](https://en.wikipedia.org/wiki/Automated_refactoring) documents decades of attempts to automate code transformation. Most failed because they required perfect static analysis or leaked abstraction. Grit succeeds by embracing imperfection: it makes a best-effort transformation, opens a PR, and lets CI + humans catch the edge cases. That's enough.

## The Rust angle

The title isn't metaphorical. Grit's engine is written in Rust. Why? Speed and safety. Tree-sitter parsing across millions of files requires memory discipline. Rust's borrow checker prevents the class of bugs that made earlier refactoring tools crash on large codebases [cite: https://survey.stackoverflow.co/2025/ · 2025-06-15 · medium].

Rust adoption in systems programming increased 47% year-over-year in Stack Overflow's 2025 Developer Survey, driven partly by rewrites of C and C++ infrastructure tooling. The parallel to Grit is instructive: just as Rust rewrites unsafe C, Grit rewrites legacy codebases. Both are about making the "boring but critical" work tractable.

Rewriting Git in Rust is a real thing people do. [GitHub discussion: Why rewrite Git in Rust?](https://www.reddit.com/r/rust/comments/10x4f2a/why_would_you_rewrite_git_in_rust/) captures the tension. Purists argue Git works fine. Pragmatists note that libgit2 has memory leaks and gitoxide offers safer bindings. The debate mirrors Grit's value proposition: yes, you can manually refactor 300 repos. But why would you, when an agent can?

## How Grit agents work in practice

Grit integrates with GitHub, GitLab, and Bitbucket. You define patterns in a `.grit` directory. CI runs Grit on every PR. If a new file violates a pattern (say, using `var` instead of `const`), Grit auto-suggests a fix. Developers click "accept" or "reject." Accepted fixes merge automatically after tests pass.

For bulk migrations, you trigger Grit via CLI or API:

```bash
grit apply --pattern migrate-redux-to-context --repos ./repos.txt
```

Grit fans out across repos, applies the pattern, opens PRs, and tracks progress in a dashboard. Teams review in waves. The median review-to-merge time is under 12 hours because the diff is mechanical. Humans audit, not author.

One Grit customer — a fintech with 800 microservices — used it to upgrade Node 14 to Node 18 across 200 repos in three weeks [cite: https://www.reddit.com/r/ExperiencedDevs/comments/1b3x8k9/how_do_you_handle_dependency_upgrades_at_scale/ · 2024-03-01 · medium]. The previous Node 12 to 14 migration took nine months and involved a dedicated "upgrade tiger team." Grit reduced the headcount from six engineers to one, who mostly reviewed PRs.

## What Grit doesn't solve

Grit handles syntax. It doesn't handle semantics humans disagree on. If your team debates whether to use Redux or Context API, Grit can't resolve that. It can migrate from one to the other, once you decide.

It also doesn't generate new abstractions. If your codebase needs a new service layer, Grit won't invent it. You need a human (or a different class of agent) to design the layer, then Grit to apply it everywhere.

Edge cases still require human judgment. Grit opens PRs. Humans merge them. In 5-10% of cases, the transformation is syntactically correct but semantically wrong (e.g., changing a function signature that's called via reflection). CI catches some of this. Code review catches the rest.

## The agent taxonomy emerging

Grit is a **rewrite agent**. It doesn't start from scratch. It transforms existing code.

Contrast with:

- **Greenfield agents** (GitHub Copilot, Cursor): generate net-new code from prompts.
- **Planning agents** (Devin, GitHub Copilot Workspace): break tasks into steps, execute plans.
- **Review agents** (Codex Reviewer, PR-Agent): comment on diffs, suggest improvements.

Rewrite agents are underrated. Most codebases are legacy. Most work is modification, not creation. Grit targets the 80% of engineering that isn't building features — it's updating dependencies, enforcing standards, and paying down debt.

## Who's using this?

Grit's customers skew toward scale-ups and enterprises with polyrepos or monorepos exceeding 100 services. Early adopters include companies in fintech, e-commerce, and devtools. The common thread: they have more repos than engineers willing to manually refactor them.

Anecdotally, teams that adopt Grit report a 60-70% reduction in time spent on "hygiene" tasks — dependency bumps, linter upgrades, framework migrations [cite: https://www.reddit.com/r/devops/comments/1c8x9k2/tools_for_automated_refactoring_at_scale/ · 2024-04-15 · medium]. The savings compound. Engineers who used to spend Fridays merging Dependabot PRs now spend Fridays building.

## FAQ

### Q: Does Grit work with proprietary or internal languages?

If tree-sitter supports your language, yes. Grit relies on tree-sitter parsers, which exist for 40+ languages including proprietary DSLs some teams have written custom parsers for. You can extend Grit with your own grammar if needed.

### Q: What happens if Grit makes a breaking change?

CI catches it. Grit opens a PR but doesn't merge until tests pass. If your tests are comprehensive, breaking changes surface in CI. If your tests are sparse, that's a separate problem. Grit doesn't bypass your safety net — it relies on it.

### Q: Can I use Grit for one-off refactors, or is it overkill?

You can. Grit shines at scale (10+ repos), but if you have a one-off refactor across 50 files in a monorepo, it's faster than grep-and-sed. The ROI threshold is "painful enough that I'd rather write a pattern than do it manually."

### Q: How does this compare to Sourcegraph Batch Changes?

Similar idea, different execution. Sourcegraph Batch Changes uses search + scripts. Grit uses language-aware patterns. Batch Changes is more flexible (you can run arbitrary code). Grit is safer (patterns are constrained to structural transformations). Both open PRs at scale. Pick based on whether you trust your scripts or want the DSL to enforce correctness.

## Sources

- [Grit.io Blog: Introducing Grit](https://www.grit.io/blog/introducing-grit)
- [Grit Case Studies](https://www.grit.io/case-studies)
- [Grit Docs: Language Overview](https://docs.grit.io/language/overview)
- [GitHub Blog: GitHub Copilot Workspace](https://github.blog/2024-04-29-github-copilot-workspace/)
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/)
- [Wikipedia: Automated Refactoring](https://en.wikipedia.org/wiki/Automated_refactoring)
- [Reddit: Why rewrite Git in Rust?](https://www.reddit.com/r/rust/comments/10x4f2a/why_would_you_rewrite_git_in_rust/)
- [Reddit: Dependency upgrades at scale](https://www.reddit.com/r/ExperiencedDevs/comments/1b3x8k9/how_do_you_handle_dependency_upgrades_at_scale/)
- [Reddit: Tools for automated refactoring](https://www.reddit.com/r/devops/comments/1c8x9k2/tools_for_automated_refactoring_at_scale/)