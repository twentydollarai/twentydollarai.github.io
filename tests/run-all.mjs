// Runs every verification step in order and prints a summary.
// Prerequisite: npm ci in the project root and in tests/, plus `npx playwright install chromium firefox webkit`.
// Usage: node run-all.mjs [--skip-lighthouse] [--skip-browsers]
import { ROOT, run } from './lib.mjs';

const skip = (f) => process.argv.includes(f);
const steps = [
  ['schema tests', 'npm', ['run', 'test:schema'], ROOT],
  ['astro check', 'npm', ['run', 'check'], ROOT],
  ['production build', 'npm', ['run', 'build'], ROOT],
  ['no demo content in dist', 'node', ['scripts/check-no-demo.mjs'], ROOT],
  ['demo build (dist-demo/)', 'npm', ['run', 'build:demo'], ROOT],
  ['behaviour (chromium)', 'node', ['behaviour.mjs', '--browser=chromium']],
  ...(skip('--skip-browsers') ? [] : [
    ['behaviour (firefox)', 'node', ['behaviour.mjs', '--browser=firefox']],
    ['behaviour (webkit)', 'node', ['behaviour.mjs', '--browser=webkit']],
  ]),
  ['axe accessibility', 'node', ['axe.mjs']],
  ['links', 'node', ['links.mjs']],
  ['RSS + sitemap', 'node', ['feeds.mjs']],
  ['share images (og:image)', 'node', ['og-cards.mjs']],
  ['copy claims (prompt)', 'node', ['copy-claims.mjs']],
  ['security review', 'node', ['security.mjs']],
  ['publishing workflow', 'node', ['test-publishing.mjs']],
  ['GitHub Pages URL structure', 'node', ['base-path.mjs']],
  ...(skip('--skip-lighthouse') ? [] : [['lighthouse', 'node', ['lighthouse.mjs']]]),
];
const results = [];
for (const [name, cmd, args, cwd] of steps) {
  const t = Date.now();
  const res = run(cmd, args, { cwd: cwd ?? `${ROOT}/tests` });
  process.stdout.write(res.out);
  results.push([name, res.code === 0, ((Date.now() - t) / 1000).toFixed(1)]);
  if (res.code !== 0 && ['production build', 'demo build (dist-demo/)'].includes(name)) break;
}
console.log('\n=== SUMMARY ===');
for (const [n, ok, s] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${n} (${s}s)`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
