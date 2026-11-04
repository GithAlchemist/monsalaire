import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DASH_RE, SLUG_RE } from './blog/lib';
import { THEME_IDS } from './blog/themes';

/**
 * Content of the articles section. The build fails on any article that breaks these rules, with the file and the
 * field in the message: see docs/PUBLIER_UN_ARTICLE.md for what each field means.
 */

const noDash = (field: string) => (s: string) => !DASH_RE.test(s) || `${field}: no em or en dash (use a colon, a comma or brackets)`;
const text = (field: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${field}: at least ${min} characters`)
    .max(max, `${field}: at most ${max} characters`)
    .refine((s) => !DASH_RE.test(s), `${field}: no em or en dash (use a colon, a comma or brackets)`);

const authors = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Personal page: the author's link on every article and the `url` of the Person in the structured data. */
      url: z.url(),
      jobTitle: z.object({ fr: z.string(), en: z.string() }).optional(),
      bio: z.object({ fr: z.string(), en: z.string() }),
      /** Optional square picture, at least 160 x 160 px, next to the JSON file. */
      avatar: image().optional(),
      sameAs: z.array(z.url()).default([]),
    }),
});

const source = z.object({
  title: z.string().min(3),
  url: z.url(),
  publisher: z.string().optional(),
  /** Article, section or table of the text, e.g. "art. 1". */
  article: z.string().optional(),
  page: z.union([z.number().int().positive(), z.string()]).optional(),
});

const articles = defineCollection({
  // One file per article and language: src/content/articles/fr/<slug>.md, src/content/articles/en/<slug>.md.
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_*'], base: './src/content/articles' }),
  schema: ({ image }) =>
    z
      .object({
        title: text('title', 10, 110),
        /** Meta description: what search engines and link previews show under the title. */
        description: text('description', 70, 180),
        date: z.coerce.date(),
        updated: z.coerce.date().optional(),
        lang: z.enum(['fr', 'en']),
        /** Same value in the French and English files of one article: it links the two versions. */
        translationKey: z.string().regex(SLUG_RE, 'translationKey: lower case, digits and hyphens'),
        theme: z.enum(THEME_IDS),
        tags: z.array(z.string().refine(noDash('tags'))).default([]),
        author: reference('authors').default({ collection: 'authors', id: 'kevin' }),
        /** Exactly 1200 x 630 px (checked in src/blog/data.ts, once the image is read): also the social preview. */
        cover: image(),
        coverAlt: text('coverAlt', 15, 250),
        featured: z.boolean().default(false),
        /** A draft is built in `npm run dev` only, never published. */
        draft: z.boolean().default(false),
        sources: z.array(source).min(1, 'sources: at least one source (every figure is sourced on this site)'),
      })
      .refine((d) => !d.updated || d.updated >= d.date, { message: 'updated: must not be before date', path: ['updated'] }),
});

export const collections = { articles, authors };
