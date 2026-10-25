// Share images (og:image / twitter:image) in a build directory (default dist/).
// Every benchmark page must point at its own 1200x630 PNG card (made by scripts/make-og-cards.mjs),
// and the card must be up to date with what the page shows. Every other page keeps og-default.png,
// except blog posts with a cover image, which use their cover (unchanged behaviour).
// Usage: node og-cards.mjs [--dir=dist] [--site=https://twentydollarai.github.io] [--base=/]
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { reporter, arg, ROOT, SITE } from './lib.mjs';
import { cardData, cardHash, cardAlt, pngInfo, CARD_KEY } from '../scripts/og-card-data.mjs';

const dir = path.resolve(ROOT, arg('dir', 'dist'));
const prefix = arg('site', SITE).replace(/\/$/, '') + arg('base', '/');
const r = reporter(`Share images (${path.relative(ROOT, dir) || dir})`);
const read = (f) => readFile(f).catch(() => null);
const metas = (html, attr, name) => [...html.matchAll(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`, 'g'))].map((m) => m[1]);
const fileOf = (u) => (u.startsWith(prefix) ? path.join(dir, decodeURIComponent(u.slice(prefix.length))) : null);

const htmlFiles = (await readdir(dir, { recursive: true })).filter((f) => f.endsWith('.html')).sort();
const benchPages = htmlFiles.filter((f) => /^benchmarks[\/\\][^\/\\]+[\/\\]index\.html$/.test(f));
r.check(benchPages.length > 0, `found ${benchPages.length} benchmark page(s)`);
const def = pngInfo(await readFile(path.join(dir, 'og-default.png')));
r.check(def?.width === 1200 && def?.height === 630, `og-default.png is a 1200x630 PNG (${def?.width}x${def?.height})`);

for (const f of benchPages) {
  const slug = f.split(/[\/\\]/)[1];
  const html = await readFile(path.join(dir, f), 'utf8');
  const og = metas(html, 'property', 'og:image'), tw = metas(html, 'name', 'twitter:image');
  const want = `${prefix}og/benchmarks/${slug}.png`;
  r.check(og.length === 1 && og[0] === want, `${slug}: og:image is its own card (${og.join(' ') || 'none'})`);
  r.check(tw.length === 1 && tw[0] === want, `${slug}: twitter:image is the same card`);
  r.check(metas(html, 'property', 'og:image:width').join() === '1200' && metas(html, 'property', 'og:image:height').join() === '630', `${slug}: og:image:width/height are 1200/630`);
  const buf = await read(fileOf(want));
  const info = buf && pngInfo(buf);
  r.check(info?.width === 1200 && info?.height === 630, `${slug}: card exists in the build and is a 1200x630 PNG (${info ? `${info.width}x${info.height}, ${(buf.length / 1024).toFixed(0)} KB` : 'missing or not a PNG'})`);
  r.check(buf && buf.length < 5 * 1024 * 1024, `${slug}: card is under X's 5 MB image limit`);
  const d = cardData(html);
  const video = d.video ? await read(path.join(ROOT, 'public', decodeURIComponent(d.video))) : null;
  r.check(info?.text[CARD_KEY] === cardHash(d, video),
    `${slug}: card is up to date with the page's title, plan, results and video (if not, run node scripts/make-og-cards.mjs)`);
  const decodeAttr = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const ogAlt = metas(html, 'property', 'og:image:alt').map(decodeAttr), twAlt = metas(html, 'name', 'twitter:image:alt').map(decodeAttr);
  r.check(ogAlt.length === 1 && twAlt.length === 1 && ogAlt[0] === twAlt[0] && ogAlt[0].length > 0, `${slug}: og:image:alt and twitter:image:alt exist and match ("${ogAlt[0] ?? ''}")`);
  r.check(ogAlt[0] === cardAlt(d), `${slug}: alt text is built from the page's title, plan and results`);
  r.check(d.results.length > 0 && d.results.every((x) => ogAlt[0]?.includes(x.value)) && d.models.every((m) => ogAlt[0]?.includes(m.plan)),
    `${slug}: alt text contains every result value and the plan (${d.results.map((x) => x.value).join(', ')})`);
  const cost = d.results.filter((x) => /Cost \(API-equivalent\)$/.test(x.label));
  r.check(cost.every((x) => ogAlt[0]?.includes(`API-equivalent cost ${x.value}`)) && !/(^|[^-])\bCost \(/.test(ogAlt[0] ?? ''),
    `${slug}: card and alt call the cost "API-equivalent cost" (never just "Cost"), with the page's figure${cost.length ? ` (${cost.map((x) => x.value).join(', ')})` : ''}`);
  r.check(d.results.length > 0 && d.models.length > 0, `${slug}: card data read from the page (${d.models.map((m) => m.plan).join(', ')}; ${d.results.map((x) => x.value).join(', ')})`);
}

const bad = [];
for (const f of htmlFiles.filter((x) => !benchPages.includes(x))) {
  const html = await readFile(path.join(dir, f), 'utf8');
  const og = metas(html, 'property', 'og:image'), tw = metas(html, 'name', 'twitter:image');
  const cover = /^blog[\/\\][^\/\\]+[\/\\]index\.html$/.test(f) && !/^blog[\/\\]category/.test(f) && og[0] && !og[0].endsWith('/og-default.png') && /\/images\/blog\//.test(og[0]);
  const ok = og.length === 1 && tw.length === 1 && og[0] === tw[0] && (cover || (og[0] === `${prefix}og-default.png`
    && metas(html, 'property', 'og:image:width').join() === '1200' && metas(html, 'property', 'og:image:height').join() === '630'));
  if (!ok || og[0].includes('/og/benchmarks/') || /image:alt/.test(html)) bad.push(`${f}: ${og.join(' ')}`);
}
r.check(bad.length === 0, `${htmlFiles.length - benchPages.length} other pages use og-default.png (1200x630), or a blog post's own cover, and no card alt text ${bad.join('; ')}`);
process.exit(r.done() ? 1 : 0);
