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

const evidence = z.object({
  type: z.enum(['image', 'video', 'link']),
  src: mediaSrc,
  caption: z.string().min(1, 'Describe what this evidence shows'),
});

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
    results: z
      .array(
        z.object({
          model: z.string().min(1),
          metric: z.string().min(1),
          value: z.union([z.number(), z.string().min(1)]),
          unit: z.string().optional(),
          method: z.string().min(1, 'Say how this was measured'),
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
