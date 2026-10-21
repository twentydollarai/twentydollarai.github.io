---
# ─────────────────────────────────────────────────────────────────────────
# AGENT EXPERIMENT TEMPLATE: a real task handed to an AI agent.
# 1. Copy this file into  src/content/experiments/
# 2. Rename it, e.g. grok-bot-plans-a-trip.md -> /experiments/grok-bot-plans-a-trip/
# 3. Fill in what actually happened. Unknown optional fields can be deleted;
#    the page will show "Not recorded".
# 4. Set status: published when it's ready.
# ─────────────────────────────────────────────────────────────────────────

title: "What the agent was asked to do"
description: "One or two sentences summarizing the experiment and how it went."
date: 2026-01-31

# The agent or product used, e.g. "Grok Bot" or "Muse".
tool: "Grok Bot"

# Optional: which subscription tier you were on.
# plan: "Your plan name"

# The assignment, word for word. Keep the "|" and indent lines by two spaces.
assignment: |
  Paste exactly what you asked the agent to do.

# Optional, but record them if you can. Free text, as measured.
timeRequired: "e.g. 47 minutes wall clock"
usageConsumed: "e.g. what the usage meter showed before and after"

# One of: worked | partial | failed | in-progress
outcome: in-progress

# What the agent couldn't do, got wrong, or needed help with. One per line.
limitations:
  - "First limitation"
  - "Second limitation"

# Optional: your overall judgment. Shown with an Opinion label.
usefulness: "Your honest take on how useful this was."

# Screenshots, videos and links (see the benchmark template for the rules).
# Images go in public/images/experiments/.
evidence:
  - type: image
    src: /images/experiments/your-screenshot.png
    caption: "What this screenshot shows"

status: draft
demo: false
---

Write "What happened" here: a short, factual account of the run, step by step.
