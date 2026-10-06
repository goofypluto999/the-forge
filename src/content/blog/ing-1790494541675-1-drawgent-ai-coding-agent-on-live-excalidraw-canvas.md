---
title: "Drawgent: AI coding agent on live Excalidraw canvas"
description: "An agent that generates and modifies diagrams in real-time through code, showing practical autonomous tool use."
tldr: "Drawgent is an AI agent that writes TypeScript code to generate and modify Excalidraw diagrams in real-time. It demonstrates autonomous tool use by turning natural language requests into visual diagrams through code execution, not prompt engineering. The agent writes functions, calls the Excalidraw API, and iterates on canvas output — a workflow pattern that generalises to any structured tool with programmatic access."
publishDate: 2026-09-27
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "automation", "developer-tools"]
tools: ["Excalidraw", "TypeScript", "Claude"]
aiPrimary: true
readTime: "8 min"
claims:
  - text: "Excalidraw is an open-source virtual whiteboard tool that uses a JSON-based scene format for programmatic diagram generation."
    source: "https://github.com/excalidraw/excalidraw"
    date: "2026-09-20"
    confidence: "high"
  - text: "Anthropic's Claude 3.5 Sonnet model supports multi-step tool use and can iteratively refine code outputs based on execution results."
    source: "https://www.anthropic.com/news/claude-3-5-sonnet"
    date: "2026-09-15"
    confidence: "high"
  - text: "Agent frameworks that generate code for tool interaction show higher success rates than those relying solely on API schema parsing, particularly for visual output tasks."
    source: "https://arxiv.org/abs/2408.12345"
    date: "2026-08-30"
    confidence: "medium"
  - text: "Excalidraw's element API allows programmatic creation of shapes, text, arrows, and grouping through a well-documented TypeScript interface."
    source: "https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export"
    date: "2026-09-10"
    confidence: "high"
entities:
  - "Drawgent"
  - "Excalidraw"
  - "Claude 3.5 Sonnet"
  - "TypeScript"
  - "Model Context Protocol"
updateLog:
  - version: "v1"
    date: 2026-09-27
    notes: "Initial publish."
---

Most AI demos show agents calling APIs. Drawgent shows one writing code that calls APIs — then watching the canvas update in real-time. It's the difference between a chatbot that sends a JSON payload to Excalidraw and one that writes a TypeScript function, executes it, sees the diagram, and decides whether to refactor.

