import { Fragment, useEffect, useState } from 'react';
import type { PayLine, Payslip as Slip, Rules } from '../engine';
import { refLabel, refUrl, useFmt } from '../format';
import { useRoute } from '../i18n';
import { useChanged, useNow, useTweened } from '../hooks';
import { Icon } from './fields';

export function Amount({ value, className }: { value: number; className?: string }) {
  const { money } = useFmt();
  const v = useTweened(value);
  return <span className={className}>{money(v)}</span>;
}

const dot = <span className="dim">·</span>;

function Row({ l, rules, employer, open, onToggle }: { l: PayLine; rules: Rules; employer: boolean; open: boolean; onToggle: () => void }) {
  const { lang } = useRoute();
  const { money, pct } = useFmt();
  const flash = useChanged(l.employee + l.employer * 1e-3);
  const isGain = l.kind === 'earning' || l.kind === 'benefit' || l.kind === 'reimbursement';
  const rate =
    l.rate !== undefined
      ? l.id.startsWith('ot_')
        ? `× ${l.rate.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR')}`
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
                {l.unit === 'h' ? ' h' : l.unit === 'j' ? (lang === 'en' ? ' d' : ' j') : l.unit === '×' ? ' ×' : ''}
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
                    {refLabel(rules, lang, l.ref)}
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

export function Payslip({ slip, rules, statusLabel, category, shareUrl = '' }: { slip: Slip; rules: Rules; statusLabel: string; category: string; shareUrl?: string }) {
  const { t } = useRoute();
  const { money, monthLabel, date } = useFmt();
  const [open, setOpen] = useState<string | null>(null);
  const [employer, setEmployer] = useState(true);
  // Employer block open on wide screens, folded on phones (decided in the browser, after the static HTML).
  useEffect(() => {
    if (window.innerWidth <= 640) setEmployer(false);
  }, []);
  const now = useNow();
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
      <article className="sheet" aria-label={t('Bulletin de paie simulé', 'Simulated payslip')}>
        <div className="stamp" aria-hidden="true">
          SIMULATION
        </div>
        <header className="sheet-head">
          <div>
            <div className="doc-type">{t('Bulletin de paie', 'Payslip')}</div>
            <div className="period">{now ? monthLabel(now) : '\u00a0'}</div>
          </div>
          <img className="sheet-logo" src="/brand/symbol.png" alt="" />
        </header>

        <dl className="parties">
          <div>
            <dt>{t('Salarié', 'Employee')}</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div>
            <dt>{t('Catégorie', 'Category')}</dt>
            <dd>{category || t('Non précisée', 'Not set')}</dd>
          </div>
          <div>
            <dt>{t('Personnes à charge, taux horaire', 'Dependants, hourly rate')}</dt>
            <dd className="num">
              {slip.dependents} · {money(slip.hourlyRate)} F/h
            </dd>
          </div>
        </dl>

        <table className="slip">
          <thead>
            <tr>
              <th scope="col">{t('Libellé', 'Description')}</th>
              <th scope="col" className="hide-sm">
                {t('Base', 'Base')}
              </th>
              <th scope="col" className="hide-sm">
                {t('Taux', 'Rate')}
              </th>
              <th scope="col">{t('Gains', 'Earnings')}</th>
              <th scope="col">{t('Retenues', 'Deductions')}</th>
              {employer && <th scope="col">{t('Employeur', 'Employer')}</th>}
            </tr>
          </thead>
          <tbody>
            {group(t('Rémunération', 'Pay'), '#0d6b47')}
            {earnings.map(row)}
            <tr className={`total${grossFlash ? ' flash' : ''}`}>
              <td>{t('Salaire brut', 'Gross salary')}</td>
              <td className="hide-sm" />
              <td className="hide-sm" />
              <td>
                <Amount value={slip.grossTotal} />
              </td>
              <td />
              {employer && <td />}
            </tr>
            {group(t('Cotisations sociales', 'Social contributions'), '#e9b730')}
            {contributions.map(row)}
            {group(t('Impôt sur le revenu', 'Income tax'), '#c8102e')}
            {tax.map(row)}
            {after.length > 0 && group(t('Hors brut', 'Not part of gross'), '#6a6255')}
            {after.map(row)}
            <tr className={`total${totalFlash ? ' flash' : ''}`}>
              <td>{t('Totaux', 'Totals')}</td>
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
            {t('Net à payer', 'Net pay')}
            <small>{t('versé sur votre compte', 'paid into your account')}</small>
          </span>
          <span className="value">{money(net)} F</span>
        </div>

        <footer className="sheet-foot">
          <label className="toggle-line no-print">
            <input type="checkbox" checked={employer} onChange={(e) => setEmployer(e.target.checked)} />
            <span className="switch" aria-hidden="true" />
            {t('Part employeur', 'Employer share')}
          </label>
          <span>{t('Touchez une ligne pour voir son calcul et son texte de loi.', 'Tap a line to see how it’s worked out and the law behind it.')}</span>
          <span>
            {t('Règles', 'Rules')} {rules.version}, {t('vérifiées le', 'checked on')} {date(rules.verified_on)}
          </span>
          {shareUrl && (
            <a className="sheet-link print-only" href={shareUrl}>
              {t('Revoir cette simulation :', 'Open this simulation again:')} {shareUrl}
            </a>
          )}
        </footer>
      </article>
    </div>
  );
}
