import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogSchema, benchmarkSchema, experimentSchema, projectSchema } from './schemas.ts';

// Each folder in src/content/ is one section. Any .md file inside becomes an entry.
// Files starting with "_" are ignored, so you can keep notes there.
const md = (dir: string) => glob({ pattern: ['**/*.md', '!**/_*.md'], base: `./src/content/${dir}` });

export const collections = {
  blog: defineCollection({ loader: md('blog'), schema: blogSchema }),
  benchmarks: defineCollection({ loader: md('benchmarks'), schema: benchmarkSchema }),
  experiments: defineCollection({ loader: md('experiments'), schema: experimentSchema }),
  projects: defineCollection({ loader: md('projects'), schema: projectSchema }),
};
