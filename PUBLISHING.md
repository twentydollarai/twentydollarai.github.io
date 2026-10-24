# Publishing on Twenty Dollar AI

You never need to touch the site's code to publish. Every article is one Markdown file.

| To add a…        | Copy this template            | Into this folder            | Images go in                  |
|------------------|-------------------------------|-----------------------------|-------------------------------|
| Blog post        | `templates/blog-post.md`      | `src/content/blog/`         | `public/images/blog/`         |
| Benchmark        | `templates/benchmark.md`      | `src/content/benchmarks/`   | `public/images/benchmarks/`   |
| Agent experiment | `templates/experiment.md`     | `src/content/experiments/`  | `public/images/experiments/`  |
| Project card     | `templates/project.md`        | `src/content/projects/`     | `public/images/projects/`     |

## Steps

1. **Copy the template** into the right folder (table above).
2. **Rename it.** The file name becomes the page address:
   `src/content/blog/first-week-with-grok.md` → `/blog/first-week-with-grok/`.
   Use lowercase letters, numbers and dashes only.
3. **Fill in the fields** between the two `---` lines. Every field is explained in the template's comments
   (lines starting with `#`). Delete optional fields you don't use.
   Blog posts can also have an optional **At a glance** box (`glance:` in the template) with a short summary,
   what was tested, the result and the cost. Each line shows only if you fill it in. Leave out anything you
   didn't actually record.
   **Benchmark results** show by default as a short Metric / Value table near the top of the page, so they fit
   on one screen without scrolling. Keep them to four rows: **Time, Tokens, Cost, Weekly usage**, plus one
   `resultsNote` line saying where the numbers came from. If the prompt is private (or your standard benchmark prompt), write only its name or
   "Private" and set `promptLabel`. Never summarize or paraphrase it. Per-row `method` text isn't shown in this format.
   (`compactResults: false` brings back the old wide table with Model and "How it was measured" columns;
   then every row needs a `method`.)
4. **Write the body** below the second `---` in normal Markdown.
   Use `##` for main sections. A blog post with 4 or more `##` sections gets an automatic contents list,
   and every post shows an estimated reading time.
5. **Add images** to the images folder for that section, then refer to them with a path starting with `/images/…`,
   for example `![A screenshot of the result](/images/blog/result.png)`. Always describe the image (alt text).
   Keep videos on YouTube/X/Vimeo and link them; GitHub rejects files over 100 MB.
6. **Set `status: published`.** Anything left as `status: draft` stays off the public site.
7. **Save your change (commit) to the `main` branch on GitHub**, and the site updates itself in a minute or two.

### Doing it in the GitHub website (no installs)

1. Open the repository on github.com, go to `templates/`, open a template and copy its contents.
2. Go to the target folder (e.g. `src/content/blog/`), click **Add file → Create new file**, type the file name
   (e.g. `first-week-with-grok.md`), paste, and fill it in.
3. To upload an image: open `public/images/blog/`, **Add file → Upload files**.
4. Click **Commit changes**. The **Actions** tab shows the build; a green tick means it's live.
   A red cross on a **Deploy to GitHub Pages** run means a field is wrong: open the failed run and the error
   names the file and the field. Only that workflow publishes the site. If you also see a failed run called
   **pages build and deployment**, ignore it: it comes from an old GitHub Pages setting and doesn't affect the site.

### Previewing on your own computer (optional)

```sh
npm install
npm run dev        # real content only, like the live site → http://localhost:4321
npm run dev:demo   # also shows drafts and demo entries
```

## Rules the build enforces

The build stops with a clear error, so nothing broken goes live, if:

- a benchmark shows a **price without a source**,
- a published benchmark still has a template **`FILL IN`** placeholder in its results or `resultsNote`,
- a benchmark result names a model that isn't in its `models` list, or has no `method` when the page uses the
  wide table (`compactResults: false`),
- an image has no alt text, or a required field (title, description, date…) is missing,
- an experiment `outcome` isn't one of `worked`, `partial`, `failed`, `in-progress`,
- a project `repoUrl` isn't a `https://github.com/<user>/<repo>` link.

## Integrity checklist before publishing

- [ ] Every number in `results` was actually measured, and `resultsNote` says where the numbers came from.
- [ ] Opinions are in the body ("My take"), not in `results`.
- [ ] Prices have a source and, ideally, a `checked` date.
- [ ] Time and usage were recorded during the run, not guessed afterwards.
- [ ] Failures and limitations are included.
- [ ] Linked repositories are public.

## Demo content

Files named `demo-*.md` have `demo: true`. They exist only to preview layouts and are **never** included in
`npm run build` (the live site). You can delete them once real content exists. Files starting with `_` are
ignored entirely, which is handy for notes.
