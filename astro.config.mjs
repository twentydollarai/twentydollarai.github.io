// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './src/site.config.mjs';
import { buildHooks } from './src/lib/build-hooks.mjs';

const SHOW_DEMO = process.env.SHOW_DEMO === 'true';

// Warns only if a placeholder address is ever put back into src/site.config.mjs.
if (/todo--|YOUR-GITHUB-USERNAME|example\.com/i.test(siteConfig.siteUrl + siteConfig.githubUrl)) {
  console.warn('\n[site.config] siteUrl/githubUrl contain a placeholder. Set the real GitHub account in src/site.config.mjs before deploying.\n');
}

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.basePath,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/404') }),
    // Drops demo images from production builds; fixes Markdown links on project sites.
    buildHooks({ dropDemo: !SHOW_DEMO, base: siteConfig.basePath }),
  ],
});
