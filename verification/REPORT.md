# Phase 3 verification report: Twenty Dollar AI

- **Date:** 2026-10-20, 12:15–12:37 EDT. Local box only. Nothing was published, pushed, or deployed.
- **Environment:** Linux x64, Node.js v24.22.0, npm 11.19.1, Astro 7.4.1.
- **Browsers:** Playwright 1.64.1 with Chromium 156, Firefox 157 and WebKit 27.2.
- **Tools:** Lighthouse 13.5.0, axe-core (@axe-core/playwright 4.14.0), linkinator 8.1.0.
- **Configuration under test:** `siteUrl https://twentydollarai.github.io`, `basePath /`, `githubUrl https://github.com/twentydollarai`.
  At the time of Phase 3 this was provisional. **Update 2026-10-21:** the owner confirmed they own `github.com/twentydollarai`.
- **How to re-run everything:** see "Reproduce the verification" in the README. The full log of the final run is in `verification/run-all.log`.

## Results by area

| Area | Result | Evidence |
|---|---|---|
| Clean install | PASS | Removed `node_modules`, `dist`, `.astro`. Ran `npm ci` in root and `tests/`. |
| Schema tests | PASS | 11/11 (`npm run test:schema`) |
| `astro check` | PASS | 31 files, 0 errors, 0 warnings, 0 hints |
| Production build | PASS | 7 pages. `check-no-demo.mjs` found no demo content in 27 files. |
| Demo build (`dist-demo/`) | PASS | 12 pages. Demo banner shown. |
| Navigation | PASS | 5 header links, each sets `aria-current`. Logo goes home. Mobile menu link works. |
| Internal links | PASS | linkinator: prod 12 links, demo 18 links, 0 broken. Project-site builds: 10 and 18 links, 0 broken. |
| RSS | PASS | Well-formed XML (DOMParser). Channel link is `https://twentydollarai.github.io/`, with 0 items because nothing is published yet. With temporary test entries, all 3 item links were absolute, on the right domain, and pointed to built pages. |
| Sitemap | PASS | Index and `sitemap-0.xml` well-formed. All 6 URLs on `https://twentydollarai.github.io/`, each has a built page. No 404, demo or draft URLs. |
| 404 behaviour | PASS | `dist/404.html` exists. An unknown route returns HTTP 404 with the 404 page, on both `astro preview` and the Pages-like test server. A demo entry URL returns 404 in prod. |
| Responsive | PASS | No horizontal overflow at 320, 390, 768, 1280 and 1920px on 17 pages (prod + demo). Checked in all 3 browsers. No console errors. |
| Dark mode | PASS | Follows `prefers-color-scheme` both ways. Toggle works, sets `aria-pressed`, persists across pages and reloads. A stored choice overrides the system setting. Toggle is hidden when JavaScript is off. |
| Keyboard / skip link | PASS | First Tab lands on "Skip to content", which moves to `#main`. Escape closes the mobile menu. |
| No-JavaScript | PASS | Nav links stay visible on mobile. |
| Accessibility (axe) | PASS | 68 scans (prod + demo × light/dark × 1280/390): 0 violations |
| Lighthouse | PASS* | 100/100/100/100 on `/`, `/blog/`, `/about/` (desktop and mobile). See the table below; *404 SEO is 63 by design. |
| Publishing workflow | PASS | 25/25. See below. |
| GitHub Pages URL structure | PASS | 26/26. Root site, project-site base `/twenty-dollar-ai/`, trailing slashes, workflow file. |
| Security | PASS | 7/7 automated checks. `npm audit`: 0 vulnerabilities (site and tests). See below. |
| Firefox | PASS | Behaviour 38/38 plus screenshots |
| WebKit | PASS | Behaviour 38/38 plus screenshots. Needed `sudo npx playwright install-deps webkit` on this box. |
| Real devices, iOS/macOS Safari, Edge, screen readers | NOT TESTED | See Limitations |
| Live deployment | NOT TESTED | Not approved yet (Phase 5) |

## Lighthouse (local `astro preview`, production build)

| Page | Preset | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|---|
| / | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.3 s | 0 | 0 ms |
| /blog/ | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.3 s | 0 | 0 ms |
| /about/ | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.3 s | 0 | 0 ms |
| /404.html | desktop | 100 | 100 | 100 | 63 | 0.3 s | 0.3 s | 0 | 0 ms |
| / | mobile | 100 | 100 | 100 | 100 | 1.4 s | 1.5 s | 0 | 0 ms |
| /blog/ | mobile | 100 | 100 | 100 | 100 | 1.4 s | 1.5 s | 0 | 0 ms |
| /about/ | mobile | 100 | 100 | 100 | 100 | 1.2 s | 1.4 s | 0 | 0 ms |
| /404.html | mobile | 100 | 100 | 100 | 63 | 1.4 s | 1.5 s | 0 | 0 ms |

