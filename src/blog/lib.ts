import { PATHS, type Lang } from '../i18n';
import { themeOf, type ThemeId } from './themes';

/**
 * Pure helpers of the articles section (no Astro import, so the tests can run them). The data side, which reads the
 * content collections, is in src/blog/data.ts.
 */

/** What the helpers need to know about an article. */
export interface PostLike {
  slug: string;
  lang: Lang;
  date: Date;
  updated?: Date;
  theme: ThemeId;
  featured: boolean;
  translationKey: string;
}

/** Article addresses: a file name is a slug (lower case, digits and hyphens), never one of the reserved words. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = ['theme', 'rss', 'index', 'page'];

export const articlesPath = (lang: Lang) => PATHS[lang].articles;
export const articlePath = (lang: Lang, slug: string) => `${PATHS[lang].articles}/${slug}`;
export const themePath = (lang: Lang, id: ThemeId) => `${PATHS[lang].articles}/theme/${themeOf(id)[lang].slug}`;
export const rssPath = (lang: Lang) => `${PATHS[lang].articles}/rss.xml`;

/** Em and en dashes are banned from every text of the site. */
export const DASH_RE = /[\u2013\u2014]/;

/** Words of the readable text of a Markdown body: code, tags, link targets and Markdown signs are left out. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/^---[\s\S]*?---/, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]+/g, ' ');
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Reading time in whole minutes, at 220 words a minute, one minute at least. */
export const readingMinutes = (markdown: string) => Math.max(1, Math.round(countWords(markdown) / 220));

export const byDateDesc = <T extends PostLike>(a: T, b: T) => b.date.getTime() - a.date.getTime() || a.slug.localeCompare(b.slug);

/** The article shown first: the latest one marked `featured`, else the latest one. */
export function pickFeatured<T extends PostLike>(posts: T[]): T | undefined {
  const sorted = [...posts].sort(byDateDesc);
  return sorted.find((p) => p.featured) ?? sorted[0];
}

/** Related articles: the same theme first (latest first), then the latest of the other themes. */
export function relatedTo<T extends PostLike>(post: T, posts: T[], n = 3): T[] {
  const others = posts.filter((p) => p.lang === post.lang && p.slug !== post.slug).sort(byDateDesc);
  const same = others.filter((p) => p.theme === post.theme);
  return [...same, ...others.filter((p) => p.theme !== post.theme)].slice(0, n);
}

/** "4 novembre 2026" or "4 November 2026". */
export const formatDate = (d: Date, lang: Lang) =>
  d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const minutesLabel = (n: number, lang: Lang) => (lang === 'en' ? `${n} min read` : `${n} min de lecture`);

/** French typography: a non-breaking space before : ; ! ? » and after «, so a colon never starts a line. */
export const typo = (s: string, lang: Lang) => (lang === 'fr' ? s.replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0') : s);
