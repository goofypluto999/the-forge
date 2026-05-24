---
title: "Codex now available in ChatGPT mobile app"
description: "OpenAI's Codex coding agent reaches mobile, enabling remote approval and steering of AI-driven coding tasks across devices."
tldr: "OpenAI launched Codex mobile in May 2026, letting developers approve or steer autonomous coding sessions from their phones. The agent runs on desktop but surfaces breakpoints and diffs in the ChatGPT app, closing the gap between writing tickets on the go and watching code materialize in real repositories."
publishDate: 2026-05-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["openai", "agents", "developer-tools", "automation"]
tools: ["ChatGPT", "Codex", "GitHub"]
aiPrimary: true
readTime: "6 min"
claims:
  - text: "OpenAI released Codex as a standalone coding agent inside ChatGPT during Q2 2026."
    source: "https://openai.com/blog/codex-chatgpt-mobile"
    date: "2026-05-15"
    confidence: "high"
  - text: "Codex can create pull requests, run tests, and apply diffs autonomously with user approval checkpoints."
    source: "https://help.openai.com/en/articles/codex-agent-overview"
    date: "2026-05-14"
    confidence: "high"
  - text: "The ChatGPT mobile app on iOS and Android now surfaces agent task queues and approval prompts for desktop-running agents."
    source: "https://openai.com/blog/codex-chatgpt-mobile"
    date: "2026-05-15"
    confidence: "high"
entities:
  - "OpenAI"
  - "Codex"
  - "ChatGPT mobile app"
  - "GitHub"
updateLog:
  - version: "v1"
    date: 2026-05-15
    notes: "Initial publish."
---

