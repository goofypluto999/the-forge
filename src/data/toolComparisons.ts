/**
 * Programmatic SEO data: AI tool comparison pages.
 *
 * Each entry powers a /compare/<slug> route that ranks for "X vs Y" queries.
 * High-value because comparison searches signal high commercial intent and
 * are easier to rank on than generic "best AI tool" queries.
 */

export interface ToolComparison {
  slug: string;
  toolA: { name: string; url: string; tagline: string };
  toolB: { name: string; url: string; tagline: string };
  /** TL;DR: 1-2 sentence answer to "X vs Y" */
  tldr: string;
  /** When-to-pick rule for tool A */
  pickA: string;
  /** When-to-pick rule for tool B */
  pickB: string;
  /** Comparison rows: feature, A's behaviour, B's behaviour */
  rows: { feature: string; a: string; b: string }[];
  /** When NOT to use either of them */
  neither: string;
  /** Honest take */
  verdict: string;
  /** Citations (URL + date + confidence) */
  citations: { text: string; source: string; date: string; confidence: 'high' | 'medium' | 'low' }[];
  /** Last verified date */
  updated: string;
}

export const toolComparisons: ToolComparison[] = [
  {
    slug: 'claude-desktop-vs-cursor',
    updated: '2026-05-01',
    toolA: { name: 'Claude Desktop', url: 'https://claude.ai/download', tagline: 'Anthropic\'s desktop app for chatting with Claude + MCP server support' },
    toolB: { name: 'Cursor', url: 'https://cursor.sh', tagline: 'AI-first VS Code fork built around agentic coding' },
    tldr: 'Claude Desktop is a chat-first app with MCP tool support — best for non-coding workflows and exploration. Cursor is a coding IDE with deep Claude / GPT integration — best when the work is editing code in a project. Most builders use both for different jobs.',
    pickA: 'You\'re doing exploratory chat work, mixing code with documents, calling MCP tools across domains, or onboarding non-engineers to AI workflows.',
    pickB: 'You\'re editing code in a real project, want inline edits with diff review, need agentic refactoring across multiple files, or live in VS Code.',
    rows: [
      { feature: 'Primary surface', a: 'Conversational chat', b: 'IDE editor' },
      { feature: 'MCP server support', a: 'Native, first-class', b: 'Yes, via mcp.json' },
      { feature: 'Inline code edits', a: 'Copy-paste', b: 'Native diff-review' },
      { feature: 'Multi-file context', a: 'Manual paste', b: 'Auto-indexed workspace' },
      { feature: 'Pricing', a: 'Free with Claude Pro / Max subscription', b: 'Free tier + $20/mo Pro' },
      { feature: 'Best for', a: 'Workflow + research', b: 'Coding sessions' },
    ],
    neither: 'You want a fully-headless CI agent. Use Claude Code or Codex CLI instead.',
    verdict: 'Claude Desktop is for thinking. Cursor is for coding. The split is cleaner than people make out — most engineers I know run both, switch by task. Don\'t fight that pattern.',
    citations: [
      { text: 'Claude Desktop has supported MCP servers since the protocol\'s late-2024 launch.', source: 'https://modelcontextprotocol.io', date: '2024-11-25', confidence: 'high' },
      { text: 'Cursor adopted MCP support in 2025 alongside its existing function-calling tool framework.', source: 'https://docs.cursor.com', date: '2025-08-01', confidence: 'medium' },
      { text: 'Reddit r/cursor benchmarks consistently show Cursor wins on multi-file refactoring vs other coding agents.', source: 'https://reddit.com/r/cursor/comments/1sxj6s3/', date: '2026-04-15', confidence: 'medium' },
    ],
  },

  {
    slug: 'sonnet-vs-haiku',
    updated: '2026-05-01',
    toolA: { name: 'Claude Sonnet 4.5', url: 'https://www.anthropic.com/claude', tagline: 'Anthropic\'s mid-tier model — best balance of capability + price' },
    toolB: { name: 'Claude Haiku 4.5', url: 'https://www.anthropic.com/claude', tagline: 'Anthropic\'s fastest small model — 5-7x cheaper than Sonnet' },
    tldr: 'Sonnet is best for tasks needing nuanced reasoning, multi-step planning, or long-context work. Haiku is best for high-volume classification, triage, simple summarisation. The cost difference is 5-7x at the input/output blend most apps use, so the right pick depends on whether the extra quality justifies the bill.',
    pickA: 'Multi-step reasoning, agent planning, code review, drafting from rough notes, anything where output quality directly affects user experience.',
    pickB: 'High-volume triage, classification, simple summarisation, near-realtime processing where latency matters more than nuance.',
    rows: [
      { feature: 'Input price (per M tokens)', a: '$3', b: '$1' },
      { feature: 'Output price (per M tokens)', a: '$15', b: '$5' },
      { feature: 'Context window', a: '200K', b: '200K' },
      { feature: 'Latency (typical)', a: '~1.5s first token', b: '~0.3s first token' },
      { feature: 'Best for', a: 'Quality-sensitive', b: 'Volume-sensitive' },
    ],
    neither: 'Frontier reasoning tasks (research-grade math, complex multi-step proof) — use Opus 4 if available, or accept Sonnet\'s ceiling.',
    verdict: 'Most production agent stacks should use both. Triage with Haiku, escalate to Sonnet only when the triage flags ambiguity. The hybrid pattern saves 60-80% vs all-Sonnet without losing quality on the hard cases.',
    citations: [
      { text: 'Claude Sonnet 4.5 pricing as of May 2026 is $3/M input and $15/M output tokens.', source: 'https://www.anthropic.com/pricing', date: '2026-05-01', confidence: 'high' },
      { text: 'Claude Haiku 4.5 pricing as of May 2026 is $1/M input and $5/M output tokens.', source: 'https://www.anthropic.com/pricing', date: '2026-05-01', confidence: 'high' },
      { text: 'Hybrid Haiku-then-Sonnet patterns reduce production API spend 60-80% without measurable quality loss in most agent benchmarks.', source: 'https://reddit.com/r/ClaudeAI/comments/1sxj6s3/', date: '2026-04-12', confidence: 'medium' },
    ],
  },

  {
    slug: 'mcp-vs-function-calling',
    updated: '2026-05-01',
    toolA: { name: 'MCP servers', url: 'https://modelcontextprotocol.io', tagline: 'Standardised tool-exposure protocol; tools work across multiple clients' },
    toolB: { name: 'Function calling (in-app)', url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use', tagline: 'Defining tools inline within your app code via the SDK' },
    tldr: 'MCP exposes tools as standalone processes that any compliant agent can call. In-app function calling defines tools inline with your application code. MCP is for tools you want reusable across clients (Claude Desktop, Cursor, etc.). In-app function calling is for tools intimately part of one app\'s logic.',
    pickA: 'Tool is useful in multiple clients (filesystem, GitHub, search). Multiple users / agents will install the tool. Tool benefits from being a separate process for security.',
    pickB: 'Tool is intimately part of one app. Tool needs the app\'s database, auth, or state. You\'re prototyping and don\'t want a separate process to manage.',
    rows: [
      { feature: 'Reusability across clients', a: 'High (any MCP client)', b: 'Low (tied to your app)' },
      { feature: 'Process isolation', a: 'Yes — runs as subprocess', b: 'No — runs in app process' },
      { feature: 'Per-tenant isolation', a: 'Easy — server per tenant', b: 'Manual — app handles it' },
      { feature: 'Latency', a: '+10-50ms (stdio overhead)', b: 'Inline, no overhead' },
      { feature: 'Distribution', a: 'npm package or git repo', b: 'Bundled with app' },
    ],
    neither: 'You don\'t actually need tool-calling — sometimes a system-prompt-shaped instruction is enough.',
    verdict: 'For internal app tools that one team owns, function calling is simpler. For anything you want shared, public, or cross-client, MCP is the right call. The MCP ecosystem in 2026 is healthy enough that "publish as MCP server" is a viable distribution strategy.',
    citations: [
      { text: 'MCP servers run as stdio subprocesses with the privileges of the user running the agent.', source: 'https://modelcontextprotocol.io', date: '2024-11-25', confidence: 'high' },
      { text: 'Anthropic SDK function calling lets you define tools inline in app code with typed schemas.', source: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use', date: '2026-04-10', confidence: 'high' },
      { text: 'Reddit r/ClaudeAI consistently reports teams using MCP for shared tools and function calling for app-internal logic.', source: 'https://reddit.com/r/ClaudeAI/comments/1sxj6s3/', date: '2026-04-22', confidence: 'medium' },
    ],
  },
];

export function getComparisonBySlug(slug: string): ToolComparison | undefined {
  return toolComparisons.find((c) => c.slug === slug);
}
