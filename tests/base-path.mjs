// GitHub Pages URL structure checks.
//  A. Root site (current config: https://twentydollarai.github.io/, base '/'): paths in dist/.
//  B. Project site (base '/twenty-dollar-ai/'): built in a temporary copy, crawled, then deleted.
//  C. Trailing-slash behaviour of the preview server and the deploy workflow file.
import { cp, mkdtemp, readdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LinkChecker } from 'linkinator';
import { ROOT, SITE, reporter, run, astroBin, preview, astroPreview } from './lib.mjs';

const r = reporter('GitHub Pages URL structure');
const EXCLUDE = new Set(['node_modules', 'dist', 'dist-demo', '.astro', 'tests', 'verification', '.git']);

async function htmlRefs(dir) {
  const refs = [];
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.html')) {
        for (const m of (await readFile(p, 'utf8')).matchAll(/\s(?:href|src)="([^"]+)"/g)) refs.push([path.relative(dir, p), m[1]]);
      }
    }
  };
  await walk(dir);
  return refs;
}

// A. root site
{
  const refs = await htmlRefs(path.join(ROOT, 'dist'));
  const rootRel = refs.filter(([, u]) => u.startsWith('/') && !u.startsWith('//'));
  const relative = refs.filter(([, u]) => !/^(\/|https?:|#|mailto:)/.test(u));
  r.check(relative.length === 0, `root site: no page-relative links that would break between folders (${relative.length})`);
  const abs = refs.filter(([, u]) => u.startsWith('https://twentydollarai.github.io'));
  r.check(abs.every(([, u]) => u.startsWith(SITE + '/')), `root site: ${abs.length} absolute self-links (canonical/og) all on ${SITE}/`);
  r.info(`root site: ${rootRel.length} root-relative refs, e.g. ${[...new Set(rootRel.map(([, u]) => u))].slice(0, 8).join(' ')}`);
}

// B. project site in a temporary copy
const tmp = await mkdtemp(path.join(tmpdir(), 'tda-base-'));
try {
  for (const e of await readdir(ROOT)) if (!EXCLUDE.has(e)) await cp(path.join(ROOT, e), path.join(tmp, e), { recursive: true });
  await symlink(path.join(ROOT, 'node_modules'), path.join(tmp, 'node_modules'), 'dir');
  const cfg = path.join(tmp, 'src/site.config.mjs');
  await writeFile(cfg, (await readFile(cfg, 'utf8')).replace("basePath: '/',", "basePath: '/twenty-dollar-ai/',"));
  for (const [label, env, outDir] of [['prod', {}, 'dist'], ['demo', { SHOW_DEMO: 'true' }, 'dist-demo']]) {
    const b = run(astroBin(tmp), ['build', '--outDir', outDir], { cwd: tmp, env: { SHOW_DEMO: '', ...env } });
    r.check(b.code === 0, `project site ${label} build succeeds`);
    const refs = await htmlRefs(path.join(tmp, outDir));
    const wrong = refs.filter(([, u]) => u.startsWith('/') && !u.startsWith('//') && !u.startsWith('/twenty-dollar-ai/'));
    wrong.slice(0, 5).forEach(([f, u]) => r.info(`missing base: ${u} in ${f}`));
    r.check(wrong.length === 0, `project site ${label}: all ${refs.filter(([, u]) => u.startsWith('/')).length} root-relative refs start with /twenty-dollar-ai/`);
    const abs = refs.filter(([, u]) => u.startsWith(SITE));
    r.check(abs.every(([, u]) => u.startsWith(SITE + '/twenty-dollar-ai/')), `project site ${label}: canonical/og URLs include the base`);
    const srv = await preview({ root: tmp, outDir, port: 4331, basePath: '/twenty-dollar-ai/' });
    try {
      const res = await new LinkChecker().check({ path: srv.url + '/twenty-dollar-ai/', recurse: true, linksToSkip: async (l) => !l.startsWith(srv.url) });
      const broken = res.links.filter((l) => l.state === 'BROKEN');
      broken.forEach((l) => r.info(`BROKEN ${l.status} ${l.url} <- ${l.parent}`));
      r.check(broken.length === 0, `project site ${label}: ${res.links.filter((l) => l.state !== 'SKIPPED').length} links crawled, ${broken.length} broken`);
    } finally { srv.stop(); }
    const feeds = run(process.execPath, [path.join(ROOT, 'tests/feeds.mjs'), `--dir=${path.join(tmp, outDir)}`, '--base=/twenty-dollar-ai/']);
    r.check(feeds.code === 0, `project site ${label}: RSS + sitemap URLs include the base`);
    if (feeds.code) r.info(feeds.out.slice(-800));
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

// C. trailing slashes (preview server) + workflow file
{
  // astro preview, and the Pages-like test server (301 /dir -> /dir/, like GitHub Pages).
  for (const [label, start] of [['astro preview', () => astroPreview({ port: 4332 })], ['pages-like server', () => preview({ port: 4333 })]]) {
    const srv = await start();
    try {
      for (const u of ['/blog', '/blog/', '/blog/index.html', '/about', '/nope/']) {
        const res = await fetch(srv.url + u, { redirect: 'manual' });
        const loc = res.headers.get('location');
        r.info(`${label} ${u} -> HTTP ${res.status}${loc ? ' -> ' + loc : ''}`);
        const ok = u === '/nope/' ? res.status === 404 : [200, 301, 302, 308].includes(res.status);
        r.check(ok, `${label}: ${u} -> HTTP ${res.status}${loc ? ' ' + loc : ''}`);
      }
    } finally { srv.stop(); }
  }
  const wf = await readFile(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
  r.check(/uses: withastro\/action@v\d/.test(wf) && /uses: actions\/deploy-pages@v\d/.test(wf), 'workflow uses withastro/action + actions/deploy-pages');
  r.check(/pages: write/.test(wf) && /id-token: write/.test(wf) && /contents: read/.test(wf), 'workflow permissions: contents read, pages write, id-token write');
  r.check(!/secrets\./.test(wf), 'workflow uses no secrets');
  r.check(/build-cmd: npm run build\b/.test(wf) && !/SHOW_DEMO/.test(wf), 'workflow runs the production build (no SHOW_DEMO)');
}
process.exit(r.done() ? 1 : 0);