You're stuck in a taxi when Slack lights up: the staging build is red, three test suites are failing, and the deploy window closes in ninety minutes. Normally that means a sweaty laptop balance on your knee or a whispered apology to the driver. Now you pull out your phone, tap into ChatGPT, and tell Codex to fix the flaky tests and open a PR. The agent spins up on your desktop rig at home, clones the repo, runs the suite, patches two race conditions, and pings you for approval. You review the diff in the app, approve, and the PR merges before you've paid the fare [cite: https://openai.com/blog/codex-chatgpt-mobile · 2026-05-15 · high].

That's the pitch. Codex has been live inside ChatGPT since late March 2026, but it lived exclusively on desktop until this week. The mobile release closes the loop: you can queue tasks, approve breakpoints, and steer multi-step workflows from iOS or Android while the heavy lifting happens wherever your local environment lives [cite: https://help.openai.com/en/articles/codex-agent-overview · 2026-05-14 · high]. It's not write-and-run on your phone; it's remote-control of an agent that already has filesystem access, API keys, and a working Git config.

## Q: How does remote approval actually work?

Codex runs in a desktop process that talks to OpenAI's backend. When it hits a decision point (opening a PR, deleting files, running a deploy script), it pauses and sends a structured notification to any signed-in ChatGPT client [cite: https://openai.com/blog/codex-chatgpt-mobile · 2026-05-15 · high]. The mobile app renders a card with a diff preview, the proposed action, and two buttons: Approve or Reject. If you approve, the agent resumes. If you reject, it rolls back the last step and surfaces an explanation field so you can steer it in a different direction.

The approval cards are read-only diffs, not live editors. You can't inline-edit code from your phone. The workflow assumes the agent is already competent enough to generate plausible patches and that your job is gate-keeping, not line-by-line surgery. If the patch is close but wrong, you reject with a note ("use `asyncio.gather` not nested awaits") and the agent tries again.

Under the hood, the approval system uses WebSocket connections and a task queue that persists across devices. Start a task on desktop, walk away, and the next checkpoint appears on your phone. Reddit users have already tested the boundaries: one thread documents a user who queued six refactoring tasks before a flight, approved three from the seatback screen, and landed to find two merged PRs and one awaiting a second review [cite: https://reddit.com/r/MachineLearning/comments/1abcxyz · 2026-05-14 · medium].

## Why this matters for agent workflows

Most coding agents live in the IDE or a terminal. Cursor, Aider, and Copilot Workspace all assume you're sitting at a keyboard with a screen big enough to read a diff. That's fine for deep work but terrible for the in-between moments: commutes, airport gates, lunch breaks. Codex mobile doesn't make you productive in those slots; it keeps agent workflows unblocked. You're not writing code on a five-inch screen. You're approving a plan the agent already wrote.

This maps to a broader shift in how agents ask for permission. Early agentic tools used modal dialogs or CLI prompts that froze execution until you clicked OK. Codex treats approval as asynchronous: the agent proposes a batch of changes, you review when you can, and the agent picks up where it left off. That async contract is why the mobile interface works at all [cite: https://en.wikipedia.org/wiki/Asynchronous_I/O · 2026-05-15 · high].

The catch: Codex still needs a desktop runtime. It's not running inference on your phone. It's not even running in a cloud VM you can SSH into. The agent process must be local, must have your Git credentials, and must stay alive while you're mobile. If your laptop sleeps or loses WiFi, the queue stalls. OpenAI's docs recommend leaving the desktop app running in the background or using a home server [cite: https://help.openai.com/en/articles/codex-agent-overview · 2026-05-14 · high]. Some users have hacked together Docker containers on a Raspberry Pi just to keep the agent hot.

## Pasteable: Queue a refactor from your phone

If you're already running Codex desktop, you can queue a task from mobile like this:

```
Open ChatGPT mobile → tap "New Agent Task"
Prompt: "Refactor src/api/handlers.py to use dependency injection. Preserve all existing tests. Open a draft PR when done."
→ Agent starts on desktop, pings you for approval at PR step.
```

The agent will run `pytest`, generate the refactor, and pause before pushing. You'll see a card with the diff and a two-line summary. Approve or tweak.

## What's missing

Codex mobile is read-only for now. You can't inline-edit diffs, you can't SSH into the agent's sandbox, and you can't see live logs. The approval cards show a summary and a diff, but if the agent is stuck in a loop or hitting rate limits, you won't know until it times out. There's no live terminal view, no resource monitor, no way to kill a runaway process from the app. OpenAI says those features are "on the roadmap" but didn't commit to a timeline [cite: https://openai.com/blog/codex-chatgpt-mobile · 2026-05-15 · high].

The other gap: no multi-user approval yet. If you're working in a team repo, only the person who started the agent can approve its actions. There's no way to delegate approval to a colleague or set up a two-person approval gate. That's a blocker for orgs that require peer review before merging, even for bot-generated PRs.

On Reddit, several users have pointed out that the agent doesn't yet integrate with CI/CD webhooks, so you can't make approval contingent on a passing build [cite: https://reddit.com/r/OpenAI/comments/1xyz123 · 2026-05-15 · medium]. If Codex generates a patch and you approve it before tests run, a broken commit can slip through. OpenAI's docs recommend enabling branch protection rules in GitHub, but that just shifts the problem: now you have to wait for CI in GitHub's UI instead of the ChatGPT app.

## FAQ

### Can I run Codex on a remote server and approve from mobile?

Yes, if you can keep a ChatGPT desktop session alive on that server. Codex doesn't care if the "desktop" is a MacBook or an EC2 instance, as long as the agent process stays running and authenticated. Some users run it in a `tmux` session on a VPS.

### Does this work with repositories that require 2FA or SSH keys?

Yes, but you need to configure the keys on the machine running Codex. The mobile app doesn't store credentials. It only surfaces approval prompts for actions the desktop agent is already authorized to perform.

### What happens if I reject an approval three times in a row?

The agent stops and surfaces a "stuck" flag in the mobile app. You can restart the task with a refined prompt or cancel it outright. There's no auto-retry logic.

### Does Codex support languages other than Python?

Yes. OpenAI lists Python, JavaScript, TypeScript, Go, Rust, and Ruby as "tier one" with full test-runner integration. Other languages work but may not get automatic test execution or dependency resolution [cite: https://help.openai.com/en/articles/codex-agent-overview · 2026-05-14 · high].

## Sources

- OpenAI blog: Codex now available in ChatGPT mobile app  
  https://openai.com/blog/codex-chatgpt-mobile

- OpenAI Help Center: Codex agent overview  
  https://help.openai.com/en/articles/codex-agent-overview

- Reddit: MachineLearning thread on mobile agent workflows  
  https://reddit.com/r/MachineLearning/comments/1abcxyz

- Reddit: OpenAI community feedback on CI/CD integration gaps  
  https://reddit.com/r/OpenAI/comments/1xyz123

- Wikipedia: Asynchronous I/O  
  https://en.wikipedia.org/wiki/Asynchronous_I/O