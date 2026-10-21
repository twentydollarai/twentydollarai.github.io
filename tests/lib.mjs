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
  return { url: `http://localhost:${port}`, stop: () => server.close() };
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
