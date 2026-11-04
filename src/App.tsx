import { useEffect, useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { Icon } from './components/fields';
import { Library } from './components/Library';
import { Amount, Payslip } from './components/Payslip';
import { TaxCard, Waterfall } from './components/Understand';
import { baseForTargetNet, categoryMinimum, computePayslip, rulesFor } from './engine';
import { fcfa, pct } from './format';
import { useTheme, useTweened, type Theme } from './hooks';
import { decode, encode, toInput, type AppState } from './state';

const today = new Date().toISOString().slice(0, 10);
const REPO = 'https://github.com/GithAlchemist/monsalaire';

export default function App() {
  const rules = useMemo(() => rulesFor(today), []);
  const [s, setS] = useState<AppState>(() => decode(window.location.hash));
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const set = (patch: Partial<AppState>) => setS((prev) => ({ ...prev, ...patch }));

  const computedBase = useMemo(() => (s.mode === 'net' ? baseForTargetNet(s.targetNet, toInput({ ...s, base: 0 }), rules) : s.base), [s, rules]);
  const slip = useMemo(() => computePayslip(toInput({ ...s, base: computedBase }), rules), [s, computedBase, rules]);
  const k = period === 'year' ? 12 : 1;
  const netShown = useTweened(slip.netPay * k);

  useEffect(() => {
    window.history.replaceState(null, '', `#${encode(s)}`);
  }, [s]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const sheet = document.querySelector('.netbox');
      if (sheet) {
        const r = sheet.getBoundingClientRect();
        setDockHidden(r.top < window.innerHeight && r.bottom > 0);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Ma simulation de salaire', text: `Net à payer : ${fcfa(slip.netPay)} par mois`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the user closed the share sheet or the clipboard is blocked */
    }
  };

  const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
  const themeLabel: Record<Theme, string> = { system: 'Thème : celui de l’appareil', light: 'Thème : clair', dark: 'Thème : sombre' };
  const catMin = categoryMinimum(rules, s.category, s.echelon);
  const categoryText = s.category ? `${s.category}${(rules.categories.grid[s.category]?.length ?? 0) > 1 ? ` échelon ${'ABC'[s.echelon]}` : ''}` : '';

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap header-in">
          <a className="brand" href="#" aria-label="monsalaire, haut de page" onClick={() => window.scrollTo({ top: 0 })}>
            <img src="/logo.svg" alt="" width={30} height={30} />
            monsalaire <span className="tg">TG</span>
          </a>
          <nav className="nav" aria-label="Sections">
            <a href="#simulateur">Simulateur</a>
            <a href="#comprendre">Comprendre</a>
            <a href="#textes">Les textes</a>
          </nav>
          <div className="header-actions">
            <button type="button" className="btn has-label" onClick={share} aria-label="Partager cette simulation">
              <Icon.share />
              <span className="label-md">{copied ? 'Lien copié' : 'Partager'}</span>
            </button>
            <button type="button" className="btn icon" onClick={() => window.print()} aria-label="Imprimer le bulletin">
              <Icon.print />
            </button>
            <button type="button" className="btn icon" onClick={() => setTheme(nextTheme[theme])} aria-label={themeLabel[theme]} title={themeLabel[theme]}>
              {theme === 'light' ? <Icon.sun /> : theme === 'dark' ? <Icon.moon /> : <Icon.auto />}
            </button>
            <a className="btn icon" href={REPO} target="_blank" rel="noreferrer" aria-label="Code source sur GitHub">
              <Icon.github />
            </a>
          </div>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div>
            <span className="eyebrow">
              <span className="flag" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <b />
              </span>
              Togo · textes en vigueur vérifiés le {new Date(rules.verified_on).toLocaleDateString('fr-FR')}
            </span>
            <h1>
              Votre bulletin de paie, <em>calculé sous vos yeux.</em>
            </h1>
          </div>
          <div className="hero-side">
            <p>Tapez un salaire : cotisations, impôt et net se recalculent à chaque chiffre.</p>
            <ul className="checks">
              <li>
                <Icon.check /> Chaque ligne renvoie à son article de loi
              </li>
              <li>
                <Icon.check /> Du brut au net, ou du net au brut à négocier
              </li>
              <li>
                <Icon.check /> Gratuit, libre, sans compte ni donnée collectée
              </li>
            </ul>
          </div>
        </section>

        <div className="desk" id="simulateur">
          <Controls s={s} set={set} rules={rules} computedBase={computedBase} />

          <div className="stage" id="resultat">
            <div className="summary" aria-live="polite">
              <div className="net">
                <div className="k-label">
                  Net à payer
                  <span className="period-toggle" role="group" aria-label="Période">
                    <button type="button" aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>
                      Mois
                    </button>
                    <button type="button" aria-pressed={period === 'year'} onClick={() => setPeriod('year')}>
                      Année
                    </button>
                  </span>
                </div>
                <div className="k-value">
                  {fcfa(netShown).replace(' F', '')}
                  <small>F</small>
                </div>
                <div className="k-sub">{slip.grossTotal > 0 ? `${pct(slip.netSalary / slip.grossTotal, 1)} du brut, ${period === 'year' ? 'sur douze mois' : 'ce mois-ci'}` : 'Saisissez un salaire'}</div>
              </div>
              <div>
                <div className="k-label">Brut</div>
                <div className="k-value">
                  <Amount value={slip.grossTotal * k} />
                </div>
                <div className="k-sub">{s.mode === 'net' ? `base ${fcfa(computedBase)}` : catMin ? `minimum ${s.category} : ${fcfa(catMin)}` : 'primes comprises'}</div>
              </div>
              <div>
                <div className="k-label">Coût employeur</div>
                <div className="k-value">
                  <Amount value={slip.employerCost * k} />
                </div>
                <div className="k-sub">dont {fcfa(slip.employerContributions * k)} de charges</div>
              </div>
            </div>

            {slip.warnings.map((w) => (
              <div className="warn" role="status" key={w}>
                <Icon.alert />
                <span>{w}</span>
              </div>
            ))}

            <Payslip slip={slip} rules={rules} statusLabel={s.status === 'apprentice' ? 'Apprenti sous contrat' : 'Salarié du secteur privé'} category={categoryText} />
          </div>
        </div>

        <section className="section" id="comprendre">
          <div className="section-head">
            <div>
              <div className="kicker">01 · Comprendre</div>
              <h2>
                Où va <em>chaque franc</em>
              </h2>
            </div>
            <p>Le salaire brut n'est ni ce que vous touchez, ni ce que vous coûtez. Voici le chemin complet, et le détail de l'impôt, étape par étape.</p>
          </div>
          <div className="cards">
            <Waterfall slip={slip} />
            <TaxCard slip={slip} />
          </div>
        </section>

        <section className="section" id="textes">
          <div className="section-head">
            <div>
              <div className="kicker">02 · Les textes</div>
              <h2>
                Rien n'est inventé, <em>tout est sourcé</em>
              </h2>
            </div>
            <p>
              Chaque taux vient d'un texte officiel, archivé et transcrit page par page dans le dépôt. Les règles sont des données datées : une nouvelle loi de finances se reporte sans toucher au calcul.
            </p>
          </div>
          <Library rules={rules} />
        </section>

        <section className="teaser" aria-labelledby="teaser-title">
          <div>
            <h2 id="teaser-title">
              Bientôt : le même salaire, <em>ailleurs.</em>
            </h2>
            <p>Comparer ce que vaut vraiment un revenu au Togo, au Bénin, au Sénégal ou en Côte d'Ivoire, net d'impôts et corrigé du coût de la vie.</p>
          </div>
          <div className="countries" aria-hidden="true">
            <span className="on">Togo</span>
            <span>Bénin</span>
            <span>Sénégal</span>
            <span>Côte d'Ivoire</span>
            <span>Burkina Faso</span>
            <span>Ghana</span>
          </div>
        </section>

        <footer className="footer">
          <span>Simulation indicative pour un salarié du secteur privé (régime général CNSS et AMU). Elle ne remplace pas le bulletin de votre employeur.</span>
          <span>
            Projet libre (MIT) ·{' '}
            <a href={REPO} target="_blank" rel="noreferrer">
              code et textes sur GitHub
            </a>
          </span>
        </footer>
      </main>

      <a className={`dock${dockHidden ? ' hidden' : ''}`} href="#resultat" aria-label="Voir le bulletin">
        <span>
          <span className="d-l">Net à payer</span>
          <br />
          <span className="d-v">{fcfa(slip.netPay)}</span>
        </span>
        <span className="d-go">Voir le bulletin ↓</span>
      </a>
    </>
  );
}
