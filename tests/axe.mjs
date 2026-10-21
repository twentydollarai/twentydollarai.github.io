// axe-core accessibility scan: prod + demo pages, light + dark, desktop + mobile.
import { AxeBuilder } from '@axe-core/playwright';
import { launch, preview, reporter, PROD_PAGES, DEMO_PAGES, PROD_PORT, DEMO_PORT } from './lib.mjs';

const r = reporter('Accessibility (axe-core, WCAG 2.1 A/AA + best-practice)');
const prod = await preview({ port: PROD_PORT });
const demo = await preview({ port: DEMO_PORT, outDir: 'dist-demo' });
const b = await launch('chromium');
let scans = 0, groups = 0;
try {
  for (const [name, base, pages] of [['prod', prod.url, PROD_PAGES], ['demo', demo.url, DEMO_PAGES]]) {
    for (const colorScheme of ['light', 'dark']) {
      for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
        const ctx = await b.newContext({ viewport, colorScheme });
        const p = await ctx.newPage();
        for (const path of pages) {
          await p.goto(base + path, { waitUntil: 'load' });
          const res = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
          scans++;
          for (const v of res.violations) {
            groups++;
            r.info(`${name} ${colorScheme} ${viewport.width} ${path}: [${v.impact}] ${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(' ')}`);
          }
        }
        await ctx.close();
      }
    }
  }
} finally { await b.close(); prod.stop(); demo.stop(); }
r.check(groups === 0, `${scans} page scans, ${groups} violation groups`);
process.exit(r.done() ? 1 : 0);
