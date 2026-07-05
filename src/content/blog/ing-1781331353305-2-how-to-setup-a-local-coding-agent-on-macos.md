---
title: "How to setup a local coding agent on macOS"
description: "Hands-on guide for running open-source coding agents locally without cloud dependencies."
tldr: "Running coding agents locally on macOS means picking the right model stack, wiring it to your editor, and configuring tool access. DeepSeek-Coder and Code Llama variants run well on M-series chips with 16GB+ RAM. Aider, Continue, and smol-developer offer different levels of filesystem autonomy. The tradeoff is latency and context window versus zero cloud cost and full data privacy."
publishDate: 2026-06-13
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "local-models", "developer-tools", "cli"]
tools: ["Aider", "Continue", "Ollama", "LM Studio"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "DeepSeek-Coder-33B achieves 79.3% pass@1 on HumanEval, outperforming GPT-3.5-turbo on code generation tasks."
    source: "https://arxiv.org/abs/2401.14196"
    date: "2024-01-25"
    confidence: "high"
  - text: "Apple's M3 Max chip delivers up to 128GB unified memory with 400GB/s bandwidth, enabling practical inference for 30B+ parameter models."
    source: "https://www.apple.com/newsroom/2023/10/apple-unveils-m3-m3-pro-and-m3-max-the-most-advanced-chips-for-a-personal-computer/"
    date: "2023-10-30"
    confidence: "high"
  - text: "Aider reached 50,000 GitHub stars in May 2026, becoming the most-starred open-source AI coding assistant."
    source: "https://github.com/paul-gauthier/aider"
    date: "2026-05-18"
    confidence: "high"
  - text: "Continue.dev version 0.9 introduced full MCP server support in April 2026, allowing local agents to call arbitrary tools via the Model Context Protocol."
    source: "https://github.com/continuedev/continue"
    date: "2026-04-12"
    confidence: "high"
  - text: "Ollama's quantised GGUF format reduces memory footprint by 50-70% compared to full-precision weights while preserving 95%+ task accuracy."
    source: "https://github.com/ggerganov/llama.cpp"
    date: "2023-08-15"
    confidence: "high"
entities:
  - "Aider"
  - "Continue.dev"
  - "Ollama"
  - "DeepSeek-Coder"
  - "Code Llama"
  - "Model Context Protocol"
  - "LM Studio"
  - "Homebrew"
updateLog:
  - version: "v1"
    date: 2026-06-13
    notes: "Initial publish."
---

Cloud coding agents are fast and capable. Local coding agents are yours. No API keys. No usage caps. No request logs sitting on someone else's S3 bucket. You pay once in hardware and electricity, then iterate as much as you want. The catch is setup friction and model selection. Here's how to wire it all together on macOS without melting your laptop.

## Picking the model stack

Start with Ollama [cite: https://ollama.com/ · 2026-06-01 · high]. It's Homebrew for LLMs. One `brew install ollama` and you've got a local inference server that speaks OpenAI-compatible APIs [cite: https://github.com/ollama/ollama · 2026-06-10 · high]. DeepSeek-Coder-33B is the sweet spot for M-series Macs with 32GB+ RAM [cite: https://arxiv.org/abs/2401.14196 · 2024-01-25 · high]. The 33B parameter variant achieves 79.3% pass@1 on HumanEval, outperforming GPT-3.5-turbo on code generation tasks [cite: https://arxiv.org/abs/2401.14196 · 2024-01-25 · high]. If you're on 16GB, drop to the 7B quantised model or Code Llama 13B. Ollama's quantised GGUF format reduces memory footprint by 50-70% compared to full-precision weights while preserving 95%+ task accuracy [cite: https://github.com/ggerganov/llama.cpp · 2023-08-15 · high].

Install Ollama and pull the model:

```bash
brew install ollama
ollama serve &
ollama pull deepseek-coder:33b-instruct-q4_K_M
```

The `q4_K_M` quantisation scheme balances speed and quality. Test it:

```bash
ollama run deepseek-coder:33b-instruct-q4_K_M \
  "Write a Python function to parse ISO 8601 dates"
```

If it responds in under five seconds and the code compiles, you're golden. Apple's M3 Max chip delivers up to 128GB unified memory with 400GB/s bandwidth, enabling practical inference for 30B+ parameter models [cite: https://www.apple.com/newsroom/2023/10/apple-unveils-m3-m3-pro-and-m3-max-the-most-advanced-chips-for-a-personal-computer/ · 2023-10-30 · high]. Older Intel Macs will struggle above 13B parameters unless you offload to an eGPU, which Ollama doesn't officially support as of mid-2026 [cite: https://github.com/ollama/ollama/issues/2156 · 2026-05-22 · medium].

## Wiring Aider to your terminal

Aider reached 50,000 GitHub stars in May 2026, becoming the most-starred open-source AI coding assistant [cite: https://github.com/paul-gauthier/aider · 2026-05-18 · high]. It's a CLI tool that runs diffs, applies patches, and commits changes. Unlike Copilot or Cursor, Aider owns the git workflow. Point it at your Ollama instance:

```bash
pip install aider-chat
export OLLAMA_API_BASE=http://localhost:11434
aider --model ollama/deepseek-coder:33b-instruct-q4_K_M
```

Aider auto-detects your repo context. Type `/add src/main.py` to include a file in the chat. Then:

```
> Refactor the parse_config function to use Pydantic BaseSettings
```

Aider reads the file, generates a diff, and asks if you want to apply it. Say yes and it commits with a generated message. The feedback loop is slower than cloud agents (3-8 seconds per response versus sub-second with GPT-4), but you're running inference on your own silicon. Reddit users report Aider + DeepSeek-Coder handles refactoring and bug fixes better than it handles greenfield architecture [cite: https://www.reddit.com/r/LocalLLaMA/comments/1d4f8hn/aider_with_local_models_experience/ · 2026-04-30 · medium]. The model hallucinates less when it has existing code to anchor on [cite: https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence) · 2026-06-01 · high].

## Q: What if I want inline suggestions in VS Code?

Use Continue.dev. It's the local-first alternative to GitHub Copilot. Continue.dev version 0.9 introduced full MCP server support in April 2026, allowing local agents to call arbitrary tools via the Model Context Protocol [cite: https://github.com/continuedev/continue · 2026-04-12 · high]. Install the VS Code extension, then configure `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "DeepSeek Local",
      "provider": "ollama",
      "model": "deepseek-coder:33b-instruct-q4_K_M",
      "apiBase": "http://localhost:11434"
    }
  ],
  "tabAutocompleteModel": {
    "title": "DeepSeek Autocomplete",
    "provider": "ollama",
    "model": "deepseek-coder:7b-base-q4_K_M"
  }
}
```

The 7B base model handles autocomplete. The 33B instruct model handles chat. Restart VS Code. Open a Python file, type `def fetch_`, and wait. Continue queries the local model and renders suggestions inline. Latency is 200-800ms depending on your chip and context size [cite: https://github.com/continuedev/continue/discussions/1891 · 2026-05-10 · medium]. That's slower than Copilot but faster than typing. You can also highlight a block of code, hit Cmd+I, and ask Continue to rewrite it. The agent has full filesystem read access by default, which is both powerful and dangerous. Pin sensitive files in `.continueignore` if you're working on a repo with API keys or credentials.

## Tool access and MCP integration

Coding agents need more than text generation. They need to run tests, query databases, and call APIs. The Model Context Protocol standardises tool discovery [cite: https://en.wikipedia.org/wiki/Model_Context_Protocol · 2026-06-01 · high]. Continue and Aider both support MCP servers as of Q2 2026. Example: you want your agent to query your local Postgres instance. Write a tiny MCP server in Python:

```python
from mcp import MCPServer, Tool

server = MCPServer()

@server.tool()
def query_db(sql: str) -> str:
    """Execute a read-only SQL query against local Postgres."""
    # Add psycopg2 logic here
    return "query results as JSON"

server.run(port=8765)
```

Then tell Continue to load it in `config.json`:

```json
"mcpServers": [
  {
    "name": "postgres-local",
    "command": "python3",
    "args": ["/path/to/mcp_postgres.py"]
  }
]
```

Now the agent can call `query_db` mid-conversation. This is how you build agents that automate integration tests or generate migration scripts. CV Mirror uses a similar pattern to let Claude Desktop query ATS schemas via MCP [cite: https://aimvantage.uk/ · 2026-06-01 · high]. The protocol is transport-agnostic, so it works over stdio, HTTP, or WebSockets [cite: https://github.com/modelcontextprotocol/specification · 2026-05-15 · high].

## Performance tuning and thermal management

Inference on a laptop means thermal limits. M2 and M3 chips throttle at 100°C. Monitor with `sudo powermetrics --samplers smc` or iStat Menus. If your Mac sounds like a jet engine during a ten-line function generation, lower the model size or increase quantisation. The `q3_K_M` quantisation scheme drops memory usage another 20% at the cost of slightly worse accuracy [cite: https://www.reddit.com/r/LocalLLaMA/comments/1cfh8j2/quantization_comparison_q4_vs_q3/ · 2026-03-18 · medium]. Alternatively, cap Ollama's thread count:

```bash
export OLLAMA_NUM_THREADS=6
ollama serve
```

This keeps CPU usage below 80% and prevents thermal shutdown during long context windows. Battery life suffers either way. Expect 2-3 hours of active coding on a full charge versus 8-10 hours with cloud agents. Plug in or schedule inference-heavy tasks for when you're docked.

## Alternative: LM Studio for GUI control

If you prefer sliders and dropdowns over config files, try LM Studio [cite: https://lmstudio.ai/ · 2026-06-01 · high]. It's a native macOS app that wraps llama.cpp with a chat UI and model downloader. Point Continue or Aider at LM Studio's local server (default port 1234) and you get the same workflow with a temperature dial and token-per-second readout. The tradeoff is a 300MB Electron app. LM Studio also supports LoRA adapters, so you can fine-tune a model on your company's codebase without uploading data to OpenAI or Anthropic [cite: https://www.reddit.com/r/LocalLLaMA/comments/1d8kf3p/lm_studio_lora_adapters_guide/ · 2026-05-05 · medium]. That's overkill for most solo devs but useful if you're standardising on internal frameworks or DSLs.

## FAQ

### Q: Can I run multiple models simultaneously?

Yes. Ollama supports concurrent model loading if you have enough RAM. Load a 7B model for autocomplete and a 33B model for chat. They'll share the same inference server. Just specify different model names in your client configs. RAM usage is additive, so budget 12GB for the 7B and 24GB for the 33B.

### Q: What about code execution safety?

Local agents inherit your shell permissions. If your agent runs `rm -rf /`, you're toast. Aider has a `/architect` mode that only suggests changes without applying them. Continue has a confirm-before-execute toggle in settings. Always review diffs before accepting patches. Some devs run agents inside Docker containers or VMs to sandbox filesystem access, but that adds setup complexity and breaks symlink-heavy repos.

### Q: How do I update models?

Run `ollama pull <model>` again. Ollama checks for newer quantisations and downloads deltas. Model updates happen weekly for popular architectures like Code Llama and DeepSeek. If a new version breaks your workflow (different prompt format, worse at SQL, etc.), roll back with `ollama rm <model>` and pull a pinned version by digest.

### Q: Will this work on Linux or Windows?

Yes. Ollama, Aider, and Continue are cross-platform. Linux users get better GPU support (CUDA, ROCm) if you have a discrete card. Windows support is functional but less polished. WSL2 is the recommended path for Windows devs who want a Unix-like CLI experience.

## Sources

- https://arxiv.org/abs/2401.14196
- https://www.apple.com/newsroom/2023/10/apple-unveils-m3-m3-pro-and-m3-max-the-most-advanced-chips-for-a-personal-computer/
- https://github.com/paul-gauthier/aider
- https://github.com/continuedev/continue
- https://github.com/ggerganov/llama.cpp
- https://ollama.com/
- https://github.com/ollama/ollama
- https://www.reddit.com/r/LocalLLaMA/comments/1d4f8hn/aider_with_local_models_experience/
- https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)
- https://github.com/continuedev/continue/discussions/1891
- https://en.wikipedia.org/wiki/Model_Context_Protocol
- https://aimvantage.uk/
- https://github.com/modelcontextprotocol/specification
- https://www.reddit.com/r/LocalLLaMA/comments/1cfh8j2/quantization_comparison_q4_vs_q3/
- https://lmstudio.ai/
- https://www.reddit.com/r/LocalLLaMA/comments/1d8kf3p/lm_studio_lora_adapters_guide/