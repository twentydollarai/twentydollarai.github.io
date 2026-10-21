// Crawls every internal link/asset of the prod and demo builds with linkinator.
// External links are listed, not fetched (run with --external to fetch them too).
import { LinkChecker } from 'linkinator';
import { preview, reporter, PROD_PORT, DEMO_PORT } from './lib.mjs';

const external = process.argv.includes('--external');
const r = reporter('Links (linkinator)');
const prod = await preview({ port: PROD_PORT });
const demo = await preview({ port: DEMO_PORT, outDir: 'dist-demo' });
try {
  for (const [name, base] of [['prod', prod.url], ['demo', demo.url]]) {
    const ext = new Set();
    const res = await new LinkChecker().check({
      path: base + '/', recurse: true, timeout: 15000,
      linksToSkip: async (link) => { if (!link.startsWith(base)) { ext.add(link); return !external; } return false; },
    });
    const broken = res.links.filter((l) => l.state === 'BROKEN');
    broken.forEach((l) => r.info(`BROKEN ${l.status} ${l.url} <- ${l.parent}`));
    const checked = res.links.filter((l) => l.state !== 'SKIPPED').length;
    r.check(broken.length === 0, `${name}: ${checked} links checked, ${broken.length} broken`);
    r.info(`${name} external links (${ext.size}): ${[...ext].sort().join(' ')}`);
  }
} finally { prod.stop(); demo.stop(); }
process.exit(r.done() ? 1 : 0);
