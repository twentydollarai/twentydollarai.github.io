// ─────────────────────────────────────────────────────────────────────────────
// Twenty Dollar AI: site settings
// This is the ONLY file you need to edit to change the address, links, or name.
// ─────────────────────────────────────────────────────────────────────────────

export const siteConfig = {
  name: 'Twenty Dollar AI',
  tagline: 'What can $20 a month of AI actually do?',
  description:
    'Real-world tests of affordable AI subscriptions: experiments, benchmarks, and honest notes, failures included.',

  // GitHub account 'twentydollarai' (ownership confirmed by the owner 2026-10-21).
  // Root user site: repo 'twentydollarai.github.io' -> https://twentydollarai.github.io/
  //  • User site (repo named <username>.github.io): siteUrl 'https://<username>.github.io', basePath '/'
  //  • Project site (any other repo name):           siteUrl 'https://<username>.github.io', basePath '/<repo-name>/'
  //  • Custom domain later:                          siteUrl 'https://example.com', basePath '/'  (+ add public/CNAME)
  siteUrl: 'https://twentydollarai.github.io',
  basePath: '/',

  xUrl: 'https://x.com/TwentyDollarAI',
  xHandle: '@TwentyDollarAI',
  githubUrl: 'https://github.com/twentydollarai',

  // Homepage introduction, shown right after the hero on every build.
  // Edit the text between the quotes; keep it to one paragraph.
  intro: {
    label: 'Why I started this',
    text: "Twenty Dollar AI started with an interest in what AI could help me do, from researching trading ideas to building things I never thought I could make myself. It became more personal after I lost my best friend of 14 years. Learning and creating gave me something to focus on during a time when life felt painfully empty, and one of those projects was a photo app to keep his memories close. This website is a place to share what I’m trying, what works, and what doesn’t—with an everyday person’s budget and perspective. I’m still learning, and I hope sharing that process helps someone else.",
  },

  locale: 'en',
};
