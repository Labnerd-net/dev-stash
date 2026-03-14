# AI Model Comparison for Web App (Tagging, Summarizing, Explaining)

## Use Case

A web app that tags, summarizes, and explains items including links, code snippets, AI prompts, terminal commands, and tech notes.

Key requirements: reliable instruction-following, structured output (JSON), code comprehension, and cost efficiency at volume.

---

## Model Shortlist

### Claude Haiku 4.5 — Recommended Default
- **Provider:** Anthropic API (console.anthropic.com)
- **Pricing:** $1.00 / $5.00 per million input/output tokens
- **Subscription:** None — pay-per-token only
- **Context window:** 200K tokens
- **Strengths:** Fast, strong instruction-following, solid code comprehension, reliable structured output. Achieves ~90% of Sonnet 4.5 performance at 1/5th the cost.
- **Weaknesses:** May struggle with deeply complex explanations (dense code, multi-step prompts).
- **Verdict:** Best starting point. Use for tagging and simple summaries. Escalate to Sonnet 4.6 for complex explanations if needed.

---

### GPT-5 mini — Strong Price Competitor
- **Provider:** OpenAI API (platform.openai.com)
- **Pricing:** $0.25 / $2.00 per million input/output tokens
- **Subscription:** None — pay-per-token only
- **Context window:** 400K tokens
- **Strengths:** Input cost is 4x cheaper than Haiku 4.5. High intelligence score for its price tier (41 on Artificial Analysis Intelligence Index vs median of 19). Large context window.
- **Weaknesses:** Output cost ($2.00/M) is heavier relative to input — matters for explanation-heavy tasks. Higher hallucination rate than full GPT-5. Slower than average for its tier. Instruction-following precision on structured output (JSON tagging) may need more prompt engineering than Claude.
- **Verdict:** Worth A/B testing against Haiku 4.5 on your actual content. If quality holds up, wins on price for input-heavy workloads.

---

### Claude Sonnet 4.6 — Quality Ceiling / Fallback
- **Provider:** Anthropic API
- **Pricing:** $3.00 / $15.00 per million input/output tokens
- **Subscription:** None — pay-per-token only
- **Context window:** 200K tokens (1M token beta available)
- **Strengths:** Best capability-cost balance in the Claude lineup. Strong code comprehension and complex reasoning. Use as a fallback for items that Haiku flags as high complexity.
- **Weaknesses:** 3x more expensive than Haiku 4.5.
- **Verdict:** Don't use this as your default. Route only complex items to it via tiered logic.

---

### Gemini 3 Flash — Budget Alternative
- **Provider:** Google AI / Vertex AI
- **Pricing:** $0.50 / $3.00 per million input/output tokens
- **Subscription:** None — pay-per-token only
- **Strengths:** Cheap. Free tier available for testing.
- **Weaknesses:** Claude generally outperforms Gemini on precise instruction-following and code comprehension. Validate quality before committing.
- **Verdict:** Test it if cost is a primary concern, but don't assume it matches Haiku 4.5 quality on technical content without benchmarking.

---

## Cost Optimization Strategies

### Prompt Caching
If you have a shared system prompt (e.g., tagging schema, output format instructions), enable prompt caching. Both Anthropic and OpenAI support this.
- **Anthropic:** Up to 90% savings on cached input tokens after the first two requests.
- **OpenAI:** ~50% savings on cached input.

### Batch API
For items saved asynchronously (not requiring instant results), use the Batch API.
- Both Anthropic and OpenAI offer a **50% discount** on all token costs for batch jobs processed within 24 hours.
- At batch pricing, Haiku 4.5 drops to ~$0.50/$2.50 per million tokens.

### Tiered Routing
Use a cheap model (Haiku 4.5 or GPT-5 mini) for the majority of requests. Route only flagged complex items to Sonnet 4.6.
- A 70/20/10 Haiku/Sonnet/Opus split vs all-Sonnet can reduce costs by ~60%.

---

## Quick Comparison Table

| Model            | Input ($/M) | Output ($/M) | Subscription | Notes                          |
|------------------|-------------|--------------|--------------|--------------------------------|
| GPT-5 mini       | $0.25       | $2.00        | None         | Cheapest input; test quality   |
| Gemini 3 Flash   | $0.50       | $3.00        | None         | Free tier for testing          |
| Claude Haiku 4.5 | $1.00       | $5.00        | None         | Recommended default            |
| Claude Sonnet 4.6| $3.00       | $15.00       | None         | Fallback for complex items     |

---

## Recommendation

1. **Start with Claude Haiku 4.5.** Build your structured output prompts (JSON tagging schema, summary format) and validate on a sample of your real content.
2. **Test GPT-5 mini in parallel** on the same sample. If output quality is comparable, switch to GPT-5 mini for the cost advantage — especially if your workload is input-heavy.
3. **Implement tiered routing** to Sonnet 4.6 for items that need deeper explanation.
4. **Enable prompt caching** on your system prompt from day one.
5. **Use Batch API** for any non-realtime processing paths.

---

*Pricing verified March 2026. Token costs change — check official docs before production deployment.*
- Anthropic: https://anthropic.com/pricing
- OpenAI: https://openai.com/api/pricing
- Google: https://ai.google.dev/gemini-api/docs/pricing
