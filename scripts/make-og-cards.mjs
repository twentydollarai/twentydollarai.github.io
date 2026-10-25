// Makes the 1200x630 share card (og:image / twitter:image) for every published benchmark.
// Run after adding or changing a benchmark:  node scripts/make-og-cards.mjs
// Needs: npm ci here and in tests/ (it uses the tests' Playwright Chromium), and ffmpeg for the video still.
// Writes public/og/benchmarks/<slug>.png and commits nothing itself. Commit the PNGs with the benchmark.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, readdir, mkdir, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cardData, cardHash, withPngText, CARD_KEY, toolOf, planLine, cardResult } from './og-card-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/og/benchmarks');
const require = createRequire(path.join(ROOT, 'tests/package.json'));
const pw = require('playwright');
const chromium = pw.chromium ?? pw.default.chromium;
const fontsrc = (pkg, file) => readFile(path.join(ROOT, 'node_modules/@fontsource', pkg, 'files', file)).then((b) => `data:font/woff2;base64,${b.toString('base64')}`);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const build = () => execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

// Read colors from the site CSS (light theme) so the card matches the site.
const css = await readFile(path.join(ROOT, 'src/styles/global.css'), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const color = (name) => root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))[1];
const C = { paper: color('paper'), ink: color('ink'), ink2: color('ink-2'), line: color('line'), green: color('green') };
const fonts = {
  inter400: await fontsrc('inter', 'inter-latin-400-normal.woff2'),
  inter600: await fontsrc('inter', 'inter-latin-600-normal.woff2'),
  inter700: await fontsrc('inter', 'inter-latin-700-normal.woff2'),
  mono600: await fontsrc('ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff2'),
};
const logo = `data:image/svg+xml;base64,${(await readFile(path.join(ROOT, 'public/favicon.svg'))).toString('base64')}`;
const siteName = (await readFile(path.join(ROOT, 'src/site.config.mjs'), 'utf8')).match(/name:\s*'([^']+)'/)[1];

const html = (d, still) => {
  const tool = toolOf(d.cardTitle);
  const results = d.results.map(cardResult);
  // Four results or fewer: 2 per row at full size. Five or six: 3 per row, a little smaller.
  const cols = results.length > 4 ? 3 : results.length > 1 ? 2 : 1;
  const big = cols < 3;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:400;src:url(${fonts.inter400}) format('woff2')}
@font-face{font-family:Inter;font-weight:600;src:url(${fonts.inter600}) format('woff2')}
@font-face{font-family:Inter;font-weight:700;src:url(${fonts.inter700}) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:600;src:url(${fonts.mono600}) format('woff2')}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:${C.paper};color:${C.ink};font-family:Inter,sans-serif;padding:40px 60px 36px;display:flex;flex-direction:column}
/* Top: site name, title and plan on the left; the output still on the right. */
.top{display:flex;gap:44px;flex:1;min-height:0}
.text{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between}
.site{display:flex;align-items:center;gap:12px;font-weight:600;font-size:30px;letter-spacing:-0.01em}
.site img{width:42px;height:42px}
h1{font-weight:700;font-size:56px;line-height:1.06;letter-spacing:-0.02em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.plan{font-size:38px;color:${C.ink2};margin-top:10px}
.still{height:100%;flex:none;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:${C.line}}
.still img{width:100%;height:100%;object-fit:cover;display:block}
/* Bottom: the measured results, two per row, label above value. Sized to read at ~350px wide (X's phone feed). */
.results{display:grid;grid-template-columns:repeat(${cols},1fr);column-gap:${big ? 56 : 40}px;margin-top:16px}
.cell{border-top:2px solid ${C.line};padding:10px 0 8px;min-width:0}
.label{font-size:${big ? 38 : 32}px;color:${C.ink2};line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.value{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:${big ? 58 : 44}px;line-height:1.1;white-space:nowrap}
/* "Not the subscription price", under an API-equivalent cost. */
.note{font-size:${big ? 32 : 26}px;line-height:1.1;color:${C.ink2};font-weight:600;white-space:nowrap;margin-top:2px}
</style></head><body>
<div class="top">
  <div class="text"><div class="site"><img src="${logo}" alt="">${esc(siteName)}</div>
  <div><h1>${esc(d.cardTitle)}</h1>
  <div class="plan">${d.models.length === 1 ? esc(planLine(d.models[0].plan, tool)) : d.models.map((m) => `${esc(m.name)} · ${esc(planLine(m.plan, tool))}`).join('<br>')}</div></div></div>
  ${still ? `<div class="still"><img src="${still}" alt=""></div>` : ''}
</div>
${results.length ? `<div class="results">${results.map((r) => `<div class="cell"><div class="label">${esc(r.label)}</div><div class="value">${esc(r.value)}</div>${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}</div>`).join('')}</div>` : ''}
</body></html>`;
};

build();
const dist = path.join(ROOT, 'dist/benchmarks');
const slugs = (await readdir(dist, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
await mkdir(OUT, { recursive: true });
const tmp = await mkdtemp(path.join(tmpdir(), 'og-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const slug of slugs) {
  const d = cardData(await readFile(path.join(dist, slug, 'index.html'), 'utf8'));
  let still = null, videoBytes = null;
  if (d.video) {
    const src = path.join(ROOT, 'public', decodeURIComponent(d.video));
    videoBytes = await readFile(src);
    try {
      // A frame from the middle of the clip.
      const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).toString());
      const frame = path.join(tmp, `${slug}.png`);
      execFileSync('ffmpeg', ['-v', 'error', '-ss', String((dur / 2).toFixed(2)), '-i', src, '-frames:v', '1', '-y', frame]);
      still = `data:image/png;base64,${(await readFile(frame)).toString('base64')}`;
    } catch (e) { console.warn(`No video still for ${slug} (${e.message.split('\n')[0]}); card made without it.`); }
  }
  await page.setContent(html(d, still), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = withPngText(await page.screenshot({ type: 'png' }), CARD_KEY, cardHash(d, videoBytes));
  await writeFile(path.join(OUT, `${slug}.png`), png);
  console.log(`public/og/benchmarks/${slug}.png  ${(png.length / 1024).toFixed(0)} KB  ${JSON.stringify(d)}`);
}
await browser.close();
await rm(tmp, { recursive: true, force: true });
build(); // so dist/ picks up the new cards and the pages point at them
