import type { Lang } from '../i18n';
import { SITE } from '../seo';
import { postsIn } from './data';
import { articlePath, articlesPath, rssPath } from './lib';
import { themeName } from './themes';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed of the articles of one language: /articles/rss.xml and /en/articles/rss.xml. */
export async function rssFeed(lang: Lang): Promise<Response> {
  const posts = await postsIn(lang);
  const title = lang === 'en' ? 'monsalaire: articles' : 'monsalaire : articles';
  const description =
    lang === 'en'
      ? 'Dated, sourced articles on pay in Togo and French-speaking Africa.'
      : 'Articles datés et sourcés sur les salaires au Togo et en Afrique francophone.';
  const items = posts
    .map((p) => {
      const url = SITE + articlePath(lang, p.slug);
      const d = p.entry.data;
      return `    <item>
      <title>${esc(d.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(d.description)}</description>
      <pubDate>${d.date.toUTCString()}</pubDate>
      <category>${esc(themeName(p.theme, lang))}</category>
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${SITE}${articlesPath(lang)}</link>
    <description>${esc(description)}</description>
    <language>${lang === 'en' ? 'en-gb' : 'fr-fr'}</language>
    <atom:link href="${SITE}${rssPath(lang)}" rel="self" type="application/rss+xml"/>
${posts[0] ? `    <lastBuildDate>${(posts[0].entry.data.updated ?? posts[0].entry.data.date).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
