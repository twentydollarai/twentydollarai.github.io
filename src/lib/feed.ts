import { getVisible, url } from './content';

export interface FeedItem {
  type: 'Blog' | 'Benchmark' | 'Experiment';
  href: string;
  title: string;
  description: string;
  date: Date;
  demo: boolean;
  draft: boolean;
}

/** Newest visible items across Blog, Benchmarks and Experiments. */
export async function getFeed(limit?: number): Promise<FeedItem[]> {
  const [blog, bench, exp] = await Promise.all([getVisible('blog'), getVisible('benchmarks'), getVisible('experiments')]);
  const items: FeedItem[] = [
    ...blog.map((e) => ({ type: 'Blog' as const, href: url(`/blog/${e.id}/`), ...pick(e.data) })),
    ...bench.map((e) => ({ type: 'Benchmark' as const, href: url(`/benchmarks/${e.id}/`), ...pick(e.data) })),
    ...exp.map((e) => ({ type: 'Experiment' as const, href: url(`/experiments/${e.id}/`), ...pick(e.data) })),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());
  return limit ? items.slice(0, limit) : items;
}

function pick(d: { title: string; description: string; date: Date; demo: boolean; status: string }) {
  return { title: d.title, description: d.description, date: d.date, demo: d.demo, draft: d.status === 'draft' };
}
