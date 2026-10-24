---
# ─────────────────────────────────────────────────────────────────────────
# BENCHMARK TEMPLATE: the same task run on one or more models.
# 1. Copy this file into  src/content/benchmarks/
# 2. Rename it, e.g. summarize-a-pdf.md  ->  /benchmarks/summarize-a-pdf/
# 3. Fill in ONLY what you actually measured. Leave out anything you didn't.
# 4. Set status: published when it's ready.
#
# RULES the build enforces (it stops with an error if broken):
#  • A price must have a source, or the build fails.
#  • Every result's "model" must match a name in the models list.
#
# RESULTS FORMAT (the default): a short Metric / Value table that fits on one screen.
#  • Show just four things: Time, Tokens, Cost, Weekly usage.
#  • Put where the numbers came from in ONE line: resultsNote.
#  • No per-row "how it was measured" text. It isn't shown in this format.
# ─────────────────────────────────────────────────────────────────────────

title: "What you tested, in plain words"
description: "One or two sentences: the task and which models were compared."

# The date you ran the test, YYYY-MM-DD.
date: 2026-01-31

# One entry per model. plan and price are optional.
models:
  - name: "Model or product name"
    plan: "The subscription tier you used"
    # Optional. Delete the whole price block if you don't want to show a price.
    price:
      amount: 0            # number only, no $ sign. Replace 0 with the real price.
      currency: "USD"
      period: "month"
      source: "https://link-to-pricing-page"   # REQUIRED with a price: a URL or a note like "My receipt, Jan 2026"
      checked: 2026-01-31  # optional: when you checked the price
  - name: "Second model"
    plan: "Its tier"

# The exact prompt, word for word. Keep the "|" and indent every line by two spaces.
prompt: |
  Paste the exact prompt here.
  Multiple lines are fine.

# Where the numbers came from, in one short line. Shown above the results table.
resultsNote: "Figures from the tool's end-of-run summary."

# Measured results only: things you timed, counted, or checked. Keep to the four metrics below.
# Delete a row you didn't record; never guess a number. Opinions go in the text below the second ---.
# value can be a number (42) or short text ("About 2%").
# Optional: compactResults: false switches to the old wide table with Model and
# "How it was measured" columns. Then every row also needs  method: "how you measured it".
results:
  - model: "Model or product name"   # must match a name above
    metric: "Time"
    value: "0m 0s"                   # replace with what you measured
  - model: "Model or product name"
    metric: "Tokens"
    value: 0
  - model: "Model or product name"
    metric: "Cost"
    value: "$0.00"
  - model: "Model or product name"
    metric: "Weekly usage"
    value: "0%"

# Screenshots, videos and links that back up the results.
#   type: image  -> file in public/images/benchmarks/, src starts with /images/benchmarks/
#   type: video  -> YouTube/Vimeo link (embedded), or an .mp4 in public/images/benchmarks/ (keep it small)
#   type: link   -> any https:// page, e.g. a shared chat or an X post
# Delete the list (write  evidence: []) if you have none.
evidence:
  - type: image
    src: /images/benchmarks/your-screenshot.png
    caption: "What this screenshot shows"

status: draft
demo: false
---

Write "My take" here: your opinions, impressions, and conclusions.
This section is automatically labeled **Opinion** on the page, separate from the measured results.
