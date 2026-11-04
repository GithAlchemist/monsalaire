import { Fragment, useState } from 'react';
import type { PayLine, Payslip as Slip, Rules } from '../engine';
import { money, monthLabel, pct, refLabel, refUrl } from '../format';
import { useChanged, useTweened } from '../hooks';
import { Icon } from './fields';

export function Amount({ value, className }: { value: number; className?: string }) {
  const v = useTweened(value);
  return <span className={className}>{money(v)}</span>;
}

const dot = <span className="dim">·</span>;

function Row({ l, rules, employer, open, onToggle }: { l: PayLine; rules: Rules; employer: boolean; open: boolean; onToggle: () => void }) {
  const flash = useChanged(l.employee + l.employer * 1e-3);
  const isGain = l.kind === 'earning' || l.kind === 'benefit' || l.kind === 'reimbursement';
  const rate =
    l.rate !== undefined
      ? l.id.startsWith('ot_')
        ? `× ${l.rate.toLocaleString('fr-FR')}`
        : pct(l.rate)
      : l.employerRate !== undefined
        ? pct(l.employerRate)
        : null;
  const url = refUrl(rules, l.ref);
  const cols = employer ? 6 : 5;
  return (
    <Fragment>
      <tr className={flash ? 'flash' : undefined}>
        <td>
          <button type="button" className="line-btn" aria-expanded={open} onClick={onToggle}>
            {l.label}
            {l.quantity !== undefined && (
              <span className="q">
                {l.quantity}
                {l.unit === 'h' ? ' h' : l.unit === 'j' ? ' j' : l.unit === '×' ? ' ×' : ''}
              </span>
            )}
          </button>
        </td>
        <td className="hide-sm muted">{l.base !== undefined ? money(l.base) : dot}</td>
        <td className="hide-sm muted">{rate ?? dot}</td>
        <td>{isGain && l.employee ? <Amount value={l.employee} /> : dot}</td>
        <td className="neg">{!isGain && l.employee ? <Amount value={l.employee} /> : dot}</td>
        {employer && <td className="col-er">{l.employer ? <Amount value={l.employer} /> : dot}</td>}
      </tr>
      {open && (
        <tr className="explain">
          <td colSpan={cols}>
            <div className="box">
              {l.explain}
              {url && (
                <div>
                  <a className="cite" href={url} target="_blank" rel="noreferrer">
                    <Icon.book />
                    {refLabel(rules, l.ref)}
                  </a>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function Payslip({ slip, rules, statusLabel, category }: { slip: Slip; rules: Rules; statusLabel: string; category: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [employer, setEmployer] = useState(() => typeof window === 'undefined' || window.innerWidth > 640);
  const net = useTweened(slip.netPay);
  const grossFlash = useChanged(slip.grossTotal);
  const totalFlash = useChanged(slip.netPay);

  const earnings = slip.lines.filter((l) => l.kind === 'earning' || l.kind === 'benefit');
  const contributions = slip.lines.filter((l) => l.kind === 'contribution');
  const tax = slip.lines.filter((l) => l.kind === 'tax');
  const after = slip.lines.filter((l) => l.kind === 'reimbursement' || l.kind === 'deduction');
  const cols = employer ? 6 : 5;
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));
  const group = (title: string, color: string) => (
    <tr className="group">
      <td colSpan={cols}>
        <span style={{ ['--dot' as string]: color }}>{title}</span>
      </td>
    </tr>
  );
  const row = (l: PayLine) => <Row key={l.id} l={l} rules={rules} employer={employer} open={open === l.id} onToggle={() => toggle(l.id)} />;

  return (
    <div className="sheet-wrap">
      <article className="sheet" aria-label="Bulletin de paie simulé">
        <div className="stamp" aria-hidden="true">
          SIMULATION
        </div>
        <header className="sheet-head">
          <div>
            <div className="doc-type">Bulletin de paie</div>
            <div className="period">{monthLabel()}</div>
          </div>
          <img className="sheet-logo" src="/logo.svg" alt="" width={40} height={40} />
        </header>

        <dl className="parties">
          <div>
            <dt>Salarié</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div>
            <dt>Catégorie</dt>
            <dd>{category || 'Non précisée'}</dd>
          </div>
          <div>
            <dt>Parts et taux horaire</dt>
            <dd className="num">
              {slip.dependents} à charge · {money(slip.hourlyRate)} F/h
            </dd>
          </div>
        </dl>

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
            {group('Rémunération', '#0d6b47')}
            {earnings.map(row)}
            <tr className={`total${grossFlash ? ' flash' : ''}`}>
              <td>Salaire brut</td>
              <td className="hide-sm" />
              <td className="hide-sm" />
              <td>
                <Amount value={slip.grossTotal} />
              </td>
              <td />
              {employer && <td />}
            </tr>
            {group('Cotisations sociales', '#e9b730')}
            {contributions.map(row)}
            {group('Impôt sur le revenu', '#c8102e')}
            {tax.map(row)}
            {after.length > 0 && group('Hors brut', '#6a6255')}
            {after.map(row)}
            <tr className={`total${totalFlash ? ' flash' : ''}`}>
              <td>Totaux</td>
              <td className="hide-sm" />
              <td className="hide-sm" />
              <td>
                <Amount value={slip.grossTotal + slip.reimbursements} />
              </td>
              <td className="neg">
                <Amount value={slip.employeeContributions + slip.irpp + slip.benefitsInKind + slip.voluntaryPension + slip.otherDeductions} />
              </td>
              {employer && (
                <td className="col-er">
                  <Amount value={slip.employerContributions} />
                </td>
              )}
            </tr>
          </tbody>
        </table>

        <div className="netbox">
          <span className="label">
            Net à payer
            <small>versé sur votre compte</small>
          </span>
          <span className="value">{money(net)} F</span>
        </div>

        <footer className="sheet-foot">
          <label className="toggle-line no-print">
            <input type="checkbox" checked={employer} onChange={(e) => setEmployer(e.target.checked)} />
            <span className="switch" aria-hidden="true" />
            Part employeur
          </label>
          <span>Touchez une ligne pour voir son calcul et son texte de loi.</span>
          <span>
            Règles {rules.version}, vérifiées le {new Date(rules.verified_on).toLocaleDateString('fr-FR')}
          </span>
        </footer>
      </article>
    </div>
  );
}
