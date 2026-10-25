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
# Draft until the owner approves publishing. Tested with status: published (see the run-all log).
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

**Confirmed:**

- **Scene:** layered meadow with hills and distant mountains, sun top-left with light rays, puffy clouds, floating pollen and purple and orange butterflies. Clear parallax: the foreground flowers move faster than the hills.
- **Dog:** a recognizable white fluffy Maltese with a black nose and a curled tail, consistent throughout.
- **Running:** the dog runs in place at the center while the scene scrolls right to left. The legs cycle through distinct stride poses but pivot stiffly, like a puppet rig.
- **Fur and tail:** the fur moves as one mass, the tail stays curled and still, and the ears only bounce with the body.
- **Toy:** stays at the mouth, but it's a glowing yellow-orange blob with heavy glow. No beak, eyes or chicken shape.
- **Clean frame:** no window borders, private info or frame-rate overlay.
- **Start of the recording:** a browser tooltip ("Click or press Space to pause") shows in the sky for about the first 1.3 seconds, and the mouse cursor for about the first second. They're part of the screen recording, not the animation. I left the recording as it was.

**Uncertain:**

- Whether the dog looks generic. That's subjective.
- How true it is to my reference photo, which isn't shown here.

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
