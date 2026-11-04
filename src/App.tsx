import { useEffect, useMemo, useState } from 'react';
import { Footer, Header } from './components/Chrome';
import { baseForTargetNet, computePayslip, rulesFor } from './engine';
import { makeFmt } from './format';
import { RouterProvider, useRoute } from './i18n';
import { Home } from './pages/Home';
import { Sources } from './pages/Sources';
import { Terms } from './pages/Terms';
import { Understand } from './pages/Understand';
import { decode, encode, toInput, type AppState } from './state';

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

export default function App() {
  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}

function Shell() {
  const { page, lang, t } = useRoute();
  const rules = useMemo(() => rulesFor(today), []);
  const [s, setS] = useState<AppState>(initialState);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<AppState>) => setS((prev) => ({ ...prev, ...patch }));

  const computedBase = useMemo(() => (s.mode === 'net' ? baseForTargetNet(s.targetNet, toInput({ ...s, base: 0 }), rules) : s.base), [s, rules]);
  const slip = useMemo(() => computePayslip(toInput({ ...s, base: computedBase }), rules, lang), [s, computedBase, rules, lang]);

  useEffect(() => {
    const h = encode(s);
    if (page === 'home') window.history.replaceState(null, '', `${window.location.pathname}#${h}`);
    try {
      localStorage.setItem(SIM_KEY, h);
    } catch {
      /* not remembered */
    }
  }, [s, page]);

  useEffect(() => {
    const titles = {
      home: t('monsalaire · votre bulletin de paie au Togo', 'monsalaire · your payslip in Togo'),
      understand: t('Comprendre le calcul · monsalaire', 'How it is computed · monsalaire'),
      sources: t('Les textes officiels · monsalaire', 'Official texts · monsalaire'),
      terms: t("Conditions d'utilisation · monsalaire", 'Terms of use · monsalaire'),
    };
    document.title = titles[page];
  }, [page, t]);

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
      </main>
      <Footer rules={rules} />
    </>
  );
}
