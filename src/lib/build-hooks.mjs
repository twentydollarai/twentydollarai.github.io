import { rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Post-build steps (no dependencies):
 *  1. Production builds drop dist/images/demo/ so demo images never ship.
 *  2. On a project site (basePath like '/repo/'), root-relative links written inside
 *     Markdown ("/images/blog/x.png", "/about/") get the base path added.
 */
export function buildHooks({ dropDemo, base = '/' }) {
  return {
    name: 'tda-build-hooks',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        if (dropDemo) {
          await rm(path.join(out, 'images', 'demo'), { recursive: true, force: true });
          logger.info('Removed demo images from production output.');
        }
        const prefix = base.replace(/\/$/, '');
        if (!prefix) return;
        const esc = prefix.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(\\s(?:href|src)=")/(?!/|${esc}(?:/|"))`, 'g');
        let changed = 0;
        const walk = async (d) => {
          for (const e of await readdir(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) await walk(p);
            else if (e.name.endsWith('.html')) {
              const html = await readFile(p, 'utf8');
              const next = html.replace(re, `$1${prefix}/`);
              if (next !== html) { await writeFile(p, next); changed++; }
            }
          }
        };
        await walk(out);
        logger.info(`Added base path to Markdown links in ${changed} page(s).`);
      },
    },
  };
}
