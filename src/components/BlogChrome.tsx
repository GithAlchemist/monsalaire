import type { Rules } from '../engine';
import { RouterProvider, type Lang, type Page } from '../i18n';
import { Footer, Header } from './Chrome';

/**
 * The site header and footer on the static article pages. Same components as the simulator, but every internal
 * link loads its page (there is no React app to switch views), and the language button goes to `altHref`: the
 * translation of the article, or the articles in the other language.
 */
interface Props {
  lang: Lang;
  page: Page;
  altHref: string;
}

export function BlogHeader({ lang, page, altHref }: Props) {
  return (
    <RouterProvider lang={lang} page={page} spa={false} altHref={altHref}>
      <Header />
    </RouterProvider>
  );
}

export function BlogFooter({ lang, page, altHref, rules }: Props & { rules: Pick<Rules, 'version' | 'verified_on'> }) {
  return (
    <RouterProvider lang={lang} page={page} spa={false} altHref={altHref}>
      <Footer rules={rules} />
    </RouterProvider>
  );
}
