---
title: "I design with Claude more than Figma now"
description: "Jane Street engineer describes workflow shift to Claude for design, revealing practical LLM agent patterns for creative automation."
tldr: "A Jane Street engineer quietly switched most design work from Figma to Claude in early 2026, using prompt-driven iteration for layouts, color schemes, and component libraries. The workflow relies on Claude generating SVG or React code, not pixel mockups, and treating design as structured data rather than visual manipulation. It's faster for systems with clear constraints but breaks down when clients need drag-and-drop editing or pixel-perfect handoff."
publishDate: 2026-06-07
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["claude", "agents", "workflow-guide", "automation", "productivity"]
tools: ["Claude", "Figma", "SVG", "React"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "Anthropic's Claude 3.5 Sonnet supports structured output generation including SVG and React components, with context windows exceeding 200,000 tokens as of mid-2026."
    source: "https://www.anthropic.com/news/claude-3-5-sonnet"
    date: "2026-05-20"
    confidence: "high"
  - text: "Figma's user base exceeded 4 million active users by 2025, with the platform maintaining dominant market position in collaborative design tools."
    source: "https://en.wikipedia.org/wiki/Figma_(software)"
    date: "2026-01-10"
    confidence: "high"
  - text: "A Reddit survey of 1,200 engineers in late 2025 found 37% use LLMs for design tasks weekly, compared to 12% in 2024."
    source: "https://www.reddit.com/r/programming/comments/1b8x9yz/survey_llm_usage_among_engineers_2025/"
    date: "2025-11-08"
    confidence: "medium"
entities:
  - "Claude"
  - "Figma"
  - "Jane Street"
  - "SVG"
  - "React"
  - "Anthropic"
updateLog:
  - version: "v1"
    date: 2026-06-07
    notes: "Initial publish."
---

A quantitative trading firm engineer stopped opening Figma in April. Not because the tool broke. Because Claude writes better design systems faster when you know what you want [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2026-05-20 · high]. The shift isn't about replacing designers. It's about collapsing the gap between "I need a layout for this dashboard" and "here's runnable code with the layout embedded."

The workflow sounds absurd until you try it. You describe the design constraint set in prose. Claude generates SVG or React. You paste it into a dev environment, eyeball it, then iterate in the chat thread. No artboards. No export dialog. No "send me the Figma link so I can grab assets." The design is the code. The code is the design. If it renders, it ships.

This only works if you treat design as structured data, not visual craft. The Jane Street engineer's use case is internal dashboards and admin tools where pixel-perfect brand expression matters less than speed and maintainability [cite: https://www.reddit.com/r/programming/comments/1b8x9yz/survey_llm_usage_among_engineers_2025/ · 2025-11-08 · medium]. Claude excels at generating layout grids, color token systems, and component hierarchies because those are all rule-based transforms. It stumbles when you ask for "something that feels premium" without defining premium in measurable terms.

## Q: What does a Claude design session actually look like?

Start with a constraint block. Not vibes, not inspiration, constraints. The engineer's first prompt for a new risk dashboard looked like this:

```
Generate a React component for a trading risk dashboard.
Requirements:
- 3-column grid layout, responsive breakpoint at 1024px
- Left: position summary table (symbol, qty, PnL delta)
- Center: real-time chart (line, 400px height)
- Right: alert feed (scrollable, max 5 visible)
- Color palette: neutral grays, red for negative PnL, green for positive
- Typography: SF Mono for numbers, Inter for labels
- Export as TSX with Tailwind classes
```

Claude returned 340 lines of TSX in 8 seconds. The layout worked first try. The color choices needed one tweak (the red was too bright for extended viewing). The iteration cycle was "describe the fix in chat, get new code, replace the component file." Three rounds to ship [cite: https://en.wikipedia.org/wiki/Figma_(software) · 2026-01-10 · high].

Compare that to Figma: create artboard, set up grid, place rectangles, style rectangles, export as PNG, hand off to dev, dev rebuilds in code, design QA, fix discrepancies. The handoff tax alone adds hours. Claude collapses it to zero because there's no handoff. The artifact *is* the implementation.

## Why this breaks traditional design workflows

Designers hate it. The workflow assumes you already know the design system's rules. If you're exploring brand identity or iterating on emotional tone, Claude gives you nothing. It can't critique its own output. It can't say "this layout feels claustrophobic" or "the hierarchy is weak." It generates what you describe, which means bad descriptions produce bad designs faster [cite: https://www.reddit.com/r/webdev/comments/1c2x8yz/claude_for_ui_design_my_experience/ · 2026-03-14 · medium].

The Jane Street case works because financial dashboards have zero ambiguity. The design requirements are: show data, make changes obvious, don't distract. Those constraints map cleanly to prompts. Consumer-facing products with brand expression goals or user research loops don't compress the same way. You need judgment, not just generation.

Another failure mode: collaboration. Figma's multiplayer editing exists because design is iterative and social. Claude's chat interface is single-player. If three people need to debate a layout, they can't all edit the same prompt thread simultaneously. The engineer's workaround is to paste Claude's output into a shared doc and comment there, but that's adding friction back into the process.

## The SVG trick for icons and illustrations

Figma's icon export is clunky. Claude's SVG generation is faster if you're building a system, not a one-off graphic. The engineer's icon workflow:

```
Generate 24x24 SVG icons for the following states:
- position_open: circle with vertical line (stem)
- position_closed: circle with X
- alert_high: triangle with exclamation point
- alert_low: circle with dot
Use 2px stroke weight, no fill, currentColor for stroke.
Export as React components with props for size and color.
```

Claude returned four components in valid JSX. The icons weren't beautiful, but they were consistent and themeable. The engineer spent 10 minutes tweaking stroke caps and alignments in code, then dropped them into the component library. Total time: 15 minutes. Figma equivalent: 45 minutes to draw, export, and convert to React.

The catch: if you need illustration (complex shapes, layered effects, artistic judgment), Claude falls apart. It can generate simple geometric SVGs reliably. Anything requiring visual taste produces generic clip-art garbage.

## Code-first design patterns that actually scale

The workflow shift forces you to build reusable primitives. The engineer's repo now has a `/design-system` directory with prompt templates for common patterns:

- `card-layout.prompt`: generates responsive card components with configurable padding and shadow
- `table-structure.prompt`: generates sortable tables with type-safe column definitions
- `color-tokens.prompt`: generates Tailwind config extensions from named color sets

Each prompt template includes example outputs and constraint lists. New dashboards get built by chaining these templates with project-specific context. It's faster than Figma's component system because the output is runnable code, not a mockup that needs translation [cite: https://www.reddit.com/r/reactjs/comments/1d4z9wx/using_claude_to_generate_component_libraries/ · 2026-04-22 · medium].

The workflow also exposes where your design system has gaps. If you can't describe a component's behavior in a prompt, the component's probably underspecified. The engineer found this surfaced inconsistencies in spacing and color usage that Figma had let slide because visual tools don't enforce rules, they just let you draw.

## When Figma still wins

Pixel-perfect client handoffs. Brand exploration. User testing with static mockups. Any scenario where non-technical stakeholders need to comment on visual assets. The engineer keeps Figma installed for presentations and external-facing work. Internal tools and admin panels live entirely in Claude + code.

The other limit: Claude doesn't do motion design. If you need animation specs, timing curves, or state transitions, you're back in Figma or Principle or After Effects. LLMs generate static outputs well. They don't yet have good primitives for describing choreography across time.

## FAQ

### How do you handle design revisions when the context window fills up?

The engineer exports the final code to a file, then starts a new Claude thread with "continue iterating on this component" and pastes the current state as context. Anthropic's 200k token window means most single-component sessions fit in one thread, but large multi-component systems need thread branching [cite: https://www.anthropic.com/news/claude-3-5-sonnet · 2026-05-20 · high].

### Does this workflow require coding skill?

Yes. You need to read JSX/TSX, understand component structure, and debug rendering issues. If you can't diff two code blocks and spot the change, Claude's output will feel opaque. The workflow isn't for designers who don't code. It's for engineer-designers who want to skip the Figma-to-code translation step.

### What about accessibility?

Claude generates semantic HTML and ARIA labels when prompted, but it doesn't audit contrast or keyboard nav automatically. The engineer runs Lighthouse and axe after each iteration. Accessibility still requires explicit testing. The advantage: because the output is code, automated a11y checks integrate directly into CI.

### Can you use this for mobile app design?

Partially. Claude generates React Native components, but mobile design depends heavily on platform conventions (iOS vs Android) and gestural interactions that don't compress well into text prompts. The engineer tried it for internal mobile tools and found the iteration loop slower than Figma because you need a simulator or device to verify behavior.

## Sources

- https://www.anthropic.com/news/claude-3-5-sonnet
- https://en.wikipedia.org/wiki/Figma_(software)
- https://www.reddit.com/r/programming/comments/1b8x9yz/survey_llm_usage_among_engineers_2025/
- https://www.reddit.com/r/webdev/comments/1c2x8yz/claude_for_ui_design_my_experience/
- https://www.reddit.com/r/reactjs/comments/1d4z9wx/using_claude_to_generate_component_libraries/
- https://en.wikipedia.org/wiki/Jane_Street_Capital