// Homepage screenshots of the production build in Chromium, Firefox and WebKit.
// Usage: node screenshots.mjs [--out=/path/to/dir]   (default: verification/screenshots)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, launch, preview, arg } from './lib.mjs';

const OUT = path.resolve(arg('out', path.join(ROOT, 'verification', 'screenshots')));
await mkdir(OUT, { recursive: true });
const srv = await preview({ port: 4326 });
const shots = [
  ['chromium', 'home-desktop-light-chromium.png', { viewport: { width: 1280, height: 800 }, colorScheme: 'light' }],
  ['chromium', 'home-desktop-dark-chromium.png', { viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }],
  ['chromium', 'home-mobile-light-chromium.png', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' }],
  ['firefox', 'home-desktop-light-firefox.png', { viewport: { width: 1280, height: 800 }, colorScheme: 'light' }],
  ['firefox', 'home-mobile-light-firefox.png', { viewport: { width: 390, height: 844 }, colorScheme: 'light' }],
  ['webkit', 'home-desktop-light-webkit.png', { viewport: { width: 1280, height: 800 }, colorScheme: 'light' }],
  ['webkit', 'home-mobile-dark-webkit.png', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' }],
];
try {
  for (const [browser, file, opts] of shots) {
    const b = await launch(browser);
    const p = await (await b.newContext(opts)).newPage();
    await p.goto(srv.url + '/', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, file), fullPage: true });
    await b.close();
    console.log(`saved ${path.join(OUT, file)}`);
  }
} finally { srv.stop(); }
