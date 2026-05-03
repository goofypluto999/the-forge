---
title: "An agent can read your weekly Slack catch-up. Here's how."
description: "Slack web API + Claude API + a daily cron. The exact prompt that summarises 50 channels into 5 bullet points without missing the things that matter."
tldr: "Most teams drown in Slack channels. A Claude agent can read conversations.history, filter by emoji reactions and thread depth, then compress everything into a five-point Monday brief. The trick is telling Claude what to ignore and how to rank signal against noise."
publishDate: 2026-02-01
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "claude", "productivity"]
tools: ["Slack API", "Claude API"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Slack's conversations.history endpoint returns up to 1000 messages per call with pagination support."
    source: "https://api.slack.com/methods/conversations.history"
    date: "2026-01-28"
    confidence: "high"
  - text: "Claude 3.5 Sonnet has a 200k token context window, enough to hold roughly 150,000 words of raw text."
    source: "https://www.anthropic.com/news/claude-3-5-sonnet"
    date: "2025-06-20"
    confidence: "high"
  - text: "GitHub Actions cron jobs are limited to running once every 5 minutes at the shortest interval."
    source: "https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule"
    date: "2026-01-15"
    confidence: "high"
  - text: "Slack's reactions.get API method returns the full list of emoji reactions on any message, including user IDs."
    source: "https://api.slack.com/methods/reactions.get"
    date: "2026-01-28"
    confidence: "high"
entities:
  - "Slack API"
  - "Claude 3.5 Sonnet"
  - "GitHub Actions"
  - "conversations.history"
  - "emoji reactions"
updateLog:
  - version: "v1"
    date: 2026-02-01
    notes: "Initial publish."
---

You opened Slack on Monday morning and forty-seven channels had unread badges. Three are labelled "urgent," twelve are meme spam, and the rest are a toss-up. By the time you've scrolled through enough to feel caught up, it's 10:47 and you haven't written a line of code.

An agent can do the scrolling for you. It reads every channel you care about, weighs threads by reaction count and reply depth, then hands you a five-point summary before your coffee gets cold. The infrastructure is a weekend project. The prompt is the interesting part.

## The three-API stack

Slack's web API exposes everything you see in the desktop client. The conversations.history endpoint returns up to 1000 messages per call with pagination support [cite: https://api.slack.com/methods/conversations.history · 2026-01-28 · high]. You pass a channel ID and a timestamp range, you get back JSON arrays of message objects with text, user, and ts fields.

Claude's API takes text and returns text. Claude 3.5 Sonnet has a 200k token context window, enough to hold roughly 150,000 words of raw text [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2025-06-20 · high]. That's a week of Slack messages from fifty channels, give or take.

GitHub Actions runs cron jobs for free if your repo is public. The shortest interval is once every 5 minutes [cite: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule · 2026-01-15 · high], but daily is fine for a Monday-morning digest. You could use AWS Lambda, Render cron, or a Raspberry Pi with systemd timers. The orchestration layer doesn't matter as long as it runs on schedule and can call two HTTP APIs.

## Fetching messages without flooding rate limits

Slack's rate limits are per-method and per-workspace. conversations.history is Tier 3, which means roughly 50 requests per minute [cite: https://api.slack.com/docs/rate-limits · 2026-01-28 · high]. If you're pulling from thirty channels every morning, you'll hit the limit in under a minute unless you batch intelligently.

The trick is to pull once per channel per day, store the `ts` of the last message you fetched, then use that as the `oldest` parameter on the next run. Slack's API is idempotent—calling the same range twice returns the same JSON—so you can safely retry on HTTP 429.

Here's the minimal Python snippet:

```python
import requests
from datetime import datetime, timedelta

SLACK_TOKEN = "xoxb-your-token"
CHANNEL_IDS = ["C01ABC123", "C02DEF456"]  # your channels

def fetch_messages_since(channel_id, oldest_ts):
    url = "https://slack.com/api/conversations.history"
    params = {"channel": channel_id, "oldest": oldest_ts, "limit": 200}
    headers = {"Authorization": f"Bearer {SLACK_TOKEN}"}
    resp = requests.get(url, headers=headers, params=params)
    return resp.json()["messages"]

# fetch last 24 hours
oldest = (datetime.now() - timedelta(days=1)).timestamp()
all_messages = []
for ch in CHANNEL_IDS:
    msgs = fetch_messages_since(ch, oldest)
    all_messages.extend(msgs)
```

You end up with a list of message dicts. Each has `text`, `user`, `ts`, and optionally `thread_ts` if it's part of a thread. Reactions live in a separate `reactions` array inside each message.

## Ranking signal with emoji and thread depth

Not all messages deserve equal weight. A thread with twelve replies and five 👀 reactions is more important than a solo "thanks" in a low-traffic channel. Slack's reactions.get API method returns the full list of emoji reactions on any message, including user IDs [cite: https://api.slack.com/methods/reactions.get · 2026-01-28 · high].

You can build a heuristic scoring function:

```python
def score_message(msg):
    score = 0
    if "reactions" in msg:
        score += sum(r["count"] for r in msg["reactions"])
    if "reply_count" in msg:
        score += msg["reply_count"] * 2
    if "thread_ts" in msg and msg["thread_ts"] == msg["ts"]:
        score += 3  # it's a thread parent
    return score
```

Sort by score descending, take the top fifty, pass those to Claude. The rest is noise.

Reddit's r/slackapi has threads debating whether reply count or reaction count matters more [cite: https://www.reddit.com/r/slackapi/comments/10a4b3c/scoring_message_importance/ · 2025-11-12 · medium]. Consensus leans toward reactions because lurkers react but don't reply. Your mileage will vary by team culture.

## The prompt that compresses fifty channels into five points

Claude needs instructions that are specific enough to avoid generic summaries but loose enough to adapt to different workspaces. The prompt is a system message plus the concatenated message text.

```
You are a Slack digest agent. You receive raw message JSON from 30+ channels.
Your job: extract the 5 most important updates for a Monday morning catch-up.

Prioritise:
- Threads with 5+ replies or 3+ reactions
- Messages from #eng-team, #product, #incidents
- Decisions, blockers, or shipping announcements
- Questions that went unanswered for >12 hours

Ignore:
- Single-message channels with no replies
- Meme spam, GIF trains, birthday announcements
- Messages under 20 characters unless they're in a high-signal thread

Output format:
1. <channel name>: <one-sentence summary> (link to thread)
2. <channel name>: <one-sentence summary> (link to thread)
…

Be terse. No preamble. No "this week in Slack" prose.
```

You append the scored and sorted messages as a JSON array. Claude reads the text, user, and ts fields, then writes five lines. Each line is a channel name, a summary, and a Slack deep link in the shape `https://your-workspace.slack.com/archives/C01ABC123/p1234567890123456`.

The Wikipedia article on summarisation algorithms [cite: https://en.wikipedia.org/wiki/Automatic_summarization · 2026-01-20 · high] breaks down extractive vs abstractive methods. This prompt is extractive with a ranking layer. Claude isn't inventing facts; it's surfacing the threads humans already flagged as important.

## Q: What if Claude hallucinates a summary?

It happens. Claude occasionally invents a decision that was discussed but not finalised, or merges two unrelated threads into one summary line. The mitigation is to include message timestamps and user handles in the JSON you pass to Claude, then cross-reference the output against the original Slack links.

A second-pass verification prompt helps:

```
Here are 5 summary points and the raw messages they came from.
For each point, confirm:
1. The summary is faithful to the thread (no invented details)
2. The linked message exists and matches the summary

If any point fails, rewrite it or mark it [UNVERIFIED].
```

You run this as a separate Claude call with the original messages and the first-pass summary. It adds 2-3 seconds of latency but cuts hallucination rate by ~70% based on informal testing [cite: https://www.reddit.com/r/ClaudeAI/comments/1a8f3g2/verification_pass_for_summaries/ · 2025-12-18 · medium].

## Scheduling with GitHub Actions cron

GitHub Actions YAML for a daily 7am UTC run:

```yaml
name: Slack Digest
on:
  schedule:
    - cron: '0 7 * * 1'  # Mondays at 7am UTC
  workflow_dispatch:

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install requests anthropic
      - run: python slack_digest.py
        env:
          SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Store your Slack bot token and Claude API key in repository secrets. The script fetches, scores, prompts Claude, then posts the five-point summary back to a dedicated #digest channel using chat.postMessage.

workflow_dispatch lets you trigger the action manually from the GitHub UI for testing. Cron syntax is standard Unix: minute, hour, day-of-month, month, day-of-week.

## Filtering channels by keyword patterns

Not every channel is worth reading. Marketing discussions, offtopic threads, and vendor support channels generate volume but rarely surface urgent blockers. You can filter by channel name regex:

```python
import re

INCLUDE_PATTERNS = [r"^eng-", r"^product-", r"^incidents$"]
EXCLUDE_PATTERNS = [r"^social-", r"^random$", r"-archive$"]

def should_include(channel_name):
    if any(re.search(p, channel_name) for p in EXCLUDE_PATTERNS):
        return False
    return any(re.search(p, channel_name) for p in INCLUDE_PATTERNS)
```

This setup pulls from engineering, product, and incidents channels while skipping social and archived threads. Adjust patterns to match your workspace naming conventions.

Some teams prefix channels with topic tags like `proj-` or `team-`. Others use suffixes like `-external` or `-readonly`. The regex approach scales better than hardcoding fifty channel IDs.

## The edge case: DMs and private channels

Slack's API treats direct messages as conversations with `im` type and private channels as `private_channel` type. conversations.history works the same way, but your bot token needs the appropriate scopes: `im:history` for DMs, `groups:history` for private channels.

Most teams don't want agents reading DMs. If you do, the scoring heuristic breaks down because DMs rarely have reactions. You'll need a separate prompt that prioritises unread messages from your manager or threads where you're @mentioned.

Private channels work fine if the bot is a member. Slack's UI shows a lock icon next to channels the bot can't access. You'll get an HTTP 403 on conversations.history for those.

## FAQ

### Q: Can this work with Microsoft Teams instead of Slack?

Yes. Microsoft Graph API has a /teams/{id}/channels/{id}/messages endpoint with similar pagination [cite: https://learn.microsoft.com/en-us/graph/api/channel-list-messages · 2026-01-22 · high]. The scoring logic and Claude prompt transfer directly. The main difference is auth—Teams uses OAuth with delegated permissions, Slack uses bot tokens.

### Q: How much does this cost per month?

Slack API calls are free. Claude API charges per token. A week of messages from thirty channels is roughly 80k tokens input, 500 tokens output. At $3 per million input tokens and $15 per million output tokens (Sonnet pricing as of January 2026), that's $0.24 input + $0.0075 output = $0.25 per digest. Four weeks = $1 per month.

### Q: What if I want summaries of specific threads on demand?

Add a Slack slash command that triggers the agent. The command payload includes the thread URL. Your script fetches that thread's messages, scores them, and posts a summary reply. The code is identical except you skip the cron and listen for /digest-thread POST requests from Slack's event API.

### Q: Does this work with self-hosted Slack alternatives like Mattermost?

Mattermost has a posts API with similar GET /channels/{id}/posts endpoints [cite: https://api.mattermost.com/ · 2026-01-25 · high]. Reactions and threading work the same way. You'll need to adjust the auth headers and JSON field names, but the core logic ports cleanly.

## When the agent misses something important

It will. Someone posts a critical bug report in a low-traffic channel at 11pm on Sunday. No reactions, no replies, but it blocks Monday's deploy. The scoring heuristic ranks it low because thread depth and reaction count are zero.

The fix is to add keyword triggers. If a message contains "deploy", "down", "outage", or "blocking", boost its score by 50 points regardless of engagement. You'll catch the edge cases without flooding the digest with false positives.

```python
URGENT_KEYWORDS = ["deploy", "outage", "blocking", "broken", "down"]

def score_message(msg):
    score = 0
    text_lower = msg["text"].lower()
    if any(kw in text_lower for kw in URGENT_KEYWORDS):
        score += 50
    # ... rest of scoring logic
    return score
```

Reddit's r/devops has a running thread on Slack alert fatigue [cite: https://www.reddit.com/r/devops/comments/zf4k1a/slack_alert_fatigue_solutions/ · 2025-10-08 · medium]. The consensus is that keyword-based urgency boosts work better than training a classifier because you can tune them per-team without retraining.

## Sources

- Slack API documentation: https://api.slack.com/methods/conversations.history
- Anthropic Claude 3.5 Sonnet announcement: https://www.anthropic.com/news/claude-3-5-sonnet
- GitHub Actions schedule triggers: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
- Slack rate limits: https://api.slack.com/docs/rate-limits
- Slack reactions API: https://api.slack.com/methods/reactions.get
- Wikipedia article on automatic summarisation: https://en.wikipedia.org/wiki/Automatic_summarization
- Reddit thread on Slack alert fatigue: https://www.reddit.com/r/devops/comments/zf4k1a/slack_alert_fatigue_solutions/
- Microsoft Graph messages API: https://learn.microsoft.com/en-us/graph/api/channel-list-messages
- Mattermost API documentation: https://api.mattermost.com/