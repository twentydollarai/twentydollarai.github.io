// End-to-end publishing workflow test, run entirely in a temporary copy of the project.
// 1. Creates VALID entries by copying templates/ and filling them with obvious "TEST" values.
// 2. Builds production and checks they appear in lists, homepage, RSS, sitemap and render.
// 3. Checks draft and demo entries stay out of production.
// 4. Adds INVALID entries one at a time and checks the build fails with a clear message.
// 5. Deletes the temporary copy and confirms the real project was not modified.
import { cp, mkdir, mkdtemp, readFile, writeFile, rm, readdir, symlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT, SITE, reporter, run, astroBin } from './lib.mjs';

const r = reporter('Publishing workflow (temporary copy)');
const EXCLUDE = new Set(['node_modules', 'dist', 'dist-demo', '.astro', 'tests', 'verification', '.git']);

async function treeHash(dir) {
  const h = createHash('sha256');
  const walk = async (d) => {
    for (const e of (await readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (EXCLUDE.has(e.name) && d === dir) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else h.update(path.relative(dir, p)).update(await readFile(p));
    }
  };
  await walk(dir);
  return h.digest('hex');
}

const before = await treeHash(ROOT);
const tmp = await mkdtemp(path.join(tmpdir(), 'tda-publish-'));
r.info(`temp copy: ${tmp}`);
for (const e of await readdir(ROOT)) if (!EXCLUDE.has(e)) await cp(path.join(ROOT, e), path.join(tmp, e), { recursive: true });
await symlink(path.join(ROOT, 'node_modules'), path.join(tmp, 'node_modules'), 'dir');

const tpl = (name) => readFile(path.join(tmp, 'templates', name), 'utf8');
const put = (section, file, text) => writeFile(path.join(tmp, 'src/content', section, file), text);
const del = (section, file) => rm(path.join(tmp, 'src/content', section, file));
const sub = (text, pairs) => pairs.reduce((t, [a, b]) => { if (!t.includes(a)) throw new Error(`template text not found: ${a}`); return t.split(a).join(b); }, text);
const build = (env = {}) => run(astroBin(tmp), ['build'], { cwd: tmp, env: { SHOW_DEMO: '', ...env } });
const read = (p) => readFile(path.join(tmp, 'dist', p), 'utf8').catch(() => '');
const exists = (p) => access(path.join(tmp, 'dist', p)).then(() => true, () => false);

try {
  // ---- valid entries made from the templates ----
  const blog = sub(await tpl('blog-post.md'), [
    ['"Your post title"', '"TEST post from template"'],
    ['"A short summary of what this post is about."', '"TEST description. Not a real article."'],
    ['["Learning AI"]', '["TEST category"]'],
    ['status: draft', 'status: published'],
    ['/images/blog/your-image.png', '/og-default.png'],
  ]);
  await put('blog', 'test-post.md', blog);
  await put('blog', 'test-draft.md', sub(blog, [['TEST post from template', 'TEST draft entry'], ['status: published', 'status: draft']]));
  await put('blog', 'test-demo.md', sub(blog, [['TEST post from template', 'TEST demo entry'], ['demo: false', 'demo: true']]));

  await put('benchmarks', 'test-benchmark.md', sub(await tpl('benchmark.md'), [
    ['"What you tested, in plain words"', '"TEST benchmark from template"'],
    ['"One or two sentences: the task and which models were compared."', '"TEST description. No real test was run."'],
    ['"Model or product name"', '"TEST model A"'],
    ['"Second model"', '"TEST model B"'],
    ['"https://link-to-pricing-page"', '"TEST note: not a real price"'],
    ['/images/benchmarks/your-screenshot.png', '/og-default.png'],
    ['status: draft', 'status: published'],
  ]));

  await put('experiments', 'test-experiment.md', sub(await tpl('experiment.md'), [
    ['"What the agent was asked to do"', '"TEST experiment from template"'],
    ['"One or two sentences summarizing the experiment and how it went."', '"TEST description. No real experiment was run."'],
    ['tool: "Grok Bot"', 'tool: "TEST tool"'],
    ['"e.g. 47 minutes wall clock"', '"TEST value"'],
    ['"e.g. what the usage meter showed before and after"', '"TEST value"'],
    ['/images/experiments/your-screenshot.png', '/og-default.png'],
    ['status: draft', 'status: published'],
  ]));

  await put('projects', 'test-project.md', sub(await tpl('project.md'), [
    ['"Project name"', '"TEST project from template"'],
    ['status: draft', 'status: published'],
  ]));

  const ok = build();
  r.check(ok.code === 0, `production build with template-based entries succeeds (exit ${ok.code})`);
  if (ok.code !== 0) r.info(ok.out.slice(-1500));

  const post = await read('blog/test-post/index.html');
  r.check(post.includes('TEST post from template') && post.includes('TEST category'), 'blog post page renders title + category');
  r.check(!post.includes('demo-banner'), 'published post has no demo/draft banner');
  r.check((await read('blog/index.html')).includes('href="/blog/test-post/"'), 'blog list links the post');
  r.check(await exists('blog/category/test-category/index.html'), 'category page generated');
  const bench = await read('benchmarks/test-benchmark/index.html');
  r.check(bench.includes('TEST model A') && bench.includes('chip-measured') && bench.includes('chip-opinion') && bench.includes('TEST note: not a real price'),
    'benchmark page renders models, price source, Measured and Opinion sections');
  r.check((await read('benchmarks/index.html')).includes('href="/benchmarks/test-benchmark/"'), 'benchmarks list links the benchmark');
  const exp = await read('experiments/test-experiment/index.html');
  r.check(exp.includes('TEST tool') && exp.includes('Outcome: In progress') && exp.includes('First limitation'), 'experiment page renders tool, outcome, limitations');
  r.check((await read('experiments/index.html')).includes('href="/experiments/test-experiment/"'), 'experiments list links the experiment');
  r.check((await read('projects/index.html')).includes('TEST project from template'), 'projects page shows the project card');
  const home = await read('index.html');
  r.check(['/blog/test-post/', '/benchmarks/test-benchmark/', '/experiments/test-experiment/'].every((u) => home.includes(`href="${u}"`)) && !home.includes('First experiments coming soon'),
    'homepage Latest feed lists all three, empty state gone');

  const feeds = run(process.execPath, [path.join(ROOT, 'tests', 'feeds.mjs'), `--dir=${path.join(tmp, 'dist')}`, `--site=${SITE}`,
    '--expect=/blog/test-post/,/benchmarks/test-benchmark/,/experiments/test-experiment/,/blog/category/test-category/']);
  r.check(feeds.code === 0, 'RSS + sitemap contain the new entries and are valid (feeds.mjs)');
  if (feeds.code !== 0) r.info(feeds.out.slice(-1500));

  const grep = run('grep', ['-rliE', 'test-draft|test-demo|TEST draft entry|TEST demo entry', path.join(tmp, 'dist')]);
  r.check(grep.out.trim() === '', `draft and demo entries absent from production output ${grep.out.trim()}`);

  const demoBuild = build({ SHOW_DEMO: 'true' });
  r.check(demoBuild.code === 0 && (await exists('blog/test-draft/index.html')) && (await exists('blog/test-demo/index.html')),
    'demo build (SHOW_DEMO=true) does include the draft and demo entries');
  const draftPage = await read('blog/test-draft/index.html');
  r.check(draftPage.includes('demo-banner') && (await read('blog/test-demo/index.html')).includes('Demo content, not real data'), 'draft/demo entries show their banner');
  await del('blog', 'test-draft.md');
  await del('blog', 'test-demo.md');

  // ---- invalid entries: each must stop the build with a clear message ----
  const cases = [
    ['blog', 'bad-missing-title.md', sub(blog, [['title: "TEST post from template"\n', '']]), /title/i],
    ['blog', 'bad-missing-date.md', sub(blog, [['date: 2026-01-31\n', '']]), /YYYY-MM-DD/],
    ['blog', 'bad-image-no-alt.md', sub(blog, [['# cover:\n#   src: /og-default.png\n#   alt: "Describe what the image shows"', 'cover:\n  src: /og-default.png']]), /cover\.alt|alt/i],
    ['benchmarks', 'bad-price.md', sub(await readFile(path.join(tmp, 'src/content/benchmarks/test-benchmark.md'), 'utf8'), [['      source: "TEST note: not a real price"   # REQUIRED with a price: a URL or a note like "My receipt, Jan 2026"\n', '']]), /has no source/],
    ['benchmarks', 'bad-no-method.md', sub(await readFile(path.join(tmp, 'src/content/benchmarks/test-benchmark.md'), 'utf8'), [['    method: "Stopwatch from pressing send to the last word appearing"\n  - model: "TEST model B"', '  - model: "TEST model B"']]), /method/],
    ['experiments', 'bad-outcome.md', sub(await readFile(path.join(tmp, 'src/content/experiments/test-experiment.md'), 'utf8'), [['outcome: in-progress', 'outcome: great']]), /outcome/],
    ['projects', 'bad-repo.md', sub(await readFile(path.join(tmp, 'src/content/projects/test-project.md'), 'utf8'), [['# repoUrl: "https://github.com/YOUR-USERNAME/your-repo"', 'repoUrl: "https://example.com/not-github"']]), /repoUrl/],
  ];
  for (const [section, file, text, expectRe] of cases) {
    await put(section, file, text);
    const res = build();
    await del(section, file);
    const msg = res.out.split('\n').filter((l) => /does not match|^\s+[\w.]+: |Required|Invalid|expected/i.test(l)).map((l) => l.trim()).slice(0, 3).join(' / ');
    r.check(res.code !== 0 && res.out.includes(file.replace('.md', '')) && expectRe.test(msg), `invalid ${section}/${file} fails the build: ${msg || '(no message)'}`);
  }
  const again = build();
  r.check(again.code === 0, 'build passes again after removing invalid entries');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
r.check(!(await access(tmp).then(() => true, () => false)), 'temporary copy deleted');
r.check((await treeHash(ROOT)) === before, 'real project files unchanged (content hash identical before/after)');
process.exit(r.done() ? 1 : 0);
