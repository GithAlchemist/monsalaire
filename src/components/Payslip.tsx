import { Fragment, useState } from 'react';
import type { PayLine, Payslip as Slip, Rules } from '../engine';
import { money, monthLabel, pct } from '../format';

const dash = <span className="muted">·</span>;

export function Payslip({ slip, rules, dependents }: { slip: Slip; rules: Rules; dependents: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const [employer, setEmployer] = useState(true);

  const earnings = slip.lines.filter((l) => l.kind === 'earning' || l.kind === 'benefit');
  const contributions = slip.lines.filter((l) => l.kind === 'contribution');
  const tax = slip.lines.filter((l) => l.kind === 'tax');
  const after = slip.lines.filter((l) => l.kind === 'reimbursement' || l.kind === 'deduction');
  const cols = employer ? 6 : 5;

  const row = (l: PayLine) => {
    const isOpen = open === l.id;
    const isGain = l.kind === 'earning' || l.kind === 'benefit' || l.kind === 'reimbursement';
    const rate =
      l.id === 'amu'
        ? `${pct(rules.social.amu.employee_rate)}`
        : l.rate !== undefined
          ? l.kind === 'earning' && l.id.startsWith('ot_')
            ? `× ${l.rate.toLocaleString('fr-FR')}`
            : pct(l.rate)
          : null;
    return (
      <Fragment key={l.id}>
        <tr>
          <td>
            <button type="button" className="line-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : l.id)}>
              {l.label}
            </button>
            {l.quantity !== undefined && <span className="muted"> · {l.quantity} h</span>}
          </td>
          <td className="hide-sm muted">{l.base !== undefined ? money(l.base) : dash}</td>
          <td className="hide-sm muted">{rate ?? dash}</td>
          <td>{isGain && l.employee ? money(l.employee) : dash}</td>
          <td className="neg">{!isGain && l.employee ? money(l.employee) : dash}</td>
          {employer && <td className="col-employer">{l.employer ? money(l.employer) : dash}</td>}
        </tr>
        {isOpen && (
          <tr className="explain">
            <td colSpan={cols}>
              {l.explain}
              {l.sourceId && rules.sources[l.sourceId] && (
                <>
                  {' '}
                  <a href={rules.sources[l.sourceId].url} target="_blank" rel="noreferrer">
                    {rules.sources[l.sourceId].title}
                    {l.article ? `, ${l.article}` : ''}
                  </a>
                </>
              )}
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  const group = (title: string) => (
    <tr className="group">
      <td colSpan={cols}>{title}</td>
    </tr>
  );

  return (
    <article className="paper" aria-label="Bulletin de paie simulé">
      <header className="paper-head">
        <div>
          <h2>Bulletin de paie</h2>
          <div className="period">{monthLabel()}</div>
        </div>
        <div className="paper-meta">
          <div>Salarié du secteur privé</div>
          <div>
            Personnes à charge : <span className="num">{Math.min(dependents, rules.irpp.dependents.max)}</span>
          </div>
          <div>
            Taux horaire : <span className="num">{money(slip.hourlyRate)} F</span>
          </div>
        </div>
      </header>

      <table className="slip">
        <thead>
          <tr>
            <th scope="col">Libellé</th>
            <th scope="col" className="hide-sm">
              Base
            </th>
            <th scope="col" className="hide-sm">
              Taux
            </th>
            <th scope="col">Gains</th>
            <th scope="col">Retenues</th>
            {employer && <th scope="col">Employeur</th>}
          </tr>
        </thead>
        <tbody>
          {group('Rémunération')}
          {earnings.map(row)}
          <tr className="total">
            <td>Salaire brut</td>
            <td className="hide-sm" />
            <td className="hide-sm" />
            <td>{money(slip.grossTotal)}</td>
            <td />
            {employer && <td />}
          </tr>
          {group('Cotisations sociales')}
          {contributions.map(row)}
          {group('Impôt')}
          {tax.map(row)}
          {after.length > 0 && group('Hors brut')}
          {after.map(row)}
          <tr className="total">
            <td>Total</td>
            <td className="hide-sm" />
            <td className="hide-sm" />
            <td>{money(slip.grossTotal + slip.reimbursements)}</td>
            <td className="neg">{money(slip.employeeContributions + slip.irpp + slip.benefitsInKind + slip.otherDeductions)}</td>
            {employer && <td className="col-employer">{money(slip.employerContributions)}</td>}
          </tr>
        </tbody>
      </table>

      <div className="netbox">
        <span className="label">Net à payer</span>
        <span className="value">{money(slip.netPay)} F</span>
      </div>

      <footer className="paper-foot">
        <label className="toggle-line no-print">
          <input type="checkbox" checked={employer} onChange={(e) => setEmployer(e.target.checked)} />
          Afficher la part employeur
        </label>
        <span>Touchez une ligne pour comprendre son calcul.</span>
        <span>
          Règles {rules.version}, en vigueur depuis le {new Date(rules.valid_from).toLocaleDateString('fr-FR')}
        </span>
      </footer>
    </article>
  );
}
