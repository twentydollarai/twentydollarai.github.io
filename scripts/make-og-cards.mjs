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
import { cardTemplate, fitCard } from './og-card-html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/og/benchmarks');
const require = createRequire(path.join(ROOT, 'tests/package.json'));
const pw = require('playwright');
const chromium = pw.chromium ?? pw.default.chromium;
const build = () => execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

const html = await cardTemplate(ROOT);

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
  const overflow = await fitCard(page);
  if (overflow.length) throw new Error(`${slug}: card text does not fit: ${overflow.join('; ')}`);
  const png = withPngText(await page.screenshot({ type: 'png' }), CARD_KEY, cardHash(d, videoBytes));
  await writeFile(path.join(OUT, `${slug}.png`), png);
  console.log(`public/og/benchmarks/${slug}.png  ${(png.length / 1024).toFixed(0)} KB  ${JSON.stringify(d)}`);
}
await browser.close();
await rm(tmp, { recursive: true, force: true });
build(); // so dist/ picks up the new cards and the pages point at them
