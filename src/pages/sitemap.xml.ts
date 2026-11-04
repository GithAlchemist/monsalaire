import { allPosts, themeCounts } from '../blog/data';
import { articlePath, isoDate, themePath } from '../blog/lib';
import { rulesFor } from '../engine';
import { APP_PAGES, PATHS, type Lang } from '../i18n';
import { SITE } from '../seo';

type Alt = Partial<Record<Lang, string>>;

/** Sitemap: every page with its other-language version (hreflang), the articles and the theme pages that have some. */
export async function GET() {
  const lastmod = rulesFor(new Date().toISOString().slice(0, 10)).verified_on;
  const abs = (path: string) => SITE + (path === '/' ? '' : path);
  const posts = await allPosts();
  const latest = posts[0] ? isoDate(posts[0].entry.data.updated ?? posts[0].entry.data.date) : lastmod;
  const entries: { path: string; lastmod: string; alt: Alt }[] = [];

  for (const lang of ['fr', 'en'] as Lang[]) {
    for (const page of APP_PAGES) entries.push({ path: PATHS[lang][page], lastmod, alt: { fr: PATHS.fr[page], en: PATHS.en[page] } });
    entries.push({ path: PATHS[lang].articles, lastmod: latest, alt: { fr: PATHS.fr.articles, en: PATHS.en.articles } });
  }
  for (const p of posts) {
    const twin = posts.find((q) => q.lang !== p.lang && q.translationKey === p.translationKey);
    const alt: Alt = { [p.lang]: articlePath(p.lang, p.slug) };
    if (twin) alt[twin.lang] = articlePath(twin.lang, twin.slug);
    entries.push({ path: articlePath(p.lang, p.slug), lastmod: isoDate(p.entry.data.updated ?? p.entry.data.date), alt });
  }
  // Theme pages with at least one article (empty ones are built with noindex).
  const counts = { fr: themeCounts(posts.filter((p) => p.lang === 'fr')), en: themeCounts(posts.filter((p) => p.lang === 'en')) };
  for (const lang of ['fr', 'en'] as Lang[]) {
    const other: Lang = lang === 'fr' ? 'en' : 'fr';
    for (const c of counts[lang].filter((x) => x.count > 0)) {
      const themed = posts.filter((p) => p.lang === lang && p.theme === c.id);
      const alt: Alt = { [lang]: themePath(lang, c.id) };
      if (counts[other].find((x) => x.id === c.id)!.count > 0) alt[other] = themePath(other, c.id);
      entries.push({ path: themePath(lang, c.id), lastmod: isoDate(themed[0].entry.data.updated ?? themed[0].entry.data.date), alt });
    }
  }

  const urls = entries.map(({ path, lastmod, alt }) => {
    const links =
      Object.keys(alt).length > 1
        ? (['fr', 'en'] as Lang[])
            .map((l) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(alt[l]!)}"/>`)
            .join('') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(alt.fr!)}"/>`
        : '';
    return `  <url>
    <loc>${abs(path)}</loc>
    <lastmod>${lastmod}</lastmod>${links}
  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
