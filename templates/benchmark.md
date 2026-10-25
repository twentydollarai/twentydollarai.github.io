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
#  • A published page can't still say "FILL IN" anywhere in its results.
#
# RESULTS FORMAT (the default): a short Metric / Value table that fits on one screen.
#  • Show just four things: Time, Tokens, Cost, Weekly usage.
#  • Put where the numbers came from in ONE line: resultsNote.
#  • No per-row "how it was measured" text. It isn't shown in this format.
#
# LAYOUT LOCKED (owner-approved Oct 24, 2026): a new benchmark page is data only. No layout changes without my approval.
#
# THE WHOLE PAGE FITS ON ONE LAPTOP SCREEN (1280x800). On desktop: the title block across the top, then
# two columns (about 40/60). Left: Results, Models tested, The prompt, My take. Right: the evidence clip or
# screenshot, as large as the column (the biggest thing on the page), with its one-line caption.
# On phones it stacks: title, results, model and prompt, evidence, my take.
#  • Keep the title short enough for one line (about 65 characters).
#  • One evidence item works best: a short .mp4 clip (it plays by itself, muted and looping) or one screenshot.
#    Keep its caption to one line (about 90 characters).
#  • Keep My take to about three short bullets.
#  • The tests fail if the title wraps, the page runs past the first screen, or it leaves a big empty area.
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

# The prompt's NAME only. Benchmark prompts are private: write its name or "Private", e.g.
#   prompt: "Standard TwentyDollarAI Benchmarking"
# Never paste, describe, summarize, paraphrase or reconstruct the prompt itself.
prompt: "Your prompt's name"

# Optional: where the numbers came from, in one short line, shown above the results table.
# Delete the # and replace FILL IN with the real source. Never claim a source you didn't use.
#resultsNote: "FILL IN: where the numbers came from"

# Measured results only: things you timed, counted, or checked. Keep to the four metrics below.
# Delete a row you didn't record; never guess a number. Opinions go in the text below the second ---.
# value can be a number (42) or short text ("About 2%").
# Optional: compactResults: false switches to the old wide table with Model and
# "How it was measured" columns. Then every row also needs  method: "how you measured it".
# Replace every FILL IN with what you measured (e.g. "36m 34s", "4.77M", "$3.24", "About 2%").
# The build refuses to publish a page that still says FILL IN.
results:
  - model: "Model or product name"   # must match a name above
    metric: "Time"
    value: "FILL IN"
  - model: "Model or product name"
    metric: "Tokens"
    value: "FILL IN"
  - model: "Model or product name"
    metric: "Cost"
    value: "FILL IN"
  - model: "Model or product name"
    metric: "Weekly usage"
    value: "FILL IN"

# Screenshots, videos and links that back up the results.
#   type: image  -> file in public/images/benchmarks/, src starts with /images/benchmarks/
#   type: video  -> YouTube/Vimeo link (embedded), or an .mp4 in public/images/benchmarks/ (under 1 MB)
#                   optional for an .mp4:  poster: /images/benchmarks/your-still.webp  (shown before it plays)
#                   An .mp4 on a benchmark page plays by itself, muted and looping, with controls to pause it.
#                   Visitors who turn on "reduce motion" see it paused on the poster instead.
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
It shows under the heading "My take", separate from the measured results. Keep it to about three short bullets
so the page still fits on one screen.
