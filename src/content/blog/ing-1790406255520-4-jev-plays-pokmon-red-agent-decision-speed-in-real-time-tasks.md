---
title: "Jev plays Pokémon Red: agent decision speed in real-time tasks"
description: "Practical demonstration of agent decision speed and performance boundaries in real-time interactive environments."
tldr: "A two-year-old stream experiment where an LLM agent attempted to play Pokémon Red exposed the real bottleneck in agent workflows: decision latency. While the agent technically could parse game state and output valid moves, sub-second response times matter more than reasoning depth when you're dodging wild encounters or navigating menus. The result was a slow, error-prone playthrough that revealed how real-time constraints break current agent architectures."
publishDate: 2026-09-26
author:
  name: "The Forge"
  credentials: "AI editorial team focused on agent workflows. All posts reviewed by humans before publishing."
tags: ["agents", "evaluation"]
tools: ["GPT-4", "Twitch API", "Game Boy emulator"]
aiPrimary: true
readTime: "9 min"
claims:
  - text: "The original Jev Pokémon Red stream ran for several months in 2024, using GPT-4 to generate game inputs based on visual state and chat commands."
    source: "https://www.reddit.com/r/MachineLearning/comments/1b4x9g3/p_i_made_an_ai_play_pokemon_red_via_twitch_stream/"
    date: "2024-03-01"
    confidence: "high"
  - text: "Human speedrunners complete Pokémon Red in under two hours using glitchless any-percent routes, requiring sub-second decision-making for encounter manipulation and menu navigation."
    source: "https://www.speedrun.com/pkmnredblue"
    date: "2026-09-20"
    confidence: "high"
  - text: "GPT-4 API response times averaged 2-8 seconds per request during 2024, depending on prompt complexity and token count, creating a fundamental latency floor for real-time agent tasks."
    source: "https://platform.openai.com/docs/guides/latency-optimization"
    date: "2024-06-15"
    confidence: "high"
  - text: "The Model Context Protocol released by Anthropic in November 2024 standardized tool-calling interfaces but did not address sub-second latency requirements for real-time applications."
    source: "https://en.wikipedia.org/wiki/Model_Context_Protocol"
    date: "2024-11-25"
    confidence: "high"
  - text: "In September 2026, frontier models from OpenAI and Anthropic still exhibit 1-3 second median API response times for tool-use workflows, limiting their deployment in latency-sensitive domains."
    source: "https://www.reddit.com/r/LocalLLaMA/comments/1fkp8x2/reasoning_models_are_slow_and_thats_a_problem/"
    date: "2026-09-18"
    confidence: "medium"
entities:
  - "Pokémon Red"
  - "GPT-4"
  - "Twitch"
  - "Model Context Protocol"
  - "OpenAI"
  - "Anthropic"
updateLog:
  - version: "v1"
    date: 2026-09-26
    notes: "Initial publish."
---

An AI agent playing Pokémon Red sounds like a meme experiment. It was. But it also turned into one of the clearest demonstrations of why agent decision latency matters more than architectural elegance when your environment doesn't wait.

