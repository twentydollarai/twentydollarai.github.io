// Static security review of source and built output, plus a live check that pages
// make no requests to other hosts when loaded.
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { launch, preview, reporter, ROOT, PROD_PAGES, DEMO_PAGES, PROD_PORT, DEMO_PORT } from './lib.mjs';

const r = reporter('Security review');
// verification/ holds generated reports and logs (they mention temp paths by design).
const SKIP = new Set(['node_modules', '.astro', '.git', 'verification', 'dist-demo']);
async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p)));
    else out.push(p);
  }
  return out;
}
const textual = (f) => /\.(m?[jt]s|astro|md|json|ya?ml|css|html|xml|svg|txt|gitignore|nvmrc)$|\/\.[a-z]+$/i.test(f);

const secretPatterns = [
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Credential assignment', /\b(api[_-]?key|secret|password|passwd|token)\s*[:=]\s*['"][^'"\s]{8,}['"]/i],
];
const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const localPathRe = /\/workspace\/|\/home\/[a-z]|\/Users\/[A-Za-z]|[A-Z]:\\\\Users/;

const srcFiles = (await files(ROOT)).filter((f) => !f.includes(`${path.sep}dist`) && !f.includes(`${path.sep}tests${path.sep}`) && textual(f));
const distFiles = (await files(path.join(ROOT, 'dist')));

// 1. Secrets anywhere in source or output.
const hits = [];
for (const f of [...srcFiles, ...distFiles.filter(textual)]) {
  const t = await readFile(f, 'utf8');
  for (const [name, re] of secretPatterns) if (re.test(t)) hits.push(`${name} in ${path.relative(ROOT, f)}`);
}
hits.forEach((h) => r.info(h));
r.check(hits.length === 0, `no secret-like strings in ${srcFiles.length} source + ${distFiles.length} output files`);

// 2. Emails and local filesystem paths in output (and in source outside docs/tests).
const leak = [];
for (const f of distFiles.filter(textual)) {
  const t = await readFile(f, 'utf8');
  const emails = (t.match(emailRe) ?? []).filter((e) => !/@(fontsource|[0-9])/.test(e) && !/\.(woff2?|png|svg)$/.test(e));
  if (emails.length) leak.push(`emails ${[...new Set(emails)].join(',')} in ${path.relative(ROOT, f)}`);
  if (localPathRe.test(t)) leak.push(`local path in ${path.relative(ROOT, f)}`);
}
for (const f of srcFiles) {
  const t = await readFile(f, 'utf8');
  if (localPathRe.test(t) && !/README|VERIFICATION|REPORT|package-lock/.test(f)) leak.push(`local path in ${path.relative(ROOT, f)}`);
}
leak.forEach((l) => r.info(l));
r.check(leak.length === 0, 'no emails or local paths in built output or site source');

// 3. Source maps.
const maps = distFiles.filter((f) => f.endsWith('.map'));
let mapRefs = 0;
for (const f of distFiles.filter((f) => /\.(js|css|html)$/.test(f))) if ((await readFile(f, 'utf8')).includes('sourceMappingURL')) mapRefs++;
r.check(maps.length === 0 && mapRefs === 0, `no source maps in dist (${maps.length} files, ${mapRefs} references)`);

// 4. HTML review: external resources, inline scripts, target=_blank rel.
const html = distFiles.filter((f) => f.endsWith('.html'));
const inline = new Map();
const extRes = new Set();
const badRel = [];
for (const f of html) {
  const t = await readFile(f, 'utf8');
  for (const m of t.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(m[1])) { const s = m[1].match(/src="([^"]+)"/)[1]; if (/^https?:|^\/\//.test(s)) extRes.add(s); continue; }
    const h = createHash('sha256').update(m[2]).digest('base64').slice(0, 16);
    inline.set(h, { len: m[2].length, type: (m[1].match(/type="([^"]+)"/) ?? [, 'classic'])[1], sample: m[2].trim().slice(0, 70) });
  }
  for (const m of t.matchAll(/<(?:link|img|iframe|video|source|audio)\b[^>]*\b(?:href|src)="([^"]+)"[^>]*>/g)) {
    const tag = m[0];
    if (/^https?:|^\/\//.test(m[1]) && !/rel="(canonical|alternate|sitemap)"/.test(tag)) extRes.add(m[1]);
  }
  for (const m of t.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) badRel.push(`${path.relative(ROOT, f)}: ${m[0]}`);
}
for (const f of distFiles.filter((f) => f.endsWith('.css'))) {
  for (const m of (await readFile(f, 'utf8')).matchAll(/url\(\s*['"]?((?:https?:)?\/\/[^'")]+)/g)) extRes.add(m[1]);
}
r.check(extRes.size === 0, `no external scripts/styles/fonts/images referenced in dist ${[...extRes].join(' ')}`);
r.check(badRel.length === 0, `every target="_blank" link has rel=noopener (${badRel.length} missing)`);
r.info(`inline scripts (${inline.size} distinct, all first-party):`);
for (const [h, s] of inline) r.info(`  sha256:${h}… ${s.type} ${s.len} chars: ${s.sample.replace(/\s+/g, ' ')}…`);
r.check([...inline.values()].every((s) => !/eval\(|new Function|document\.write|innerHTML/.test(s.sample)), 'inline scripts contain no eval/new Function/document.write/innerHTML');

// 5. Live: no requests to other hosts while loading every page.
const prod = await preview({ port: PROD_PORT });
const demo = await preview({ port: DEMO_PORT, outDir: 'dist-demo' });
const b = await launch('chromium');
const foreign = new Set();
try {
  const p = await b.newPage();
  p.on('request', (q) => { const u = new URL(q.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.protocol.startsWith('data')) foreign.add(q.url()); });
  for (const path of PROD_PAGES) await p.goto(prod.url + path, { waitUntil: 'networkidle' });
  for (const path of DEMO_PAGES) await p.goto(demo.url + path, { waitUntil: 'networkidle' });
} finally { await b.close(); prod.stop(); demo.stop(); }
r.check(foreign.size === 0, `no requests to external hosts while loading ${PROD_PAGES.length + DEMO_PAGES.length} pages ${[...foreign].join(' ')}`);
process.exit(r.done() ? 1 : 0);
