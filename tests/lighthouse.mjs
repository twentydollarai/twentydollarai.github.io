// Lighthouse on the production build (astro preview), desktop + mobile presets.
// Writes verification/lighthouse/: summary.json, summary.md, full reports (*.json.gz), and HTML for the homepage.
import { mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { ROOT, astroPreview, reporter } from './lib.mjs';

const OUT = path.join(ROOT, 'verification', 'lighthouse');
const PAGES = ['/', '/blog/', '/about/', '/404.html'];
const r = reporter('Lighthouse');
await mkdir(OUT, { recursive: true });
const srv = await astroPreview({ port: 4325 });
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});
const rows = [];
try {
  for (const formFactor of ['desktop', 'mobile']) {
    for (const page of PAGES) {
      const res = await lighthouse(srv.url + page, { port: chrome.port, output: ['json', 'html'], logLevel: 'error' },
        formFactor === 'desktop' ? desktopConfig : undefined);
      const lhr = res.lhr;
      const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
      const failing = Object.values(lhr.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable')
        .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ''}`);
      const row = {
        page, formFactor, performance: score('performance'), accessibility: score('accessibility'),
        bestPractices: score('best-practices'), seo: score('seo'),
        fcp: lhr.audits['first-contentful-paint'].displayValue, lcp: lhr.audits['largest-contentful-paint'].displayValue,
        cls: lhr.audits['cumulative-layout-shift'].displayValue, tbt: lhr.audits['total-blocking-time'].displayValue,
        runWarnings: lhr.runWarnings, failingAudits: failing, lighthouseVersion: lhr.lighthouseVersion,
      };
      rows.push(row);
      const slug = `${formFactor}-${page === '/' ? 'home' : page.replace(/[/.]/g, '')}`;
      await writeFile(path.join(OUT, `${slug}.json.gz`), gzipSync(res.report[0]));
      if (page === '/') await writeFile(path.join(OUT, `${slug}.html`), res.report[1]);
      console.log(`${formFactor.padEnd(7)} ${page.padEnd(10)} P${row.performance} A${row.accessibility} BP${row.bestPractices} SEO${row.seo}  ${failing.join(', ')}`);
    }
  }
} finally { await chrome.kill(); srv.stop(); }
await writeFile(path.join(OUT, 'summary.json'), JSON.stringify(rows, null, 2));
const md = ['| Page | Preset | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |', '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((x) => `| ${x.page} | ${x.formFactor} | ${x.performance} | ${x.accessibility} | ${x.bestPractices} | ${x.seo} | ${x.fcp} | ${x.lcp} | ${x.cls} | ${x.tbt} |`)].join('\n');
await writeFile(path.join(OUT, 'summary.md'), `Lighthouse ${rows[0]?.lighthouseVersion} on local astro preview (production build).\n\n${md}\n`);
r.check(rows.length === PAGES.length * 2, `${rows.length} Lighthouse runs completed`);
process.exit(r.done() ? 1 : 0);
