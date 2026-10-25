---
title: "Grok 4.7 High in Grok CLI: TwentyDollarAI Standard Benchmarking"
description: "Time, tokens, cost and weekly usage for one run, plus the output."
date: 2026-10-19
models:
  - name: "Grok 4.7 High"
    # My plan for this run: $30 (confirmed 2026-10-24). Owner, Oct 25, 2026: keep the $30 price and name the subscription clearly.
    # No product or tier name beyond that.
    plan: "$30/month Grok plan"
    # No price block: $3.2425 is an API-equivalent figure, not a subscription price (see results).
# My standard benchmark prompt and data are private. Show only its name; never describe,
# paraphrase or reconstruct the prompt.
prompt: "Standard TwentyDollarAI Benchmarking"
resultsNote: "Figures from the Grok CLI’s end-of-run summary."
results:
  - model: "Grok 4.7 High"
    metric: "Time (total runtime)"
    value: "36m 34s"
  - model: "Grok 4.7 High"
    metric: "Tokens (total)"
    value: "4.77M"
  - model: "Grok 4.7 High"
    metric: "Cost (API-equivalent)"
    value: "$3.2425"
  - model: "Grok 4.7 High"
    metric: "Weekly usage"
    value: "About 2%"
evidence:
  - type: video
    src: /images/benchmarks/grok-4-7-high-maltese-meadow.mp4
    poster: /images/benchmarks/grok-4-7-high-maltese-meadow-still.webp
    caption: "The output: a white dog running through a meadow with a toy (about 5 seconds, silent)."
status: published
demo: false
---

- **Excellent visuals:** detailed scene, convincing dog, smooth running.
- **Low usage:** about 2% of the weekly allowance.
- **Slow:** over 36 minutes.
