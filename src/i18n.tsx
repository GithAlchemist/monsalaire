import { createContext, useCallback, useContext, useEffect, useState, type MouseEvent, type ReactNode } from 'react';

export type Lang = 'fr' | 'en';
export type Page = 'home' | 'understand' | 'sources' | 'terms';

/** Every page has a French and an English address. French lives at the root, English under /en. */
export const PATHS: Record<Lang, Record<Page, string>> = {
  fr: { home: '/', understand: '/comprendre', sources: '/textes', terms: '/conditions' },
  en: { home: '/en', understand: '/en/understand', sources: '/en/sources', terms: '/en/terms' },
};

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

/** First visit to "/" from a device that is not set to French: go to the English home, once. */
function initialRoute(): { lang: Lang; page: Page } {
  const r = parsePath(window.location.pathname);
  if (window.location.pathname === '/' || window.location.pathname === '') {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LANG_KEY);
    } catch {
      /* storage blocked: decide from the device language */
    }
    const device = (navigator.languages?.[0] ?? navigator.language ?? 'fr').toLowerCase();
    const want: Lang = stored === 'en' || stored === 'fr' ? stored : device.startsWith('fr') ? 'fr' : 'en';
    if (want === 'en') {
      window.history.replaceState(null, '', PATHS.en.home + window.location.hash);
      return { lang: 'en', page: 'home' };
    }
  }
  return r;
}

interface Ctx {
  lang: Lang;
  page: Page;
  go: (page: Page, lang?: Lang) => void;
  href: (page: Page, lang?: Lang) => string;
  t: (fr: string, en: string) => string;
}

const RouteContext = createContext<Ctx | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(initialRoute);

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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

  return <RouteContext.Provider value={{ ...route, go, href, t }}>{children}</RouteContext.Provider>;
}

export function useRoute(): Ctx {
  const c = useContext(RouteContext);
  if (!c) throw new Error('useRoute outside RouterProvider');
  return c;
}

/** Internal link: a real <a href> (works without JavaScript, opens in a new tab), handled by the router on click. */
export function Link({ to, lang, className, children, onClick, ...rest }: { to: Page; lang?: Lang; className?: string; children: ReactNode; onClick?: () => void; 'aria-current'?: 'page'; hrefLang?: string; title?: string }) {
  const { go, href } = useRoute();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
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
