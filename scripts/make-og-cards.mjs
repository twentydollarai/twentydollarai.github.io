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
import { cardData, cardHash, withPngText, CARD_KEY } from './og-card-data.mjs';

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

const html = (d, still) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:400;src:url(${fonts.inter400}) format('woff2')}
@font-face{font-family:Inter;font-weight:600;src:url(${fonts.inter600}) format('woff2')}
@font-face{font-family:Inter;font-weight:700;src:url(${fonts.inter700}) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:600;src:url(${fonts.mono600}) format('woff2')}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:${C.paper};color:${C.ink};font-family:Inter,sans-serif;padding:52px 64px 48px;display:flex;flex-direction:column}
.site{display:flex;align-items:center;gap:14px;font-weight:600;font-size:30px;letter-spacing:-0.01em}
.site img{width:46px;height:46px}
.top{display:flex;gap:48px;margin-top:34px;flex:1;min-height:0}
.text{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:18px}
h1{font-weight:700;font-size:62px;line-height:1.08;letter-spacing:-0.02em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.plan{font-size:34px;color:${C.ink2}}
.still{width:${still ? 520 : 0}px;flex:none;align-self:center;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:${C.line}}
.still img{width:100%;height:100%;object-fit:cover;display:block}
.results{display:grid;grid-template-columns:repeat(${Math.min(4, Math.max(1, d.results.length))},1fr);gap:18px 28px;border-top:2px solid ${C.line};padding-top:22px;margin-top:30px}
.label{font-size:24px;color:${C.ink2};line-height:1.2}
.value{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:46px;line-height:1.1;margin-top:6px;white-space:nowrap}
</style></head><body>
<div class="site"><img src="${logo}" alt="">${esc(siteName)}</div>
<div class="top">
  <div class="text"><h1>${esc(d.cardTitle)}</h1>
  <div class="plan">${d.models.length === 1 ? esc(d.models[0].plan) : d.models.map((m) => `${esc(m.name)} · ${esc(m.plan)}`).join('<br>')}</div></div>
  ${still ? `<div class="still"><img src="${still}" alt=""></div>` : ''}
</div>
${d.results.length ? `<div class="results">${d.results.map((r) => `<div><div class="label">${esc(r.label)}</div><div class="value">${esc(r.value)}</div></div>`).join('')}</div>` : ''}
</body></html>`;

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
