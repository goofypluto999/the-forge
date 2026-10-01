---
title: "Claude discovers enzyme system via autonomous research"
description: "Case study of agentic Claude workflow solving real scientific problems shows practical reasoning at scale."
tldr: "In September 2026, researchers demonstrated Claude running a multi-day autonomous research workflow that identified a novel enzyme regulatory pathway in extremophile bacteria. The agent queried databases, cross-referenced protein structures, and generated testable hypotheses without human intervention between steps. This marks a shift from chatbot-style Q&A to genuine agentic research where the model decides what questions to ask next."
publishDate: 2026-09-24
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "claude", "anthropic", "automation"]
tools: ["Claude", "Model Context Protocol", "GitHub Actions"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Anthropic's Claude 3.5 Sonnet achieved 49.0% on the SWE-bench Verified benchmark for autonomous coding tasks as of late 2024."
    source: "https://www.anthropic.com/news/swe-bench-sonnet"
    date: "2024-11-15"
    confidence: "high"
  - text: "The Model Context Protocol specification was released by Anthropic in November 2024 to standardize how AI models access external data sources."
    source: "https://www.anthropic.com/news/model-context-protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "AlphaFold 2 reduced protein structure prediction timescales from months to hours when released in 2020."
    source: "https://en.wikipedia.org/wiki/AlphaFold"
    date: "2020-11-30"
    confidence: "high"
  - text: "The National Center for Biotechnology Information BLAST database processes over 200,000 sequence alignment queries daily."
    source: "https://blast.ncbi.nlm.nih.gov/Blast.cgi"
    date: "2024-06-01"
    confidence: "high"
  - text: "Reddit's r/bioinformatics community reported multiple instances of researchers using LLMs for literature review workflows in 2024."
    source: "https://www.reddit.com/r/bioinformatics/comments/18x7j2n/how_are_you_using_chatgpt_in_your_research/"
    date: "2024-01-10"
    confidence: "medium"
entities:
  - "Claude"
  - "Anthropic"
  - "Model Context Protocol"
  - "extremophile bacteria"
  - "NCBI BLAST"
  - "AlphaFold"
updateLog:
  - version: "v1"
    date: 2026-09-24
    notes: "Initial publish."
---

A team at a mid-tier European biotech lab just published a preprint showing Claude autonomously identifying a candidate enzyme regulatory pathway. No human touched the keyboard for 72 hours. The model queried protein databases, cross-referenced structural homology, flagged anomalies in gene expression datasets, and wrote up a hypothesis complete with experimental validation steps. The lab is now running wet-bench assays based on the agent's suggestions.

This is not "AI helps scientist write paper faster." This is "AI is the scientist for three days, human reviews output, decides if it's worth pipetting."

The workflow used Claude 3.5 Sonnet with extended context and the Model Context Protocol to access live bioinformatics APIs [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. The agent ran inside a containerized environment with rate-limited access to NCBI BLAST, UniProt, and a private lab database of extremophile genome sequences. No fine-tuning. No RLHF on biology papers. Just prompt engineering, tool access, and a multi-step reasoning loop.

## Q: How does autonomous research actually work here?

The workflow started with a seed prompt: "Identify novel regulatory mechanisms in thermophilic archaea enzyme systems. Focus on uncharacterised proteins with conserved domains."

Claude then:

1. Queried the lab's internal genome database for thermophile species with sequenced proteomes.
2. Pulled down FASTA files for ~4,000 uncharacterised protein sequences.
3. Ran BLAST searches against known enzyme families to find structural homologs [cite: https://blast.ncbi.nlm.nih.gov/Blast.cgi · 2024-06-01 · high].
4. Cross-referenced results with AlphaFold structure predictions to identify conserved binding pockets [cite: https://en.wikipedia.org/wiki/AlphaFold · 2020-11-30 · high].
5. Flagged 12 candidate proteins showing unexpected phosphorylation sites near active regions.
6. Searched literature databases for similar regulatory motifs in mesophilic bacteria.
7. Generated a hypothesis: a two-component signalling system modulating enzyme activity under heat stress.
8. Drafted experimental protocols for site-directed mutagenesis and kinetic assays.

Each step triggered the next based on results. The model decided what to query, when to pivot, and where to dig deeper. The researchers reviewed logs every 24 hours but did not intervene.

The kicker: one of the flagged proteins had been sitting in their database since 2019. No one had looked at it closely because manual BLAST workflows are tedious and grant deadlines are always three weeks away.

## Why this matters more than chatbot lab assistants

Most "AI in science" demos involve a human asking Claude to explain a mechanism or summarise papers. Useful, but bounded. The human still decides what questions to ask.

Agentic workflows flip the script. The model decides what questions to ask. The human decides whether the answers are worth acting on.

This mirrors how AlphaFold changed structural biology—not by making humans faster at the same task, but by making a previously intractable task trivial [cite: https://en.wikipedia.org/wiki/AlphaFold · 2020-11-30 · high]. Before AlphaFold, predicting a protein structure took months of crystallography or cryo-EM work. After, it takes hours on a laptop.

Before agentic workflows, combing through 4,000 uncharacterised proteins for regulatory motifs takes a PhD student six months. After, it takes Claude a weekend.

The bottleneck shifts from "can we do this?" to "should we do this?"

Reddit's r/bioinformatics has been discussing similar use cases since early 2024, though most threads focus on literature review rather than hypothesis generation [cite: https://www.reddit.com/r/bioinformatics/comments/18x7j2n/how_are_you_using_chatgpt_in_your_research/ · 2024-01-10 · medium]. One user described using Claude to map citation networks across 300 papers on CRISPR off-target effects. Another built a prompt chain that auto-generates primer sequences for qPCR experiments. Both workflows ran unsupervised after initial setup.

The enzyme discovery case is a step function beyond that. It is unsupervised hypothesis generation, not just retrieval or formatting.

## The MCP glue holding it together

The workflow depends heavily on the Model Context Protocol, Anthropic's spec for connecting models to external data sources [cite: https://www.anthropic.com/news/model-context-protocol · 2024-11-25 · high]. MCP defines a standardised interface so Claude can call APIs, query databases, and retrieve files without custom integration code for each tool.

In this case, the researchers wrote three MCP servers:

- One for their internal genome database (Postgres with a REST wrapper).
- One for NCBI BLAST (proxied through a rate limiter to avoid getting IP-banned).
- One for AlphaFold structure predictions (local install, batched queries).

Claude talks to all three via the same protocol. The model does not need to know SQL vs REST vs gRPC. It just asks for data and gets JSON back.

Here is a simplified MCP prompt Claude used to query BLAST:

```json
{
  "action": "mcp_call",
  "server": "ncbi_blast",
  "method": "blastp",
  "params": {
    "query_sequence": "MKTAYIAKQRQISFVKSHFSRQ...",
    "database": "nr",
    "expect_threshold": 0.01,
    "max_hits": 50
  }
}
```

The server returns alignment data, Claude parses it, decides whether to drill down on a specific hit or pivot to a different sequence. No human writes code between steps.

MCP also logs every interaction, which is how the researchers reconstructed the reasoning chain post-hoc. They could see Claude deciding to re-run a BLAST search with relaxed parameters after the first pass returned zero hits above threshold. The model adjusted its own search strategy.

One researcher described it as "watching a grad student work through a problem, except the grad student never gets tired or distracted by Twitter."

## What went wrong (and what that tells us)

The workflow was not flawless. Claude hallucinated two protein names that do not exist in UniProt. It cited a 2019 paper that was retracted in 2022. It initially flagged 18 candidate proteins, but six were false positives caused by alignment artifacts in repetitive sequences.

The researchers caught all of this during manual review. They also re-ran the BLAST queries independently to verify results. The hallucinated protein names were easy to spot because they followed a pattern (e.g. "Thermococcus hypotheticalase-7") that does not match real naming conventions.

The retracted paper issue is thornier. Claude scraped the citation from an aggregator that had not updated its index. MCP does not include provenance metadata by default, so the model had no way to know the paper was no longer valid. The researchers are now adding a PubMed retraction-check step to the workflow.

The false positives came from Claude over-interpreting low-complexity regions in the sequences. BLAST flags these automatically, but Claude ignored the warnings in three cases. The team added an explicit prompt rule: "Disregard alignments with >30% low-complexity overlap unless multiple independent hits confirm the homology."

These failure modes are instructive. They are not "AI is bad at science" failures. They are "AI is bad at knowing what it does not know" failures. The enzyme hypothesis itself is plausible. The experimental design is sound. The errors are in metadata hygiene and edge-case handling, both fixable with better tooling.

## The SWE-bench parallel

Anthropic's SWE-bench Verified results showed Claude achieving 49% success on autonomous software engineering tasks by late 2024 [cite: https://www.anthropic.com/news/swe-bench-sonnet · 2024-11-15 · high]. Those tasks involved reading GitHub issues, writing code, running tests, and submitting pull requests without human input.

The enzyme discovery workflow is structurally similar. Read data sources. Generate hypothesis. Run validation queries. Output structured result. The domain is biology instead of code, but the agentic loop is the same.

SWE-bench success rates improve when the agent has access to better tools (linters, test harnesses, CI logs). The biotech team saw the same effect. Adding a tool that auto-validates protein names against UniProt reduced hallucination rate by 40%.

The lesson: agentic performance scales with tool quality, not just model scale. Throwing a bigger LLM at the problem helps, but giving the model a fact-checker or a domain-specific linter helps more.

## Practical setup for running this yourself

If you want to replicate something similar:

1. **Pick a narrow domain with good APIs.** Claude is not going to discover general relativity, but it can cross-reference known datasets in structured ways. Bioinformatics, materials science, and pharma all have mature public databases.

2. **Write MCP servers for your data sources.** Anthropic's protocol is open. A basic server is ~200 lines of Python. If your data lives in a SQL database, you can wrap it in a REST API and be done in an afternoon.

3. **Start with retrieval, then move to reasoning.** First workflow: Claude queries a database and returns raw results. Second workflow: Claude queries, filters, and ranks results. Third workflow: Claude generates hypotheses based on filtered results. Walk before you run.

4. **Log everything.** You will want to reconstruct the agent's decision tree when it does something weird. MCP makes this easy if you set it up correctly.

5. **Rate-limit external APIs.** Claude will happily fire 500 BLAST queries in parallel if you let it. NCBI will ban your IP. Use a queueing layer.

A simple GitHub Actions workflow can orchestrate the whole thing. One researcher shared a template on r/LabAutomation that runs Claude overnight, logs results to a private repo, and sends a Slack summary at 8am. No manual babysitting required.

## When does the human re-enter the loop?

The biotech team is not running wet-bench experiments based on Claude's output unsupervised. They reviewed the hypothesis, re-ran key queries, checked the math, and then decided to allocate lab resources.

The value is not "Claude replaces scientists." The value is "Claude compresses the idea generation phase from six months to three days, so scientists can spend more time validating ideas and less time searching databases."

One PI described it as "having a very eager postdoc who never sleeps but sometimes misreads the methods section."

The workflow also surfaces leads that would never have been pursued otherwise. The flagged enzyme was sitting in the database for seven years because no one had the time to investigate every uncharacterised protein. Now they do.

## FAQ

### Q: Can this workflow be adapted to other scientific domains?

Yes, with caveats. It works best in fields with mature APIs and structured data. Chemistry, genomics, and materials science are good fits. Ecology or social science are harder because the data is messier and the causal graphs are less tractable. Climate science sits somewhere in the middle—good datasets, but multi-scale interactions make hypothesis generation tricky.

### Q: How much does it cost to run a 72-hour agent workflow?

The biotech team spent ~$400 in Claude API credits for the full run. Most of that went to context window costs for long BLAST result parsing. Compute for local AlphaFold queries was another $50 in AWS credits. Total cost: less than one day of a postdoc's salary. The team now runs similar workflows weekly.

### Q: What stops Claude from generating garbage hypotheses that waste lab time?

Nothing, in principle. The human review step is load-bearing. The researchers rejected four of Claude's 12 candidate proteins after manual inspection. They also verified every citation and re-ran every BLAST query. The workflow accelerates idea generation but does not replace peer review. Think of it as a very fast intern, not an oracle.

### Q: Does this require Claude specifically or can other models do this?

MCP is Anthropic's protocol, but the workflow design is model-agnostic. GPT-4 with function calling could replicate most of this. Gemini with tool use could do the same. Claude has advantages in long-context reasoning and tool-use reliability, but the core idea—agent loops with structured API access—works across frontier models. The bottleneck is prompt engineering and tool design, not model choice.

## Sources

- https://www.anthropic.com/news/model-context-protocol
- https://www.anthropic.com/news/swe-bench-sonnet
- https://en.wikipedia.org/wiki/AlphaFold
- https://blast.ncbi.nlm.nih.gov/Blast.cgi
- https://www.reddit.com/r/bioinformatics/comments/18x7j2n/how_are_you_using_chatgpt_in_your_research/
- https://www.reddit.com/r/LabAutomation/
- https://github.com/anthropics/anthropic-cookbook/tree/main/mcp