Notes:
- **404 SEO 63:** fails only `is-crawlable`, because the 404 page is deliberately `noindex`. Not a defect.
- **Remaining diagnostics:** `render-blocking-insight` (the one site stylesheet, estimated 520–740 ms saving on simulated mobile) and `network-dependency-tree-insight`. These are informational and don't affect the scores. They were left as is: inlining the CSS would be an optimisation, not a fix.
- **First run, before the fix:** homepage CLS was 0.115 (desktop) and 0.19 (mobile), and mobile Performance was 90. See D1.
- **Caveat:** these are localhost runs with Lighthouse's simulated throttling. Real-network scores on GitHub Pages will differ.
- **Report files:** `verification/lighthouse/`. Full JSON is gzipped; HTML is kept for the homepage only; plus `summary.json` and `summary.md`.

## Publishing workflow test (`tests/test-publishing.mjs`)

The test runs in a temporary copy, which is deleted afterwards.
- **Valid entries.** It made a blog post, benchmark, experiment and project by copying `templates/*.md` and filling in obvious `TEST` values (for example "TEST model A" and "TEST note: not a real price"). Then it ran a production build and checked:
  - The build passes.
  - Each page renders, including the benchmark's Measured and Opinion sections, the price source and the experiment outcome.
  - Each entry appears in its list page.
  - The category page is generated.
  - The homepage feed lists all three and the empty state disappears.
  - RSS and sitemap contain them (`feeds.mjs --expect`).
- **Draft and demo.** A `status: draft` entry and a `demo: true` entry are absent from production output (checked with grep), present in the demo build, and show their banner.
- **Invalid entries.** Each one fails the build and names the file and the field:
  - missing title → `title: Required`
  - missing date → `date: Add a valid date written as YYYY-MM-DD`
  - cover image without alt → `cover.alt: Required`
  - price without source → `Price for "TEST model A" has no source. Add price.source …`
  - result without method → `results.0.method: Required`
  - bad outcome → `outcome: Invalid option: expected one of "worked"|"partial"|"failed"|"in-progress"`
  - non-GitHub repo URL → `repoUrl must be a public https://github.com/<user>/<repo> link`
- **Cleanup.** The build passes again once the invalid files are removed. The temporary copy is gone. The real project's content hash is identical before and after. Separately, a sha256 snapshot of all 68 project files (excluding `node_modules`, builds and `verification/`) taken before the final full run matched the one taken after.

## GitHub Pages URL structure (`tests/base-path.mjs`)

- **Root site (`/`):**
  - 0 page-relative links.
  - All 102 root-relative references resolve.
  - Canonical and og URLs are absolute on `https://twentydollarai.github.io/`.
- **Project site (`basePath: '/twenty-dollar-ai/'`, built in a temporary copy):**
  - All root-relative references carry the base: 88 in prod and 167 in demo, including Markdown body links.
  - Canonical, og, RSS and sitemap URLs include the base.
  - 0 broken links.
- **Trailing slashes:**
  - `astro preview` serves `/blog` and `/blog/` with 200.
  - The Pages-like test server mimics GitHub Pages: `/blog` returns 301 to `/blog/`.
  - All internal links are written with a trailing slash, so no redirect is needed in practice.
- **Workflow (`.github/workflows/deploy.yml`):**
  - Uses `withastro/action@v6` and `actions/deploy-pages@v5`.
  - Permissions are `contents: read`, `pages: write`, `id-token: write`. No secrets are used.
  - Runs `npm run build` with no `SHOW_DEMO`.
  - `.nojekyll` is **not needed**: an Actions-based Pages deployment publishes the uploaded artifact as-is and doesn't run Jekyll.
  - One-time setting on GitHub: Settings → Pages → Source: **GitHub Actions**.
  - The workflow file was checked statically only. It has not run on GitHub.

## Security review (`tests/security.mjs`, `npm audit`)

