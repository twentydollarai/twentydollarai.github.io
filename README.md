# Twenty Dollar AI

Website for **Twenty Dollar AI**: real-world tests of affordable (~$20/month) AI subscriptions.
Static site built with [Astro](https://astro.build), plain CSS, and Markdown content. Hosted for free on GitHub Pages.

**To publish an article, see [PUBLISHING.md](PUBLISHING.md).** No code changes needed.

- Deploying to GitHub Pages: [DEPLOY.md](DEPLOY.md)
- Day-to-day upkeep (content, tests, dependency updates, custom domain, rollback): [MAINTENANCE.md](MAINTENANCE.md)

## Requirements

- Node.js 22.22+ (24 LTS recommended; see `.nvmrc`)

## Commands

| Command              | What it does                                                     |
|----------------------|------------------------------------------------------------------|
| `npm install`        | Install dependencies                                             |
| `npm run dev`        | Local dev server at http://localhost:4321 (published content only) |
| `npm run dev:demo`   | Dev server that also shows demo and draft entries                |
| `npm run build`      | Production build into `dist/` (demo and drafts excluded)         |
| `npm run build:demo` | Build including demo and drafts into `dist-demo/` (layout checks only, never deployed) |
| `npm run preview`    | Serve the production build (`dist/`) locally                     |
| `npm run preview:demo` | Serve the demo build (`dist-demo/`) locally                    |
| `npm run check`      | Type and template checks (`astro check`)                         |
| `npm run test:schema`| Checks the frontmatter rules (e.g. price needs a source)         |
| `npm test`           | Schema checks + astro check + production build + demo-leak scan  |

## Configuration

Everything you'd change lives in **`src/site.config.mjs`**:

- `siteUrl` / `basePath`: the public address: `https://twentydollarai.github.io/`, base `/`
  (GitHub account `twentydollarai`, root user-site repo `twentydollarai.github.io`).
  - User site (repo named `<username>.github.io`): `siteUrl: 'https://<username>.github.io'`, `basePath: '/'`
  - Project site (any other repo name): same `siteUrl`, `basePath: '/<repo-name>/'`
  - Custom domain later: `siteUrl: 'https://yourdomain.com'`, `basePath: '/'`, and add `public/CNAME` containing the domain.
- `githubUrl`: the GitHub profile link, `https://github.com/twentydollarai`.
- `xUrl`, `xHandle`, `name`, `description`.

> Image and link paths starting with `/` (e.g. `/images/blog/x.png`) work with any `basePath`: a small post-build
> step in `src/lib/build-hooks.mjs` adds the base path for project sites.

## Project layout

```
src/
  site.config.mjs     ← site name, URL, social links
  content/            ← all articles (one .md file each)
    blog/ benchmarks/ experiments/ projects/
  schemas.ts          ← frontmatter rules (build fails on bad data)
  content.config.ts   ← connects folders to rules
  lib/content.ts      ← demo/draft filter (SHOW_DEMO)
  pages/              ← routes
  components/ layouts/ styles/global.css
public/
  images/<section>/   ← put images here
  og-default.png      ← default social-share image (source: scripts/og-image.html)
templates/            ← copy-paste Markdown templates
.github/workflows/deploy.yml  ← GitHub Pages deployment
```

## Deployment (GitHub Pages)

Not yet deployed. Exact step-by-step instructions and troubleshooting: **[DEPLOY.md](DEPLOY.md)**. Summary:

1. Create a **public** repository named `twentydollarai.github.io` and push this folder to `main`.
2. If the account or repo name differs, update `siteUrl`, `basePath`, and `githubUrl` in `src/site.config.mjs`.
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.
5. The site appears at `https://twentydollarai.github.io/` (or `https://<username>.github.io/<repo>/` for a project site).
6. No `.nojekyll` file is needed: the Actions deployment uploads the built `dist/` as-is and never runs Jekyll.
   No secrets are needed: the workflow uses GitHub's built-in OIDC token (`id-token: write`).

## How demo content is kept off the live site

Entries are shown only if `status: published` and `demo: false`, unless the build runs with `SHOW_DEMO=true`.
The filter is in `src/lib/content.ts` and applies to lists, detail pages, category pages, the homepage feed,
RSS, and the sitemap (which only lists generated pages). A build hook (`src/lib/build-hooks.mjs`) also removes `public/images/demo/`
from production output. `node scripts/check-no-demo.mjs` scans `dist/` for leaks.

## Reproduce the verification

Everything below runs locally, offline except for `npm ci`/browser downloads. Full results: [verification/REPORT.md](verification/REPORT.md).

**Versions used:** Node.js v24.22.0, npm 11.19.1, Astro 7.4.1, Playwright 1.64.1 (Chromium 156, Firefox 157, WebKit 27.2), Lighthouse 13.5.0, axe-core via @axe-core/playwright 4.14.0, linkinator 8.1.0. Linux x64.

```sh
# 1. Site dependencies (from the lockfile)
npm ci

# 2. Test tooling lives in tests/ with its own package.json and lockfile,
#    so the site itself has no test dependencies.
cd tests
npm ci
npx playwright install chromium firefox webkit
# Linux only, if WebKit/Firefox complain about missing system libraries (needs sudo):
#   sudo npx playwright install-deps webkit firefox

# 3. Run everything (builds dist/ and dist-demo/ itself). About 2–3 minutes.
node run-all.mjs                     # all steps
node run-all.mjs --skip-lighthouse   # faster
node run-all.mjs --skip-browsers     # Chromium only
```

Individual steps (from `tests/`, after `npm run build && npm run build:demo` in the project root):

| Command | What it checks | Expected |
|---|---|---|
| `npm run test:schema` *(root)* | frontmatter rules, e.g. price needs a source | 11/11 PASS |
| `npm run check` *(root)* | `astro check` | 0 errors, 0 warnings, 0 hints |
| `node ../scripts/check-no-demo.mjs` | no demo content in `dist/` | "No demo content found" |
| `node behaviour.mjs --browser=chromium` (also `firefox`, `webkit`) | nav, theme, menu, skip link, 404, overflow at 320–1920px | 38/38 PASS each |
| `node axe.mjs` | axe WCAG 2.1 A/AA + best-practice, light/dark, desktop/mobile | 68 scans, 0 violations |
| `node links.mjs` | every internal link in prod + demo builds | 0 broken |
| `node feeds.mjs` | RSS + sitemap well-formed, absolute URLs on the right domain | 13/13 PASS |
| `node security.mjs` | secrets, local paths, source maps, external requests | 7/7 PASS |
| `node test-publishing.mjs` | templates → valid entries publish; invalid ones fail clearly (temp copy) | 25/25 PASS |
| `node base-path.mjs` | root site + project-site base path, trailing slashes, workflow | 26/26 PASS |
| `node lighthouse.mjs` | Lighthouse desktop + mobile on 4 pages → `verification/lighthouse/` | see report |
| `node screenshots.mjs` | homepage screenshots in 3 browsers → `verification/screenshots/` | 7 PNGs |

Set `CHROME_PATH=/path/to/chrome` to use an installed Chrome instead of Playwright's Chromium.
