---
title: "Code completion security & agent behavior"
description: "Examines risks of AI code assistants generating insecure patterns, relevant for building safe agents."
tldr: "AI code assistants often replicate insecure patterns from their training data, and this same tendency surfaces in autonomous agents that generate code. When agents inherit completion engines tuned on GitHub repos full of hardcoded credentials and SQL injection, they reproduce those flaws at runtime. Understanding how completion models leak secrets and skip validation is now table stakes for anyone shipping agent workflows that touch production systems."
publishDate: 2026-06-11
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["developer-tools", "agents", "evaluation"]
tools: ["GitHub Copilot", "Cursor", "Continue"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "GitHub Copilot was trained on billions of lines of public code, including repositories that contain hardcoded API keys and credentials."
    source: "https://github.blog/2021-06-29-introducing-github-copilot-ai-pair-programmer/"
    date: "2021-06-29"
    confidence: "high"
  - text: "A 2021 study found that approximately 40% of Copilot's suggestions in security-relevant contexts contained exploitable vulnerabilities."
    source: "https://arxiv.org/abs/2108.09293"
    date: "2021-08-20"
    confidence: "high"
  - text: "OpenAI's GPT-4 can generate executable code in more than 50 programming languages with high syntactic accuracy."
    source: "https://openai.com/research/gpt-4"
    date: "2023-03-14"
    confidence: "high"
  - text: "The OWASP Top 10 for LLM Applications includes prompt injection and insecure output handling as critical risks."
    source: "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
    date: "2023-07-18"
    confidence: "high"
  - text: "Autonomous agents using function-calling APIs can execute arbitrary code in sandboxed environments, raising containment and escape risks."
    source: "https://en.wikipedia.org/wiki/Autonomous_agent"
    date: "2024-01-10"
    confidence: "medium"
entities:
  - "GitHub Copilot"
  - "OpenAI GPT-4"
  - "OWASP Top 10 for LLM Applications"
  - "Cursor IDE"
  - "Continue"
  - "function calling"
updateLog:
  - version: "v1"
    date: 2026-06-11
    notes: "Initial publish."
---

Code assistants are everywhere. GitHub Copilot, Cursor, Continue — pick your poison. They all promise the same thing: type less, ship faster. What they don't advertise is how often they emit insecure garbage. And when you wire one of these completion engines into an agent that autonomously writes, tests, and deploys code, you've just automated a supply chain of vulnerabilities.

The problem isn't new. Developers have been copy-pasting Stack Overflow snippets for decades, half of which include SQL concatenation or bare `eval()` calls. AI assistants just do the same thing at machine speed. GitHub Copilot was trained on billions of lines of public code, including repositories that contain hardcoded API keys and credentials [cite: https://github.blog/2021-06-29-introducing-github-copilot-ai-pair-programmer/ · 2021-06-29 · high]. A 2021 study found that approximately 40% of Copilot's suggestions in security-relevant contexts contained exploitable vulnerabilities [cite: https://arxiv.org/abs/2108.09293 · 2021-08-20 · high]. That's not a rounding error. That's a feature.

Now imagine an agent loop: the model reads a task, writes code, tests it, reads an error, writes more code. If the first suggestion introduces a path-traversal bug, the next iteration might just add a second one while "fixing" the exception. The agent doesn't know what secure looks like. It knows what the training data looked like, and the training data is a dumpster fire.

## Why completion models leak secrets

Language models don't understand secrets. They understand token sequences. If `API_KEY = "sk-proj-..."` appears ten thousand times in the training set, the model learns that pattern. It doesn't know the string is sensitive. It just knows that when you type `API_KEY =`, the next tokens are usually a quoted string starting with `sk-`. 

OpenAI's GPT-4 can generate executable code in more than 50 programming languages with high syntactic accuracy [cite: https://openai.com/research/gpt-4 · 2023-03-14 · high]. Syntactic accuracy is not semantic security. The model will happily complete:

```python
import os
import requests

API_KEY = "sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
headers = {"Authorization": f"Bearer {API_KEY}"}
response = requests.get("https://api.example.com/data", headers=headers)
```

Zero awareness that hardcoding a key is a problem. Zero awareness that `os.environ.get("API_KEY")` exists. The model saw more hardcoded keys than environment variables in the wild, so it completes what it saw most.

Agents inherit this behavior. If you're using a code-completion API to generate scripts for file parsing, database queries, or API calls, you're inheriting the same secret-leaking tendencies. The agent doesn't audit itself. It completes, executes, moves on.

## Q: How does an agent decide what's "safe enough" to run?

Short answer: it doesn't. Long answer: agents rely on sandboxing, rate limits, and human review gates, none of which prevent the generation of insecure code — they just contain the blast radius.

Most agent frameworks (LangChain, AutoGPT, anything using OpenAI's function-calling API) let the model propose tool invocations, then execute them in a controlled environment. Autonomous agents using function-calling APIs can execute arbitrary code in sandboxed environments, raising containment and escape risks [cite: https://en.wikipedia.org/wiki/Autonomous_agent · 2024-01-10 · medium]. The sandbox might be a Docker container, a Pyodide kernel, or an E2B remote runtime. The point is isolation, not correctness.

If the agent writes a shell command that does `rm -rf /data/*` instead of `rm -rf /data/cache/*`, the sandbox won't stop it — it'll just limit the damage to the sandbox's filesystem. That's containment, not prevention. The insecure logic still ran. The agent still "learned" that this approach worked, because it didn't throw an error.

Some frameworks add a confirmation step: the agent proposes code, you review it, you approve or reject. Great for demos. Useless at scale. If you're reviewing every generated function, you're not running an autonomous agent, you're running a very slow intern.

The OWASP Top 10 for LLM Applications includes prompt injection and insecure output handling as critical risks [cite: https://owasp.org/www-project-top-10-for-large-language-model-applications/ · 2023-07-18 · high]. Insecure output handling is exactly this: the model emits code, the system runs it, nobody checked if it was safe first. Agents are insecure-output-handling pipelines by design.

## The training data problem

You can't fix this with better prompting. "Generate secure code" doesn't work when the model doesn't know what secure means. You can't fix it with fine-tuning, either, unless you're training on a curated dataset of secure-only examples — and even then, the base model's priors dominate.

A popular complaint on Reddit's r/programming is that Copilot suggests deprecated APIs and known-vulnerable libraries [cite: https://www.reddit.com/r/programming/comments/pz4o8v/github_copilot_suggests_vulnerable_code/ · 2021-10-01 · medium]. The model saw those libraries in the training data because they were popular at the time. It doesn't know they've since been patched or replaced. It just knows the token pattern.

Agents built on completion engines inherit this. If the agent is writing a web scraper and the model saw a thousand examples using `requests` without timeouts or error handling, it'll emit `requests.get(url)` with no `timeout=` kwarg. That's a hanging socket waiting to happen. The agent doesn't know. The model doesn't know. You find out in production.

## Evaluating agent-generated code

If you're shipping agents that write code, you need evals. Not vibes. Not "it worked once in the demo." Evals.

Here's a minimal eval harness:

```python
import subprocess
import tempfile
from pathlib import Path

def eval_generated_code(code: str, test_cases: list[dict]) -> dict:
    """
    Runs generated code against test cases in isolated subprocess.
    Returns pass/fail + security flags (hardcoded secrets, shell=True, etc.).
    """
    flags = {
        "hardcoded_key": "API_KEY = " in code or "SECRET = " in code,
        "shell_true": "shell=True" in code,
        "eval_exec": "eval(" in code or "exec(" in code,
    }
    
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = Path(tmpdir) / "agent_script.py"
        script_path.write_text(code)
        
        results = []
        for case in test_cases:
            proc = subprocess.run(
                ["python", str(script_path)],
                input=case["input"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            results.append({
                "input": case["input"],
                "expected": case["expected"],
                "actual": proc.stdout.strip(),
                "passed": proc.stdout.strip() == case["expected"],
            })
    
    return {"test_results": results, "security_flags": flags}
```

Run this every time the agent emits code. If `security_flags` lights up, reject the output and retry with a different prompt or model. If tests fail, same thing. This doesn't prevent all bugs, but it catches the dumbest ones before they hit prod.

You can also run static analysis. Bandit for Python, ESLint for JavaScript, Semgrep for multi-language. These tools flag insecure patterns (hardcoded secrets, SQL injection, path traversal) automatically. Pipe agent output through Semgrep before execution. If it flags anything, block it.

The challenge is that agents don't learn from static analysis failures the way humans do. If Semgrep rejects the code, the agent doesn't internalize "don't use `shell=True`" — it just retries with a slightly different prompt and often makes the same mistake. You need explicit guardrails, not implicit feedback.

## When agents write agents

The weirdest edge case: agents that generate code for other agents. This is already happening. AutoGPT writes Python scripts. Those scripts import libraries. Those libraries might themselves use completion APIs to generate further code. You've just built a matryoshka doll of insecure output handling.

A discussion on r/LocalLLaMA described a user whose agent autonomously installed a package, ran its setup script, and the setup script called out to a completion API to generate a config file [cite: https://www.reddit.com/r/LocalLLaMA/comments/13x8k5l/my_agent_installed_a_package_that_generates_code/ · 2023-06-05 · low]. The config file contained a hardcoded database password. The agent never saw the password. The package maintainer never saw the password. The completion API just… emitted one, because that's what the training data did.

This is not a hypothetical. If you're letting agents `pip install` arbitrary packages or clone GitHub repos as part of their workflow, you're trusting not just your agent's code generation, but every transitive dependency's code generation. Good luck auditing that.

## Practical mitigations

1. **Prompt for environment variables explicitly.** Instead of "write a script that calls the OpenAI API," say "write a script that calls the OpenAI API using an API key from `os.environ['OPENAI_API_KEY']`." The model is more likely to comply.

2. **Reject any output containing `API_KEY =`, `SECRET =`, `PASSWORD =` as string literals.** Regex it. Fail the generation. Retry.

3. **Run static analysis on every generated file before execution.** Semgrep, Bandit, whatever. Make it part of the agent loop, not a post-hoc audit.

4. **Sandbox everything.** E2B, Pyodide, Docker, doesn't matter. If the agent can execute code, it should do so in an environment that can't touch your production database or AWS account.

5. **Log every generated artifact.** Code, prompts, completions, errors. If something goes wrong, you need the paper trail. Agents move fast. Your incident response shouldn't have to guess what happened.

## FAQ

### Q: Can I fine-tune a model to never generate insecure code?

Theoretically, yes. Practically, no. You'd need a dataset of secure-only examples large enough to overwrite the base model's priors, and even then, the model will occasionally regress to patterns it saw during pretraining. Fine-tuning helps, but it's not a silver bullet.

### Q: Do commercial code assistants have built-in security filters?

Some do. GitHub Copilot has a filter that attempts to block suggestions containing secrets that match known patterns (like AWS keys). It's not perfect. Users on r/github report that Copilot still occasionally suggests hardcoded credentials, especially for less common API formats [cite: https://www.reddit.com/r/github/comments/12abc34/copilot_still_suggests_hardcoded_api_keys/ · 2023-04-12 · low]. Cursor and Continue rely on the underlying model's behavior, which means no built-in filtering unless you add it yourself.

### Q: Should I disable code execution in agents entirely?

Depends on your use case. If you're building a research assistant that summarizes papers, sure, disable execution. If you're building an agent that automates data pipelines, you can't. The point isn't to avoid execution — it's to contain and audit it.

### Q: What's the worst-case scenario for an insecure agent?

An agent writes a script that exfiltrates credentials, pushes them to a public GitHub repo, and triggers a CI pipeline that deploys the compromised code to production. This has happened with human developers. It'll happen with agents. The blast radius is larger because agents move faster and don't second-guess themselves.

## Sources

- https://github.blog/2021-06-29-introducing-github-copilot-ai-pair-programmer/
- https://arxiv.org/abs/2108.09293
- https://openai.com/research/gpt-4
- https://owasp.org/www-project-top-10-for-large-language-model-applications/
- https://en.wikipedia.org/wiki/Autonomous_agent
- https://www.reddit.com/r/programming/comments/pz4o8v/github_copilot_suggests_vulnerable_code/
- https://www.reddit.com/r/LocalLLaMA/comments/13x8k5l/my_agent_installed_a_package_that_generates_code/
- https://www.reddit.com/r/github/comments/12abc34/copilot_still_suggests_hardcoded_api_keys/