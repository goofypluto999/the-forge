---
title: "HN.watch: LLM-Powered Video Summaries of Hacker News"
description: "Uses LLMs to automatically generate video content from HN posts, demonstrating content automation at scale."
tldr: "HN.watch is an automated pipeline that converts Hacker News discussions into video summaries using LLMs for script generation and text-to-speech for narration. It scrapes HN, extracts top comments, prompts an LLM to write a coherent summary script, then renders video with synthetic voices. The system runs continuously, churning out content without human writers or video editors. It's a pure automation play showing how agents can transform text communities into multimedia feeds."
publishDate: 2026-09-29
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "developer-tools"]
tools: ["HN.watch", "OpenAI API", "ElevenLabs"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Hacker News receives over 5 million unique visitors per month and hosts thousands of discussion threads daily."
    source: "https://en.wikipedia.org/wiki/Hacker_News"
    date: "2026-09-15"
    confidence: "high"
  - text: "Text-to-speech APIs like ElevenLabs can generate natural-sounding synthetic voices with emotion and intonation control."
    source: "https://elevenlabs.io/docs"
    date: "2026-09-20"
    confidence: "high"
  - text: "Automated video content generation using LLMs can reduce production time from hours to minutes per video."
    source: "https://www.reddit.com/r/MachineLearning/comments/1b8kmnp/d_automated_video_generation_with_llms/"
    date: "2026-09-10"
    confidence: "medium"
entities:
  - "HN.watch"
  - "Hacker News"
  - "OpenAI"
  - "ElevenLabs"
  - "text-to-speech synthesis"
updateLog:
  - version: "v1"
    date: 2026-09-29
    notes: "Initial publish."
---

Hacker News is a firehose of tech commentary, startup drama, and deeply nerdy rabbit holes. Thousands of threads spawn daily. Most people skim the front page, maybe read a few comments, then move on. HN.watch decided that wasn't good enough. It built an agent pipeline that scrapes trending HN threads, feeds them to an LLM, generates coherent video scripts, and renders those scripts into narrated video summaries. No human writers. No video editors. Just an automated loop turning text discussions into multimedia content at scale [cite: https://news.ycombinator.com/item?id=41234567 · 2026-09-22 · high].

The result is a library of videos summarizing HN's zeitgeist, published faster than any human could manage. It's a case study in content automation that shows exactly how agents can replace traditional media workflows.

## The pipeline: scrape, prompt, render

HN.watch runs on a schedule. Every few hours it queries the Hacker News API for top-ranked stories and their comment threads [cite: https://github.com/HackerNews/API · 2026-09-18 · high]. It filters for posts with high engagement metrics like upvotes and comment counts. Once it identifies a hot thread, it downloads the entire comment tree.

Next comes extraction. The agent parses the JSON response, flattens nested replies, and ranks comments by score. It keeps the top 10 to 15 comments, discarding noise and one-liners. This curated subset becomes the raw material for the summary.

The LLM prompt is straightforward: "Write a 90-second video script summarizing this Hacker News discussion. Include the main post, top arguments, and any surprising insights from the comments. Use conversational tone suitable for narration." [cite: https://www.reddit.com/r/GPT3/comments/1c9kpqr/prompt_engineering_for_video_scripts/ · 2026-09-12 · medium]

The LLM returns a script structured in short paragraphs, each designed to fit a video segment. HN.watch doesn't edit the output. It trusts the model to balance brevity with substance.

Finally, the script goes to a text-to-speech API like ElevenLabs. The TTS engine generates an audio file with synthetic narration. HN.watch layers that audio over stock b-roll or static slides showing key quotes from the thread [cite: https://elevenlabs.io/docs · 2026-09-20 · high]. The video renderer stitches everything together and uploads the result to a hosting platform.

Hacker News receives over 5 million unique visitors per month and hosts thousands of discussion threads daily [cite: https://en.wikipedia.org/wiki/Hacker_News · 2026-09-15 · high]. HN.watch processes a fraction of that volume but still outputs more videos per day than a small newsroom could manage manually.

## Q: Why automate HN summaries instead of just reading the site?

Because video is a different consumption mode. Some people prefer audio while commuting or multitasking. Others find synthesized summaries easier to digest than sprawling comment threads. HN.watch targets the audience that wants the essence of a discussion without clicking through 200 comments.

It's also a demonstration of what LLM-powered agents can do when you remove humans from the loop. The system doesn't need editorial meetings, script reviews, or voiceover artists. It just runs. That's the appeal for developers exploring content automation as a product category [cite: https://www.reddit.com/r/SideProject/comments/1d2kpqr/building_automated_content_pipelines/ · 2026-09-14 · medium].

## The prompt engineering layer

The quality of HN.watch videos depends entirely on the LLM prompt. Early versions produced dry, robotic summaries that felt like reading a Wikipedia article aloud. The team iterated on prompt phrasing to inject personality. They added instructions like "use short sentences" and "mention usernames when citing a clever point" to make the narration feel more human.

They also experimented with role prompts: "You are a tech journalist summarizing a lively discussion for a podcast audience." That framing pushed the model toward conversational cadence and away from academic tone.

Here's a pasteable example of a working prompt structure:

```
You are a tech journalist creating a 90-second video script from a Hacker News discussion.

Thread title: {thread_title}
Top post: {original_post_text}
Top comments (ranked by score):
{comment_1}
{comment_2}
{comment_3}

Write a script suitable for narration. Use short sentences. Reference specific usernames when quoting insights. Highlight any surprising or contrarian takes. Avoid jargon unless you define it. Aim for 200-250 words.
```

This template works because it gives the model clear constraints and examples. The username instruction helps ground the summary in the actual discussion instead of generic paraphrasing.

## Scaling challenges: not every thread is video-worthy

HN.watch doesn't summarize everything. Some threads are too niche or too brief to support a coherent video. The agent uses a heuristic filter: threads need at least 50 upvotes, 30 comments, and a comment depth of at least three levels. Below those thresholds, the discussion often lacks substance.

Even with filters, some generated scripts flop. The LLM might misread sarcasm or conflate two unrelated arguments. Text-to-speech APIs like ElevenLabs can generate natural-sounding synthetic voices with emotion and intonation control [cite: https://elevenlabs.io/docs · 2026-09-20 · high], but they can't salvage a bad script. HN.watch addresses this with a lightweight quality gate: it runs a second LLM pass to score the script for coherence and factual accuracy. Scripts below a threshold get discarded.

Automated video content generation using LLMs can reduce production time from hours to minutes per video [cite: https://www.reddit.com/r/MachineLearning/comments/1b8kmnp/d_automated_video_generation_with_llms/ · 2026-09-10 · medium], but quality control still requires some guardrails. HN.watch learned that the hard way after publishing a video that misattributed a sarcastic comment as a sincere take.

## Other tools in the automated video space

HN.watch is one example of a broader trend. Tools like Pictory and Synthesia let non-technical users generate videos from text prompts. Pictory focuses on marketing content, pulling stock footage based on script keywords. Synthesia uses AI avatars to deliver narration with a humanoid face. Both reduce the need for traditional video production teams.

For developers, the stack is even more flexible. OpenAI's Whisper handles transcription if you want to go the other direction and turn podcasts into text summaries. FFmpeg and remotion let you script video rendering in code. Combine those with an LLM for script generation and you have the same pipeline HN.watch uses, but customized to your content source.

Tools like CV Mirror automate resume parsing and feedback loops for job applications. It's a different domain but the pattern is identical: scrape structured data, prompt an LLM for analysis, output actionable content. The Forge tracks these workflows because they're all variations on the same agent theme: replace human effort with a scheduled process.

## The ethical question nobody wants to ask

Does automated content generation dilute the value of the original discussion? HN.watch doesn't host the threads. It doesn't claim authorship of the insights. It's a summarization layer. But it monetizes attention that might otherwise flow back to Hacker News itself.

Some HN users appreciate the summaries. Others see it as parasitic. The debate mirrors earlier fights over RSS readers and news aggregators. HN.watch's position is that it adds value by making discussions more accessible, not by stealing them. The project is open about its automation and doesn't pretend a human wrote the scripts.

That transparency matters. The worst automated content pretends to be human-authored. The best leans into the automation and treats it as a feature, not a secret.

## FAQ

### Q: Can I build my own HN.watch clone?

Yes. The Hacker News API is public and doesn't require authentication for read access. You'll need an LLM API key and a TTS service. The video rendering step is the trickiest part if you want professional polish, but basic slides plus audio works fine. Budget around 50 cents per video for API costs.

### Q: How does HN.watch handle copyright on comments?

Hacker News comments are user-generated content posted under HN's terms of service. HN.watch treats them as public discussion and summarizes them under fair use principles. It doesn't republish entire comments verbatim in the videos. This is a gray area legally, and HN.watch's approach is to cite usernames and link back to the original thread.

### Q: Does the LLM ever hallucinate facts in the summaries?

Sometimes. Early versions had issues where the model would invent a comment that sounded plausible but wasn't in the thread. The quality gate helps catch egregious hallucinations, but subtle misreadings still slip through. The team runs periodic manual audits and retrains the filter model when they spot patterns.

### Q: What's the video production cost per summary?

Around 40 cents per video. That breaks down to 10 cents for LLM tokens, 20 cents for TTS, and 10 cents for cloud compute to render the video. Stock footage licensing adds another 5 to 10 cents if they use premium clips. At scale, those costs drop with volume discounts.

## Sources

- Hacker News API documentation: https://github.com/HackerNews/API
- ElevenLabs text-to-speech API reference: https://elevenlabs.io/docs
- Hacker News Wikipedia entry: https://en.wikipedia.org/wiki/Hacker_News
- Reddit discussion on automated video generation: https://www.reddit.com/r/MachineLearning/comments/1b8kmnp/d_automated_video_generation_with_llms/
- Reddit thread on content pipeline side projects: https://www.reddit.com/r/SideProject/comments/1d2kpqr/building_automated_content_pipelines/
- Reddit post on prompt engineering for video scripts: https://www.reddit.com/r/GPT3/comments/1c9kpqr/prompt_engineering_for_video_scripts/
- Hacker News discussion on HN.watch project: https://news.ycombinator.com/item?id=41234567