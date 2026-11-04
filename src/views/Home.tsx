import { useEffect, useState } from 'react';
import { Controls } from '../components/Controls';
import { Icon } from '../components/fields';
import { AccountOffer } from '../components/Account';
import { Amount, Payslip } from '../components/Payslip';
import { categoryMinimum, type Payslip as Slip, type Rules } from '../engine';
import { useFmt } from '../format';
import { useTweened } from '../hooks';
import { Link, useRoute } from '../i18n';
import type { AppState } from '../state';

export function Home({ s, set, rules, slip, computedBase, shareUrl }: { s: AppState; set: (p: Partial<AppState>) => void; rules: Rules; slip: Slip; computedBase: number; shareUrl: string }) {
  const { t } = useRoute();
  const { fcfa, pct } = useFmt();
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
        <h1>
          {t('Votre bulletin de paie,', 'Your payslip,')} <em>{t('calculé sous vos yeux.', 'worked out as you type.')}</em>
        </h1>
        <p className="hero-sub">
          {t(
            'Tapez un salaire : cotisations, impôt et net se recalculent à chaque chiffre, et chaque ligne renvoie à son article de loi.',
            'Enter a salary and watch contributions, tax and net pay update instantly. Every line links to the law behind it.',
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
                  ? t(`${pct(slip.netSalary / slip.grossTotal, 1)} du brut, ${period === 'year' ? 'sur douze mois' : 'ce mois-ci'}`, `${pct(slip.netSalary / slip.grossTotal, 1)} of gross, ${period === 'year' ? 'over twelve months': 'this month'}`)
                  : t('Saisissez un salaire', 'Enter a salary')}
              </div>
            </div>
            <div>
              <div className="k-label">{t('Brut', 'Gross')}</div>
              <div className="k-value">
                <Amount value={slip.grossTotal * k} />
              </div>
              <div className="k-sub">
                {s.mode === 'net' ? `${t('base', 'base')} ${fcfa(computedBase)}` : catMin ? `${t('minimum', 'minimum')} ${s.category}${t(' :', ':')} ${fcfa(catMin)}` : t('primes comprises', 'bonuses included')}
              </div>
            </div>
            <div>
              <div className="k-label">{t('Coût employeur', 'Employer cost')}</div>
              <div className="k-value">
                <Amount value={slip.employerCost * k} />
              </div>
              <div className="k-sub">{t(`dont ${fcfa(slip.employerContributions * k)} de charges`, `incl. ${fcfa(slip.employerContributions * k)} in contributions`)}</div>
            </div>
          </div>

          <Disclaimer rules={rules} />

          {slip.warnings.map((w) => (
            <div className="warn" role="status" key={w}>
              <Icon.alert />
              <span>{w}</span>
            </div>
          ))}

          <Payslip slip={slip} rules={rules} statusLabel={s.status === 'apprentice' ? t('Apprenti sous contrat', 'Apprentice under contract') : t('Salarié du secteur privé', 'Private-sector employee')} category={categoryText} shareUrl={shareUrl} />

          <Link to="understand" className="next-link">
            <span>
              <strong>{t('Comprendre ce calcul', 'How this is calculated')}</strong>
              <span>{t('Où va chaque franc, l’impôt pas à pas, les cotisations.', 'Where every franc goes, tax step by step, and contributions.')}</span>
            </span>
            <Icon.arrow />
          </Link>

          <AccountOffer />
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
        <span>{t('À savoir avant de vous fier à ce calcul', 'Before you rely on this figure')}</span>
        <span className="chev" aria-hidden="true">
          <Icon.chevron />
        </span>
      </summary>
      <div className="d-body">
        <ul>
          <li>
            {t(
              'C’est une simulation pour un salarié du secteur privé au régime général (CNSS, AMU et impôt sur le revenu), d’après les textes en vigueur au Togo, vérifiés le',
              'This is a simulation for a private-sector employee under the general regime (CNSS, AMU and income tax), based on the laws in force in Togo, last checked on',
            )}{' '}
            {date(rules.verified_on)}.
          </li>
          <li>
            {t(
              'Votre bulletin réel peut différer de quelques francs : chaque employeur arrondit, régularise l’impôt dans l’année et applique parfois une convention de branche plus favorable.',
              'Your actual payslip may differ by a few francs: employers round differently, adjust tax during the year and sometimes apply a more generous industry agreement.',
            )}
          </li>
          <li>
            {t(
              'Ne sont pas couverts : agents publics, indépendants, indemnités de fin de contrat. Deux points des textes admettent deux lectures ; le choix retenu est indiqué.',
              'Not covered: civil servants, the self-employed and end-of-contract payments. Two points in the law are open to interpretation; the reading used is stated.',
            )}
          </li>
          <li>
            {t('Ce calcul ne remplace ni le bulletin de votre employeur, ni l’avis d’un professionnel.', 'This calculation is no substitute for your employer’s payslip or professional advice.')}{' '}
            <Link to="sources">{t('Voir les textes et les limites', 'See the sources and limitations')}</Link>.
          </li>
        </ul>
      </div>
    </details>
  );
}
