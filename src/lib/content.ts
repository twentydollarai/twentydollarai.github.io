import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';

/**
 * Demo/draft gate. Production (`npm run build`) shows ONLY entries with
 * status: published AND demo: false. `npm run dev:demo` / `build:demo`
 * (SHOW_DEMO=true) shows everything so layouts can be checked.
 */
export const SHOW_DEMO = process.env.SHOW_DEMO === 'true';

export function isVisible(data: { status: string; demo: boolean }): boolean {
  if (SHOW_DEMO) return true;
  return data.status === 'published' && !data.demo;
}

export async function getVisible<C extends CollectionKey>(name: C): Promise<CollectionEntry<C>[]> {
  const all = await getCollection(name, ({ data }) => isVisible(data as any));
  return all.sort((a, b) => {
    const da = (a.data as any).date?.valueOf?.() ?? 0;
    const db = (b.data as any).date?.valueOf?.() ?? 0;
    return db - da;
  });
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Build an internal link that respects the base path. */
export const url = (path: string) => `${base}${path.startsWith('/') ? path : '/' + path}`;

/** Resolve a media src: local "/images/..." gets the base path, full URLs pass through. */
export const asset = (src: string) => (src.startsWith('/') ? url(src) : src);

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Rough reading time for a Markdown body at 220 words per minute (an estimate, shown as "~N min read"). */
export function readingMinutes(body: string | undefined): number {
  const text = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / 220));
}
