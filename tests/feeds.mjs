// RSS + sitemap validation for a build directory (default dist/).
// XML is parsed with the browser's DOMParser (no extra dependency).
// Usage: node feeds.mjs [--dir=dist] [--site=https://twentydollarai.github.io] [--base=/] [--expect=/blog/x/,/benchmarks/y/]
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { launch, reporter, arg, ROOT, SITE } from './lib.mjs';

const dir = path.resolve(ROOT, arg('dir', 'dist'));
const site = arg('site', SITE).replace(/\/$/, '');
const base = arg('base', '/');
const expect = (arg('expect', '') || '').split(',').filter(Boolean);
const r = reporter(`Feeds (${path.relative(ROOT, dir) || dir})`);
const b = await launch('chromium');
const page = await b.newPage();
const parse = (xml) => page.evaluate((x) => {
  const doc = new DOMParser().parseFromString(x, 'application/xml');
  const err = doc.querySelector('parsererror');
  const all = (sel) => [...doc.getElementsByTagName(sel)].map((n) => n.textContent.trim());
  return { error: err ? err.textContent : null, root: doc.documentElement.nodeName, all: { loc: all('loc'), link: all('link'), title: all('title'), pubDate: all('pubDate'), item: doc.getElementsByTagName('item').length } };
}, xml);
const exists = async (p) => access(p).then(() => true, () => false);
const fileFor = (u) => {
  const p = new URL(u).pathname.slice(base.length - 1);
  return path.join(dir, p.endsWith('/') ? p + 'index.html' : p);
};
const prefix = site + base;

try {
  // RSS
  const rss = await parse(await readFile(path.join(dir, 'rss.xml'), 'utf8'));
  r.check(!rss.error && rss.root === 'rss', `rss.xml is well-formed RSS (${rss.error ?? 'ok'})`);
  const [channelLink, ...itemLinks] = rss.all.link;
  r.check(channelLink === prefix, `RSS channel link = ${channelLink}`);
  r.check(rss.all.item === itemLinks.length, `RSS has ${rss.all.item} item(s), each with a link`);
  r.check(itemLinks.every((l) => l.startsWith(prefix)), `all RSS item links absolute on ${prefix}`);
  r.check(rss.all.pubDate.every((d) => !Number.isNaN(Date.parse(d))), 'all RSS pubDates parse');
  for (const l of itemLinks) r.check(await exists(fileFor(l)), `RSS item resolves to a built page: ${l}`);
  r.check(itemLinks.every((l) => !/demo|draft/i.test(l)) || dir.endsWith('dist-demo'), 'no demo/draft URLs in RSS');

  // Sitemap
  const idx = await parse(await readFile(path.join(dir, 'sitemap-index.xml'), 'utf8'));
  r.check(!idx.error && idx.root === 'sitemapindex', 'sitemap-index.xml well-formed');
  r.check(idx.all.loc.length > 0 && idx.all.loc.every((l) => l.startsWith(prefix)), `sitemap index points to ${idx.all.loc.join(', ')}`);
  const locs = [];
  for (const sm of idx.all.loc) {
    const s = await parse(await readFile(path.join(dir, new URL(sm).pathname.slice(base.length - 1)), 'utf8'));
    r.check(!s.error && s.root === 'urlset', `${path.basename(sm)} well-formed`);
    locs.push(...s.all.loc);
  }
  r.check(locs.every((l) => l.startsWith(prefix)), `all ${locs.length} sitemap URLs on ${prefix}`);
  r.check(!locs.some((l) => /404/.test(l)), '404 page not in sitemap');
  r.check(!locs.some((l) => /demo|draft/i.test(l)) || dir.endsWith('dist-demo'), 'no demo/draft URLs in sitemap');
  const missing = [];
  for (const l of locs) if (!(await exists(fileFor(l)))) missing.push(l);
  r.check(missing.length === 0, `every sitemap URL has a built page ${missing.join(' ')}`);
  for (const e of expect) {
    r.check(locs.includes(prefix + e.replace(/^\//, '')), `sitemap includes ${e}`);
    r.check(itemLinks.includes(prefix + e.replace(/^\//, '')) || /projects|category/.test(e), `RSS includes ${e}`);
  }
  r.info(`sitemap: ${locs.join(' ')}`);
} finally { await b.close(); }
process.exit(r.done() ? 1 : 0);
