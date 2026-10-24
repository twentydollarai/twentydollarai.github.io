// Frontmatter rules for every content type. If a Markdown file breaks a rule,
// `npm run build` stops with a message that names the file and the field.
import { z } from 'astro/zod';

const status = z.enum(['draft', 'published']).default('draft');
const demo = z.boolean().default(false);
// Dates are written as YYYY-MM-DD. A clear message beats zod's default "expected date, received object".
const date = z.coerce.date({ error: 'Add a valid date written as YYYY-MM-DD' });

/** A local image ("/images/...") or a full https:// URL. */
const mediaSrc = z
  .string()
  .min(1)
  .refine((s) => s.startsWith('/') || /^https:\/\//.test(s), {
    message: 'Use a path starting with /images/... or a full https:// URL',
  });

const image = z.object({
  src: mediaSrc,
  alt: z.string().min(1, 'Every image needs alt text describing it'),
});

const evidence = z
  .object({
    type: z.enum(['image', 'video', 'link']),
    src: mediaSrc,
    caption: z.string().min(1, 'Describe what this evidence shows'),
    // Optional, videos only: a still image shown before the video plays. Must be a local /images/... file.
    poster: z.string().startsWith('/images/', 'poster must be a local image path starting with /images/').optional(),
  })
  .refine((e) => !e.poster || e.type === 'video', { message: 'poster only works on type: video', path: ['poster'] });

export const blogSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date,
  updated: date.optional(),
  categories: z.array(z.string().min(1)).default([]),
  cover: image.optional(),
  // Optional "At a glance" box at the top of the post. Each line shows only if filled in.
  // Write only what actually happened; leave a field out rather than guess.
  glance: z
    .object({
      summary: z.string().trim().min(1).optional(),
      tested: z.string().trim().min(1).optional(),
      result: z.string().trim().min(1).optional(),
      cost: z.string().trim().min(1).optional(),
    })
    .optional(),
  status,
  demo,
});

const price = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().default('USD'),
  period: z.string().default('month'),
  // Where the price came from: a URL or a short note ("Checkout receipt, 2026-10-01").
  source: z.string().trim().optional(),
  checked: date.optional(),
});

export const benchmarkSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    date,
    updated: date.optional(),
    models: z
      .array(
        z.object({
          name: z.string().min(1),
          plan: z.string().optional(),
          price: price.optional(),
        }),
      )
      .min(1, 'List at least one model'),
    prompt: z.string().min(1),
    // No longer shown on the page (benchmark pages have no label chips). Still accepted so older files build.
    promptLabel: z.string().min(1).optional(),
    // Default: results show as a short Metric / Value table (no Model or "How it was measured" column).
    // Set compactResults: false for the older wide table, which shows model and method on every row.
    compactResults: z.boolean().default(true),
    // One short source line shown above the results table, e.g. "Figures from the Grok CLI's end-of-run summary.".
    resultsNote: z.string().min(1).optional(),
    results: z
      .array(
        z.object({
          model: z.string().min(1),
          metric: z.string().min(1),
          value: z.union([z.number(), z.string().min(1)]),
          unit: z.string().optional(),
          // Not displayed in the default compact table. Required only when compactResults: false.
          method: z.string().min(1, 'Say how this was measured').optional(),
        }),
      )
      .default([]),
    evidence: z.array(evidence).default([]),
    status,
    demo,
  })
  .superRefine((data, ctx) => {
    data.models.forEach((m, i) => {
      if (m.price && !m.price.source) {
        ctx.addIssue({
          code: 'custom',
          path: ['models', i, 'price', 'source'],
          message: `Price for "${m.name}" has no source. Add price.source (a URL or a note), or remove the price.`,
        });
      }
    });
    if (!data.compactResults) {
      data.results.forEach((r, i) => {
        if (!r.method) {
          ctx.addIssue({
            code: 'custom',
            path: ['results', i, 'method'],
            message: `Result "${r.metric}" has no method. With compactResults: false every result needs a method (how it was measured).`,
          });
        }
      });
    }
    // Template placeholders must never go live: a published page with "FILL IN" left in fails the build.
    if (data.status === 'published') {
      const left = (v: unknown) => typeof v === 'string' && /FILL IN/.test(v);
      if (left(data.resultsNote)) {
        ctx.addIssue({ code: 'custom', path: ['resultsNote'], message: 'resultsNote still says "FILL IN". Replace it with the real source, or delete the line.' });
      }
      data.results.forEach((r, i) => {
        if (left(r.value) || left(r.metric)) {
          ctx.addIssue({ code: 'custom', path: ['results', i, 'value'], message: `Result "${r.metric}" still says "FILL IN". Put in what you measured, or delete the row.` });
        }
      });
    }
    const names = new Set(data.models.map((m) => m.name));
    data.results.forEach((r, i) => {
      if (!names.has(r.model)) {
        ctx.addIssue({
          code: 'custom',
          path: ['results', i, 'model'],
          message: `Result model "${r.model}" is not listed under models.`,
        });
      }
    });
  });

export const experimentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date,
  updated: date.optional(),
  tool: z.string().min(1),
  plan: z.string().optional(),
  assignment: z.string().min(1),
  timeRequired: z.string().optional(),
  usageConsumed: z.string().optional(),
  outcome: z.enum(['worked', 'partial', 'failed', 'in-progress']),
  limitations: z.array(z.string().min(1)).default([]),
  usefulness: z.string().optional(),
  evidence: z.array(evidence).default([]),
  status,
  demo,
});

export const projectSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  progress: z.enum(['ongoing', 'completed']),
  repoUrl: z
    .string()
    .regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/, 'repoUrl must be a public https://github.com/<user>/<repo> link')
    .optional(),
  siteUrl: z.url().optional(),
  screenshots: z.array(image).default([]),
  order: z.number().default(0),
  status,
  demo,
});
