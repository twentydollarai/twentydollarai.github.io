// Shared helpers for the verification scripts.
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://twentydollarai.github.io';
export const PROD_PORT = 4321;
export const DEMO_PORT = 4322;

/** Pages that exist in the production build (no published content yet). */
export const PROD_PAGES = ['/', '/blog/', '/benchmarks/', '/experiments/', '/projects/', '/about/', '/404.html'];
/** Pages that exist only in the demo build. */
export const DEMO_PAGES = [
  '/', '/blog/', '/blog/demo-example-post/', '/blog/category/example-category/', '/benchmarks/',
  '/benchmarks/demo-example-benchmark/', '/experiments/', '/experiments/demo-example-experiment/', '/projects/', '/about/',
];

/** Launch a browser. Chromium uses CHROME_PATH if set, otherwise Playwright's bundled build. */
export function launch(name = 'chromium') {
  const type = { chromium, firefox, webkit }[name];
  if (!type) throw new Error(`Unknown browser ${name}`);
  const opts = name === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  return type.launch(opts);
}

export function run(cmd, args, { cwd = ROOT, env = {} } = {}) {
  const r = spawnSync(cmd, args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

export function astroBin(root = ROOT) {
  return path.join(root, 'node_modules', '.bin', 'astro');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.txt': 'text/plain', '.mp4': 'video/mp4',
};

/**
 * Serve a build directory the way GitHub Pages does: /dir -> 301 /dir/, /dir/ -> dir/index.html,
 * unknown paths -> 404.html with HTTP 404. Several can run at once (astro preview allows one per project).
 */
export async function serve({ dir, port, basePath = '/' }) {
  const root = path.resolve(dir);
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith(basePath)) return notFound(res);
    const rel = p.slice(basePath.length);
    let file = path.join(root, rel);
    if (!file.startsWith(root)) return notFound(res);
    try {
      let st = await stat(file);
      if (st.isDirectory()) {
        if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
        file = path.join(file, 'index.html');
        st = await stat(file);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      notFound(res);
    }
  });
  async function notFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(path.join(root, '404.html')).catch(() => 'Not found'));
  }
  await new Promise((ok) => server.listen(port, '127.0.0.1', ok));
  // stop() also drops kept-alive sockets, so a later server on the same port never gets requests
  // meant for it answered by this one (that made the base-path demo crawl flaky).
  return { url: `http://localhost:${port}`, stop: () => { server.closeAllConnections(); server.close(); } };
}

/** Start `astro preview` (only one per project at a time) and wait until it answers. */
export async function astroPreview({ root = ROOT, outDir = 'dist', port, basePath = '/' }) {
  const child = spawn(astroBin(root), ['preview', '--port', String(port), '--outDir', outDir], { cwd: root, stdio: 'ignore' });
  const url = `http://localhost:${port}${basePath}`;
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(url); if (r.ok) return { url: `http://localhost:${port}`, stop: () => child.kill() }; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error(`astro preview on ${port} did not start (is another astro preview running? try: npx astro preview stop)`);
}

/** Static server for a build directory relative to `root`. */
export function preview({ root = ROOT, outDir = 'dist', port, basePath = '/' }) {
  return serve({ dir: path.join(root, outDir), port, basePath });
}

export function reporter(title) {
  let pass = 0, fail = 0;
  console.log(`\n# ${title}`);
  return {
    check(ok, msg) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); ok ? pass++ : fail++; return ok; },
    info(msg) { console.log(`      ${msg}`); },
    done() { console.log(`-- ${title}: ${pass} passed, ${fail} failed`); return fail; },
  };
}

export function arg(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : fallback;
}

// Runs in the page (pass to page.evaluate). Finds the largest empty rectangle inside `rootSel`
// (from its top to the bottom of `endSel`, across its full width), on an 8px grid. "Occupied" means
// covered by visible text, a video, an image or a table row. Returns the largest empty rectangle by
// area and the widest empty rectangle that is at least `minH` px tall.
export function emptyRegionProbe({ rootSel, endSel, minH }) {
  const root = document.querySelector(rootSel).getBoundingClientRect();
  const end = document.querySelector(endSel).getBoundingClientRect();
  const G = 8, x0 = root.left, y0 = root.top, W = Math.floor(root.width / G), H = Math.ceil((end.bottom - root.top) / G);
  const occ = Array.from({ length: H }, () => new Uint8Array(W));
  const mark = (r) => {
    if (r.width < 2 || r.height < 2) return;
    for (let y = Math.max(0, Math.floor((r.top - y0) / G)); y < Math.min(H, Math.ceil((r.bottom - y0) / G)); y++)
      for (let x = Math.max(0, Math.floor((r.left - x0) / G)); x < Math.min(W, Math.ceil((r.right - x0) / G)); x++) occ[y][x] = 1;
  };
  const scope = document.querySelector(rootSel);
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (el.closest('.visually-hidden') || getComputedStyle(el).visibility === 'hidden') continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) mark(r);
  }
  scope.querySelectorAll('video, img, iframe, tr').forEach((e) => mark(e.getBoundingClientRect()));
  const heights = new Array(W).fill(0);
  let best = { w: 0, h: 0, area: 0 }, widest = { w: 0, h: 0 };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) heights[x] = occ[y][x] ? 0 : heights[x] + 1;
    const stack = [];
    for (let x = 0; x <= W; x++) {
      const h = x === W ? 0 : heights[x];
      let start = x;
      while (stack.length && stack[stack.length - 1][1] >= h) {
        const [s, sh] = stack.pop();
        const w = (x - s) * G, hh = sh * G;
        if (w * hh > best.area) best = { w, h: hh, area: w * hh, x: Math.round(x0 + s * G), y: Math.round(y0 + (y - sh + 1) * G) };
        if (hh >= minH && w > widest.w) widest = { w, h: hh, x: Math.round(x0 + s * G), y: Math.round(y0 + (y - sh + 1) * G) };
        start = s;
      }
      stack.push([start, h]);
    }
  }
  return { gridW: W * G, largest: best, widestTall: widest };
}
