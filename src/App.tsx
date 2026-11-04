import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Footer, Header } from './components/Chrome';
import { baseForTargetNet, computePayslip, rulesFor } from './engine';
import { makeFmt } from './format';
import { RouterProvider, useRoute, type Lang, type Page } from './i18n';
import { META } from './seo';
import { Contact } from './views/Contact';
import { Home } from './views/Home';
import { Sources } from './views/Sources';
import { Terms } from './views/Terms';
import { Understand } from './views/Understand';
import { decode, defaultState, encode, toInput, type AppState } from './state';

const today = new Date().toISOString().slice(0, 10);
const SIM_KEY = 'monsalaire-simulation';

/** The simulation comes from the link first (shared links), else from this browser's last one, else defaults. */
function initialState(): AppState {
  if (window.location.hash.length > 1) return decode(window.location.hash);
  try {
    const saved = localStorage.getItem(SIM_KEY);
    if (saved) return decode(saved);
  } catch {
    /* storage blocked */
  }
  return decode('');
}

/** One React island per page: the static HTML is rendered with the defaults, the browser then restores the simulation. */
export default function App({ lang, page }: { lang: Lang; page: Page }) {
  return (
    <RouterProvider lang={lang} page={page}>
      <Shell />
    </RouterProvider>
  );
}

function Shell() {
  const { page, lang, t } = useRoute();
  const rules = useMemo(() => rulesFor(today), []);
  const [s, setS] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<AppState>) => setS((prev) => ({ ...prev, ...patch }));

  const computedBase = useMemo(() => (s.mode === 'net' ? baseForTargetNet(s.targetNet, toInput({ ...s, base: 0 }), rules) : s.base), [s, rules]);
  const slip = useMemo(() => computePayslip(toInput({ ...s, base: computedBase }), rules, lang), [s, computedBase, rules, lang]);

  // Read the shared link or the last simulation before the first paint, so the defaults never overwrite it.
  useLayoutEffect(() => {
    setS(initialState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const h = encode(s);
    if (page === 'home') window.history.replaceState(null, '', `${window.location.pathname}#${h}`);
    try {
      localStorage.setItem(SIM_KEY, h);
    } catch {
      /* not remembered */
    }
  }, [s, page, ready]);

  // A shared link opened in a tab already on the site only changes the hash: read it again.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash.length > 1 && window.location.hash.slice(1) !== encode(s)) setS(decode(window.location.hash));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [s]);

  useEffect(() => {
    document.title = META[lang][page].title;
  }, [page, lang]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: t('Ma simulation de salaire', 'My salary simulation'), text: `${t('Net à payer', 'Net pay')} : ${makeFmt(lang).fcfa(slip.netPay)}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* share sheet closed or clipboard blocked */
    }
  };

  return (
    <>
      <Header onShare={page === 'home' ? share : undefined} copied={copied} />
      <main className="wrap" id="contenu">
        {page === 'home' && <Home s={s} set={set} rules={rules} slip={slip} computedBase={computedBase} />}
        {page === 'understand' && <Understand s={s} rules={rules} slip={slip} computedBase={computedBase} />}
        {page === 'sources' && <Sources rules={rules} />}
        {page === 'terms' && <Terms />}
        {page === 'contact' && <Contact />}
      </main>
      <Footer rules={rules} />
    </>
  );
}
