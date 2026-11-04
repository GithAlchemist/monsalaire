import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n';
import { byDateDesc, readingMinutes, RESERVED_SLUGS, SLUG_RE, type PostLike } from './lib';
import { THEMES, type ThemeId } from './themes';

/** Data side of the articles section: reads the content collections (build time only). */

export type ArticleEntry = CollectionEntry<'articles'>;
export type AuthorEntry = CollectionEntry<'authors'>;

export interface Post extends PostLike {
  entry: ArticleEntry;
  minutes: number;
}

let cache: Promise<Post[]> | undefined;

/**
 * Every published article, latest first. Drafts are kept in `npm run dev` only. The file must sit in the folder of
 * its language (src/content/articles/fr/... for `lang: fr`), and its name is the address of the article.
 */
export function allPosts(): Promise<Post[]> {
  cache ??= (async () => {
    const entries = await getCollection('articles', (e) => import.meta.env.DEV || !e.data.draft);
    const posts = entries.map((entry) => {
      const [folder, ...rest] = entry.id.split('/');
      const slug = rest.join('/');
      const file = `src/content/articles/${entry.id}`;
      if (folder !== entry.data.lang) throw new Error(`${file}: lang is "${entry.data.lang}" but the file is in the "${folder}" folder.`);
      const { width, height } = entry.data.cover;
      if (width !== 1200 || height !== 630) throw new Error(`${file}: the cover is ${width} x ${height} px; it must be exactly 1200 x 630 px (it is also the social preview).`);
      if (!SLUG_RE.test(slug) || RESERVED_SLUGS.includes(slug)) throw new Error(`${file}: the file name must be lower case words joined by hyphens (not ${RESERVED_SLUGS.join(', ')}).`);
      return {
        entry,
        slug,
        lang: entry.data.lang,
        date: entry.data.date,
        updated: entry.data.updated,
        theme: entry.data.theme,
        featured: entry.data.featured,
        translationKey: entry.data.translationKey,
        minutes: readingMinutes(entry.body ?? ''),
      } satisfies Post;
    });
    for (const lang of ['fr', 'en'] as Lang[]) {
      const seen = new Map<string, string>();
      for (const p of posts.filter((x) => x.lang === lang)) {
        const other = seen.get(p.translationKey);
        if (other) throw new Error(`translationKey "${p.translationKey}" is used by two ${lang} articles: ${other} and ${p.slug}.`);
        seen.set(p.translationKey, p.slug);
      }
    }
    return posts.sort(byDateDesc);
  })();
  return cache;
}

export const postsIn = async (lang: Lang) => (await allPosts()).filter((p) => p.lang === lang);

/** The same article in the other language, when it exists. */
export async function translationOf(post: Post): Promise<Post | undefined> {
  return (await allPosts()).find((p) => p.lang !== post.lang && p.translationKey === post.translationKey);
}

export async function authorOf(post: Post): Promise<AuthorEntry> {
  const a = await getEntry(post.entry.data.author);
  if (!a) throw new Error(`src/content/articles/${post.entry.id}: unknown author "${post.entry.data.author.id}" (src/content/authors).`);
  return a;
}

/** Number of articles per theme in a language, in the fixed order of the themes. */
export function themeCounts(posts: Post[]): { id: ThemeId; count: number }[] {
  return THEMES.map((t) => ({ id: t.id, count: posts.filter((p) => p.theme === t.id).length }));
}
