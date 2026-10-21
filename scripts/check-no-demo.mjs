// Fails if any demo/draft content leaked into the production build (dist/).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');
const needles = ['demo-example', 'Demo content, not real data', 'Example Model', '/images/demo/', 'data-demo'];
const files = [];
const walk = async (d) => {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name === 'demo') files.push(p + '/'); await walk(p); }
    else files.push(p);
  }
};
await walk(dist);
let hits = 0;
for (const f of files) {
  if (f.endsWith('/')) { console.log(`LEAK  directory ${path.relative(dist, f)}`); hits++; continue; }
  if (!/\.(html|xml|js|css|json|txt)$/.test(f)) continue;
  const text = await readFile(f, 'utf8');
  for (const n of needles) if (text.includes(n)) { console.log(`LEAK  "${n}" in ${path.relative(dist, f)}`); hits++; }
}
console.log(hits ? `\n${hits} demo leak(s) found in ${dist}` : `No demo content found in ${files.length} files under ${path.relative(process.cwd(), dist) || dist}`);
process.exit(hits ? 1 : 0);
