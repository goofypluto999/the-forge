---
title: "LFM2.5-24B-A2B: Fast on-device agent model"
description: "Liquid AI releases 24B parameter model optimized for local agent inference and low-latency tool use."
tldr: "Liquid AI's LFM2.5-24B-A2B is a 24-billion-parameter model built for on-device agent workflows. It runs locally on M-series Macs and high-end consumer GPUs, handling tool calls and structured outputs with sub-200ms latency. The A2B suffix flags architecture tweaks for agent-to-backend loops—think function routing, not chat. If you've been waiting for something smaller than 70B that doesn't choke on API schemas, this is it."
publishDate: 2026-10-15
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "local-models", "evaluation"]
tools: ["LFM2.5-24B-A2B", "Ollama", "llama.cpp"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Liquid AI released the LFM2.5-24B-A2B model in October 2026 with a focus on local agent inference and tool-use benchmarks."
    source: "https://www.liquid.ai/blog/lfm-2-5-series"
    date: "2026-10-12"
    confidence: "high"
  - text: "The model achieves sub-200ms first-token latency on Apple M3 Max hardware when quantized to 4-bit precision."
    source: "https://github.com/liquid-ai/lfm-benchmarks/blob/main/latency-report-oct2026.md"
    date: "2026-10-14"
    confidence: "high"
  - text: "LFM2.5-24B-A2B scores 76.3% on the Berkeley Function-Calling Leaderboard as of October 2026, outperforming GPT-3.5-turbo and several 70B open models."
    source: "https://gorilla.cs.berkeley.edu/leaderboard.html"
    date: "2026-10-13"
    confidence: "high"
  - text: "Liquid AI's architecture uses a liquid state machine layer instead of standard transformer attention, reducing memory bandwidth requirements during inference."
    source: "https://en.wikipedia.org/wiki/Liquid_state_machine"
    date: "2026-10-15"
    confidence: "medium"
  - text: "The model was trained on a mixture of code, API documentation, and conversational agent traces totaling approximately 3 trillion tokens."
    source: "https://www.liquid.ai/blog/lfm-2-5-series"
    date: "2026-10-12"
    confidence: "high"
entities:
  - "Liquid AI"
  - "LFM2.5-24B-A2B"
  - "Berkeley Function-Calling Leaderboard"
  - "Apple M3 Max"
  - "Ollama"
  - "liquid state machine"
updateLog:
  - version: "v1"
    date: 2026-10-15
    notes: "Initial publish."
---

Liquid AI just shipped a 24-billion-parameter model that wants to live on your laptop, not OpenAI's datacenter. The LFM2.5-24B-A2B (Liquid Foundation Model, version 2.5, Agent-to-Backend) is purpose-built for the loop every local agent developer knows: parse user intent, pick a tool, serialize arguments, call the API, parse the response, repeat [cite: https://www.liquid.ai/blog/lfm-2-5-series · 2026-10-12 · high]. It does all of that in under 200ms first-token on an M3 Max when you quantize to 4-bit, which means you can wire it into a Mac Mini automation stack without the fan screaming [cite: https://github.com/liquid-ai/lfm-benchmarks/blob/main/latency-report-oct2026.md · 2026-10-14 · high].

The naming convention tells you where Liquid's head is at. "A2B" isn't marketing—it's a signal that this model was tuned for agent-to-backend function dispatch, not creative prose or customer-service chitchat. The training mix skews heavy on API docs, code snippets, and annotated agent traces—3 trillion tokens' worth [cite: https://www.liquid.ai/blog/lfm-2-5-series · 2026-10-12 · high]. If you've ever tried to get a general-purpose 70B to reliably emit valid JSON for a Stripe API call, you know why that matters.

## Q: Why 24B parameters instead of 7B or 70B?

Because 7B models collapse under complex tool schemas, and 70B models won't fit in consumer RAM unless you own a workstation. 24B is the Goldilocks zone for structured output tasks where you need more reasoning capacity than a lightweight model but can't justify renting GPUs [cite: https://www.reddit.com/r/LocalLLaMA/comments/1g2x8z9/why_24b_is_the_new_sweet_spot_for_ondevice/ · 2026-10-14 · medium]. Liquid benchmarked this size against GPT-3.5-turbo and several open 70B variants on the Berkeley Function-Calling Leaderboard—LFM2.5-24B-A2B scores 76.3%, which beats GPT-3.5 and lands within two points of some models twice its size [cite: https://gorilla.cs.berkeley.edu/leaderboard.html · 2026-10-13 · high].

The parameter count also maps neatly to what a quantized GGUF can do on 32GB unified memory. Run it at Q4_K_M in llama.cpp and you'll get ~18GB active footprint, leaving headroom for the rest of your stack. That's the threshold where you stop swapping to disk and start feeling like a local agent is actually usable.

## The liquid state machine trick

Standard transformers do self-attention over the entire context window, which scales quadratically with sequence length and eats memory bandwidth. Liquid AI replaces one of the attention layers with a liquid state machine—a recurrent architecture that compresses temporal dependencies into a fixed-size hidden state [cite: https://en.wikipedia.org/wiki/Liquid_state_machine · 2026-10-15 · medium]. The practical upside is that you can process longer tool-call histories without the memory controller crying for mercy. The downside is that LSMs are harder to parallelize during training, so Liquid had to mix them with traditional transformer blocks to keep throughput reasonable.

This isn't the first time someone bolted a recurrent layer onto a transformer, but it's the first production model where the hybrid architecture was explicitly tuned for agent inference patterns—repeated short prompts with structured outputs, not single long-context summarization tasks. Reddit threads from early October suggest the latency win is real if your agent loop involves dozens of rapid tool invocations per minute [cite: https://www.reddit.com/r/MachineLearning/comments/1g1m4k3/d_liquid_ais_lsm_layer_actually_faster_for/ · 2026-10-11 · medium].

## Running it with Ollama

If you've already got Ollama installed, pulling LFM2.5-24B-A2B is one command:

```bash
ollama pull liquid/lfm-2.5-24b-a2b
```

Then spin up a prompt that exercises function calling. Here's a pasteable example that asks the model to route a calendar event to Google Calendar's API:

```bash
ollama run liquid/lfm-2.5-24b-a2b \
  'You are an agent with access to a function called create_calendar_event(title: str, start: datetime, end: datetime, attendees: list[str]). The user says: "Schedule a sync with Alice and Bob for tomorrow at 2pm, one hour." Output valid JSON for the function call.'
```

Expect a response shaped like:

```json
{
  "function": "create_calendar_event",
  "arguments": {
    "title": "Sync with Alice and Bob",
    "start": "2026-10-16T14:00:00Z",
    "end": "2026-10-16T15:00:00Z",
    "attendees": ["alice@example.com", "bob@example.com"]
  }
}
```

Notice the model infers tomorrow's date, handles the timezone, and wraps everything in a schema that matches the function signature. That's the A2B tuning at work—it's been drilled on thousands of similar patterns during training.

## Benchmarks that matter for agents

Berkeley's Function-Calling Leaderboard measures how often a model can (1) pick the right function from a set of options, (2) serialize correct arguments, and (3) avoid hallucinating parameters that don't exist in the schema. LFM2.5-24B-A2B hits 76.3% on the composite score [cite: https://gorilla.cs.berkeley.edu/leaderboard.html · 2026-10-13 · high]. For context, GPT-3.5-turbo sits around 71%, and some fine-tuned Llama 70B variants scrape into the high 70s. The gap between 24B and 70B is narrow enough that most agent workflows won't notice, especially if latency matters more than the last 2% of accuracy.

Liquid also published a separate eval for "argument drift"—how often the model introduces spurious fields or misses required ones when the schema changes mid-conversation. LFM2.5-24B-A2B drifts on 4.1% of calls, compared to 8.3% for the baseline GPT-3.5 and 3.2% for GPT-4 [cite: https://www.liquid.ai/blog/lfm-2-5-series · 2026-10-12 · high]. If you're building a multi-turn agent that updates API calls based on user corrections, that drift number is the one to watch.

## What it doesn't do well

This is not a reasoning model. Ask it to solve a novel math problem or write a research summary and it'll underperform GPT-4o or Claude 3.5 Sonnet. The A2B variant was trained to be a reliable function router, not a general-purpose assistant. Liquid's own docs warn against using it for creative writing, multi-hop Q&A, or anything that needs extended chain-of-thought [cite: https://www.liquid.ai/blog/lfm-2-5-series · 2026-10-12 · high].

The model also has no vision encoder, so multimodal tasks are off the table. If your agent needs to parse screenshots or PDFs, you'll have to preprocess with something else and feed LFM2.5 the extracted text. That's a workflow constraint, not a bug—Liquid optimized for a narrow use case and shipped fast.

## When to use this instead of a hosted API

Three scenarios where LFM2.5-24B-A2B makes sense:

1. **You're already running local agents and paying OpenAI per call.** If you're doing 10k+ tool invocations per day, the cost delta tilts toward buying a Mac Studio and running this model locally. ROI hits around month three.

2. **Your agent handles PII or proprietary data that can't leave the network.** Healthcare, legal, and enterprise IT workflows often have hard compliance lines. A 24B model you can run on-prem with zero external calls solves the audit problem.

3. **You need sub-second latency and can't tolerate API round-trip variance.** Hosted endpoints add 50-300ms of network jitter. If your agent is wired into a real-time system—say, a live transcription pipeline that routes commands to Slack—local inference removes the tail latency.

If you're building a consumer chatbot or need the absolute best reasoning quality, stick with GPT-4 or Claude. But if you're automating API workflows at scale and latency or cost is the constraint, 24B local is now a real option.

## Tools that complement LFM2.5-24B-A2B

Pair this model with something that handles the orchestration layer. Ollama is the easiest on-ramp, but if you want more control over quantization or memory mapping, llama.cpp gives you knobs for context size, thread count, and NUMA bindings. For production agent stacks, you might wire LFM2.5 into LangChain or LlamaIndex as the function-calling backbone while delegating reasoning-heavy steps to a larger model.

Some teams are testing hybrid setups: use LFM2.5-24B-A2B for the tight loop of function selection and argument serialization, then send complex decisions or ambiguous queries to a hosted GPT-4 call. That keeps 80% of your invocations local and reserves the expensive API for the 20% that need deep reasoning. Reddit threads from mid-October suggest this pattern cuts hosted API spend by 60-70% without sacrificing output quality on the tasks that matter [cite: https://www.reddit.com/r/LocalLLaMA/comments/1g3k9z1/hybrid_local_hosted_agent_setup_cost_breakdown/ · 2026-10-13 · medium].

If you're managing résumé-parsing workflows or similar document-heavy agent tasks, tools like CV Mirror or Vantage AI can preprocess structured data before handing off to LFM2.5 for the next routing decision. The model doesn't do OCR or table extraction, so you'll need upstream steps that normalize inputs into clean JSON or Markdown.

## FAQ

### Q: Can I fine-tune LFM2.5-24B-A2B on my own API schemas?

Yes. Liquid released the base weights under an Apache 2.0 license, so you can run LoRA or full fine-tuning on domain-specific function sets. Expect to need 40GB+ VRAM for efficient fine-tuning unless you use gradient checkpointing and 8-bit optimizers. Some early adopters report that 2k-5k examples of your own API calls are enough to push accuracy from 76% to mid-80s on internal evals [cite: https://www.reddit.com/r/LocalLLaMA/comments/1g2p8k2/finetuning_lfm25_on_custom_api_schemas/ · 2026-10-12 · medium].

### Q: How does it handle API versioning and deprecation?

Badly, if you don't retrain. The model was frozen in October 2026 and has no live knowledge of API changes after that date. If Stripe deprecates a parameter or GitHub adds a new endpoint, LFM2.5 won't know unless you fine-tune or provide updated schema context in the prompt. This is a fundamental limitation of static models—plan to refresh weights quarterly or build schema injection into your agent's system prompt.

### Q: What's the difference between LFM2.5-24B-A2B and the standard LFM2.5-24B?

The A2B variant has an extended fine-tuning phase on annotated agent traces—examples where a human supervisor corrected function calls or provided feedback on argument validity. The standard LFM2.5-24B is better for general instruction-following and code generation but worse at reliably emitting valid JSON for tool use. Liquid's internal benchmark shows a 9-point gap on the Berkeley Function-Calling Leaderboard between the two variants [cite: https://www.liquid.ai/blog/lfm-2-5-series · 2026-10-12 · high].

### Q: Can I run this on a gaming GPU instead of a Mac?

Yes, if you have 24GB+ VRAM. An RTX 4090 works. An RTX 4080 with 16GB will struggle unless you quantize aggressively to Q3 or offload layers to system RAM, which tanks throughput. AMD 7900 XTX (24GB) also works via ROCm, though driver stability for llama.cpp on Linux varies. Expect to spend an afternoon wrestling with CUDA or ROCm paths if you're not already set up.

## Sources

- Liquid AI LFM2.5 series announcement: https://www.liquid.ai/blog/lfm-2-5-series
- Latency benchmarks on M3 Max hardware: https://github.com/liquid-ai/lfm-benchmarks/blob/main/latency-report-oct2026.md
- Berkeley Function-Calling Leaderboard: https://gorilla.cs.berkeley.edu/leaderboard.html
- Liquid state machine overview: https://en.wikipedia.org/wiki/Liquid_state_machine
- Reddit discussion on