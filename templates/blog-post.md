---
# ─────────────────────────────────────────────────────────────────────────
# BLOG POST TEMPLATE
# 1. Copy this file into  src/content/blog/
# 2. Rename it. The file name becomes the web address:
#      my-first-week-with-grok.md  ->  /blog/my-first-week-with-grok/
#    Use lowercase letters, numbers and dashes only.
# 3. Fill in the fields below, write the article under the second ---,
#    then set status: published.
# Lines starting with # are comments; you can delete them.
# ─────────────────────────────────────────────────────────────────────────

# Headline shown on the page and in link previews. Keep the quotes.
title: "Your post title"

# One or two sentences. Shown on cards, in search results and on social previews.
description: "A short summary of what this post is about."

# Publication date, YYYY-MM-DD.
date: 2026-01-31

# Optional: date of your last meaningful edit. Delete the line if not needed.
# updated: 2026-02-05

# Categories, in a list. Each one gets its own page at /blog/category/<name>/.
categories: ["Learning AI"]

# Optional cover image. Put the file in public/images/blog/ and refer to it
# starting with /images/blog/. alt describes the image for screen readers.
# To add a cover, delete the # at the start of these three lines.
#cover:
#  src: /images/blog/your-image.png
#  alt: "Describe what the image shows"

# Optional "At a glance" box shown at the top of the post. Each line appears
# only if you fill it in, so delete any you don't need (or the whole block).
# To use it, delete the # at the start of each line, but keep the spaces
# before summary, tested, result and cost.
# Write only what really happened. If you didn't measure something, say
# "Not measured" or leave the line out. Never guess a number.
#glance:
#  summary: "One or two plain sentences: what you did and what happened."
#  tested: "What you tried, e.g. which tool, plan or task."
#  result: "What happened, including what didn't work."
#  cost: "What it cost and where that figure came from (receipt, pricing page)."

# draft = hidden from the public site.  published = live after the next deploy.
status: draft

# Leave false. true marks layout-test content that is never published.
demo: false
---

Write your article here in Markdown.

Label every number in the post Measured, Estimate, Not measured or Not tested.

Use ## for each main section. Posts with 4 or more ## sections get an
automatic "In this post" contents list at the top.

## A subheading

Normal paragraphs are just text. **Bold**, *italic*, and [a link](https://example.com).

Images (put the file in public/images/blog/ first):

![Describe the image](/images/blog/your-image.png)

> Quotes look like this.

- Bullet lists
- look like this
