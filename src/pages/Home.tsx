import { useEffect, useState } from 'react';
import { Controls } from '../components/Controls';
import { Icon } from '../components/fields';
import { Amount, Payslip } from '../components/Payslip';
import { categoryMinimum, type Payslip as Slip, type Rules } from '../engine';
import { useFmt } from '../format';
import { useTweened } from '../hooks';
import { Link, useRoute } from '../i18n';
import type { AppState } from '../state';

export function Home({ s, set, rules, slip, computedBase }: { s: AppState; set: (p: Partial<AppState>) => void; rules: Rules; slip: Slip; computedBase: number }) {
  const { t } = useRoute();
  const { fcfa, pct, date } = useFmt();
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [dockHidden, setDockHidden] = useState(false);
  const k = period === 'year' ? 12 : 1;
  const netShown = useTweened(slip.netPay * k);
  const catMin = categoryMinimum(rules, s.category, s.echelon);
  const categoryText = s.category ? `${s.category}${(rules.categories.grid[s.category]?.length ?? 0) > 1 ? ` ${t('échelon', 'step')} ${'ABC'[s.echelon]}` : ''}` : '';

  useEffect(() => {
    const on = () => {
      const box = document.querySelector('.netbox');
      if (!box) return;
      const r = box.getBoundingClientRect();
      const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
      setDockHidden(r.top < window.innerHeight || (!!footer && footer.top < window.innerHeight));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <>
      <section className="hero compact">
        <span className="eyebrow">
          <span className="flag" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <b />
          </span>
          {t('Togo · textes en vigueur vérifiés le', 'Togo · laws in force checked on')} {date(rules.verified_on)}
        </span>
        <h1>
          {t('Votre bulletin de paie,', 'Your payslip,')} <em>{t('calculé sous vos yeux.', 'computed before your eyes.')}</em>
        </h1>
        <p className="hero-sub">
          {t(
            'Tapez un salaire : cotisations, impôt et net se recalculent à chaque chiffre, et chaque ligne renvoie à son article de loi.',
            'Type a salary: contributions, tax and net pay update with every digit, and each line points to its article of law.',
          )}
        </p>
      </section>

      <div className="desk" id="simulateur">
        <Controls s={s} set={set} rules={rules} computedBase={computedBase} />

        <div className="stage" id="resultat">
          <div className="summary" aria-live="polite">
            <div className="net">
              <div className="k-label">
                {t('Net à payer', 'Net pay')}
                <span className="period-toggle" role="group" aria-label={t('Période', 'Period')}>
                  <button type="button" aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>
                    {t('Mois', 'Month')}
                  </button>
                  <button type="button" aria-pressed={period === 'year'} onClick={() => setPeriod('year')}>
                    {t('Année', 'Year')}
                  </button>
                </span>
              </div>
              <div className="k-value">
                {fcfa(netShown).replace(/\sF$/, '')}
                <small>F</small>
              </div>
              <div className="k-sub">
                {slip.grossTotal > 0
                  ? t(`${pct(slip.netSalary / slip.grossTotal, 1)} du brut, ${period === 'year' ? 'sur douze mois' : 'ce mois-ci'}`, `${pct(slip.netSalary / slip.grossTotal, 1)} of gross, ${period === 'year' ? 'over twelve months' : 'this month'}`)
                  : t('Saisissez un salaire', 'Enter a salary')}
              </div>
            </div>
            <div>
              <div className="k-label">{t('Brut', 'Gross')}</div>
              <div className="k-value">
                <Amount value={slip.grossTotal * k} />
              </div>
              <div className="k-sub">
                {s.mode === 'net' ? `${t('base', 'base')} ${fcfa(computedBase)}` : catMin ? `${t('minimum', 'minimum')} ${s.category} : ${fcfa(catMin)}` : t('primes comprises', 'bonuses included')}
              </div>
            </div>
            <div>
              <div className="k-label">{t('Coût employeur', 'Employer cost')}</div>
              <div className="k-value">
                <Amount value={slip.employerCost * k} />
              </div>
              <div className="k-sub">{t(`dont ${fcfa(slip.employerContributions * k)} de charges`, `incl. ${fcfa(slip.employerContributions * k)} of contributions`)}</div>
            </div>
          </div>

          <Disclaimer rules={rules} />

          {slip.warnings.map((w) => (
            <div className="warn" role="status" key={w}>
              <Icon.alert />
              <span>{w}</span>
            </div>
          ))}

          <Payslip slip={slip} rules={rules} statusLabel={s.status === 'apprentice' ? t('Apprenti sous contrat', 'Apprentice under contract') : t('Salarié du secteur privé', 'Private-sector employee')} category={categoryText} />

          <Link to="understand" className="next-link">
            <span>
              <strong>{t('Comprendre ce calcul', 'Understand this calculation')}</strong>
              <span>{t('Où va chaque franc, l’impôt pas à pas, les cotisations.', 'Where each franc goes, tax step by step, contributions.')}</span>
            </span>
            <Icon.arrow />
          </Link>
        </div>
      </div>

      <a className={`dock${dockHidden ? ' hidden' : ''}`} href="#resultat" aria-label={t('Voir le bulletin', 'See the payslip')}>
        <span>
          <span className="d-l">{t('Net à payer', 'Net pay')}</span>
          <br />
          <span className="d-v">{fcfa(slip.netPay)}</span>
        </span>
        <span className="d-go">{t('Voir le bulletin ↓', 'See the payslip ↓')}</span>
      </a>
    </>
  );
}

/** One line by default; opens on what to know before trusting the figure. */
function Disclaimer({ rules }: { rules: Rules }) {
  const { t } = useRoute();
  const { date } = useFmt();
  return (
    <details className="disclaimer">
      <summary>
        <Icon.info />
        <span>{t('À savoir avant de vous fier à ce calcul', 'Worth knowing before you rely on this figure')}</span>
        <span className="chev" aria-hidden="true">
          <Icon.chevron />
        </span>
      </summary>
      <div className="d-body">
        <ul>
          <li>
            {t(
              'C’est une simulation pour un salarié du secteur privé au régime général (CNSS, AMU et impôt sur le revenu), d’après les textes en vigueur au Togo, vérifiés le',
              'This is a simulation for a private-sector employee under the general regime (CNSS, AMU and income tax), based on the laws in force in Togo, checked on',
            )}{' '}
            {date(rules.verified_on)}.
          </li>
          <li>
            {t(
              'Votre bulletin réel peut différer de quelques francs : chaque employeur arrondit, régularise l’impôt dans l’année et applique parfois une convention de branche plus favorable.',
              'Your real payslip may differ by a few francs: each employer rounds, adjusts tax over the year and sometimes applies a more favourable sector agreement.',
            )}
          </li>
          <li>
            {t(
              'Ne sont pas couverts : agents publics, indépendants, indemnités de fin de contrat. Deux points des textes admettent deux lectures ; le choix retenu est indiqué.',
              'Not covered: public servants, self-employed, end-of-contract payments. Two points of the texts can be read two ways; the reading used is stated.',
            )}
          </li>
          <li>
            {t('Ce calcul ne remplace ni le bulletin de votre employeur, ni l’avis d’un professionnel.', 'This calculation replaces neither your employer’s payslip nor professional advice.')}{' '}
            <Link to="sources">{t('Voir les textes et les limites', 'See the texts and the limits')}</Link>.
          </li>
        </ul>
      </div>
    </details>
  );
}
