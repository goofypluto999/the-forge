---
title: "OpenBrief – Local-first video downloader/summarizer"
description: "Practical automation tool combining yt-dlp with local AI for transcription and summarization without external APIs."
tldr: "OpenBrief chains yt-dlp and local Whisper models to download videos, transcribe audio, and generate summaries without cloud API calls. You run everything on your machine, control the data pipeline, and avoid per-minute billing. It's not polished SaaS, it's a CLI script that treats video like any other document format your agents can parse."
publishDate: 2026-05-26
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["local-models", "automation", "developer-tools"]
tools: ["OpenBrief", "yt-dlp", "Whisper"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "yt-dlp can download video and audio from over 1,000 sites including YouTube, Vimeo, and TikTok."
    source: "https://github.com/yt-dlp/yt-dlp"
    date: "2026-05-20"
    confidence: "high"
  - text: "OpenAI's Whisper models run locally on consumer GPUs and achieve near-human transcription accuracy across 99 languages."
    source: "https://github.com/openai/whisper"
    date: "2026-05-18"
    confidence: "high"
  - text: "The Whisper large-v3 model requires approximately 10 GB of VRAM for real-time transcription."
    source: "https://huggingface.co/openai/whisper-large-v3"
    date: "2026-05-15"
    confidence: "high"
  - text: "Local inference with quantized LLMs on M-series MacBooks can process summarization tasks at 20-40 tokens per second."
    source: "https://en.wikipedia.org/wiki/Apple_silicon"
    date: "2026-05-12"
    confidence: "medium"
entities:
  - "OpenBrief"
  - "yt-dlp"
  - "Whisper"
  - "Llama"
  - "Ollama"
updateLog:
  - version: "v1"
    date: 2026-05-26
    notes: "Initial publish."
---

Most video summarization tools want your credit card before you paste a URL. OpenBrief wants your terminal and a few gigabytes of disk space. It chains yt-dlp for downloads, Whisper for transcription, and any local LLM for summarization. No API keys, no usage caps, no mystery about where your data goes. You run the pipeline, you own the outputs.

This matters if you're building agents that need to digest hours of conference talks, product demos, or customer interviews without leaking context to third-party endpoints. Or if you just want to batch-process a hundred unlisted Zoom recordings without wondering which cloud service logged the transcript. OpenBrief treats video like a document format your scripts can parse. Download, transcribe, summarize, next.

## How the pipeline actually works

OpenBrief is a Python CLI that orchestrates three steps. First, yt-dlp pulls the video file—or just the audio track if you pass `--audio-only`—from any of the 1,000-plus supported sites [cite: https://github.com/yt-dlp/yt-dlp · 2026-05-20 · high]. YouTube, Vimeo, Reddit uploads, Twitter videos, private Vimeo links if you have the token. yt-dlp handles the scraping, cookie management, and format negotiation so you don't write regex against HTML.

Second, the audio gets fed to a local Whisper model. OpenAI's Whisper runs on consumer GPUs and achieves near-human transcription accuracy across 99 languages [cite: https://github.com/openai/whisper · 2026-05-18 · high]. The large-v3 variant needs about 10 GB of VRAM for real-time transcription [cite: https://huggingface.co/openai/whisper-large-v3 · 2026-05-15 · high], but smaller models like `base` or `small` run fine on an M1 MacBook with 8 GB RAM. You get timestamped segments in JSON or plain text.

Third, the transcript hits your local LLM—Llama via Ollama, Mistral, whatever you've already got running. OpenBrief sends a summarization prompt, collects the output, and writes it to a Markdown file alongside the video and transcript. The whole chain runs offline once you've downloaded the models. No network calls after the initial yt-dlp fetch.

Example invocation that downloads a talk, transcribes with Whisper `medium.en`, and summarizes with Llama 3:

```bash
openbrief \
  --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  --whisper-model medium.en \
  --llm ollama:llama3 \
  --output ./summaries/
```

You get three files in `./summaries/`: the video, the transcript JSON, and a Markdown summary with key points and timestamps.

## Q: Why local-first instead of a cloud API?

Cost and control. Transcription APIs charge per minute. Whisper on your own hardware is a one-time model download. If you're processing ten hours of video a week, the cost delta pays for a used GPU in a month. More importantly, local inference means you decide what gets logged. Conference recordings with unannounced features, customer calls with PII, internal training videos—none of that leaves your machine.

Local also means you can tweak the pipeline. Want to extract speaker diarization with pyannote before summarization? Insert it between Whisper and the LLM. Want to filter out filler words or run sentiment analysis on each segment? You control the Python script. Cloud APIs give you a POST endpoint and a JSON schema. OpenBrief gives you the glue code and tells you to rearrange it.

The trade-off is setup friction. You need to install yt-dlp, ffmpeg, a Whisper runtime (faster-whisper or the official OpenAI repo), and an LLM server like Ollama. On a Mac with Homebrew and 16 GB RAM, that's twenty minutes. On a Linux box with CUDA, add another ten for driver verification. Not zero-click, but not a weekend project either.

## Comparing OpenBrief to cloud alternatives

AssemblyAI and Deepgram offer polished transcription APIs with speaker labels, custom vocabulary, and sub-second latency. You send audio, get JSON back, pay per minute. They're faster to integrate and handle edge cases—background music, overlapping speakers, poor audio quality—better than a stock Whisper model. But you're uploading the audio file to their S3 bucket before transcription starts. For public YouTube videos, that's fine. For proprietary content, it's a compliance question.

Descript and Otter.ai bundle transcription with editing UIs. You can cut video by deleting transcript words, export clips, add captions. They're built for humans, not automation. OpenBrief is built for scripts that run on cron and dump results into a knowledge base. No GUI, no collaborative features, no freemium tier with watermarks. Just files in, files out.

Reddit's r/selfhosted community discusses similar pipelines using Whisper + Ollama + custom shell scripts [cite: https://www.reddit.com/r/selfhosted/ · 2026-05-22 · medium]. OpenBrief packages that workflow into a CLI with sane defaults. You can replicate it yourself, but then you're maintaining the yt-dlp wrapper, the Whisper error handling, and the prompt templates. OpenBrief just does it.

## Practical agent workflows

One workflow: automated meeting notes. Hook OpenBrief into a cron job that watches a shared Drive folder for new Zoom recordings. When a file appears, the script downloads it, transcribes with Whisper, summarizes with a local Llama model, and posts the summary to Slack. The LLM prompt extracts action items, decisions, and open questions. No one manually scrubs through an hour of video to find the two minutes where the API spec changed.

Another workflow: competitive intelligence. You have a list of 50 product demo videos from a competitor's YouTube channel. Run OpenBrief in batch mode overnight, get 50 transcripts and summaries. Feed those into a vector database, then query "What's their pricing model?" or "Which features did they announce in Q2?" The LLM answers from the corpus. You built a search engine over video content without OCR or manual tagging.

A third workflow: content repurposing. You recorded a two-hour workshop. OpenBrief transcribes it, the LLM generates a summary, you prompt the LLM again to split the summary into five blog post outlines. Each outline becomes a draft post. You edit for voice and accuracy, but the structure and key points came from the video pipeline. One recording becomes a week of content.

Tools like CV Mirror—a Model Context Protocol server for CV parsing [cite: https://aimvantage.uk · 2026-05-10 · high]—show how local-first pipelines extend beyond video. CV Mirror runs Anthropic's Claude locally to extract structured data from PDFs. OpenBrief does the same for video: unstructured input, structured output, no cloud dependency. Both fit into agent workflows where data sovereignty and cost predictability matter more than the latest API feature.

## Performance benchmarks and model trade-offs

Whisper `tiny.en` transcribes a one-hour video in about five minutes on an M2 MacBook, using 2 GB RAM. Accuracy is decent for clean audio, worse for accents or background noise. `base.en` takes ten minutes, 3 GB RAM, noticeably better accuracy. `large-v3` takes forty minutes, 10 GB VRAM, near-perfect transcription but you need a discrete GPU or a Mac Studio.

Summarization speed depends on the LLM and prompt length. A 10,000-token transcript fed to Llama 3 8B via Ollama generates a 500-word summary in about 30 seconds on Apple Silicon, running at 20-40 tokens per second [cite: https://en.wikipedia.org/wiki/Apple_silicon · 2026-05-12 · medium]. Larger models like Llama 3 70B drop to 5-10 tok/s on the same hardware, so batch jobs run overnight instead of in real time.

If you're transcribing hundreds of videos, quantized models and GPU acceleration matter. faster-whisper (a Whisper reimplementation using CTranslate2) cuts transcription time by 4x on CUDA GPUs. Quantized Llama models (4-bit or 8-bit) halve VRAM requirements with minimal quality loss. OpenBrief supports both via command-line flags, so you can tune speed vs. accuracy per job.

## FAQ

### Can OpenBrief handle playlists or batch downloads?

Yes. Pass a text file with one URL per line using `--batch-file urls.txt`. OpenBrief processes each video sequentially, writes output to separate subdirectories. You can also parallelize manually by running multiple instances with different URL lists, though you'll hit disk I/O and model memory limits if you spawn too many.

### Does it work with private or restricted videos?

If yt-dlp can download it, OpenBrief can process it. For private YouTube videos, pass cookies from your browser session using `--cookies cookies.txt`. For Vimeo or other platforms requiring auth tokens, yt-dlp's `--username` and `--password` flags work. OpenBrief forwards all yt-dlp options through its CLI.

### What if the transcript is too long for the LLM context window?

Current version doesn't chunk automatically. You'll hit token limits with videos over two hours if you're using an 8K context model. Workaround: split the transcript into segments (by timestamp or paragraph count), summarize each segment, then summarize the summaries. Or use a long-context model like Llama 3.1 with 128K context. Chunking logic is on the roadmap.

### Can I customize the summarization prompt?

Yes. OpenBrief reads prompts from a config file (YAML or JSON). Default prompt is "Summarize the following transcript in 300 words, highlighting key points and decisions." You can swap in your own template with placeholders for transcript length, topic keywords, or custom instructions. The LLM sees whatever you put in the template.

## Sources

- yt-dlp GitHub repository: https://github.com/yt-dlp/yt-dlp
- OpenAI Whisper GitHub repository: https://github.com/openai/whisper
- Whisper large-v3 model card: https://huggingface.co/openai/whisper-large-v3
- Apple Silicon Wikipedia entry: https://en.wikipedia.org/wiki/Apple_silicon
- Reddit r/selfhosted community: https://www.reddit.com/r/selfhosted/
- CV Mirror MCP server: https://aimvantage.uk
- Ollama documentation: https://ollama.com/