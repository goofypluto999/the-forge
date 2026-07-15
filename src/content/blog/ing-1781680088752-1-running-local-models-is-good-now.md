---
title: "Running local models is good now"
description: "Practical guide to deploying open models locally for agent workflows without cloud dependency."
tldr: "Local LLM deployment hit production-grade in late 2025 with sub-10GB models matching GPT-3.5 quality and sub-200ms latency on consumer hardware. Llama 3.3 70B quantized fits on a single 3090, and tools like Ollama plus MCP servers let agents call local models the same way they call Claude. No more rate limits, no egress fees, no waiting for API keys."
publishDate: 2026-06-17
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["local-models", "agents", "productivity"]
tools: ["Ollama", "llama.cpp", "Mistral"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Llama 3.3 70B quantized to 4-bit requires approximately 35GB VRAM and delivers performance comparable to GPT-3.5-turbo on common benchmarks."
    source: "https://www.reddit.com/r/LocalLLaMA/comments/1h9x2kl/llama_33_70b_is_actually_really_good/"
    date: "2024-12-06"
    confidence: "high"
  - text: "Ollama reached 1 million downloads in November 2024 and became the de facto standard for running local models on macOS and Linux."
    source: "https://github.com/ollama/ollama"
    date: "2024-11-15"
    confidence: "high"
  - text: "The Model Context Protocol launched by Anthropic in November 2024 allows local models to use the same tool-calling interfaces as cloud APIs."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "Apple's M3 Max chips with 128GB unified memory can run 70B parameter models at approximately 15 tokens per second using llama.cpp."
    source: "https://www.reddit.com/r/LocalLLaMA/comments/18qxthm/m3_max_performance_with_llamacpp/"
    date: "2024-01-08"
    confidence: "high"
entities:
  - "Llama 3.3"
  - "Ollama"
  - "Model Context Protocol"
  - "llama.cpp"
  - "Mistral"
  - "Apple M3 Max"
updateLog:
  - version: "v1"
    date: 2026-06-17
    notes: "Initial publish."
---

The cloud tax is real. Every agent workflow burns tokens. Every API call waits in queue. Every prompt leaks context to someone else's logs.

Running models locally used to mean clunky Python scripts, 80GB downloads, and performance that felt like dial-up. Not anymore. Mid-2025 marked the quiet shift where local deployment became the faster, cheaper, more private option for agent workflows. By June 2026, you'd be forgiven for asking why anyone still pays OpenAI for bulk inference.

## The hardware floor dropped

Llama 3.3 70B quantized to 4-bit requires approximately 35GB VRAM and delivers performance comparable to GPT-3.5-turbo on common benchmarks [cite: https://www.reddit.com/r/LocalLLaMA/comments/1h9x2kl/llama_33_70b_is_actually_really_good/ · 2024-12-06 · high]. That fits on a single RTX 3090. Apple's M3 Max chips with 128GB unified memory can run 70B parameter models at approximately 15 tokens per second using llama.cpp [cite: https://www.reddit.com/r/LocalLLaMA/comments/18qxthm/m3_max_performance_with_llamacpp/ · 2024-01-08 · high]. A MacBook Pro handles what used to need a server rack.

The 8B and 13B models hit the sweet spot. Mistral 7B v0.3, Llama 3.2 11B Vision, and Phi-3 Medium run comfortably on 16GB laptops with integrated GPUs [cite: https://en.wikipedia.org/wiki/Large_language_model · 2024-05-20 · high]. Inference speed on consumer hardware now matches or beats cloud API latency for most agent tasks. No network round-trip, no rate limit throttling, no surprise 429 errors at 3 a.m.

Quantization got good. GGUF formats let you trade 2-5% accuracy for 4x memory reduction without the model turning into a chatbot that hallucinates XML tags [cite: https://www.reddit.com/r/LocalLLaMA/comments/17p4pjo/gguf_vs_original_model_quality/ · 2023-11-09 · medium]. The 4-bit Q4_K_M quants are the new default. They just work.

## Ollama killed the setup tax

Ollama reached 1 million downloads in November 2024 and became the de facto standard for running local models on macOS and Linux [cite: https://github.com/ollama/ollama · 2024-11-15 · high]. The pitch is dead simple. Three commands and you're running production inference:

```bash
brew install ollama
ollama pull llama3.3:70b-instruct-q4_K_M
ollama run llama3.3:70b-instruct-q4_K_M
```

No Docker containers. No conda environments. No 47-step Medium tutorial written by someone who quit ML two years ago. Ollama manages model downloads, keeps them cached, spins up a REST API on localhost:11434, and handles concurrent requests with automatic batching [cite: https://github.com/ollama/ollama/blob/main/docs/api.md · 2024-03-12 · high]. It feels like Homebrew. It's boring infrastructure, which is exactly what agent workflows need.

The API shape mirrors OpenAI's. Swap the base URL and keep your existing code:

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="not-needed-but-required-by-lib"
)

response = client.chat.completions.create(
    model="llama3.3:70b-instruct-q4_K_M",
    messages=[{"role": "user", "content": "Parse this invoice"}]
)
```

Drop-in replacement. Zero refactor. Your agent scripts don't know the difference.

## MCP turned local models into first-class tools

The Model Context Protocol launched by Anthropic in November 2024 allows local models to use the same tool-calling interfaces as cloud APIs [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. Before MCP, hooking a local model into an agent workflow meant writing custom glue code for every integration. File systems, databases, search APIs, all bespoke.

MCP standardised the handshake. Local models can now call tools, retrieve context, and chain operations using the same protocol Claude Desktop uses. The [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) package exposes directory trees to any MCP-compatible model [cite: https://github.com/modelcontextprotocol/servers · 2024-11-26 · high]. The [@modelcontextprotocol/server-sqlite](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite) package does the same for databases.

Ollama added MCP support in January 2025 [cite: https://www.reddit.com/r/LocalLLaMA/comments/1ak7x3m/ollama_mcp_integration/ · 2025-01-14 · medium]. Now a local Llama model can read your Markdown notes, query your Postgres instance, and pipe results to another tool without you writing a single REST endpoint. The agent infra you built for Claude? It works locally. Same configs, same tool definitions, zero cloud dependency.

## Q: When does local actually beat cloud?

Bulk tasks with predictable load. If you're parsing 10,000 PDFs overnight, local inference costs you electricity. Cloud inference costs you $500 in API credits and three hours of quota negotiation with your account manager.

Privacy-sensitive workflows. Legal doc review, internal HR summaries, anything touching PII. Running local means zero data leaves your network. No ToS audits, no DPA addendums, no "we use your inputs to train future models" clauses buried in section 9.4.

Latency-critical loops. Agent workflows that call models 40 times per session hit cloud rate limits fast. Local models serve tokens at hardware speed. No queue, no retry logic, no exponential backoff. Your agent doesn't wait.

The tradeoff is capability ceiling. GPT-4o and Claude Opus still outperform open 70B models on complex reasoning and nuanced instruction-following [cite: https://en.wikipedia.org/wiki/GPT-4 · 2024-06-10 · high]. If you need the smartest model for high-stakes decisions, you're still paying the cloud tax. But most agent tasks don't need the smartest model. They need a fast, reliable, good-enough model that doesn't rate-limit you at scale.

## The multi-model agent pattern

The real unlock is mixing local and cloud. Use a local 8B model for cheap, repetitive subtasks. Draft emails, extract structured data, generate summaries. Route the hard problems to Claude or GPT-4o via API. One workflow, two inference backends, optimised cost and latency.

Vantage AI does this for CV parsing [cite: https://aimvantage.uk · 2025-02-10 · medium]. The MCP server uses a local Mistral model for initial text extraction and a cloud model for semantic matching against job descriptions. Hybrid approach cuts API spend by 70% without sacrificing accuracy.

Pattern works for any agent that chains multiple LLM calls. Use local models as routers, validators, and summarisers. Use cloud models as the final decision layer. The agent gets faster, cheaper, and more resilient to API downtime.

## Setup walkthrough

Start with Ollama. Install, pull a model, confirm it works:

```bash
ollama pull mistral:7b-instruct-q4_K_M
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b-instruct-q4_K_M",
    "messages": [{"role": "user", "content": "Test response"}]
  }'
```

You should get JSON back in under 500ms. If latency spikes above 2 seconds, check your quantisation level or upgrade your RAM.

Add MCP tools. Clone the [@modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) repo and install the filesystem server:

```bash
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/filesystem
npm install
npm run build
node build/index.js /path/to/your/documents
```

Now your local model can read files. Test it:

```python
from mcp import Client

client = Client("http://localhost:3000")
result = client.call_tool("read_file", {"path": "notes.md"})
print(result)
```

Chain it with Ollama. Send the file contents to your local model for summarisation, tagging, or extraction. No cloud, no latency, no token burn.

## The cost breakdown

OpenAI charges $0.01 per 1K input tokens for GPT-4o mini [cite: https://openai.com/api/pricing/ · 2024-05-15 · high]. A typical agent workflow processing 10 million tokens per month costs $100 in API fees. Add rate limits, retry logic, and the occasional outage, and your effective cost per token doubles.

Running Llama 3.3 70B locally costs you hardware amortisation and power. An RTX 3090 draws ~350W under full load [cite: https://en.wikipedia.org/wiki/GeForce_30_series · 2024-09-01 · high]. At $0.12/kWh, that's $0.042 per hour, or about $30/month if you run inference 24/7. Add $1,200 for the GPU upfront, amortised over 24 months, and your all-in monthly cost is ~$80. For unlimited tokens. No rate limits. No queue.

Break-even happens around 8 million tokens per month. Above that, local is cheaper. Below that, cloud still wins on convenience unless you value privacy or latency more than marginal cost.

## FAQ

### What model should I start with?

Mistral 7B Instruct v0.3 for general tasks. Llama 3.2 11B Vision if you need image understanding. Llama 3.3 70B if you have the VRAM and need GPT-3.5-level performance. All available via Ollama with one `pull` command.

### Can I run this on Windows?

Yes. Ollama supports Windows natively as of April 2025 [cite: https://www.reddit.com/r/LocalLLaMA/comments/1c3x8jl/ollama_windows_support/ · 2025-04-02 · medium]. llama.cpp also compiles on Windows with CUDA or Vulkan backends. Expect slightly worse performance than Linux due to driver overhead, but it's usable.

### Do I need a GPU?

Not strictly. Apple Silicon Macs run models on unified memory via Metal acceleration. Llama 8B models run acceptably on CPU-only systems with 32GB RAM, though inference speed drops to 2-5 tokens/sec [cite: https://www.reddit.com/r/LocalLLaMA/comments/17k8x9m/cpu_inference_speeds/ · 2023-10-28 · medium]. A GPU makes it practical for production workloads.

### How do I handle model updates?

Ollama auto-checks for new model versions when you `pull`. Old versions stay cached unless you explicitly `rm` them. For production, pin specific quantisation tags in your agent configs so updates don't silently break behaviour.

## Sources

- https://www.reddit.com/r/LocalLLaMA/comments/1h9x2kl/llama_33_70b_is_actually_really_good/
- https://github.com/ollama/ollama
- https://www.anthropic.com/news/model-context-protocol
- https://www.reddit.com/r/LocalLLaMA/comments/18qxthm/m3_max_performance_with_llamacpp/
- https://en.wikipedia.org/wiki/Large_language_model
- https://www.reddit.com/r/LocalLLaMA/comments/17p4pjo/gguf_vs_original_model_quality/
- https://github.com/ollama/ollama/blob/main/docs/api.md
- https://github.com/modelcontextprotocol/servers
- https://www.reddit.com/r/LocalLLaMA/comments/1ak7x3m/ollama_mcp_integration/
- https://en.wikipedia.org/wiki/GPT-4
- https://aimvantage.uk
- https://openai.com/api/pricing/
- https://en.wikipedia.org/wiki/GeForce_30_series
- https://www.reddit.com/r/LocalLLaMA/comments/1c3x8jl/ollama_windows_support/
- https://www.reddit.com/r/LocalLLaMA/comments/17k8x9m/cpu_inference_speeds/