# Maintaining Twenty Dollar AI

The live site is rebuilt and redeployed automatically on every push to `main`: https://twentydollarai.github.io/

## Add content (no code changes)

| Content | Template | Put the file in | Images go in |
|---|---|---|---|
| Blog post | `templates/blog-post.md` | `src/content/blog/` | `public/images/blog/` |
| Benchmark | `templates/benchmark.md` | `src/content/benchmarks/` | `public/images/benchmarks/` |
| Agent experiment | `templates/experiment.md` | `src/content/experiments/` | `public/images/experiments/` |
| Project card | `templates/project.md` | `src/content/projects/` | `public/images/projects/` |

1. Copy the template and name the file with lowercase-and-dashes, e.g. `first-week-with-grok.md`. The file name becomes the page address.
2. Fill in the fields; every field is explained in the template.
3. Reference images as `/images/<section>/<file>` and always give them alt text. Keep images small (well under 1 MB), and host videos on YouTube, X or Vimeo.
4. Set `status: published`, then commit and push.

**Benchmark results format (default):** a two-column Metric / Value table shown right after the title, before
the Models tested card, so it fits on the first screen on desktop and mobile. Use four metrics (Time, Tokens,
Cost, Weekly usage) and one source line in `resultsNote`. `method` is optional and not displayed unless a page
sets `compactResults: false` (the old wide table with Model and "How it was measured" columns, where `method`
is required again). With more than one model, each compact row is labelled "Model · Metric".

**In the GitHub website:**
1. Open the template under `templates/` and copy its text.
2. In the target folder, choose **Add file → Create new file**, name it, paste, edit, and **Commit changes**.
3. For images, use **Add file → Upload files** in `public/images/<section>/`.

The **Actions** tab shows the rebuild. If it goes red, the log names the file and field to fix. PUBLISHING.md has the full guide and integrity checklist.

## Drafts and demo content
- `status: draft` entries and anything with `demo: true` **never** appear on the live site. They're left out of lists, pages, the homepage, RSS and the sitemap.
- To see them locally, run `npm run dev:demo`, or `npm run build:demo` then `npm run preview:demo`.
- `src/content/*/demo-*.md` and `public/images/demo/` are layout samples. You can delete them once real content exists.
- Files starting with `_` are ignored, which is handy for notes.

## Preview locally
Requires Node 24 (see `.nvmrc`; Astro 7 needs ≥ 22.22).
```sh
npm ci
npm run dev        # http://localhost:4321, published content only
npm run build && npm run preview   # exactly what will be deployed
```

## Run the tests
```sh
npm test                           # schema rules + astro check + production build + demo-leak scan (fast)
cd tests && npm ci && npx playwright install chromium firefox webkit
node run-all.mjs                   # full suite (browsers, axe, links, feeds, security, publishing, Lighthouse)
```
README.md → "Reproduce the verification" lists each step and its expected result.

## Update dependencies safely
```sh
npm outdated                # see what's behind
npm audit                   # known vulnerabilities
npm update                  # stays within the ranges in package.json; major upgrades: npm install astro@latest etc.
npm test && (cd tests && node run-all.mjs --skip-lighthouse)
git commit -am "Update dependencies" && git push
```
- Update one major dependency at a time, read its release notes (Astro's especially), and always commit the updated `package-lock.json`.
- The GitHub Actions in `.github/workflows/deploy.yml` are pinned to exact versions, e.g. `withastro/action@v6.1.3`. Bump them occasionally and check that the next deploy is green.

## Move to a custom domain later
1. Buy or own the domain. *(Not needed now; that's a cost decision for later.)*
2. In the repo: **Settings → Pages → Custom domain**, enter the domain and save. Then add the DNS records GitHub's Pages documentation lists for your domain type, and tick **Enforce HTTPS** once it's offered.
3. Add `public/CNAME` containing just the domain, e.g. `example.com`.
4. In `src/site.config.mjs`, set `siteUrl: 'https://<your-domain>'` and keep `basePath: '/'`.
5. Commit, push, and check that canonical links, RSS and the sitemap now use the new domain.

## Roll back a bad change
```sh
git log --oneline            # find the bad commit
git revert <commit-hash>     # creates a new commit that undoes it
git push                     # the workflow redeploys
```
Avoid `git push --force` on `main`.

## Never commit
- Secrets of any kind: tokens, API keys, `.env` files. The site needs none.
- `node_modules/`, `dist/`, `dist-demo/`, `.astro/` (already in `.gitignore`).
- Private or unpublished work, private repo links, or personal data you don't want public. **The repository is public.**
- Large media (anything near 100 MB is rejected by GitHub, and big files slow the site). Link videos instead.
- Made-up results: every number in a benchmark or experiment must come from an actual run.
