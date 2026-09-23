---
title: "HarnessTax: How Much Does the Harness Matter for Coding Agents?"
description: "Empirical evaluation of prompt engineering and environment setup impact on agent performance across four major LLM coding benchmarks."
tldr: "Researchers tested identical LLMs across four popular coding benchmarks and discovered that environment setup and prompt design explain up to 40% of reported performance variance. The same model can score 68% on one harness and 41% on another, simply because of how the evaluation wrapper prompts the agent and packages errors. This means half the leaderboard wars are won before the first token generates."
publishDate: 2026-09-17
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["evaluation", "agents", "prompt-engineering"]
tools: ["SWE-bench", "HumanEval", "MBPP", "LiveCodeBench"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "The same GPT-4 model achieved 68% accuracy on SWE-bench Lite using one evaluation harness and 41% accuracy using another harness, with no model changes."
    source: "https://arxiv.org/abs/2409.12951"
    date: "2024-09-19"
    confidence: "high"
  - text: "Prompt engineering differences between harnesses can account for up to 40% of observed performance variance in coding agent benchmarks."
    source: "https://arxiv.org/abs/2409.12951"
    date: "2024-09-19"
    confidence: "high"
  - text: "SWE-bench has over 2,300 real-world Python issues from 12 popular repositories including Django, Flask, and Matplotlib."
    source: "https://www.swebench.com/"
    date: "2024-03-15"
    confidence: "high"
  - text: "LiveCodeBench releases new coding problems monthly sourced from LeetCode, AtCoder, and CodeForces competitions held after August 2023."
    source: "https://livecodebench.github.io/"
    date: "2024-06-10"
    confidence: "high"
  - text: "HumanEval contains 164 hand-written Python programming problems with an average of 7.7 test cases per problem."
    source: "https://github.com/openai/human-eval"
    date: "2021-07-07"
    confidence: "high"
entities:
  - "SWE-bench"
  - "GPT-4"
  - "HumanEval"
  - "MBPP"
  - "LiveCodeBench"
  - "OpenAI"
  - "evaluation harness"
---

You built a coding agent. It crushed your internal tests. You submit to SWE-bench and get middling scores. You blame the model. You throw more compute at it. Nothing moves. Then you realize someone else posted a 27-point jump using the same base model.

The secret wasn't the model. It was the wrapper.

Evaluation harnesses are the runtime environment, prompt scaffolding, and error-handling layer that sits between your agent and the benchmark. They parse task descriptions, feed them to the LLM, capture tool calls, format stack traces, retry on timeout, and decide when to stop. Different harnesses make radically different choices. Those choices move the needle more than most hyperparameter sweeps [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high].

Research published in September 2024 tested identical checkpoints of GPT-4, Claude 3.5 Sonnet, and Llama 3.1 405B across four major coding benchmarks using multiple evaluation wrappers per benchmark [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high]. The delta between best and worst harness for the same model on the same task set hit 27 percentage points. Prompt engineering differences alone explained up to 40% of observed variance [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high].

Welcome to HarnessTax — the hidden cost of evaluating agents in someone else's runtime.

## What Is an Evaluation Harness, Actually?

An evaluation harness is the scaffolding that runs your agent against a benchmark. It's not the dataset. It's not the model. It's the code that:

- Parses the benchmark JSON and formats task instructions into prompts
- Manages the conversation loop (how many turns, when to stop)
- Executes tool calls (file edits, shell commands, test runs)
- Captures and formats errors, logs, and test output
- Decides success/failure and records metrics

[SWE-bench](https://www.swebench.com/) has over 2,300 real-world Python issues from 12 popular repositories including Django, Flask, and Matplotlib [cite: https://www.swebench.com/ · 2024-03-15 · high]. The benchmark is public. But there are at least four different harnesses in the wild that run agents against it: the original Princeton harness, OpenHands, SWE-agent, and a minimal reference implementation from Anthropic's tool-use examples [cite: https://github.com/OpenDevin/OpenDevin · 2024-05-12 · medium].

Each harness structures the initial prompt differently. One might embed the issue body as a user message. Another might include repository structure context. A third might inject example patches. The model sees completely different token sequences before it starts reasoning.

Then there's error formatting. Some harnesses return raw pytest output. Others parse it into structured JSON. Some include file diffs in the error context. Others don't. When a test fails, the agent needs that feedback to iterate. If the harness mangles the traceback, the agent spirals.

Timeouts and turn limits vary wildly. One harness caps agent loops at 10 turns. Another allows 50. If your agent needs 12 iterations to solve a problem, one harness will mark it failed while another gives it room to succeed [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high].

## Q: How Big Is the Harness Delta in Practice?

Huge. The September 2024 study ran GPT-4 on SWE-bench Lite (a 300-issue subset) using two different open-source harnesses. Same model checkpoint. Same temperature. Same task set. Harness A scored 68%. Harness B scored 41% [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high].

That's a 27-point swing. Larger than the gap between most "state of the art" releases.

On HumanEval (164 hand-written Python problems with an average of 7.7 test cases each [cite: https://github.com/openai/human-eval · 2021-07-07 · high]), the variance was smaller but still meaningful. GPT-4 scored between 82% and 89% depending on whether the harness allowed multi-turn dialogue or enforced single-shot code generation [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · medium].

[MBPP](https://github.com/google-research/google-research/tree/master/mbpp) (Mostly Basic Python Problems) showed a 15-point spread. LiveCodeBench, which releases new coding problems monthly sourced from LeetCode, AtCoder, and CodeForces competitions held after August 2023 [cite: https://livecodebench.github.io/ · 2024-06-10 · high], showed a 19-point spread between harnesses that allowed web search and those that didn't [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · medium].

The problem compounds when you compare results across papers. Author A uses harness X and reports 72%. Author B uses harness Y and reports 65%. Author B's model might actually be better. But the harness makes Author A's number look bigger.

Leaderboards rank models. But they should rank (model, harness) pairs.

## The Prompt Tax

Prompts are the highest-leverage tuning knob in the harness. The exact phrasing of the system message, the inclusion or exclusion of few-shot examples, and the structure of error feedback can move scores 10 to 15 points [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high].

Here's a minimal SWE-bench prompt from one harness:

```
You are a software engineer. Fix the issue described below.

Issue: {issue_body}

Repository structure:
{file_tree}

Use the edit_file and run_tests tools. Stop when all tests pass.
```

Here's a more verbose version from another harness:

```
You are an autonomous coding agent with access to a live Python repository. Your task is to resolve the GitHub issue provided below. You may:
- Read files using read_file(path)
- Edit files using edit_file(path, changes)
- Run shell commands using bash(command)
- Run pytest using run_tests(test_path)

Work iteratively. After each tool call, check test results and refine your approach. Do not make unrelated changes. Stop when the reported issue is resolved and all existing tests still pass.

Issue title: {issue_title}
Issue body: {issue_body}
Repository: {repo_name}
Affected files (hint): {affected_files}
```

The second version primes the model to think iteratively, surfaces repo context, and explicitly scopes the task. It scores 12 points higher on average [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · medium].

Reddit user [u/ml_engineer_throwaway](https://www.reddit.com/r/MachineLearning/comments/1fjv9x3/d_does_anyone_else_feel_like_benchmark_scores_are/) posted in September 2024: "Does anyone else feel like benchmark scores are mostly vibes at this point? I spent three days reproducing a SWE-bench result from a paper and got nowhere close until I realized they were using a different prompt template buried in a fork of a fork of the eval repo." [cite: https://www.reddit.com/r/MachineLearning/comments/1fjv9x3/d_does_anyone_else_feel_like_benchmark_scores_are/ · 2024-09-16 · medium]

The issue is worse for closed-source models. OpenAI and Anthropic don't publish the exact harnesses they used for their own reported scores. You can't reproduce them. You can only approximate [cite: https://news.ycombinator.com/item?id=41401087 · 2024-09-05 · medium].

## Turn Limits and Timeout Games

Some benchmarks enforce strict turn limits. HumanEval is typically single-shot: the agent writes code once, no iteration. SWE-bench allows multi-turn, but harnesses cap it differently. One popular harness stops at 10 tool calls. Another allows 50 [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · high].

If your agent's strategy is "try, fail, read error, fix," you need turns. A 10-turn cap kills that strategy before it gets traction.

Timeouts are worse. Some harnesses enforce wall-clock limits (5 minutes per issue). Others enforce token limits (32k context window, stop when full). A few enforce both. The cheapest way to game a benchmark is to crank the timeout and let the agent brute-force [cite: https://www.reddit.com/r/LocalLLaMA/comments/1fk8x4a/swebench_results_are_meaningless_without_cost/ · 2024-09-18 · medium].

One team reported a 15-point SWE-bench jump by switching from a 5-minute timeout to a 20-minute timeout [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · medium]. The model didn't get smarter. It just had more time to flail.

## Error Formatting: The Silent Killer

When a test fails, the harness captures output and feeds it back to the agent. How that output is formatted determines whether the agent can recover.

Raw pytest output looks like this:

```
============================= FAILURES ==============================
_______________________ test_parse_header _______________________
tests/test_parser.py:42: in test_parse_header
    assert parse_header("Content-Type: text/html") == {"Content-Type": "text/html"}
E   AssertionError: assert {'content-type': 'text/html'} == {'Content-Type': 'text/html'}
```

Some harnesses return that verbatim. Others parse it into structured JSON:

```json
{
  "status": "failed",
  "test": "test_parse_header",
  "file": "tests/test_parser.py",
  "line": 42,
  "expected": {"Content-Type": "text/html"},
  "actual": {"content-type": "text/html"},
  "error_type": "AssertionError"
}
```

The structured version is easier for agents to parse. Models trained heavily on JSON (like GPT-4) perform better when errors arrive pre-parsed [cite: https://arxiv.org/abs/2409.12951 · 2024-09-19 · medium]. A 6-point gap appeared in one controlled test just from switching error format.

Another Reddit thread from [r/MachineLearning](https://www.reddit.com/r/MachineLearning/comments/1fkp2a7/d_what_evaluation_harness_should_i_trust_for/) asked, "What evaluation harness should I trust for SWE-bench?" The top reply: "Whichever one the model you're comparing against used. Otherwise you're comparing apples to JSON-formatted oranges." [cite: https://www.reddit.com/r/MachineLearning/comments/1fkp2a7/d_what_evaluation_harness_should_i_trust_for/ · 2024-09-20 · medium]

## Tool APIs: The Cambrian Explosion

Different harnesses expose different tool sets. Some use [function calling](https://en.wikipedia.org/wiki/Function_calling) via OpenAI's API spec. Others use XML tags. A few use plain-text pseudo-commands parsed with regex.

Example tool definition in OpenAI JSON schema:

```json
{
  "name": "edit_file",
  "description": "Replace a section of a file with new content.",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {"type": "string"},
      "start_line": {"type": "integer"},
      "end_line": {"type": "integer"},
      "new_content": {"type": "string"}
    },
    "required": ["path", "start_line", "end_line", "new_content"]
  }
}
```

Same tool in Anthropic's XML style:

```xml
<tool_description>
<tool_name>edit_file</tool_name>
<description>Replace lines in a file.</description>
<parameters>
<parameter name="path" type="string" required="true"/>
<parameter name="start_line" type="integer" required="true"/>
<parameter name="end_line" type="integer" required="true"/>
<parameter name="new_content" type="string" required="true"/>
</parameters>
</tool_description>
```

Models fine-tuned on one format struggle with the other. Claude does better with XML. GPT-4 does better with JSON [cite: https://docs.anthropic.com/claude/docs/tool-use · 2024-08-22 · high].

If you benchmark a model on a harness that uses the "wrong" tool format, you're penalizing the model for something unrelated to coding ability.

## What Should We Do About This?

Three things.

**1. Report the harness.** Every leaderboard entry should include the harness name, version, commit hash, and a link to the exact config. If you can't reproduce the score from that info, the score is noise.

**2. Standardize prompt templates.** The HuggingFace [Evaluate](https://huggingface.co/docs/evaluate/index) library is trying. So is the [HELM](https://crfm.stanford.edu/helm/latest/) project from Stanford. Neither is perfect. But converging on one or two canonical harnesses per benchmark would cut variance in half [cite: https://crfm.stanford.edu/helm/latest/ · 2024-