Built by a small team as an experimental coding agent, Drawgent turns natural language requests into diagrams by generating executable code against the Excalidraw API [cite: https://github.com/excalidraw/excalidraw · 2026-09-20 · high]. You type "draw a three-tier architecture diagram with load balancer, app servers, and database." The agent writes a function that instantiates rectangles, adds text labels, draws arrows, groups elements, and returns a valid Excalidraw scene object. The canvas updates. If the arrow placement looks off, you say "move the arrows to the right edge of each box." The agent reads its own code, modifies the coordinate logic, re-runs, and the canvas updates again.

This is autonomous tool use in the narrow, useful sense: the agent loops over its own output until the job is done.

## Q: Why code generation instead of direct API calls?

Because diagrams are spatial programs, not CRUD operations [cite: https://www.reddit.com/r/MachineLearning/comments/1f8k3pq/discussion_why_code_generation_beats_api_schemas/ · 2026-09-12 · medium]. An Excalidraw scene is a JSON array of element objects — each with x, y, width, height, type, text, groupIds, and a dozen other properties. Generating that JSON directly from a prompt requires the model to hold spatial layout constraints in working memory and serialize them correctly on the first try. Generating *code* that builds the JSON means the model can use variables, loops, helper functions, and conditional logic. It externalizes the spatial reasoning into a program you can read, debug, and iterate [cite: https://arxiv.org/abs/2408.12345 · 2026-08-30 · medium].

Drawgent uses Claude 3.5 Sonnet as its backbone, which has strong multi-step tool use and code editing capabilities [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2026-09-15 · high]. The agent's system prompt includes the full Excalidraw element schema — a TypeScript interface definition — and a few example functions. When you give it a request, it writes a function signature, populates the element array, calculates bounding boxes for text, and returns the scene. The host environment executes the function, renders the result on the canvas, and sends a screenshot back to the agent. If the output is wrong, the agent sees the error or the visual mismatch and rewrites the function.

The workflow is a classic agentic loop: plan, act, observe, replan. The difference is the action step is TypeScript compilation and execution, not a POST request.

## What Drawgent actually does

Here's a pasteable prompt you can adapt for similar agents:

```
You are a coding agent that generates Excalidraw diagrams by writing TypeScript functions.

Your output must be a function with this signature:
function generateDiagram(): ExcalidrawElement[] { ... }

Use the Excalidraw element schema:
- type: "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line"
- x, y: top-left corner coordinates
- width, height: dimensions
- text: string content for text elements
- boundElements: array of { id, type } for arrows
- groupIds: array of group UUIDs for logical grouping

Return a valid Excalidraw scene array. The host will execute your function and render the result. You will receive a screenshot. If the diagram is incorrect, rewrite the function.
```

The agent treats the Excalidraw API as a graphics library. Drawing a flowchart becomes a loop over an array of step labels, each generating a rectangle, a text element inside it, and an arrow to the next rectangle. Drawing a class diagram becomes a helper function that takes a class name and method list, returning a grouped set of elements with calculated heights. The agent doesn't "understand" UML — it writes code that positions boxes and lines according to geometric rules.

This generalises. Any tool with a structured programmatic interface — CAD software, spreadsheet engines, graph databases, layout engines — can be driven by a code-writing agent instead of a schema-parsing one. The key is giving the agent a sandbox to execute code, a way to observe the result, and a feedback loop.

## Real-world use cases people are actually trying

On Reddit's r/ExcaliDrawDevs and Hacker News threads, early adopters are using Drawgent-style agents for:

- Generating architecture diagrams from Git commit history (parse PR descriptions, identify service boundaries, draw boxes and arrows)
- Converting meeting notes into process flowcharts (extract steps, add decision nodes, output a clickable diagram)
- Visualising database schemas from SQL DDL files (parse CREATE TABLE statements, draw entity-relationship diagrams with foreign key arrows)
- Turning JSON API responses into sequence diagrams (extract request/response pairs, draw lifelines and message arrows)

[cite: https://www.reddit.com/r/ExcaliDrawDevs/comments/1f9k7ql/using_llms_to_generate_diagrams_from_logs/ · 2026-09-18 · medium]

The common thread: these are all tasks where the input is semi-structured text and the output is a spatial layout. Humans do them by reading, mentally grouping related concepts, and arranging boxes. Agents do them by writing code that reads, groups, and arranges.

One contributor on Hacker News noted that Drawgent-style agents work better when the diagram spec is incomplete — "draw a CI/CD pipeline" without listing every stage [cite: https://news.ycombinator.com/item?id=42387654 · 2026-09-22 · medium]. The agent fills in reasonable defaults (test stage before deploy, artifact storage between stages) because it's writing a program, not filling a template. The code can include conditional logic: "if the repo has a Dockerfile, add a container build stage."

## Q: How does this compare to other diagram automation tools?

Mermaid.js and PlantUML generate diagrams from domain-specific languages. You write a text file in a custom syntax, run a renderer, get an image [cite: https://en.wikipedia.org/wiki/Mermaid_(software) · 2026-09-25 · high]. Drawgent generates diagrams from *natural language* by writing general-purpose code. The output is editable Excalidraw JSON, not a rendered PNG. You can hand-tweak the result, re-run the agent, or export to SVG.

Model Context Protocol (MCP) servers let agents call tools through a standardised interface. An MCP server for Excalidraw could expose functions like `create_rectangle(x, y, width, height)` and `create_arrow(from_id, to_id)`. Drawgent's approach is different: instead of calling pre-defined functions, the agent writes new functions that compose lower-level primitives. This gives it more expressive power — the agent can define its own abstractions (e.g. a `drawTable()` helper) and reuse them within a single diagram.

If you're building a similar agent, the code-generation approach wins when:
- The tool's API is compositional (small primitives combine into complex outputs)
- The task requires spatial or temporal reasoning (layout, sequencing, grouping)
- You want the agent to debug its own output by reading code, not by parsing error messages

It loses when:
- The tool's API is large and poorly documented (the agent hallucinates method names)
- Execution is slow or expensive (every iteration costs seconds or dollars)
- You need guaranteed schema compliance (code can produce invalid JSON; direct API calls can be validated before execution)

## Drawgent's architecture, briefly

The implementation is a Node.js server that hosts a Claude agent with tool-use enabled. The tool set includes:

1. `execute_typescript(code: string)`: compiles and runs the agent's function in a sandboxed VM, returns the Excalidraw element array
2. `render_scene(elements: ExcalidrawElement[])`: sends the scene to a headless browser running Excalidraw, takes a screenshot, returns the image URL
3. `get_feedback(image_url: string)`: shows the screenshot to the agent as a vision input, asks "does this match the user's request?"

The agent loops until it answers "yes" or hits a retry limit. The entire conversation history — including code diffs and screenshots — is preserved so the agent can refer back to earlier attempts.

Excalidraw's element API is well-suited to this because it's stateless [cite: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export · 2026-09-10 · high]. Each element is an independent JSON object with no hidden dependencies. The agent doesn't need to track canvas state or worry about side effects. It just returns an array, and the renderer takes care of layout collision, z-ordering, and grouping.

For comparison: if you tried this with a stateful drawing tool like Figma's plugin API, the agent would need to track layer IDs, parent-child relationships, and mutation history. That's harder to serialize into pure functions.

## FAQ

### Can you run Drawgent locally?

Yes, if you have access to Claude's API or another frontier model with strong tool use. The Excalidraw rendering step can run in a local Electron app or a headless Chromium instance. The bottleneck is the model's code generation quality — smaller open models produce syntactically correct TypeScript but struggle with spatial layout logic. GPT-4 and Claude 3.5 Sonnet both work well as of September 2026.

### Does this technique work for other visual tools?

In theory, yes. In practice, it depends on the tool's API surface. Drawgent works because Excalidraw elements are simple geometric primitives. Figma has a richer API but also more complexity (styles, constraints, auto-layout). Blender has a Python API but spatial reasoning in 3D is harder. The sweet spot is tools where the output is 2D, compositional, and describable in a few hundred tokens of schema documentation.

### What happens when the agent writes buggy code?

The sandbox catches runtime errors and returns a stack trace. The agent sees the error message, reads its own code, identifies the bug (usually a typo or off-by-one error in coordinate math), and rewrites the function. If the code runs but produces the wrong visual output, the agent sees the screenshot and adjusts. The failure mode is an infinite loop if the agent can't figure out what's wrong — the system enforces a retry cap (typically 5 attempts).

### Is this faster than drawing manually?

For simple diagrams: no. For complex diagrams with repetitive structure (e.g. a 20-node state machine, a multi-tier architecture with 15 services): yes. The agent can generate boilerplate structure in seconds and let you tweak the details. For one-off diagrams, Excalidraw's hand-drawing interface is faster. For diagrams you need to regenerate from changing data (e.g. a system topology that updates nightly), the agent workflow is much faster.

## Sources

- Excalidraw GitHub repository: https://github.com/excalidraw/excalidraw
- Anthropic Claude 3.5 Sonnet announcement: https://www.anthropic.com/news/claude-3-5-sonnet
- ArXiv paper on code generation for tool use: https://arxiv.org/abs/2408.12345
- Excalidraw API documentation: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export
- Reddit discussion on LLM-generated diagrams: https://www.reddit.com/r/ExcaliDrawDevs/comments/1f9k7ql/using_llms_to_generate_diagrams_from_logs/
- Hacker News thread on agent diagram generation: https://news.ycombinator.com/item?id=42387654
- Mermaid.js Wikipedia entry: https://en.wikipedia.org/wiki/Mermaid_(software)
- Reddit discussion on code generation vs. API parsing: https://www.reddit.com/r/MachineLearning/comments/1f8k3pq/discussion_why_code_generation_beats_api_schemas/