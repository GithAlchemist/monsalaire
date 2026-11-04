import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import { articleFigures, articleRules } from './src/blog/markdown.ts';

// Every page is rendered to static HTML at build time (one file per address, e.g. /comprendre -> comprendre.html,
// served without the extension by Vercel's cleanUrls), then the React island takes over in the browser.
// Articles (src/content/articles) are Markdown or MDX; their images go through Astro's image pipeline.
export default defineConfig({
  site: 'https://monsalaire.aconta.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Pages stay static; only /api/* (accounts, contact form) runs as Vercel functions.
  adapter: vercel(),
  integrations: [react(), mdx()],
  markdown: {
    // Smart quotes and ellipses, but never dashes: "--" must not turn into an en dash (house rule: no dashes).
    processor: satteri({
      features: { smartPunctuation: { dashes: false } },
      mdastPlugins: [articleRules],
      hastPlugins: [articleFigures],
    }),
  },
  image: {
    // Images in the articles' Markdown get a srcset and sizes, and keep their proportions.
    layout: 'constrained',
    responsiveStyles: true,
  },
  server: { port: 3150 },
  devToolbar: { enabled: false },
});
