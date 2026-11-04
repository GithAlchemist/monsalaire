import type { Payslip } from '../engine';
import { useFmt } from '../format';
import { useRoute } from '../i18n';
import { Amount } from './Payslip';

interface Step {
  name: string;
  from: number;
  to: number;
  color: string;
  strong?: boolean;
  sign?: '−' | '+';
}

/** From what the employer spends to what lands in the account: each bar starts where the previous one ended. */
export function Waterfall({ slip }: { slip: Payslip }) {
  const { t } = useRoute();
  const cost = slip.employerCost;
  const gross = slip.grossTotal + slip.reimbursements;
  const afterContrib = gross - slip.employeeContributions;
  const afterTax = afterContrib - slip.irpp;
  const other = slip.netPay - afterTax;
  const steps: Step[] = [
    { name: t('Coût pour l’employeur', 'Cost to the employer'), from: 0, to: cost, color: 'var(--ink-3)', strong: true },
    { name: t('Charges patronales', 'Employer contributions'), from: gross, to: cost, color: 'var(--line-2)', sign: '−' },
    { name: slip.reimbursements ? t('Brut et remboursements', 'Gross and reimbursements') : t('Salaire brut', 'Gross salary'), from: 0, to: gross, color: 'var(--forest-3)', strong: true },
    { name: t('Vos cotisations', 'Your contributions'), from: afterContrib, to: gross, color: 'var(--gold)', sign: '−' },
    { name: t('Impôt (IRPP)', 'Income tax (IRPP)'), from: afterTax, to: afterContrib, color: 'var(--red)', sign: '−' },
  ];
  if (other)
    steps.push({
      name: other < 0 ? t('Avantages et retenues', 'Benefits and deductions') : t('Autres versements', 'Other payments'),
      from: Math.min(afterTax, slip.netPay),
      to: Math.max(afterTax, slip.netPay),
      color: 'var(--ink-3)',
      sign: other < 0 ? '−' : '+',
    });
  steps.push({ name: t('Net à payer', 'Net pay'), from: 0, to: slip.netPay, color: 'var(--brand)', strong: true });
  const scale = Math.max(1, cost);

  return (
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
  );
}

/** 100 dots: for every 100 F the employer spends, who ends up with what (largest remainder rounding). */
export function Hundred({ slip }: { slip: Payslip }) {
  const { t } = useRoute();
  const { fcfa } = useFmt();
  const total = slip.employerCost;
  if (total <= 0) return null;
  const parts = [
    { v: slip.netPay, c: 'var(--brand)', label: t('Pour vous', 'You') },
    { v: slip.employeeContributions, c: 'var(--gold)', label: t('Vos cotisations', 'Your contributions') },
    { v: slip.employerContributions, c: 'var(--line-2)', label: t('Charges patronales', 'Employer contributions') },
    { v: slip.irpp, c: 'var(--red)', label: t('Impôt', 'Income tax') },
    { v: Math.max(0, total - slip.netPay - slip.employeeContributions - slip.employerContributions - slip.irpp), c: 'var(--ink-3)', label: t('Avantages et retenues', 'Benefits and deductions') },
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
    <div className="hundred-wrap">
      <div className="hundred" role="img" aria-label={t(`Sur 100 F dépensés par l'employeur, ${n[0]} F vous reviennent.`, `For every 100 F the employer spends, you take home ${n[0]} F.`)}>
        {dots.map((c, i) => (
          <i key={i} style={{ ['--c' as string]: c }} />
        ))}
      </div>
      <ul className="hundred-legend">
        {parts.map((p, i) =>
          n[i] || p.v ? (
            <li key={p.label}>
              <i style={{ background: p.c }} />
              <span>{p.label}</span>
              <b>{n[i]} F</b>
              <em>{fcfa(p.v)}</em>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

/** The progressive scale drawn as stairs: each step's height is its rate, the fill is the part of income in it. */
export function TaxStairs({ slip }: { slip: Payslip }) {
  const { t } = useRoute();
  const { pct, money } = useFmt();
  const maxRate = Math.max(...slip.irppBrackets.map((b) => b.rate), 0.35);
  const active = [...slip.irppBrackets].reverse().find((b) => b.taxed > 0);
  return (
    <div className="stairs" role="img" aria-label={t('Barème par tranches : la part de votre revenu dans chaque tranche', 'Tax brackets: how much of your income falls in each')}>
      {slip.irppBrackets.map((b) => {
        const size = b.to === null ? 10_000_000 : b.to - b.from;
        const fill = Math.min(1, b.taxed / size);
        return (
          <div key={b.from} className={`stair${active === b && b.rate > 0 ? ' active' : ''}`} style={{ height: `${24 + (b.rate / maxRate) * 76}%` }} title={`${money(b.from)} ${t('à', 'to')} ${b.to ? money(b.to) : '…'}${t(' :', ':')} ${pct(b.rate, 0)}`}>
            <span className="rate">{pct(b.rate, 0)}</span>
            <span className="fill" style={{ height: `${fill * 100}%` }} />
            <span className="lbl">{b.to === null ? '20 M+' : b.to >= 1_000_000 ? `${b.to / 1_000_000} M` : `${b.to / 1000} k`}</span>
          </div>
        );
      })}
    </div>
  );
}
