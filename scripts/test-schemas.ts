// Quick checks that the frontmatter rules catch common mistakes.
// Run: npm run test:schema
import { benchmarkSchema, projectSchema, experimentSchema, blogSchema } from '../src/schemas.ts';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failed++;
};

const bench = {
  title: 't', description: 'd', date: '2026-01-01', prompt: 'p',
  models: [{ name: 'A', plan: 'x' }],
  results: [{ model: 'A', metric: 'm', value: 1, method: 'stopwatch' }],
};

check('valid benchmark passes', benchmarkSchema.safeParse(bench).success);

const noSource = benchmarkSchema.safeParse({ ...bench, models: [{ name: 'A', price: { amount: 20 } }] });
check('price without source is rejected', !noSource.success,
  noSource.success ? '' : noSource.error.issues.map((i) => i.message).join('; '));

const blankSource = benchmarkSchema.safeParse({ ...bench, models: [{ name: 'A', price: { amount: 20, source: '   ' } }] });
check('price with blank source is rejected', !blankSource.success);

check('price with source passes',
  benchmarkSchema.safeParse({ ...bench, models: [{ name: 'A', price: { amount: 20, source: 'https://example.com/pricing' } }] }).success);

check('result for unlisted model is rejected',
  !benchmarkSchema.safeParse({ ...bench, results: [{ model: 'Z', metric: 'm', value: 1, method: 'x' }] }).success);

check('compact results are the default',
  benchmarkSchema.parse(bench).compactResults === true);

check('result without method passes in the default compact table',
  benchmarkSchema.safeParse({ ...bench, results: [{ model: 'A', metric: 'm', value: 1 }] }).success);

check('result without method is rejected when compactResults: false',
  !benchmarkSchema.safeParse({ ...bench, compactResults: false, results: [{ model: 'A', metric: 'm', value: 1 }] }).success);

check('published benchmark with a FILL IN result is rejected',
  !benchmarkSchema.safeParse({ ...bench, status: 'published', results: [{ model: 'A', metric: 'Time', value: 'FILL IN' }] }).success);

check('draft benchmark with a FILL IN result still builds (work in progress)',
  benchmarkSchema.safeParse({ ...bench, status: 'draft', results: [{ model: 'A', metric: 'Time', value: 'FILL IN' }] }).success);

const noDate = blogSchema.safeParse({ title: 't', description: 'd' });
check('missing date is rejected with a clear message', !noDate.success && noDate.error.issues.some((i) => /YYYY-MM-DD/.test(i.message)),
  noDate.success ? '' : noDate.error.issues.map((i) => i.message).join('; '));

check('status defaults to draft', blogSchema.parse({ title: 't', description: 'd', date: '2026-01-01' }).status === 'draft');

check('image without alt is rejected',
  !blogSchema.safeParse({ title: 't', description: 'd', date: '2026-01-01', cover: { src: '/images/blog/a.png', alt: '' } }).success);

check('blog glance is optional and accepts partial fields',
  blogSchema.safeParse({ title: 't', description: 'd', date: '2026-01-01' }).success &&
  blogSchema.safeParse({ title: 't', description: 'd', date: '2026-01-01', glance: { summary: 's' } }).success);

check('blank glance field is rejected',
  !blogSchema.safeParse({ title: 't', description: 'd', date: '2026-01-01', glance: { cost: '  ' } }).success);

check('bad experiment outcome is rejected',
  !experimentSchema.safeParse({ title: 't', description: 'd', date: '2026-01-01', tool: 'x', assignment: 'a', outcome: 'great' }).success);

check('non-GitHub repoUrl is rejected',
  !projectSchema.safeParse({ name: 'n', summary: 's', progress: 'ongoing', repoUrl: 'https://example.com/x' }).success);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll schema checks passed');
process.exit(failed ? 1 : 0);
