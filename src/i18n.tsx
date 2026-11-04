import { createContext, useCallback, useContext, useEffect, useState, type MouseEvent, type ReactNode } from 'react';

export type Lang = 'fr' | 'en';
export type Page = 'home' | 'understand' | 'articles' | 'sources' | 'terms' | 'contact';

/** Every page has a French and an English address. French lives at the root, English under /en. */
export const PATHS: Record<Lang, Record<Page, string>> = {
  fr: { home: '/', understand: '/comprendre', articles: '/articles', sources: '/textes', terms: '/conditions', contact: '/contact' },
  en: { home: '/en', understand: '/en/understand', articles: '/en/articles', sources: '/en/sources', terms: '/en/terms', contact: '/en/contact' },
};

/**
 * Pages drawn by the React app (src/App.tsx), built by src/pages/[...path].astro and switched without reloading.
 * The articles live in static Astro pages (src/pages/articles, src/pages/en/articles): links to them always load.
 */
export const APP_PAGES: Page[] = ['home', 'understand', 'sources', 'terms', 'contact'];

export function parsePath(pathname: string): { lang: Lang; page: Page } {
  const p = pathname.replace(/\/+$/, '') || '/';
  for (const lang of ['en', 'fr'] as Lang[]) {
    for (const [page, path] of Object.entries(PATHS[lang]) as [Page, string][]) {
      if (p === path) return { lang, page };
    }
  }
  return { lang: p.startsWith('/en') ? 'en' : 'fr', page: 'home' };
}

const LANG_KEY = 'monsalaire-lang';

/**
 * Every page is rendered to static HTML at build time with its language and page, then hydrated in the browser.
 * The first-visit language redirect of "/" runs in an inline script of the page head (see src/layouts/Base.astro),
 * before anything is painted.
 */
interface Ctx {
  lang: Lang;
  page: Page;
  /** False on the static article pages: every internal link is then a plain page load. */
  spa: boolean;
  /** Address of this page in the other language, when it is not the other language's version of `page` (articles). */
  altHref?: string;
  go: (page: Page, lang?: Lang) => void;
  href: (page: Page, lang?: Lang) => string;
  t: (fr: string, en: string) => string;
}

const RouteContext = createContext<Ctx | null>(null);

export function RouterProvider({ lang, page, spa = true, altHref, children }: { lang: Lang; page: Page; spa?: boolean; altHref?: string; children: ReactNode }) {
  const [route, setRoute] = useState<{ lang: Lang; page: Page }>({ lang, page });

  useEffect(() => {
    if (!spa) return;
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [spa]);

  useEffect(() => {
    document.documentElement.lang = route.lang;
    try {
      localStorage.setItem(LANG_KEY, route.lang);
    } catch {
      /* not remembered: fine */
    }
  }, [route.lang]);

  const href = useCallback((page: Page, lang?: Lang) => PATHS[lang ?? route.lang][page], [route.lang]);

  const go = useCallback(
    (page: Page, lang?: Lang) => {
      const l = lang ?? route.lang;
      // The simulation lives in the hash of the home page: keep it when switching language on the home page.
      const keepHash = page === 'home' && route.page === 'home' ? window.location.hash : '';
      window.history.pushState(null, '', PATHS[l][page] + keepHash);
      setRoute({ lang: l, page });
      if (page !== route.page) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [route],
  );

  const t = useCallback((fr: string, en: string) => (route.lang === 'en' ? en : fr), [route.lang]);

  return <RouteContext.Provider value={{ ...route, spa, altHref, go, href, t }}>{children}</RouteContext.Provider>;
}

export function useRoute(): Ctx {
  const c = useContext(RouteContext);
  if (!c) throw new Error('useRoute outside RouterProvider');
  return c;
}

/** Internal link: a real <a href> (works without JavaScript, opens in a new tab), handled by the router on click. */
export function Link({ to, lang, className, children, onClick, ...rest }: { to: Page; lang?: Lang; className?: string; children: ReactNode; onClick?: () => void; 'aria-current'?: 'page'; hrefLang?: string; title?: string }) {
  const { go, href, spa } = useRoute();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    // Pages outside the React app (articles), or any link from an article page: let the browser load the page.
    if (!spa || !APP_PAGES.includes(to)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onClick?.();
    go(to, lang);
  };
  return (
    <a href={href(to, lang)} className={className} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
