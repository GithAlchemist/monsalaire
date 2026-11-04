import { useEffect, useMemo, useState } from 'react';
import { Split, SourcesCard, TaxCard } from './components/Explain';
import { Inputs } from './components/Inputs';
import { Payslip } from './components/Payslip';
import { baseForTargetNet, computePayslip, rulesFor } from './engine';
import { fcfa, money, pct } from './format';
import { decode, encode, toInput, type AppState } from './state';

const today = new Date().toISOString().slice(0, 10);

export default function App() {
  const rules = useMemo(() => rulesFor(today), []);
  const [s, setS] = useState<AppState>(() => decode(window.location.hash));
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<AppState>) => setS((prev) => ({ ...prev, ...patch }));

  // Net mode: find the base salary that gives the target net, every other parameter unchanged.
  const computedBase = useMemo(
    () => (s.mode === 'net' ? baseForTargetNet(s.targetNet, toInput({ ...s, base: 0 }), rules) : s.base),
    [s, rules],
  );
  const slip = useMemo(() => computePayslip(toInput({ ...s, base: computedBase }), rules), [s, computedBase, rules]);

  useEffect(() => {
    const h = encode(s);
    window.history.replaceState(null, '', h ? `#${h}` : window.location.pathname);
  }, [s]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copiez ce lien :', window.location.href);
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="monsalaire, accueil">
          <img src="/logo.svg" alt="" width={32} height={32} />
          monsalaire <small>Togo</small>
        </a>
        <div className="topbar-actions">
          <button type="button" className="btn" onClick={share}>
            {copied ? 'Lien copié' : 'Partager'}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            Imprimer
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="flagbar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1>
          Votre bulletin de paie, <em>calculé sous vos yeux.</em>
        </h1>
        <p>
          Saisissez votre salaire : le brut, les cotisations, l'impôt et le net se recalculent à chaque chiffre, selon les textes en vigueur au
          Togo.
        </p>
      </section>

      <div className="grid">
        <Inputs s={s} set={set} rules={rules} computedBase={computedBase} />

        <main className="results" id="resultat">
          <div className="kpis">
            <div className="kpi main">
              <div className="k-label">Net à payer</div>
              <div className="k-value">{fcfa(slip.netPay)}</div>
              <div className="k-sub">{slip.grossTotal > 0 ? `${pct(slip.netSalary / slip.grossTotal, 1)} du brut` : 'par mois'}</div>
            </div>
            <div className="kpi">
              <div className="k-label">Brut</div>
              <div className="k-value">{money(slip.grossTotal)}</div>
              <div className="k-sub">{s.mode === 'net' ? `Base : ${fcfa(computedBase)}` : 'par mois'}</div>
            </div>
            <div className="kpi">
              <div className="k-label">Coût employeur</div>
              <div className="k-value">{money(slip.employerCost)}</div>
              <div className="k-sub">+{fcfa(slip.employerContributions)} de charges</div>
            </div>
          </div>

          {slip.warnings.map((w) => (
            <div className="warn" role="status" key={w}>
              <span aria-hidden="true">⚠︎</span>
              <span>{w}</span>
            </div>
          ))}

          <Payslip slip={slip} rules={rules} dependents={s.dependents} />
          <Split slip={slip} />
          <TaxCard slip={slip} />
          <SourcesCard rules={rules} />
        </main>
      </div>

      <footer className="footer">
        <span>
          Simulation indicative pour un salarié du secteur privé (régime général CNSS et AMU). Elle ne remplace pas le bulletin de votre
          employeur.
        </span>
        <span>
          Projet libre et ouvert ·{' '}
          <a href="https://github.com/GithAlchemist/monsalaire" target="_blank" rel="noreferrer">
            code source
          </a>
        </span>
      </footer>

      <a className="mobile-net" href="#resultat">
        <span>Net à payer</span>
        <span className="num">{fcfa(slip.netPay)}</span>
      </a>
    </div>
  );
}
