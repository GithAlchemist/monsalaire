import { rulesFor } from '../engine';
import { PATHS, type Lang, type Page } from '../i18n';
import { SITE } from '../seo';

/** Sitemap with the French and English version of every page linked to each other (hreflang). */
export function GET() {
  const lastmod = rulesFor(new Date().toISOString().slice(0, 10)).verified_on;
  const abs = (lang: Lang, page: Page) => SITE + (PATHS[lang][page] === '/' ? '' : PATHS[lang][page]);
  const pages = Object.keys(PATHS.fr) as Page[];
  const urls = (['fr', 'en'] as Lang[]).flatMap((lang) =>
    pages.map(
      (page) => `  <url>
    <loc>${abs(lang, page)}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="fr" href="${abs('fr', page)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs('en', page)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('fr', page)}"/>
  </url>`,
    ),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