- **`npm audit`:** 0 vulnerabilities in the site (`npm ci`) and 0 in `tests/`.
- **Secrets:** no secret-like strings (GitHub, OpenAI-style, AWS, Slack or Google keys, private keys, credential assignments) in 58 source files or 27 output files.
- **Private data:** no email addresses or local filesystem paths (`/workspace`, `/home`, `/Users`) in built output or site source.
- **Source maps:** none in `dist/`, as files or as `sourceMappingURL` references.
- **External resources:** no external scripts, styles, fonts or images referenced in `dist/`. Fonts are self-hosted.
- **Network at load time:** loading all 17 pages made 0 requests to any host other than localhost.
- **Outbound links (user-clicked only):** `https://x.com/TwentyDollarAI` and `https://github.com/twentydollarai`. Every `target="_blank"` link has `rel="noopener noreferrer"`.
- **Inline scripts:** 2 distinct, both first-party, neither uses eval, new Function, document.write or innerHTML.
  - The theme pre-paint script: 275 chars, reads localStorage and sets `data-theme`.
  - The header script, inlined by Astro as `type="module"`: 806 chars, theme toggle and menu.
- **Security headers:** GitHub Pages can't set custom headers such as CSP. A meta CSP was not added, because the inline scripts would then need hashes kept in sync.

## Defects found and fixed

| # | Defect | Where | Fix | Re-test |
|---|---|---|---|---|
| D1 | Homepage layout shift when web fonts load (CLS 0.115 desktop / 0.19 mobile; mobile Performance 90) | `src/layouts/Base.astro` | Preload the two above-the-fold font files (Inter 400 and 700). These are the same hashed files the CSS already uses, so nothing is downloaded twice. | Lighthouse CLS 0 on all pages; Performance 100 desktop and mobile |
| D2 | RSS `<channel><link>` left out the base path on project-site builds | `src/pages/rss.xml.js` | Pass `new URL(BASE_URL, site)` as the feed site | `base-path.mjs` feeds checks PASS for prod and demo with `/twenty-dollar-ai/` |
| D3 | A missing or invalid date gave an unclear build error (`Expected type "date", received "object"`) | `src/schemas.ts` | Shared date schema with the message "Add a valid date written as YYYY-MM-DD" | `test-publishing.mjs` and the new schema test PASS |
| D4 | `npm run build:demo` wrote demo content into `dist/`, the production folder that `npm run preview` serves, which risked confusing a demo build with production | `package.json` | `build:demo` now outputs to `dist-demo/`; added `preview:demo`. CI still runs `npm run build`. | Prod and demo builds coexist; `check-no-demo` PASS |

Test-harness issue, not a site defect: Astro 7 allows only one `astro preview` per project at a time. The tests therefore use a small static server that behaves like GitHub Pages (`tests/lib.mjs`). `astro preview` is still used for Lighthouse and for one 404 check.

Config change made as requested: `twentydollarai` account (provisional at the time; ownership confirmed 2026-10-21). The old placeholder warning now fires only if a placeholder address comes back.

## Limitations / not tested

- **Not tested on:** real phones and tablets, Safari on iOS or macOS (WebKit through Playwright on Linux is close but not the same), Microsoft Edge, Chrome on Windows or macOS, and screen readers (NVDA, VoiceOver, JAWS). No manual keyboard-only review beyond the automated checks.
- **Live site:** nothing has run on GitHub Pages. The workflow hasn't executed, and there's no live HTTPS or real-network performance data. `https://twentydollarai.github.io/` currently returns 404.
- **GitHub account:** `https://github.com/twentydollarai` exists. Ownership was confirmed by the owner on 2026-10-21. No `twentydollarai.github.io` repo existed at the time of Phase 3.
- **axe coverage:** axe can't judge everything, for example text over gradient backgrounds or reading order. It also only covers the pages that exist; prod has no published content yet.
- **Lighthouse:** run on localhost only.
- **Test setup on this box:** WebKit needed system libraries (`playwright install-deps`, run with sudo). The tests use Playwright's bundled browsers, which are downloaded (not committed).

## Phase 4 re-run (2026-10-21)

- **Setup:** after the box restart, Node 24.22.0, `npm ci` for root and `tests/`, and the Playwright browsers plus system libraries were reinstalled.
- **Changes:**
  - Removed the "provisional" wording, since account ownership is confirmed.
  - Pinned the workflow actions to exact tags: `actions/checkout@v7.0.1`, `withastro/action@v6.1.3`, `actions/deploy-pages@v5.0.1`.
  - Added DEPLOY.md and MAINTENANCE.md.
  - Updated `.gitignore`.
- **Results:**
  - `node tests/run-all.mjs`: all 15 steps PASS, with the same counts as Phase 3. Lighthouse scores are unchanged (100/100/100/100; 404 SEO 63 by design).
  - `actionlint` 1.7.12 reports no issues in `.github/workflows/deploy.yml`.
- **Production build:** sitemap, RSS and canonical/og URLs all use `https://twentydollarai.github.io/`.
- **Known nit, not fixed:** the 404 page's canonical is `/404/`. It's harmless because the page is `noindex`.
