---
title: "Claude Opus 5.5 Maltese benchmark: scores, review and quota notes"
description: "The full notes behind my Claude Opus 5.5 benchmark in Google Antigravity: my preliminary scores, strengths and weaknesses, a second review of the recording, and the five-hour limit that interrupted it."
date: 2026-10-25
categories: ["Benchmarks"]
glance:
  summary: "Claude Opus 5.5 in Google Antigravity made an attractive, recognizable Maltese animation with a detailed scene. Fidelity to the reference, especially the chicken toy, was weaker. The five-hour usage limit interrupted testing."
  tested: "My standard Maltese visual animation benchmark: a 16:9 animated scene of my white Maltese running through a wildflower meadow with his yellow chicken toy, based on a reference photo."
  result: "Animation delivered. Preliminary visual score 7.4/10 (my subjective review). Independent performance check still pending."
  cost: "Time, tokens and API-equivalent cost: not measured. Plan: not recorded."
# Draft until the real Opus 5.5 recording is confirmed (the supplied file matches the Grok 4.7 High output).
status: draft
demo: false
---

These are the notes behind the [Claude Opus 5.5 benchmark page](/benchmarks/claude-opus-5-5-antigravity-animated-maltese/). The page keeps to one screen; everything else is here.

## How I ran it

- **Model:** Claude Opus 5.5. **Environment:** Google Antigravity.
- **Test:** my standard Maltese visual animation benchmark. The prompt is private.
- **Goal:** a 16:9 animated scene of my white Maltese running through a wildflower meadow carrying his yellow chicken toy, based on a reference photo.
- **Deliverable:** a single HTML file (`index.html`), about 70 KB, with no external assets. The scene is drawn by code, not cut out of the photo.

## What the agent reported (not verified)

The agent reported these numbers. I haven't checked them independently yet, and the screen recording doesn't show them.

| Item | Reported by the agent |
| --- | --- |
| Browser | Microsoft Edge |
| Frame rate | About 120 FPS |
| Render time | About 3 ms per frame |
| JavaScript errors | None reported |

## My preliminary scores

These are my own subjective scores from watching the recording. They're not automated measurements and haven't been validated.

| Category | Score |
| --- | --- |
| Environment and atmosphere | 9/10 |
| Maltese appearance | 7.5/10 |
| Chicken toy resemblance | 5/10 |
| Composition | 8.5/10 |
| Animation poses | 7/10 |
| Overall (preliminary average) | 7.4/10 |

**Strengths**

- Attractive wildflower meadow, mountain backdrop and lighting.
- Recognizable Maltese characteristics.
- Cohesive composition and visual style.
- Visible changes in the running poses.
- A working animation, shown in the recording.

**Weaknesses**

- The chicken toy isn't faithful to the reference.
- The dog looks more like a generic stylized Maltese than my dog.
- The running looks somewhat mechanical in sampled frames.
- A possible small rectangular artifact in the sky (see the review below).

## A second review of the recording

Grok Bot, my AI agent, watched the recording separately. It gave no scores; my scores above are unchanged.

- **Confirmed:** a cohesive 2D vector style with a gradient sky, sun and clouds, and layered parallax (fast foreground flowers, slower rolling hills with round trees). The dog stays consistent with no warping. Legs cycle, the body and head bob, and the ears and tail flap. The toy stays in the mouth for the whole loop. No loop pops, flicker or layering errors.
- **Confirmed weaknesses:** the dog runs in place while the background scrolls. The motion is rigid, puppet-style rotation at the joints. The dog looks like a generic stock-style Maltese. The toy reads as a yellow striped tube with a fringed end, not clearly a chicken. A small dark rectangle sits at the top edge of the sky, top center, for the whole video.
- **One difference:** the backdrop reads as rolling green hills, not mountains.
- **Not confirmed:** fidelity to the reference photo (the review didn't have it), and the frame rate and render time, which aren't visible in the recording.

## Usage limits

Testing was interrupted: Opus 5.5 hit its five-hour usage limit mid-test. That's a limit on using the plan, not a fault in the animation. I [posted about it on X](https://x.com/TwentyDollarAI/status/2114146295615205824) when it happened.

| Meter reading | Weekly remaining | Five-hour remaining | Five-hour reset in |
| --- | --- | --- | --- |
| First snapshot | 49.80% | 0.00% | 4h 23m |
| Later snapshot | 12.03% | 24.47% | 4h 33m |

Between the two snapshots, weekly remaining fell 37.77 points. Before reading anything into that:

- The quota is shared across Claude Opus, Claude Sonnet and GPT-OSS models, so the drop can't all be put down to Opus 5.5.
- These are percentages of a quota, not tokens or dollars.
- A five-hour reset happened between the two snapshots.

## Not measured yet

- Active run time, token use and API-equivalent cost.
- The plan this ran on.
- An independent check of the reported frame rate and render time.

## My take

Claude Opus 5.5 produced an attractive, recognizable Maltese with a detailed environment. Fidelity to the reference, especially the toy, was weaker than the scene. Usage limits interrupted testing, which is why I look at both output quality and practical access.
