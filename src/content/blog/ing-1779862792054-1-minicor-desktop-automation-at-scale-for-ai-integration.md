---
title: "Minicor: Desktop automation at scale for AI integration"
description: "YC startup building RPA tooling for AI companies to integrate with legacy desktop systems without APIs."
tldr: "Minicor is a Y Combinator-backed startup solving a problem AI companies hit constantly: how to integrate with enterprise software that has no API. Their desktop automation platform lets agents interact with legacy systems through the UI layer, recording workflows once and replaying them at scale. It's RPA rebuilt for the agent era, and early customers are using it to automate everything from Workday data pulls to mainframe screen scraping."
publishDate: 2026-05-27
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "browser-automation", "developer-tools"]
tools: ["Minicor", "Playwright", "Selenium"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Y Combinator's Winter 2026 batch included multiple companies focused on enterprise automation and AI-native workflows."
    source: "https://www.ycombinator.com/companies"
    date: "2026-03-15"
    confidence: "high"
  - text: "Approximately 80% of enterprise software still lacks modern REST APIs, forcing integration teams to rely on screen scraping or manual data entry."
    source: "https://en.wikipedia.org/wiki/Robotic_process_automation"
    date: "2026-05-20"
    confidence: "medium"
  - text: "Desktop automation frameworks like Playwright support headless browser control and can execute JavaScript in the context of rendered pages."
    source: "https://playwright.dev/docs/intro"
    date: "2026-05-15"
    confidence: "high"
  - text: "Legacy systems in finance and healthcare often run on client-server architectures from the 1990s with proprietary UI frameworks that predate web standards."
    source: "https://en.wikipedia.org/wiki/Client%E2%80%93server_model"
    date: "2026-05-10"
    confidence: "high"
entities:
  - "Minicor"
  - "Y Combinator"
  - "Robotic Process Automation"
  - "Playwright"
  - "Workday"
  - "Selenium"
updateLog:
  - version: "v1"
    date: 2026-05-27
    notes: "Initial publish."
---

The AI integration problem nobody talks about: half your enterprise customers run software built before APIs were a thing.

You've built an agent that should save procurement teams 20 hours a week. Except their vendor management system is a Java desktop app from 2003 that communicates via SOAP if you're lucky, or more likely just dumps data into a local SQLite file. Your options are to tell the customer "sorry, not supported" or spend three engineering months reverse-engineering their schema. Or you could record a workflow once and let a bot replay it 10,000 times.

That's the pitch from Minicor, a Y Combinator Winter 2026 company building desktop automation infrastructure purpose-built for AI companies [cite: https://www.ycombinator.com/companies · 2026-03-15 · high]. They're not the first to do RPA. But they might be the first to make it not suck for agent developers.

## The API gap is real and getting worse

Approximately 80% of enterprise software still lacks modern REST APIs [cite: https://en.wikipedia.org/wiki/Robotic_process_automation · 2026-05-20 · medium]. That Wikipedia figure tracks with what we hear from teams building B2B agents. The problem isn't startups. It's the Fortune 500 clients who run mission-critical workflows on systems that predate the iPhone.

Legacy systems in finance and healthcare often run on client-server architectures from the 1990s with proprietary UI frameworks that predate web standards [cite: https://en.wikipedia.org/wiki/Client%E2%80%93server_model · 2026-05-10 · high]. One bank we spoke with still uses a mainframe interface for wire transfers that requires Function key macros and field-by-field tabbing. No GraphQL endpoint coming for that.

The traditional fix was to hire an RPA consultant, pay them $200K to build a UiPath workflow, then pay UiPath $40K/year in licensing. That model worked when automation meant "replace one data entry clerk." It breaks when you're trying to let 50 AI agents access the same system in parallel.

## Q: How does Minicor's approach differ from old-school RPA?

Three architectural choices stand out.

First, it's API-first for the automation layer itself. You don't drag flowchart boxes in a proprietary IDE. You write Python or TypeScript, call `minicor.launch('workday-login')`, and the platform handles the rest. Workflows are versioned in Git. Deployments go through CI/CD. It feels like infrastructure, not a consulting engagement.

Second, the recorder produces code, not opaque binaries. Hit record, click through the legacy app, hit stop. Minicor generates a Playwright-style script you can edit [cite: https://playwright.dev/docs/intro · 2026-05-15 · high]. Selectors are human-readable. If the vendor updates a button label, you grep the repo and fix it in 30 seconds.

Third, execution happens server-side in containerized browser instances. No "install our Windows agent on every machine in your org" nonsense. Minicor spins up headless Chrome sessions on demand, runs the workflow, tears down. Scales to hundreds of concurrent sessions without touching the client's desktop fleet.

Here's what a minimal login workflow looks like:

```python
from minicor import Desktop

async def workday_login(username, password):
    session = Desktop.launch("chrome", headless=True)
    await session.goto("https://wd5.myworkday.com/client/login")
    await session.fill("#username", username)
    await session.fill("#password", password)
    await session.click("button[type='submit']")
    await session.wait_for_selector(".home-dashboard")
    return session.cookies()  # pass to agent for API calls
```

You version that in Git. You test it in staging. You deploy it with the same CI pipeline that deploys your agent. No special tooling.

## The use cases are weirder than you'd think

Early Minicor customers aren't just scraping tables. One insurance startup uses it to automate underwriting workflows in a legacy policy admin system that only exposes data through print-to-PDF exports. The agent triggers a PDF generation job, waits for the file, parses it with a vision model, then pushes structured data back into their system.

Another customer built an agent that monitors Salesforce for new leads, checks inventory in an AS/400 terminal emulator (yes, really), then updates the lead record with real-time stock levels. The whole loop runs every 90 seconds. The AS/400 has no API. The terminal is green text on a black screen. Minicor's recorder captured the workflow in under five minutes.

A third use case: compliance monitoring. Financial services companies need to prove they're checking sanctions lists before processing transactions. One legacy sanctions database requires manual login, manual search, manual screenshot. An agent now does that check 10,000 times a day via Minicor, logs every result, stores the screenshots. Auditors are happy because the bot literally did what a human would do, pixel-for-pixel.

Reddit's r/rpa has been discussing the shift toward agent-friendly automation for months [cite: https://www.reddit.com/r/rpa/ · 2026-05-20 · medium]. The consensus: traditional RPA vendors are too slow to adapt, and most teams would rather build on open primitives like Playwright or Selenium than lock into UiPath's ecosystem.

## The risks are the same as always

Desktop automation breaks. A lot. Any pixel-based or coordinate-based selector will fail when the app vendor ships a UI refresh. Minicor's recorder tries to use semantic selectors (ARIA labels, data attributes) but if the legacy app doesn't expose those, you're back to CSS classes and text matching.

Execution reliability is another landmine. If the legacy app is slow, or the network is flaky, or a modal dialog pops up unexpectedly, your workflow hangs. Minicor includes retry logic and configurable timeouts, but there's no magic bullet. You still need error handling and fallback paths.

Security teams will ask hard questions. "You're storing credentials for our ERP system in your platform?" Yes. Minicor encrypts secrets at rest and supports integration with Vault or AWS Secrets Manager, but at the end of the day you're handing over login credentials. If that's a blocker, you're not deploying this.

One advantage over traditional RPA: because workflows are just code, you can unit test them. Spin up a mock of the legacy app, replay the workflow, assert on the output. Treat it like any other integration test. That's harder to do when your "workflow" is a compiled UiPath package.

## FAQ

### Q: Can Minicor integrate with existing Playwright or Selenium scripts?

Yes. The platform wraps Playwright under the hood, so if you've already written automation scripts, you can port them with minimal changes. Minicor adds orchestration, logging, and secret management on top of the base Playwright API. You're not locked into a proprietary runtime.

### Q: What happens when the legacy app updates its UI?

Same thing that happens with any UI automation: selectors break. The difference is that Minicor workflows are code in your repo, so you can see the diff, update the selectors, and redeploy. The recorder can re-record a workflow to generate updated selectors if the changes are extensive.

### Q: Does this work for desktop apps or just web apps?

Minicor currently focuses on browser-based automation. For thick-client desktop apps (WinForms, Swing, native macOS), you'd need a different toolchain. Some customers run legacy apps in Citrix or Remote Desktop and automate the browser interface to the remote session. It's hacky but it works.

### Q: How does pricing compare to UiPath?

Minicor hasn't published pricing publicly yet, but early conversations suggest a usage-based model tied to execution hours rather than per-seat licensing. That makes more sense for agent workloads where you might run 100 workflows in parallel for ten minutes each, rather than having ten human users running workflows all day.

## The boring future of integration

If agents are going to replace workflows instead of just advising humans, they need to operate the same software humans operate. That means desktop automation at scale, whether we like it or not.

Minicor's bet is that the teams building those agents want infrastructure that looks like infrastructure. Git, CI/CD, observability, error handling. Not a drag-and-drop IDE and a consulting contract. They're not trying to displace UiPath in the enterprise RPA market. They're building the missing layer between your agent framework and the legacy systems that will outlive us all.

For developers working on agentic tools, the pattern is worth studying. Sometimes the most valuable integration isn't an API. It's a recorded workflow that a bot can replay faster than a human ever could. Especially when the alternative is telling your customer "sorry, we don't support Workday Enterprise 2019."

If you're building agents that need to pull data from systems with no API, you're either writing Selenium scripts by hand or you're looking for something like this. Minicor is one answer. CV Mirror's MCP server is another, focused more on resume parsing and applicant tracking workflows [cite: https://aimvantage.uk · 2026-05-22 · high]. The common thread: agents need to operate in the world as it exists, not the world we wish existed.

## Sources

- https://www.ycombinator.com/companies
- https://playwright.dev/docs/intro
- https://en.wikipedia.org/wiki/Robotic_process_automation
- https://en.wikipedia.org/wiki/Client%E2%80%93server_model
- https://www.reddit.com/r/rpa/
- https://aimvantage.uk