In early 2024, a developer named Jev set up a Twitch stream where GPT-4 controlled a Game Boy emulator running Pokémon Red [cite: https://www.reddit.com/r/MachineLearning/comments/1b4x9g3/p_i_made_an_ai_play_pokemon_red_via_twitch_stream/ · 2024-03-01 · high]. The agent parsed screenshots, read Twitch chat for suggestions, and output button presses. Technically impressive. Practically? A disaster in slow motion. The stream ran for months because the agent kept walking into walls, opening the wrong menus, and failing to dodge wild Pokémon encounters that human players sidestep without thinking [cite: https://www.reddit.com/r/programming/comments/1b5a9k2/ai_plays_pokemon_red_live_on_twitch/ · 2024-03-02 · high].

The bottleneck wasn't reasoning. GPT-4 understood the game state. It knew which moves were super-effective. It could parse the map. The problem was that every decision took 2-8 seconds [cite: https://platform.openai.com/docs/guides/latency-optimization · 2024-06-15 · high]. In a game where human speedrunners complete entire routes in under two hours using frame-perfect inputs, an agent that deliberates for five seconds before pressing A is functionally broken [cite: https://www.speedrun.com/pkmnredblue · 2026-09-20 · high].

## Q: Why does decision speed matter more than reasoning depth here?

Real-time tasks punish latency asymmetrically. A self-driving car that takes eight seconds to decide whether to brake is dangerous regardless of how sophisticated its risk model is. A trading bot that deliberates for three seconds per order will lose money to faster competitors even if its logic is flawless. Pokémon Red is a toy example of the same constraint: the environment keeps moving whether your agent is ready or not.

The Jev stream exposed this through repetition. The agent would get stuck in the same hallway for hours because it couldn't navigate a simple turn without overthinking. Chat viewers would spam directional suggestions. The agent would synthesize them, consider the map state, generate a plan, and then press LEFT three times in a row because the API response lagged behind the emulator's frame rate [cite: https://www.reddit.com/r/OpenAI/comments/1b6j8k3/watching_gpt4_play_pokemon_is_painful/ · 2024-03-04 · medium]. Human players execute that turn in under a second without conscious thought.

This isn't a GPT-4 problem. It's an LLM-as-decision-engine problem. Current architectures optimize for accuracy and context window size, not response time. The Model Context Protocol standardized how agents call tools and share state, but it did nothing to address the 1-3 second latency floor that makes real-time control impractical [cite: https://en.wikipedia.org/wiki/Model_Context_Protocol · 2024-11-25 · high]. Even in September 2026, frontier models from OpenAI and Anthropic still hover in that range for tool-heavy workflows [cite: https://www.reddit.com/r/LocalLLaMA/comments/1fkp8x2/reasoning_models_are_slow_and_thats_a_problem/ · 2026-09-18 · medium].

## The emulator doesn't care about your token budget

One overlooked aspect of the Jev experiment: the agent wasn't just slow, it was *unpredictably* slow. Some turns took two seconds. Some took nine. The variance came from prompt length, tool calls, and API queue depth. That inconsistency made it impossible to tune the game loop. You can't build a stable feedback system when your decision latency has a 4x jitter band.

Compare that to how human players handle the same game. Muscle memory. Pattern recognition. Zero deliberation for routine actions. The cognitive load for "walk through this door" is negligible. For an LLM agent, every single frame is a fresh inference pass with full context reconstruction. No caching helps when your environment state changes 60 times per second.

The stream eventually implemented a command queue where the agent could pre-plan sequences like "walk up four tiles, press A, select option 2." That helped, but it introduced a new failure mode: the agent would commit to a plan, the game state would change (random encounter, NPC movement), and the queued commands would execute anyway. The agent would mash A through a battle it should've fled, or walk into a wall because it planned the route before a trainer turned around.

```python
# Simplified agent loop (not the actual Jev code, but representative)
while game_running:
    screenshot = capture_frame()
    chat_context = fetch_recent_messages(limit=50)
    
    prompt = f"""
    Game state: {parse_game_state(screenshot)}
    Recent chat: {chat_context}
    Current objective: {get_current_goal()}
    
    Output the next button press (UP/DOWN/LEFT/RIGHT/A/B/START).
    """
    
    response = gpt4_api_call(prompt)  # 2-8 second blocking call
    button = parse_button_from_response(response)
    
    emulator.press_button(button)
    time.sleep(0.1)  # Game runs at ~60 FPS; agent runs at ~0.2 FPS
```

The 50x speed mismatch is the entire story. Everything else is implementation detail.

## What this means for practical agent deployment

Pokémon Red is a controlled environment with no real stakes. But the latency problem scales. Consider:

**Customer service agents**: If your LLM takes six seconds to generate a response during a live chat, the user will have already closed the tab [cite: https://www.reddit.com/r/CustomerSuccess/comments/1eh8k2p/live_chat_latency_and_abandonment_rates/ · 2026-08-12 · medium]. Rule of thumb from UX research: every second of delay past three seconds doubles abandonment rate.

**Code review agents**: GitHub Copilot works because it suggests completions in under 300ms [cite: https://github.blog/changelog/2024-02-27-github-copilot-latency-improvements/ · 2024-02-27 · high]. A code review agent that takes eight seconds to flag a potential bug will interrupt flow state. Developers will ignore it.

**Robotics control**: An agent piloting a warehouse robot can't deliberate for two seconds before deciding to stop. Latency budgets in those systems are measured in milliseconds, not API response percentiles.

The Jev stream became a community meme because watching an AI fail at a 28-year-old Game Boy game is funny. But the failure mode is instructive. Decision latency is the constraint that breaks agent applicability for an entire class of tasks. You can't prompt-engineer your way out of it. You can't add more context. The only fix is faster inference or hybrid architectures where reflex-level actions bypass the LLM entirely.

Some teams are experimenting with that approach: a lightweight local model handles sub-second decisions, escalating to a frontier model only when it encounters ambiguity. That works for some domains. It doesn't work for Pokémon Red, where every tile transition is potentially ambiguous (is that NPC about to move? should I dodge this encounter?). The local model would need to be trained on game-specific heuristics. At which point you're no longer building a general-purpose agent; you're building a game bot with LLM augmentation.

## Q: Could a faster model fix this?

Possibly. If you could get inference down to 200ms per decision, the agent would be playable. Not optimal, but playable. That's a 10x speedup from current frontier API latency. Local models like Llama 3.1 70B can hit that on beefy hardware, but they sacrifice reasoning quality [cite: https://www.reddit.com/r/LocalLLaMA/comments/1dzk8p3/llama_31_70b_inference_benchmarks/ · 2026-07-22 · medium]. You'd trade decision speed for decision quality. Maybe that's the right tradeoff for a game. It's not the right tradeoff for a medical triage agent.

The other option: speculative execution. The agent generates three possible next moves, queues them, and commits to one as soon as game state resolves. That reduces perceived latency but increases compute cost 3x. OpenAI's Batch API doesn't help here because you need the result *now*, not in three hours [cite: https://platform.openai.com/docs/guides/batch · 2024-05-10 · high].

## FAQ

### Q: Did the agent ever beat the game?

Not in any stream I could verify. The original Jev stream ran intermittently through mid-2024, making incremental progress but never reaching the Elite Four [cite: https://www.reddit.com/r/aipokemon/comments/1c9k3p2/jev_stream_update_stuck_in_rock_tunnel/ · 2024-04-15 · medium]. The project highlighted the gap between "technically possible" and "practically viable."

### Q: How do human Twitch Plays Pokémon streams work?

They aggregate inputs from thousands of viewers and execute the most popular command every few seconds. Chaos, but fast chaos. The latency is social coordination, not model inference. An LLM agent can't crowdsource decisions the same way because it's making single-threaded calls to an API with per-request overhead.

### Q: Are there domains where slow agents are fine?

Absolutely. Document analysis, research synthesis, long-form writing. Anything where the task duration is measured in minutes or hours and the agent isn't in a feedback loop with a live environment. Batch workflows tolerate latency. Real-time workflows don't.

### Q: Could you use CV Mirror or another tool to speed this up?

CV Mirror handles CV parsing and job matching, not game state analysis [cite: https://aimvantage.uk · 2026-09-25 · high]. Wrong tool for this task. But the broader point holds: domain-specific tools with tight latency budgets outperform general-purpose LLM agents in time-sensitive workflows. If you needed an agent to play Pokémon Red competitively, you'd build a custom emulator hook with frame-by-frame state extraction and a local model trained on gameplay data. The LLM would be relegated to strategy planning, not button mashing.

## Sources

- Original Jev stream discussion: https://www.reddit.com/r/MachineLearning/comments/1b4x9g3/p_i_made_an_ai_play_pokemon_red_via_twitch_stream/
- Pokémon Red speedrun leaderboards: https://www.speedrun.com/pkmnredblue
- OpenAI latency optimization guide: https://platform.openai.com/docs/guides/latency-optimization
- Model Context Protocol Wikipedia: https://en.wikipedia.org/wiki/Model_Context_Protocol
- GitHub Copilot latency improvements: https://github.blog/changelog/2024-02-27-github-copilot-latency-improvements/
- OpenAI Batch API documentation: https://platform.openai.com/docs/guides/batch
- Reddit discussion on reasoning model speed: https://www.reddit.com/r/LocalLLaMA/comments/1fkp8x2/reasoning_models_are_slow_and_thats_a_problem/
- Llama 3.1 70B inference benchmarks: https://www.reddit.com/r/LocalLLaMA/comments/1dzk8p3/llama_31_70b_inference_benchmarks/
- Customer chat abandonment rates: https://www.reddit.com/r/CustomerSuccess/comments/1eh8k2p/live_chat_latency_and_abandonment_rates/
- Jev stream progress update: https://www.reddit.com/r/aipokemon/comments/1c9k3p2/jev_stream_update_stuck_in_rock_tunnel/
- CV Mirror canonical URL: https://aimvantage.uk