---
title: "CS336: Language Modeling from Scratch — The Course That Trains Agent Builders, Not Prompt Jockeys"
description: "Stanford's CS336 teaches you to build language models from zero. No API wrappers. No vibes. Just math, code, and the fundamentals that make agents actually work."
tldr: "CS336 is Stanford's graduate course on building language models from scratch — covering tokenization, attention mechanisms, training loops, and emergent behaviors. It's free, public, and designed for engineers who want to understand how LLMs work under the hood instead of just calling APIs. The course gives you the literacy to debug agent failures, optimize inference, and stop guessing why your prompts break."
publishDate: 2026-06-02
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "prompt-engineering", "developer-tools", "education"]
tools: ["CS336", "PyTorch", "Hugging Face Transformers"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "CS336 is a Stanford graduate course that teaches language modeling from first principles, including tokenization, training loops, and emergent behaviors."
    source: "https://stanford-cs336.github.io/spring2024/"
    date: "2024-03-15"
    confidence: "high"
  - text: "The course materials include lecture notes, assignments, and code implementations that are publicly available on GitHub."
    source: "https://github.com/stanford-cs336/spring2024-lectures"
    date: "2024-04-10"
    confidence: "high"
  - text: "Understanding attention mechanisms and transformer architectures is foundational for debugging agent behavior and optimizing inference performance."
    source: "https://en.wikipedia.org/wiki/Attention_(machine_learning)"
    date: "2024-01-20"
    confidence: "high"
  - text: "The course covers the scaled dot-product attention formula and multi-head attention mechanisms used in modern transformers."
    source: "https://arxiv.org/abs/1706.03762"
    date: "2017-06-12"
    confidence: "high"
  - text: "CS336 includes hands-on assignments where students implement tokenizers, training loops, and inference optimizations in PyTorch."
    source: "https://stanford-cs336.github.io/spring2024/assignments.html"
    date: "2024-03-20"
    confidence: "high"
entities:
  - "CS336"
  - "Stanford University"
  - "Language Model"
  - "Transformer Architecture"
  - "PyTorch"
  - "Attention Mechanism"
  - "Tatsu Hashimoto"
  - "Percy Liang"
updateLog:
  - version: "v1"
    date: 2026-06-02
    notes: "Initial publish."
---

Most agent builders treat language models like black boxes. You send tokens in. You get tokens out. When something breaks, you tweak the prompt and pray. CS336 is the antidote to that vibe-based workflow. It's Stanford's graduate course on building language models from scratch, and it's designed to give you the literacy to debug failures, optimize inference, and stop guessing why your agent hallucinates product names at 3am [cite: https://stanford-cs336.github.io/spring2024/ · 2024-03-15 · high].

The course materials are public. The lectures are on GitHub. The assignments walk you through implementing tokenizers, training loops, and attention mechanisms in PyTorch [cite: https://github.com/stanford-cs336/spring2024-lectures · 2024-04-10 · high]. It's not an API tutorial. It's a ground-up construction of the thing you're already using to power your agents.

## Why agent builders need this

If you're shipping agents, you're shipping systems that chain LLM calls, parse outputs, and retry on failure. When those systems break, you need to know whether the problem is in your prompt, your tokenizer, your sampling strategy, or the model's training data. CS336 gives you the mental model to distinguish between those failure modes.

The course covers tokenization, which is where most people first learn that "strawberry" and " strawberry" are different tokens [cite: https://www.reddit.com/r/MachineLearning/comments/10qz9x5/d_why_do_llms_struggle_with_simple_counting_tasks/ · 2023-02-01 · high]. It covers attention mechanisms, which is where you learn why context windows matter and why your agent forgets the first three turns of a conversation [cite: https://en.wikipedia.org/wiki/Attention_(machine_learning) · 2024-01-20 · high]. It covers training dynamics, which is where you learn why your fine-tuned model overfits on 200 examples and produces garbage on the 201st.

This isn't theoretical. The assignments ask you to implement these things. You write the code that chunks text into subwords. You write the code that computes scaled dot-product attention. You write the code that backpropagates gradients through a transformer block [cite: https://stanford-cs336.github.io/spring2024/assignments.html · 2024-03-20 · high].

## ## Q: What's actually in the course?

CS336 is structured as a 10-week quarter. The first few weeks cover tokenization, embeddings, and the transformer architecture. The middle weeks cover training (optimizers, learning rate schedules, gradient accumulation). The last weeks cover emergent behaviors, scaling laws, and inference optimization [cite: https://stanford-cs336.github.io/spring2024/ · 2024-03-15 · high].

Each week pairs a lecture with a coding assignment. The assignments are in PyTorch, but the concepts port to any framework. You're not just reading about attention mechanisms — you're implementing them in `attention.py` and watching the loss curve drop.

The course assumes you know Python, linear algebra, and basic probability. It does not assume you've trained a neural network before. The first assignment walks you through building a bigram language model as a warm-up. By assignment four, you're training a small transformer on real text and measuring perplexity.

Here's a snippet from one of the early assignments, where you implement the attention mechanism:

```python
import torch
import torch.nn.functional as F

def scaled_dot_product_attention(Q, K, V, mask=None):
    """
    Q, K, V: (batch_size, seq_len, d_k)
    mask: (batch_size, seq_len, seq_len) or None
    """
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))
    attn_weights = F.softmax(scores, dim=-1)
    output = torch.matmul(attn_weights, V)
    return output, attn_weights
```

That's the function that powers every transformer you've ever used. Writing it yourself changes how you think about context length, memory usage, and why your agent's latency spikes when the conversation gets long.

## The emergent behaviors module

One of the most valuable parts of CS336 is the module on emergent behaviors. This is where the course stops being about math and starts being about what happens when you actually train these things at scale [cite: https://www.reddit.com/r/LocalLLaMA/comments/12zv8x3/emergent_abilities_in_llms_are_they_real/ · 2023-04-20 · medium].

You learn about in-context learning, where the model figures out a task from a few examples without weight updates. You learn about chain-of-thought reasoning, where the model performs better if you let it "think out loud" in the prompt. You learn about instruction following, and why it only works if the model saw instruction-response pairs during training.

This module is why CS336 matters for agent builders. Agents are systems that rely on emergent behaviors. They don't work by following deterministic code paths — they work because the model learned to generalize from training data. If you don't understand where that generalization comes from, you can't predict when it'll fail.

## What this means for prompt engineering

Prompt engineering isn't a dark art. It's applied linguistics on top of a probability distribution learned from internet text. CS336 teaches you what that distribution looks like and how it gets shaped during training [cite: https://arxiv.org/abs/1706.03762 · 2017-06-12 · high].

You learn that prompts work better when they match the distribution of text the model saw during training. You learn that few-shot examples work because they shift the model's priors without updating weights. You learn that chain-of-thought prompts work because they give the model more tokens to "think" before committing to an answer.

You also learn the limits. You learn that no amount of prompt engineering will make a 7B parameter model perform arithmetic reliably, because it doesn't have enough capacity to memorize multiplication tables. You learn that retrieval-augmented generation works because it sidesteps the model's memory bottleneck by injecting facts into the context.

Here's a prompt pattern that CS336 helps you understand:

```
Task: Extract all dates from the following text.

Text: The conference starts on June 15th and ends on June 17th.

Step 1: Identify date-like phrases.
Step 2: Normalize them to YYYY-MM-DD format.
Step 3: Return as a JSON array.

Output:
```

That works because it mirrors the step-by-step format the model saw in instruction-tuning data. You're not tricking the model — you're giving it a scaffold that matches its training distribution.

## ## Who teaches this?

CS336 is taught by Tatsu Hashimoto and Percy Liang, both Stanford faculty who work on language model evaluation and alignment. The course originally ran in Spring 2024, and the materials have been public since then [cite: https://stanford-cs336.github.io/spring2024/ · 2024-03-15 · high].

The lectures are dense but practical. They cover theory without getting lost in it. The assignments are hard but doable if you know Python and can read a loss curve. The course is aimed at grad students, but it's accessible to anyone with a strong programming background and tolerance for matrix multiplication.

## Tools and ecosystems

CS336 uses PyTorch as the primary framework, but the concepts apply to JAX, TensorFlow, or any other autodiff library. The course also references Hugging Face Transformers as the ecosystem where pre-trained models live, but you're not using `AutoModelForCausalLM` — you're implementing `CausalLMHead` from scratch [cite: https://github.com/stanford-cs336/spring2024-lectures · 2024-04-10 · high].

If you're building agents with Claude Desktop, the Model Context Protocol, or any other tool that wraps an LLM, CS336 teaches you what's happening under that wrapper. You learn why context windows are measured in tokens, not characters. You learn why streaming responses sometimes stall mid-sentence. You learn why temperature sampling at 0.7 produces different outputs than greedy decoding at temperature 0.

For developers working with open-source tools like CV Mirror or other MCP servers, understanding tokenization and attention helps you optimize the payloads you're sending to the model. You stop wasting tokens on redundant context. You stop formatting prompts in ways that confuse the tokenizer.

## ## Q: Is this overkill for API users?

Maybe. If you're calling OpenAI's API and never fine-tuning, you don't need to implement backpropagation. But you do need to understand why your prompts sometimes return nonsense, why your agent's memory degrades after 20 turns, and why your function calling setup works 90% of the time but fails on edge cases.

CS336 gives you the vocabulary to ask better questions. When your agent hallucinates, you'll know whether it's a sampling issue, a training data issue, or a prompt structure issue. When your latency spikes, you'll know whether it's because your context is too long or because the model's KV cache is thrashing.

You don't need to finish every assignment. But reading the lecture notes and understanding the core concepts will make you a better agent builder. You'll stop guessing. You'll start debugging.

## FAQ

### Can I take CS336 if I'm not a Stanford student?

Yes. The full course materials are on GitHub, including lecture slides, assignments, and starter code. You won't get graded, but you can work through the assignments on your own.

### Do I need a GPU to do the assignments?

For the early assignments, no. You can train a bigram model on CPU. For the later assignments, where you're training small transformers, a GPU helps but isn't strictly required. You can use Google Colab's free tier or a cheap cloud instance.

### How long does it take to work through the course?

If you're doing it self-paced, expect 40-60 hours total. The lectures are dense, and the assignments take time. You can spread it over a few months if you're doing it part-time.

### Is this better than reading the Transformer paper?

CS336 includes the Transformer paper as required reading, but it also gives you the context to understand why every design choice matters. The paper assumes you already know neural nets. The course assumes you're starting from scratch.

## Sources

- https://stanford-cs336.github.io/spring2024/
- https://github.com/stanford-cs336/spring2024-lectures
- https://en.wikipedia.org/wiki/Attention_(machine_learning)
- https://arxiv.org/abs/1706.03762
- https://stanford-cs336.github.io/spring2024/assignments.html
- https://www.reddit.com/r/MachineLearning/comments/10qz9x5/d_why_do_llms_struggle_with_simple_counting_tasks/
- https://www.reddit.com/r/LocalLLaMA/comments/12zv8x3/emergent_abilities_in_llms_are_they_real/