import type { Payslip, Rules } from '../engine';
import { fcfa, money, pct } from '../format';

export function Split({ slip }: { slip: Payslip }) {
  const parts = [
    { label: 'Votre net', value: slip.netSalary, color: 'var(--brand)' },
    { label: 'Vos cotisations', value: slip.employeeContributions, color: 'var(--gold)' },
    { label: 'Impôt (IRPP)', value: slip.irpp, color: 'var(--red)' },
    { label: 'Charges patronales', value: slip.employerContributions, color: 'var(--line-strong)' },
  ];
  const total = slip.employerCost - slip.reimbursements;
  return (
    <section className="split" aria-label="Répartition du coût total">
      <div className="kpi" style={{ padding: 0, boxShadow: 'none', background: 'none' }}>
        <div className="k-label">Sur {fcfa(total)} dépensés par l'employeur</div>
      </div>
      <div className="split-bar" role="img" aria-label="Répartition du coût employeur">
        {parts.map((p) => (
          <span key={p.label} style={{ flexGrow: Math.max(0, p.value), background: p.color }} />
        ))}
      </div>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.label}>
            <i style={{ background: p.color }} />
            {p.label}
            <b>{total > 0 ? pct(p.value / total, 0) : '0 %'}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

export function TaxCard({ slip }: { slip: Payslip }) {
  const maxTaxed = Math.max(1, ...slip.irppBrackets.map((b) => b.taxed));
  return (
    <section className="card">
      <h3>Comment votre impôt est calculé</h3>
      <p className="lead">
        L'IRPP se calcule sur l'année, puis l'employeur en retient un douzième chaque mois. Le barème est progressif : chaque taux ne
        s'applique qu'à la part du revenu qui se trouve dans sa tranche.
      </p>
      <ol className="steps">
        {slip.irppSteps.map((st, i) => (
          <li key={st.label} className={i >= 4 ? 'strong' : undefined}>
            <span>{st.label}</span>
            <span className="s-amount">
              {st.amount < 0 ? '− ' : ''}
              {money(Math.abs(st.amount))} F
            </span>
            {st.note && <span className="s-note">{st.note}</span>}
          </li>
        ))}
      </ol>
      <div className="brackets" aria-label="Barème par tranches">
        {slip.irppBrackets.map((b) => (
          <div key={b.from} className={`bracket${b.taxed ? '' : ' off'}`}>
            <span className="num" style={{ color: 'var(--fg-muted)' }}>
              {b.to === null ? `+ de ${money(b.from)}` : `${money(b.from)} à ${money(b.to)}`}
            </span>
            <span className="r">{pct(b.rate, 0)}</span>
            <span className="track">
              <span className="fill" style={{ display: 'block', width: `${(b.taxed / maxTaxed) * 100}%` }} />
            </span>
            <span className="t">{money(b.tax)} F</span>
          </div>
        ))}
      </div>
      <p className="lead" style={{ marginTop: 14, marginBottom: 0 }}>
        Taux moyen : <strong className="num">{pct(slip.irppEffectiveRate, 1)}</strong> de votre brut. Taux marginal :{' '}
        <strong className="num">{pct(slip.marginalRate, 0)}</strong> (ce que paie chaque franc de plus, avant cotisations et abattement).
      </p>
    </section>
  );
}

export function SourcesCard({ rules }: { rules: Rules }) {
  return (
    <section className="card">
      <h3>Sources et limites</h3>
      <p className="lead">
        Chaque taux vient d'un texte public. Les règles sont des données, versionnées par date, séparées du moteur de calcul : une nouvelle loi
        de finances se reporte sans toucher au code.
      </p>
      <div className="two">
        <div>
          <ul className="sources">
            {Object.entries(rules.sources).map(([id, s]) => (
              <li key={id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
                <br />
                <span style={{ color: 'var(--fg-subtle)' }}>{s.publisher}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ul className="sources">
            {rules.not_modeled.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
