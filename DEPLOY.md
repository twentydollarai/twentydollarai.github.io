# Deploying Twenty Dollar AI to GitHub Pages

- **Target:** root user site. GitHub account `twentydollarai`, repository `twentydollarai.github.io`.
- **Public URL:** **https://twentydollarai.github.io/**. `src/site.config.mjs` already has `siteUrl: 'https://twentydollarai.github.io'` and `basePath: '/'`.
- **Cost:** $0. You need public repo hosting, GitHub Actions minutes for public repos, and the `github.io` address, and all three are free.
- **Status:** not deployed yet. A local git repo with one commit on `main` exists, with no remote.

Some GitHub screens change over time. Steps marked *(unverified)* are ones I couldn't check without a signed-in GitHub session.

---

## Option A: you do it (about 10 minutes)

### 1. Create the empty repository
1. Sign in to GitHub as **twentydollarai** and open https://github.com/new.
2. Fill in the form:
   - **Owner:** `twentydollarai`. **Repository name:** `twentydollarai.github.io`. The name must match exactly; that's what makes it a root user site.
   - **Visibility:** **Public**. Free accounts can only serve Pages from public repos.
   - **Leave everything unticked.** No README, no .gitignore template, no license. The repo must be empty so the first push isn't rejected.
3. Click **Create repository**.

### 2. Push the code
From the project folder on a computer with git and access to the account:

```sh
cd twenty-dollar-ai
git log --oneline        # should show the initial commit on main
git remote add origin https://github.com/twentydollarai/twentydollarai.github.io.git
git push -u origin main
```

- **Authentication:** for HTTPS, GitHub asks for a username and a **personal access token**, not your password. A credential manager or `gh auth login` also works. Over SSH, the remote is `git@github.com:twentydollarai/twentydollarai.github.io.git`.
- **Commit author:** the initial commit was made as `Website Bot <website-bot@localhost>`. To show it under your own name, run this before pushing:
  `git commit --amend --reset-author --no-edit` (with your `user.name` and `user.email` configured).
- **Starting from the bundle file instead of the folder:**
  `git clone twenty-dollar-ai.bundle twenty-dollar-ai && cd twenty-dollar-ai`, then `git remote remove origin` (the clone points `origin` at the bundle file), then the `remote add` and `push` commands above.

### 3. Turn on Pages with GitHub Actions
1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**. Don't pick "Deploy from a branch"; that mode would try to serve the raw source.
3. There is nothing else to set: no branch, no folder, no secrets, no `.nojekyll` file.

### 4. Watch the deployment
1. Open the **Actions** tab and select the **Deploy to GitHub Pages** workflow.
2. **If the first run failed:** that's expected if the push ran before step 3, typically at the deploy step with a message that Pages isn't enabled *(unverified wording)*. Fix it with either of these:
   - Open the failed run and click **Re-run all jobs**, or
   - Click **Run workflow** on the workflow page. The workflow allows manual runs (`workflow_dispatch`).
3. A good run shows two green jobs, **build** and **deploy**. The deploy job prints the page URL.

### 5. Verify the live site
- Open https://twentydollarai.github.io/. Check the homepage, all five nav links, and the dark-mode toggle.
- From any terminal:
  ```sh
  curl -sI https://twentydollarai.github.io/ | head -1                 # HTTP/2 200
  curl -s  https://twentydollarai.github.io/rss.xml | head -c 300       # RSS with <link>https://twentydollarai.github.io/</link>
  curl -s  https://twentydollarai.github.io/sitemap-0.xml | head -c 300 # URLs on https://twentydollarai.github.io/
  curl -sI https://twentydollarai.github.io/no-such-page/ | head -1     # HTTP/2 404 (custom 404 page)
  ```
- Optionally, on a machine with the test tooling, run Lighthouse in Chrome DevTools against the live URL.

---

## Option B: Website Bot does the push (Phase 5)

If you connect GitHub to Website Bot and **explicitly approve** it, the bot can:
1. create the public `twentydollarai.github.io` repo under `twentydollarai` (empty, no auto-init), and
2. push the existing `main` branch.

You'll probably still need to do step 3 (Settings → Pages → Source: GitHub Actions) yourself, unless the connected integration has permission to change Pages settings *(unverified)*. The bot then watches the Actions run and checks the live URL as in step 5. Nothing happens without your approval.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 404 at https://twentydollarai.github.io/ right after a green deploy | Pages is still propagating; the first deploy can take a few minutes | Wait 5–10 minutes and hard-refresh. Check **Settings → Pages**: it shows the live URL once the site is published. |
| 404, or the raw README/source is shown | Pages source is set to "Deploy from a branch" | Settings → Pages → Source: **GitHub Actions**, then re-run the workflow |
| Site works but lives at `/twentydollarai.github.io/…` or styles are missing | Repo name isn't exactly `twentydollarai.github.io`, so GitHub treats it as a project site | Rename the repo, or set `basePath: '/<repo>/'` in `src/site.config.mjs` |
| Deploy job: permission / OIDC / "Resource not accessible" error | Workflow lacks `pages: write` / `id-token: write`, or an account or org policy restricts Actions | The workflow already declares both. Check **Settings → Actions → General** that Actions are allowed. *(Exact policy screens unverified.)* |
| Deploy job rejected by environment protection | The `github-pages` environment only allows certain branches | Settings → Environments → `github-pages`: make sure `main` is allowed (it is by default) |
| Build job: `npm ci` fails | Lockfile missing or out of sync | Commit `package-lock.json`. Run `npm install` locally, commit the updated lockfile, and push. |
| Build job: Node engine / syntax error | Wrong Node version | The workflow uses Node 24 (`node-version: 24`), matching `.nvmrc`. Astro 7 needs Node ≥ 22.22. Change both together. |
| Build job: `InvalidContentEntryDataError` | A Markdown entry breaks a template rule (e.g. price without source) | The log names the file and field. Fix it and push again. See PUBLISHING.md. |
| Old version still showing | Browser or CDN cache | Hard-refresh. Deployments usually show up within a minute or two. |

## Rolling back
`git revert <commit>` then `git push`. The workflow redeploys the previous state. See MAINTENANCE.md.
