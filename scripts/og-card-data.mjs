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

/** Alt text for the share card, from the same data: title, plan(s), each result as "label value". */
export function cardAlt({ cardTitle, models, results, video }) {
  const plans = models.length === 1 ? models[0].plan : models.map((m) => `${m.name} · ${m.plan}`).join('; ');
  const res = results.map((r) => `${r.label} ${r.value}`).join(', ');
  return `${cardTitle}, ${plans}${res ? `: ${res}` : ''}.${video ? ' With a still from the output video.' : ''}`;
}

/** The page's card title: the part of the title before ": " (model + tool), or the whole title. */
export const cardTitleOf = (title) => (title.includes(': ') ? title.slice(0, title.indexOf(': ')) : title);
