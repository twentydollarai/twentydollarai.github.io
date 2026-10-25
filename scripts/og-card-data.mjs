// Shared by scripts/make-og-cards.mjs (writes the share cards) and tests/og-cards.mjs (checks them).
// Card data is read from the BUILT benchmark page, so the card shows exactly what the page shows.
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';

const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();

/** Title, plan(s), measured results and output video of one built benchmark page. */
export function cardData(html) {
  const title = decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]);
  // "Model in Tool: Prompt name" → the card shows the part before ": " (model + tool).
  const cardTitle = cardTitleOf(title);
  const models = [...html.matchAll(/<li class="model-line"><strong>([\s\S]*?)<\/strong>[\s\S]*?<span class="visually-hidden">Plan: <\/span>([\s\S]*?)<\/span>/g)]
    .map(([, name, plan]) => ({ name: decode(name), plan: decode(plan) }));
  const table = html.match(/<table class="results[^"]*">([\s\S]*?)<\/table>/)?.[1] ?? '';
  const results = [...table.matchAll(/<tr><th scope="row">([\s\S]*?)<\/th>(?:<td>([\s\S]*?)<\/td>)?<td class="value">([\s\S]*?)<\/td>/g)]
    .map(([, a, b, value]) => ({ label: decode(b ? `${a} · ${b}` : a), value: decode(value) }));
  const video = html.match(/<video[^>]*\ssrc="([^"]+)"/)?.[1] ?? null;
  return { title, cardTitle, models, results, video };
}

/** What the card was made from: the page data plus the video's bytes. Stored in the PNG to detect stale cards. */
export const cardHash = (data, videoBytes) =>
  createHash('sha256').update(JSON.stringify(data)).update(videoBytes ?? '').digest('hex');

export const CARD_KEY = 'tda-og-card-source';

/** Width, height and tEXt chunks of a PNG buffer (null if not a PNG). */
export function pngInfo(buf) {
  if (buf.length < 33 || buf.toString('latin1', 1, 4) !== 'PNG') return null;
  const text = {};
  for (let i = 8; i < buf.length;) {
    const len = buf.readUInt32BE(i), type = buf.toString('latin1', i + 4, i + 8);
    if (type === 'tEXt') { const d = buf.subarray(i + 8, i + 8 + len), z = d.indexOf(0); text[d.toString('latin1', 0, z)] = d.toString('latin1', z + 1); }
    if (type === 'IEND') break;
    i += 12 + len;
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), text };
}

/** Returns the PNG with a tEXt chunk inserted right after IHDR. */
export function withPngText(buf, key, value) {
  const data = Buffer.from(`${key}\0${value}`, 'latin1');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0); chunk.write('tEXt', 4, 'latin1'); data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([Buffer.from('tEXt', 'latin1'), data])) >>> 0, 8 + data.length);
  return Buffer.concat([buf.subarray(0, 33), chunk, buf.subarray(33)]);
}

/** True when a benchmark's source Markdown opts in to its own share card (frontmatter shareCard: true). */
export const wantsCard = (md) => /^shareCard:\s*true\s*(?:#.*)?$/m.test(md.split(/^---\s*$/m)[1] ?? '');

/** The tool, from a "Model in Tool" card title (the part after the last " in "), or null. */
export const toolOf = (cardTitle) => (cardTitle.includes(' in ') ? cardTitle.slice(cardTitle.lastIndexOf(' in ') + 4) : null);

/** The card's plan line for one model: the page's plan, then the tool ("X Premium ($30) · Grok CLI"). */
export const planLine = (plan, tool) => (tool && !plan.includes(tool) ? `${plan} · ${tool}` : plan);

/**
 * How a result reads on the card. The page's "Cost (API-equivalent)" row becomes "API-equivalent cost",
 * and when it has a figure the card adds "Not the subscription price" (so the cost is never read as the plan's price).
 * Every other label and every value is exactly as the page shows it.
 */
export function cardResult({ label, value }) {
  const m = label.match(/^(?:(.+) · )?Cost \(API-equivalent\)$/);
  if (!m) return { label, value, note: null };
  const measured = /\d/.test(value) && !/^not\b/i.test(value);
  return { label: `${m[1] ? `${m[1]} · ` : ''}API-equivalent cost`, value, note: measured ? 'Not the subscription price' : null };
}

/** The card's one-line title: the model name(s) only ("Grok 4.7 High"). The tool is on the plan line. */
export const cardHeading = (models) => models.map((m) => m.name).join(' · ');

/**
 * Alt text for the share card, from the same data and in the same words:
 * "<page title before ': '> on <plan>: <each result>." The title already names the tool, so it isn't repeated.
 */
export function cardAlt({ cardTitle, models, results, video }) {
  const plans = models.length === 1 ? models[0].plan : models.map((m) => `${m.name} · ${m.plan}`).join('; ');
  const res = results.map(cardResult).map((r) => `${r.label} ${r.value}${r.note ? ` (${r.note.toLowerCase()})` : ''}`).join(', ');
  return `${cardTitle} on ${plans}${res ? `: ${res}` : ''}.${video ? ' With a still from the output video.' : ''}`;
}

/** The page's card title: the part of the title before ": " (model + tool), or the whole title. */
export const cardTitleOf = (title) => (title.includes(': ') ? title.slice(0, title.indexOf(': ')) : title);
