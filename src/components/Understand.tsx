import type { Payslip } from '../engine';
import { fcfa, money, pct } from '../format';
import { Amount } from './Payslip';

interface Step {
  name: string;
  from: number;
  to: number;
  color: string;
  strong?: boolean;
  sign?: '−' | '+';
}

export function Waterfall({ slip }: { slip: Payslip }) {
  const cost = slip.employerCost;
  const gross = slip.grossTotal + slip.reimbursements;
  const afterContrib = gross - slip.employeeContributions;
  const afterTax = afterContrib - slip.irpp;
  const other = slip.netPay - afterTax;
  const steps: Step[] = [
    { name: 'Coût pour l’employeur', from: 0, to: cost, color: 'var(--ink-3)', strong: true },
    { name: 'Charges patronales', from: gross, to: cost, color: 'var(--line-2)', sign: '−' },
    { name: slip.reimbursements ? 'Brut et remboursements' : 'Salaire brut', from: 0, to: gross, color: 'var(--forest-3)', strong: true },
    { name: 'Vos cotisations', from: afterContrib, to: gross, color: 'var(--gold)', sign: '−' },
    { name: 'Impôt (IRPP)', from: afterTax, to: afterContrib, color: 'var(--red)', sign: '−' },
  ];
  if (other) steps.push({ name: other < 0 ? 'Avantages et retenues' : 'Autres versements', from: Math.min(afterTax, slip.netPay), to: Math.max(afterTax, slip.netPay), color: 'var(--ink-3)', sign: other < 0 ? '−' : '+' });
  steps.push({ name: 'Net à payer', from: 0, to: slip.netPay, color: 'var(--brand)', strong: true });
  const scale = Math.max(1, cost);

  return (
    <section className="card span-7" aria-labelledby="fall-title">
      <h3 id="fall-title">De ce que vous coûtez à ce que vous touchez</h3>
      <p className="lead">Chaque barre part de la précédente : ce que l'employeur dépense, puis ce que chacun prélève en route.</p>
      <div className="fall" role="list">
        {steps.map((st) => (
          <div key={st.name} role="listitem" className={`fall-row${st.strong ? ' strong' : ' minus'}`}>
            <span className="f-name">{st.name}</span>
            <span className="fall-track" aria-hidden="true">
              <span className="fall-bar" style={{ left: `${(st.from / scale) * 100}%`, width: `${Math.max(0.4, ((st.to - st.from) / scale) * 100)}%`, background: st.color }} />
            </span>
            <span className="f-amt">
              {st.sign ? `${st.sign} ` : ''}
              <Amount value={st.to - st.from} />
            </span>
          </div>
        ))}
      </div>
      <Hundred slip={slip} />
    </section>
  );
}

/** 100 dots: for every 100 F the employer spends, who ends up with what (largest remainder rounding). */
function Hundred({ slip }: { slip: Payslip }) {
  const total = slip.employerCost;
  if (total <= 0) return null;
  const parts = [
    { v: slip.netPay, c: 'var(--brand)' },
    { v: slip.employeeContributions, c: 'var(--gold)' },
    { v: slip.employerContributions, c: 'var(--line-2)' },
    { v: slip.irpp, c: 'var(--red)' },
    { v: Math.max(0, total - slip.netPay - slip.employeeContributions - slip.employerContributions - slip.irpp), c: 'var(--ink-3)' },
  ];
  const raw = parts.map((p) => (p.v / total) * 100);
  const n = raw.map(Math.floor);
  let left = 100 - n.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => [r - Math.floor(r), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        n[i]++;
        left--;
      }
    });
  const dots = parts.flatMap((p, i) => Array.from({ length: n[i] }, () => p.c));
  return (
    <>
      <div className="hundred" role="img" aria-label={`Sur 100 F dépensés par l'employeur, ${n[0]} F vous reviennent, ${n[1] + n[2]} F vont aux cotisations et ${n[3]} F à l'impôt.`}>
        {dots.map((c, i) => (
          <i key={i} style={{ ['--c' as string]: c }} />
        ))}
      </div>
      <div className="hundred-cap">
        Sur 100 F dépensés par l'employeur : {n[0]} F pour vous, {n[1]} F de vos cotisations, {n[2]} F de charges patronales, {n[3]} F d'impôt
        {n[4] ? `, ${n[4]} F d'avantages et retenues` : ''}.
      </div>
    </>
  );
}

export function TaxCard({ slip }: { slip: Payslip }) {
  const maxRate = Math.max(...slip.irppBrackets.map((b) => b.rate), 0.35);
  const active = [...slip.irppBrackets].reverse().find((b) => b.taxed > 0);
  return (
    <section className="card span-5" aria-labelledby="tax-title">
      <h3 id="tax-title">Comment votre impôt est calculé</h3>
      <p className="lead">Sur l'année, puis divisé par douze. Chaque taux ne frappe que la part du revenu qui tombe dans sa tranche.</p>
      <ol className="steps">
        {slip.irppSteps.map((st) => (
          <li key={st.label} className={st.kind}>
            <span>{st.label}</span>
            <span className="s-amt">
              {st.kind === 'minus' ? '− ' : ''}
              {money(st.amount)} F
            </span>
            {st.note && <span className="s-note">{st.note}</span>}
          </li>
        ))}
      </ol>
      <div className="stairs" role="img" aria-label="Barème par tranches : la part de votre revenu dans chaque tranche">
        {slip.irppBrackets.map((b) => {
          const size = b.to === null ? 10_000_000 : b.to - b.from;
          const fill = Math.min(1, b.taxed / size);
          return (
            <div key={b.from} className={`stair${active === b && b.rate > 0 ? ' active' : ''}`} style={{ height: `${24 + (b.rate / maxRate) * 76}%` }} title={`${money(b.from)} à ${b.to ? money(b.to) : '...'} : ${pct(b.rate, 0)}`}>
              <span className="rate">{pct(b.rate, 0)}</span>
              <span className="fill" style={{ height: `${fill * 100}%` }} />
              <span className="lbl">{b.to === null ? '20 M+' : b.to >= 1_000_000 ? `${b.to / 1_000_000} M` : `${b.to / 1000} k`}</span>
            </div>
          );
        })}
      </div>
      <div className="tax-foot">
        <span>
          Impôt du mois <b>{fcfa(slip.irpp)}</b>
        </span>
        <span>
          Taux moyen <b>{pct(slip.irppEffectiveRate, 1)}</b> du brut
        </span>
        <span>
          Tranche marginale <b>{pct(slip.marginalRate, 0)}</b>
        </span>
      </div>
    </section>
  );
}
