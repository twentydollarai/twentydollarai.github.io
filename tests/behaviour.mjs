// Behaviour checks: navigation, theme, mobile menu, skip link, 404, responsive overflow.
// Needs: npm run build (dist/) and npm run build:demo (dist-demo/) in the project root.
// Usage: node behaviour.mjs [--browser=chromium|firefox|webkit]
import { launch, preview, astroPreview, reporter, arg, PROD_PAGES, DEMO_PAGES, PROD_PORT, DEMO_PORT, emptyRegionProbe } from './lib.mjs';

const browserName = arg('browser', 'chromium');
const r = reporter(`Behaviour (${browserName})`);
const prod = await preview({ port: PROD_PORT });
const demo = await preview({ port: DEMO_PORT, outDir: 'dist-demo' });
const b = await launch(browserName);
const touch = browserName !== 'firefox'; // Firefox in Playwright has no isMobile emulation

try {
  // Navigation: every header link goes to the right page and marks itself current.
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    await p.goto(prod.url + '/');
    const links = await p.$$eval('#site-nav a', (as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]));
    r.check(links.length === 5, `header has 5 nav links (${links.map((l) => l[0]).join(', ')})`);
    for (const [label, href] of links) {
      await p.goto(prod.url + '/');
      await p.click(`#site-nav a[href="${href}"]`);
      await p.waitForURL(`**${href}`);
      const cur = await p.$eval('#site-nav a[aria-current="page"]', (a) => a.getAttribute('href')).catch(() => null);
      r.check(new URL(p.url()).pathname === href && cur === href, `nav "${label}" -> ${href}, aria-current set`);
    }
    await p.click('.brand');
    r.check(new URL(p.url()).pathname === '/', 'logo links to homepage');
    await p.context().close();
  }

  // Theme: system preference, toggle, persistence, stored choice beats system.
  const bg = (p) => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  for (const scheme of ['light', 'dark']) {
    const p = await (await b.newContext({ colorScheme: scheme })).newPage();
    await p.goto(prod.url + '/');
    const want = scheme === 'dark' ? 'rgb(18, 20, 18)' : 'rgb(250, 248, 243)';
    r.check((await bg(p)) === want, `prefers-color-scheme: ${scheme} -> background ${want}`);
    r.check((await p.getAttribute('[data-theme-toggle]', 'aria-pressed')) === String(scheme === 'dark'), `toggle aria-pressed reflects system ${scheme}`);
    await p.context().close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
    const p = await ctx.newPage();
    await p.goto(prod.url + '/');
    await p.click('[data-theme-toggle]');
    r.check((await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark' && (await bg(p)) === 'rgb(18, 20, 18)', 'toggle switches to dark');
    await p.goto(prod.url + '/about/');
    r.check((await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'dark choice persists to the next page');
    await p.reload();
    r.check((await bg(p)) === 'rgb(18, 20, 18)', 'dark choice persists after reload');
    await p.click('[data-theme-toggle]');
    r.check((await p.evaluate(() => localStorage.getItem('theme'))) === 'light', 'toggle back stores light');
    await ctx.close();
    const ctx2 = await b.newContext({ colorScheme: 'dark' });
    await ctx2.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch {} });
    const p2 = await ctx2.newPage();
    await p2.goto(prod.url + '/');
    r.check((await bg(p2)) === 'rgb(250, 248, 243)', 'stored light choice overrides system dark');
    await ctx2.close();
  }

  // Keyboard: skip link.
  {
    const p = await (await b.newContext()).newPage();
    await p.goto(prod.url + '/about/');
    await p.keyboard.press('Tab');
    const t = await p.evaluate(() => document.activeElement?.textContent?.trim());
    r.check(t === 'Skip to content', `first Tab focuses skip link (got "${t}")`);
    await p.keyboard.press('Enter');
    r.check((await p.evaluate(() => location.hash)) === '#main', 'skip link moves to #main');
    await p.context().close();
  }

  // Mobile menu.
  {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, ...(touch ? { isMobile: true, hasTouch: true } : {}) })).newPage();
    await p.goto(prod.url + '/');
    r.check(!(await p.isVisible('#site-nav a')), 'mobile: nav collapsed by default');
    await p.click('[data-menu-toggle]');
    r.check((await p.getAttribute('[data-menu-toggle]', 'aria-expanded')) === 'true' && (await p.isVisible('#site-nav a')), 'mobile: menu opens, aria-expanded=true');
    await p.keyboard.press('Escape');
    r.check((await p.getAttribute('[data-menu-toggle]', 'aria-expanded')) === 'false' && !(await p.isVisible('#site-nav a')), 'mobile: Escape closes menu');
    await p.click('[data-menu-toggle]');
    await p.click('#site-nav a[href="/about/"]');
    await p.waitForURL('**/about/');
    r.check(true, 'mobile: menu link navigates');
    await p.context().close();
  }
  {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })).newPage();
    await p.goto(prod.url + '/');
    r.check(await p.isVisible('#site-nav a'), 'no JavaScript: nav links still visible on mobile');
    r.check(!(await p.isVisible('[data-theme-toggle]')), 'no JavaScript: non-working theme toggle hidden');
    await p.context().close();
  }

  // 404.
  {
    const p = await (await b.newContext()).newPage();
    const res = await p.goto(prod.url + '/this-page-does-not-exist/');
    r.check(res.status() === 404 && /No receipt for that page/.test(await p.textContent('h1')), `unknown route -> HTTP ${res.status()} with 404 page`);
    const d = await p.goto(prod.url + '/benchmarks/demo-example-benchmark/');
    r.check(d.status() === 404, `prod: demo entry URL -> HTTP ${d.status()}`);
    const ap = await astroPreview({ port: 4327 });
    try {
      const a = await p.goto(ap.url + '/this-page-does-not-exist/');
      r.check(a.status() === 404 && /No receipt for that page/.test(await p.textContent('h1')), `astro preview: unknown route -> HTTP ${a.status()} with 404 page`);
    } finally { ap.stop(); }
    await p.context().close();
  }

  // Responsive: no horizontal overflow, console errors.
  for (const width of [320, 390, 768, 1280, 1920]) {
    const ctx = await b.newContext({ viewport: { width, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const bad = [];
    for (const [base, pages] of [[prod.url, PROD_PAGES], [demo.url, DEMO_PAGES]]) {
      for (const path of pages) {
        await p.goto(base + path, { waitUntil: 'load' });
        const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (o > 0) bad.push(`${path} (+${o}px)`);
      }
    }
    r.check(bad.length === 0, `${width}px: no horizontal overflow on ${PROD_PAGES.length + DEMO_PAGES.length} pages ${bad.join(', ')}`);
    r.check(errors.length === 0, `${width}px: no console/page errors ${errors.slice(0, 3).join('; ')}`);
    await ctx.close();
  }

  // Benchmark pages (production build): one-screen layout and the autoplaying evidence clip.
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(prod.url + '/benchmarks/');
    const pages = [...new Set(await p.$$eval('a[href^="/benchmarks/"]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => /^\/benchmarks\/[^/]+\/$/.test(h))))];
    r.check(pages.length > 0, `production build has benchmark pages to check (${pages.length})`);
    let videos = 0;
    for (const path of pages) {
      await p.goto(prod.url + path, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      const fit = await p.evaluate(() => {
        const h1 = document.querySelector('h1');
        const lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
        const take = [...document.querySelectorAll('section[aria-labelledby="take-title"] li, section[aria-labelledby="take-title"] p')].pop();
        const results = document.querySelector('section[aria-labelledby="results-title"]');
        return { lines, takeBottom: take ? take.getBoundingClientRect().bottom : null, resultsBottom: results.getBoundingClientRect().bottom,
          chips: document.querySelectorAll('.bench .chip').length };
      });
      r.check(fit.lines === 1, `1280x800 ${path}: title on one line (${fit.lines})`);
      r.check(fit.resultsBottom <= 800 && (fit.takeBottom === null || fit.takeBottom <= 800 - 40),
        `1280x800 ${path}: results and the end of My take fit on the first screen with 40px spare (take ends ${fit.takeBottom?.toFixed(0)})`);
      r.check(fit.chips === 0, `${path}: no label chips on benchmark pages`);
      // Balanced wide layout (owner: "a lot of white space").
      const lay = await p.evaluate(() => {
        const bb = (s) => document.querySelector(s)?.getBoundingClientRect();
        const art = bb('article.bench'), foot = bb('.bench-foot'), x = bb('.follow-line'), back = bb('.back-link');
        const sec = bb('.bench-results'), table = bb('.bench-results table');
        const val = document.querySelector('.bench-results td.value');
        const media = [...document.querySelectorAll('.bench-evidence video, .bench-evidence img, .bench-evidence iframe')].map((e) => e.getBoundingClientRect());
        const area = (r) => r.width * r.height;
        const others = [...document.querySelectorAll('article.bench h1, article.bench table, article.bench .prose, article.bench p, article.bench ul')].map((e) => area(e.getBoundingClientRect()));
        return { left: art.left, right: innerWidth - art.right, width: art.width, footBottom: foot.bottom, xTop: x.top, backTop: back.top,
          tableFull: table && sec ? table.width / sec.width : null, valueRight: val ? getComputedStyle(val).textAlign : null,
          mediaArea: media.length ? Math.max(...media.map(area)) : null, otherMax: Math.max(...others) };
      });
      r.check(Math.abs(lay.left - lay.right) <= 2 && lay.width >= 1080 && lay.width <= 1160,
        `1280x800 ${path}: centered container ~1120px with equal side margins (${lay.width.toFixed(0)}px, ${lay.left.toFixed(0)}/${lay.right.toFixed(0)})`);
      const spare = 800 - lay.footBottom;
      r.check(spare >= 24 && spare <= 60, `1280x800 ${path}: content through the X line ends with 24-60px spare (${spare.toFixed(1)}px)`);
      r.check(Math.abs(lay.xTop - lay.backTop) <= 6, `${path}: X line and back link share one line`);
      r.check(lay.tableFull === null || (lay.tableFull >= 0.98 && lay.valueRight === 'right'), `${path}: results table fills its column, values right-aligned`);
      r.check(lay.mediaArea === null || lay.mediaArea > lay.otherMax, `${path}: the output (video/image) is the largest element on the page`);
      const empty = await p.evaluate(emptyRegionProbe, { rootSel: 'article.bench', endSel: '.bench-foot', minH: 96 });
      r.check(empty.widestTall.w < 256, `1280x800 ${path}: no empty region 96px+ tall wider than 20% of the screen (widest ${empty.widestTall.w}x${empty.widestTall.h})`);
      const clips = await p.$$('video[src^="/"]');
      for (let i = 0; i < clips.length; i++) {
        videos++;
        const a = await p.evaluate((i) => { const v = document.querySelectorAll('video[src^="/"]')[i];
          return { autoplayAttr: v.hasAttribute('autoplay'), flagged: v.hasAttribute('data-autoplay'), muted: v.muted && v.hasAttribute('muted'), loop: v.loop,
            inline: v.hasAttribute('playsinline'), controls: v.controls, poster: !!v.getAttribute('poster'), width: v.getBoundingClientRect().width }; }, i);
        r.check(a.flagged && a.muted && a.loop && a.inline && a.controls && a.poster && !a.autoplayAttr,
          `${path} video ${i + 1}: muted, loop, playsinline, poster and controls; started by script, not the autoplay attribute`);
        r.check(a.width >= 600 && a.width <= 700, `${path} video ${i + 1}: shown 600-700px wide at 1280, filling its column (${a.width.toFixed(0)}px)`);
        const playing = await p.waitForFunction((i) => { const v = document.querySelectorAll('video[src^="/"]')[i]; return v.dataset.motion === 'auto' && !v.paused && v.currentTime > 0.2; }, i, { timeout: 8000 }).then(() => true, () => false);
        r.check(playing, `${path} video ${i + 1}: plays by itself with no click`);
      }
      const rctx = await b.newContext({ reducedMotion: 'reduce' });
      const rp = await rctx.newPage();
      await rp.goto(prod.url + path, { waitUntil: 'load' });
      await rp.waitForTimeout(1000);
      const still = await rp.$$eval('video[src^="/"]', (vs) => vs.map((v) => ({ motion: v.dataset.motion, paused: v.paused, t: v.currentTime, controls: v.controls })));
      r.check(still.every((v) => v.motion === 'reduced' && v.paused && v.t === 0 && v.controls),
        `${path}: prefers-reduced-motion keeps the clip paused on its poster, with controls (${still.length} clip(s))`);
      await rctx.close();
      if (touch) {
        const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        const mp = await mctx.newPage();
        await mp.goto(prod.url + path, { waitUntil: 'load' });
        const mo = await mp.evaluate(() => {
          const bb = (s) => document.querySelector(s)?.getBoundingClientRect();
          return { rb: bb('section[aria-labelledby="results-title"]').bottom, h1: bb('h1').bottom, res: bb('.bench-results').top,
            vid: bb('.bench-evidence')?.top ?? null, take: bb('.bench-take')?.top ?? null };
        });
        r.check(mo.rb <= 844, `390x844 ${path}: results on the first screen (ends ${mo.rb.toFixed(0)})`);
        r.check(mo.h1 <= mo.res && (mo.vid === null || mo.res < mo.vid) && (mo.vid === null || mo.take === null || mo.vid < mo.take),
          `390x844 ${path}: stacks title, results, output, my take`);
        await mctx.close();
      }
    }
    r.check(videos > 0, `checked autoplay on ${videos} benchmark evidence clip(s)`);
    await ctx.close();
  }

  // Demo banner visible in demo build.
  {
    const p = await (await b.newContext()).newPage();
    await p.goto(demo.url + '/benchmarks/demo-example-benchmark/');
    r.check(/Demo content, not real data/.test((await p.textContent('.demo-banner')) ?? ''), 'demo build: demo banner shown on demo benchmark');
    await p.context().close();
  }
} finally {
  await b.close();
  prod.stop();
  demo.stop();
}
process.exit(r.done() ? 1 : 0);
