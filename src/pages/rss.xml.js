import rss from '@astrojs/rss';
import { getFeed } from '../lib/feed';
import { siteConfig } from '../site.config.mjs';

export async function GET(context) {
  const items = await getFeed();
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    // Include the base path so the channel link is right on project sites too.
    site: new URL(import.meta.env.BASE_URL, context.site).href,
    items: items.map((i) => ({
      title: `${i.type}: ${i.title}`,
      description: i.description,
      pubDate: i.date,
      link: i.href,
    })),
  });
}
