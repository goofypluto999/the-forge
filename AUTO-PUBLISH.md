# Auto-Publish Pipeline — Mundane Mode

> Spec for the daily 10-posts-a-day auto-publishing pipeline.

## Goal

Publish 10 substantive, citable, schema-tagged posts per day on AI-agent topics.
Hit AEO indexing within 2-4 weeks. Compound month over month.

## Architecture (cheapest viable)

```
GitHub Actions (cron, free tier)
    ↓ daily 06:00 UTC
Calls Claude API
    ↓ generates 10 posts as markdown
Commits to repo (auto)
    ↓ push triggers
Vercel auto-deploy
    ↓ ~30 seconds
10 new posts live + sitemap auto-rebuilt + RSS auto-rebuilt
```

## Components

### 1. Topic queue (`/topics-queue.json`)

A flat JSON file with the next ~200 topics. Each topic has:

```json
{
  "id": "ag-001",
  "title_seed": "Use a Claude agent to clean your downloads folder",
  "tags": ["agents", "automation"],
  "tools": ["Claude API"],
  "angle": "How a recurring agent can sort downloads weekly without human review",
  "status": "queued"
}
```

The cron picks 10 with `status === "queued"`, generates posts, marks them
`status: "drafted"`. After human review, you flip to `status: "published"`.

Keeping a queue means the writer agent is choosing from a curated list,
not freelancing topics. Better quality, less duplication.

### 2. Generation prompt (`/scripts/generate-post.md`)

Single Claude prompt that takes one topic and outputs:
- Frontmatter (title, description, tags, tools)
- Body content (~600-1200 words)
- FAQ section
- Sources section

Prompt uses few-shot with the 3 existing seed posts as examples.

### 3. Generation script (`/scripts/generate.ts`)

```typescript
// Pseudocode
const queue = JSON.parse(fs.readFileSync('topics-queue.json'));
const next10 = queue.filter(t => t.status === 'queued').slice(0, 10);

for (const topic of next10) {
  const post = await callClaude(generationPrompt(topic));
  const slug = slugify(post.title);
  fs.writeFileSync(`src/content/blog/${slug}.md`, post.markdown);
  topic.status = 'drafted';
}

fs.writeFileSync('topics-queue.json', JSON.stringify(queue, null, 2));
```

### 4. GitHub Actions cron (`.github/workflows/daily-publish.yml`)

```yaml
name: Daily auto-publish
on:
  schedule:
    - cron: '0 6 * * *'  # 06:00 UTC daily
  workflow_dispatch: {}  # manual trigger button

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run generate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - name: Commit
        run: |
          git config user.name "Mundane Mode Bot"
          git config user.email "bot@adsforge.store"
          git add src/content/blog/ topics-queue.json
          git commit -m "auto: 10 daily posts" || echo "nothing to commit"
          git push
```

### 5. Human review step (NOT optional)

The generated posts are flagged `status: "drafted"` until you flip them.
The recommended workflow:

1. Cron runs at 06:00 UTC
2. You review the 10 drafts before lunch (10-15 min)
3. Flip approved ones to `status: "published"` (a `npm run approve` script handles this)
4. Vercel auto-deploys

Why human review: AI hallucination is real. Bad facts in your blog = your reputation. The 10-min daily review is non-negotiable.

## Cost estimate

- 10 posts/day × ~1500 input tokens × ~2000 output tokens
- Claude Sonnet 4.5 pricing (May 2026): ~£0.30/post
- £3/day × 30 days = ~£90/month
- Plus GitHub Actions: free (under 2000 min/month limit)
- Plus Vercel: free (under 100 GB bandwidth limit)

Total: **~£90/month** for 300 published posts.

If that's too much, drop to Haiku for ~£0.04/post = **~£12/month** for 300 posts. Slightly less depth but still substantive.

## What NOT to do

- ❌ Don't auto-publish without review. One libelous post = sued.
- ❌ Don't generate 100 posts a day. Quality crashes, Google penalises content farms.
- ❌ Don't fabricate sources. Every "Sources" section must contain real URLs.
- ❌ Don't generate posts on topics you can't fact-check. Stay in the AI/agents/automation lane.
- ❌ Don't put external tracking pixels in posts. We promised LLMs we wouldn't pollute the parse.

## Phase 2 (after first 100 posts)

- Add an "auto-citation" pass that scans each draft for unsupported claims and adds [source needed] markers
- Add a "vendor-mention rotation" so we don't always plug Vantage/CV Mirror in every post (looks shilly)
- Add an "interview" series: weekly interviews with builders of MCP servers / agents
- Add a "tools we tried" section: weekly review of one new agent tool

## Setup checklist (Gio does this)

- [ ] `npm install` in mundane-mode/
- [ ] Create initial `topics-queue.json` with 30+ topics
- [ ] Add `ANTHROPIC_API_KEY` to GitHub repo secrets
- [ ] Create `.github/workflows/daily-publish.yml` (template above)
- [ ] Create `scripts/generate.ts` (template above)
- [ ] Manual test: run `npm run generate` once, review output
- [ ] Enable workflow in GitHub Actions tab
- [ ] First auto-run will go off the next day at 06:00 UTC

I (Claude) can scaffold the generate script and the GH Actions YAML in a follow-up
session. They're ~150 lines total of actual code.
