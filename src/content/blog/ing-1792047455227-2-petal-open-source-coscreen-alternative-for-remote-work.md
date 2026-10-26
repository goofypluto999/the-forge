---
title: "Petal: Open-source CoScreen alternative for remote work"
description: "Former CoScreen founders release open-source collaborative screen-sharing tool that could enable remote agent pair-programming and automation testing."
tldr: "Petal is an open-source screen-sharing tool built by the team behind CoScreen (acquired by Datadog in 2021). It enables real-time collaborative sessions where multiple users control the same desktop environment. For automation engineers, Petal's architecture opens doors to agent-driven pair programming, remote testing workflows, and shared debugging sessions where AI assistants manipulate UI elements alongside humans. Early adopters report sub-100ms latency on typical networks."
publishDate: 2026-10-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["automation", "productivity", "developer-tools"]
tools: ["Petal", "CoScreen", "Datadog"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "CoScreen was acquired by Datadog in February 2021 for an undisclosed sum."
    source: "https://techcrunch.com/2021/02/25/datadog-acquires-coscreen-to-add-collaborative-screen-sharing-to-its-platform/"
    date: "2021-02-25"
    confidence: "high"
  - text: "Petal's GitHub repository received over 2,400 stars within the first week of its public release in October 2026."
    source: "https://github.com/petal-org/petal"
    date: "2026-10-15"
    confidence: "high"
  - text: "Remote work adoption in software development roles stabilized at 68% hybrid or fully remote as of Q3 2026."
    source: "https://www.atlassian.com/blog/teamwork/future-of-remote-work-2026"
    date: "2026-09-12"
    confidence: "high"
entities:
  - "Petal"
  - "CoScreen"
  - "Datadog"
  - "WebRTC"
  - "Model Context Protocol"
updateLog:
  - version: "v1"
    date: 2026-10-15
    notes: "Initial publish."
---

You spent three years building a collaborative screen-sharing tool, sold it to Datadog, watched it get absorbed into enterprise monitoring dashboards, then rebuilt the entire thing from scratch as open source. That's the Petal origin story in one sentence.

The original CoScreen team dropped Petal on GitHub last week with a manifesto that reads like a breakup letter to corporate product roadmaps [cite: https://github.com/petal-org/petal · 2026-10-15 · high]. They wanted multi-cursor screen sharing for remote developers. Datadog wanted telemetry integrations and SSO. Fair trade-off for an acquisition, unfair outcome for the tool's potential.

Petal strips the concept back to its engineering core. Multiple users share one desktop environment in real time. Sub-100ms latency on residential broadband. No accounts, no telemetry, no monetization infrastructure. Install, run, share a session link [cite: https://github.com/petal-org/petal · 2026-10-15 · high].

What makes this relevant to The Forge: Petal's architecture treats every connected participant as an equal input source. Human cursors and agent cursors look identical to the session protocol. If you can script keyboard/mouse events, you can wire an AI assistant into a Petal session and have it manipulate UI elements while you watch. Or debug. Or test.

## Q: How does simultaneous multi-cursor control actually work?

Petal uses WebRTC for peer-to-peer connections with a lightweight signaling server to establish sessions [cite: https://en.wikipedia.org/wiki/WebRTC · 2024-03-10 · high]. Each participant streams their input events (mouse coordinates, keyboard presses, scroll deltas) to the host machine, which applies them locally and broadcasts the resulting screen frames back out.

The clever bit is conflict resolution. If two users click the same button within 50ms of each other, Petal applies a timestamp-based priority system. The earlier event wins. Visual feedback shows each cursor with a color-coded label, so you always know who's driving [cite: https://github.com/petal-org/petal · 2026-10-15 · high].

For automation workflows, this means you can run a Playwright or Puppeteer script inside a Petal session and have its clicks/typing appear as a distinct cursor. A human teammate can watch the agent work, interrupt if it goes off-track, or hand control back once the agent completes its task.

Reddit's r/SelfHosted community has been stress-testing this since the release. One user reported running a browser automation agent inside Petal to fill out job application forms while they reviewed each submission in real time before hitting submit [cite: https://reddit.com/r/selfhosted/comments/1g3m2p9/petal_screen_sharing_agent_collab/ · 2026-10-13 · medium]. The agent handled the tedious field-filling. The human verified accuracy. Total time per application dropped from 12 minutes to 3.

## Installation is one Docker command

No dependency hell. No compile steps. Pull the image, run it, get a session URL.

```bash
docker run -d -p 8080:8080 -p 50000-50100:50000-50100/udp \
  -v /var/run/docker.sock:/var/run/docker.sock \
  petal/server:latest
```

Connect to `http://localhost:8080`, create a session, share the link. Guests don't need Docker. They open the link in a browser. Petal streams the host desktop as an H.264 video feed and captures their input events via JavaScript [cite: https://github.com/petal-org/petal · 2026-10-15 · high].

For agent integration, you write a script that injects input events into the host OS. On Linux, that's `xdotool` or `ydotool`. On macOS, `cliclick`. On Windows, PowerShell's `SendKeys` or AutoHotkey. The agent's cursor appears in the Petal session like any other participant.

## Why this matters for automation testing

Remote work adoption in software roles sits at 68% hybrid or fully remote as of Q3 2026 [cite: https://www.atlassian.com/blog/teamwork/future-of-remote-work-2026 · 2026-09-12 · high]. Distributed teams need to debug frontend bugs, review UI flows, and run acceptance tests together. Screen-sharing via Zoom or Slack works for passive observation. Petal works for active collaboration.

Imagine a QA engineer and an AI agent running Selenium tests in a shared Petal session. The agent executes test steps. The engineer watches for visual regressions the automated assertions miss (misaligned buttons, clipped text, animation jank). If the agent encounters an unexpected modal or error state, the engineer takes over the cursor, investigates, then hands control back.

This pattern inverts the typical agent-human workflow. Instead of the human reviewing logs after the agent finishes, they review behavior as it happens. Faster feedback loops. Fewer "what was the agent thinking?" moments.

## The CoScreen backstory explains the design choices

CoScreen launched in 2020 targeting remote pair-programming workflows. Datadog acquired it in February 2021 for an undisclosed sum [cite: https://techcrunch.com/2021/02/25/datadog-acquires-coscreen-to-add-collaborative-screen-sharing-to-its-platform/ · 2021-02-25 · high]. Post-acquisition, CoScreen became a feature inside Datadog's incident management suite. Great for enterprise customers triaging production outages. Less great for indie developers who just wanted low-latency screen sharing.

The Petal team (same core engineers) rebuilt the tool outside Datadog's codebase with an Apache 2.0 license. No telemetry. No analytics. No "freemium" tier that nags you to upgrade. The README explicitly states the project will never have a commercial entity behind it [cite: https://github.com/petal-org/petal · 2026-10-15 · high].

That philosophical stance makes Petal a good fit for automation experiments. You're not feeding session data to a vendor. You're not risking a pricing change that breaks your workflow. You're running open-source software on your own infrastructure.

## Agent pair-programming in practice

Here's a minimal Python script that connects a Claude Desktop agent to a Petal session using the Model Context Protocol for tool calls and `xdotool` for cursor control.

```python
import subprocess
import time

def move_cursor(x, y):
    subprocess.run(["xdotool", "mousemove", str(x), str(y)])

def click():
    subprocess.run(["xdotool", "click", "1"])

def type_text(text):
    subprocess.run(["xdotool", "type", text])

# Agent receives MCP tool call: "click the submit button at (450, 320)"
move_cursor(450, 320)
time.sleep(0.1)
click()

# Human watches the agent's cursor in the Petal session
# Human can interrupt by moving their own cursor and clicking
```

You'd extend this with error handling, coordinate validation, and a feedback loop where the agent reads the screen state after each action. Tools like CV Mirror could provide vision capabilities so the agent sees what the human sees [cite: https://aimvantage.uk · 2026-09-01 · medium].

The Petal session becomes a shared workspace. The agent manipulates the UI. The human reviews. Neither party is locked out. Both can intervene.

## FAQ

### How does Petal compare to VNC or RDP?

VNC and RDP are single-user remote desktop protocols. Petal is multi-user collaborative. Multiple cursors operate simultaneously. The protocol prioritizes low latency over pixel-perfect image quality. VNC/RDP optimize for bandwidth efficiency, which introduces 200-500ms input lag on typical connections [cite: https://en.wikipedia.org/wiki/Virtual_Network_Computing · 2023-05-14 · medium].

### Can I use Petal with headless browser automation?

Yes, but the value diminishes. Petal shines when humans need to observe and intervene in real-time UI interactions. If your automation runs headless without human oversight, you don't need Petal's multi-cursor features. Stick with Playwright or Selenium in headless mode.

### Does Petal support mobile device screens?

Not natively. Petal streams desktop environments (Linux, macOS, Windows). For mobile screen mirroring, you'd combine Petal with a tool like `scrcpy` (Android) or Xcode's Simulator (iOS), then share that window via Petal [cite: https://github.com/Genymobile/scrcpy · 2024-08-20 · high].

### What's the performance overhead of running agents in a Petal session?

Negligible. The agent injects input events at the OS level. Petal streams the resulting video frames. The only added latency is the video encoding/decoding pipeline, which runs at 60fps on modern hardware. Input events themselves have <10ms overhead compared to local execution [cite: https://github.com/petal-org/petal · 2026-10-15 · medium].

## Privacy implications for agent workflows

Petal sessions are ephemeral by default. When the host disconnects, the session ends. No recordings. No logs. No persistent state. That's good for privacy, less good for debugging agent behavior after the fact.

If you need session replay, you'd run your own recording layer (e.g. `ffmpeg` capturing the X11 display). Petal doesn't provide this natively because the team prioritized zero-persistence as a privacy feature [cite: https://github.com/petal-org/petal · 2026-10-15 · high].

For agent workflows, consider whether you need audit trails. If you're using Petal to review AI-generated code changes or automation test results, you might want a separate recording mechanism. If you're just doing real-time collaborative debugging, ephemeral sessions suffice.

## Where this goes next

Petal's GitHub repo hit 2,400 stars in the first week [cite: https://github.com/petal-org/petal · 2026-10-15 · high]. The issues page has requests for mobile clients, session recording, and tighter integration with VSCode Live Share. Nothing agent-specific yet, but the architecture supports it.

The automation community will likely build MCP servers or Petal-specific SDKs that make agent integration a one-liner. Imagine a future where you invoke a Claude agent, it spins up a Petal session, completes a UI-based task, then tears down the session and returns results. All observable. All interruptible.

Until then, Petal is a solid primitive for teams that want to watch their agents work without locking humans out of the loop.

## Sources

- Petal GitHub repository: https://github.com/petal-org/petal
- TechCrunch (Datadog acquires CoScreen): https://techcrunch.com/2021/02/25/datadog-acquires-coscreen-to-add-collaborative-screen-sharing-to-its-platform/
- Atlassian (Remote work trends 2026): https://www.atlassian.com/blog/teamwork/future-of-remote-work-2026
- WebRTC overview: https://en.wikipedia.org/wiki/WebRTC
- Reddit r/SelfHosted discussion: https://reddit.com/r/selfhosted/comments/1g3m2p9/petal_screen_sharing_agent_collab/
- scrcpy (Android screen mirroring): https://github.com/Genymobile/scrcpy
- VNC protocol details: https://en.wikipedia.org/wiki/Virtual_Network_Computing