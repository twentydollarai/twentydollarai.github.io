// Copy claims: the Home, About and Benchmarks pages must not promise that the prompt is shown.
// Benchmark prompts are private; pages show only the prompt's name.
// They also must not promise pass/fail checks: benchmarks report time, tokens, cost and weekly usage.
// Checks the built pages (visible text, meta and share descriptions) and their source files
// (which also covers text that only shows in some states, like the empty Benchmarks list).
// Usage: node copy-claims.mjs [--dir=dist]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { reporter, arg, ROOT } from './lib.mjs';

const dir = path.resolve(ROOT, arg('dir', 'dist'));
const r = reporter('Copy claims (prompt)');
// "the prompt", "exact prompt", "full prompt", "word for word", unless it says only the name is shown.
const PROMISE = /\b(?:the|exact|full)\s+prompts?\b(?!\s+by name|'s name)|\bword[- ]for[- ]word\b/gi;
const PASSFAIL = /\bpass\s*\/\s*fail\b|\bpass-fail\b/gi;
const pages = [
  ['Home', 'index.html', 'src/pages/index.astro'],
  ['About', 'about/index.html', 'src/pages/about.astro'],
  ['Benchmarks', 'benchmarks/index.html', 'src/pages/benchmarks/index.astro'],
];
const textOf = (html) => [
  ...[...html.matchAll(/<meta[^>]+content="([^"]*)"/g)].map((m) => m[1]),
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '),
].join(' \n ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
for (const [name, built, src] of pages) {
  const builtText = textOf(await readFile(path.join(dir, built), 'utf8'));
  const srcText = (await readFile(path.join(ROOT, src), 'utf8')).replace(/class="[^"]*"|\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->/g, '');
  const find = (re) => [
    ...(builtText.match(re) ?? []).map((h) => `built: "${h}"`),
    ...(srcText.match(re) ?? []).map((h) => `source: "${h}"`),
  ];
  const hits = find(PROMISE);
  r.check(hits.length === 0, `${name} page doesn't promise the prompt is shown ${hits.join(', ')}`);
  const pf = find(PASSFAIL);
  r.check(pf.length === 0, `${name} page doesn't promise pass/fail checks ${pf.join(', ')}`);
}
process.exit(r.done() ? 1 : 0);
