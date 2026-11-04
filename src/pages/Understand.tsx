import { Hundred, TaxStairs, Waterfall } from '../components/Charts';
import { Icon } from '../components/fields';
import { seniorityRate, type Payslip, type Rules } from '../engine';
import { refLabel, refUrl, useFmt } from '../format';
import { Link, useRoute } from '../i18n';
import type { AppState } from '../state';

export function Understand({ s, rules, slip, computedBase }: { s: AppState; rules: Rules; slip: Payslip; computedBase: number }) {
  const { t } = useRoute();
  const { fcfa } = useFmt();
  const deps = slip.dependents;

  return (
    <article className="doc-page">
      <header className="page-hero">
        <div className="kicker">{t('Comprendre', 'How it works')}</div>
        <h1>
          {t('Comment votre salaire', 'How your salary')} <em>{t('est calculé', 'is computed')}</em>
        </h1>
        <p className="lead">
          {t(
            "Le salaire brut n'est ni ce que vous touchez, ni ce que vous coûtez. Cette page suit chaque franc, de la poche de l'employeur jusqu'à votre compte, avec les chiffres de votre simulation.",
            "Gross salary is neither what you receive nor what you cost. This page follows each franc, from the employer's pocket to your account, using the figures of your simulation.",
          )}
        </p>
        <div className="sim-chip">
          <span>
            {t('Votre simulation', 'Your simulation')} : <b>{fcfa(s.mode === 'net' ? computedBase : s.base)}</b> {t('de base', 'base')}
            {deps ? ` · ${deps} ${t(deps > 1 ? 'personnes à charge' : 'personne à charge', deps > 1 ? 'dependents' : 'dependent')}` : ''} · {t('net', 'net')} <b>{fcfa(slip.netPay)}</b>
          </span>
          <Link to="home" className="sim-edit">
            {t('Modifier', 'Edit')} <Icon.arrow />
          </Link>
        </div>
      </header>

      <Section n="01" title={t('Le chemin de l’argent', 'Where the money goes')} lead={t("Chaque barre part de la précédente : ce que l'employeur dépense, puis ce que chacun prélève en route.", 'Each bar starts where the previous one ends: what the employer spends, then what is taken along the way.')}>
        <div className="u-split">
          <div className="u-card">
            <Waterfall slip={slip} />
            <div className="read-notes">
              <p>
                <b>{t('Charges patronales.', 'Employer contributions.')}</b>{' '}
                {t('Payées par l’employeur en plus du brut : retraite, famille, accidents du travail, santé.', 'Paid by the employer on top of gross: pension, family, work accidents, health.')}
              </p>
              <p>
                <b>{t('Vos cotisations.', 'Your contributions.')}</b>{' '}
                {t('Retenues sur votre brut pour votre retraite (CNSS) et votre santé (AMU).', 'Withheld from your gross for your pension (CNSS) and your health (AMU).')}
              </p>
              <p>
                <b>{t('Impôt.', 'Tax.')}</b> {t('Retenu à la source chaque mois et reversé à l’OTR.', 'Withheld at source each month and paid to the OTR.')}
              </p>
            </div>
          </div>
          <div className="u-card">
            <h3 className="u-h3">{t("Sur 100 F dépensés par l'employeur", 'Out of every 100 F the employer spends')}</h3>
            <Hundred slip={slip} />
          </div>
        </div>
      </Section>

      <Section n="02" title={t('Trois montants à ne pas confondre', 'Three amounts not to mix up')}>
        <div className="trio">
          <Amount3
            tone="gross"
            name={t('Le brut', 'Gross')}
            value={slip.grossTotal}
            text={t(
              'Tout ce que l’employeur vous attribue pour le mois : salaire de base, primes, heures supplémentaires et avantages en nature. C’est le chiffre du contrat, et la base des cotisations.',
              'Everything the employer grants you for the month: base salary, bonuses, overtime and benefits in kind. It is the figure in the contract, and the base for contributions.',
            )}
          />
          <Amount3
            tone="net"
            name={t('Le net à payer', 'Net pay')}
            value={slip.netPay}
            text={t(
              'Ce qui arrive sur votre compte : le brut moins vos cotisations et l’impôt, moins les avantages déjà reçus en nature et les avances, plus les frais remboursés.',
              'What reaches your account: gross minus your contributions and tax, minus benefits already received in kind and advances, plus refunded expenses.',
            )}
          />
          <Amount3
            tone="cost"
            name={t("Le coût pour l'employeur", 'Cost to the employer')}
            value={slip.employerCost}
            text={t(
              'Le brut plus les charges patronales (CNSS et AMU) et les remboursements de frais. C’est ce que votre poste coûte vraiment, et ce qu’il faut avoir en tête pour négocier.',
              'Gross plus employer contributions (CNSS and AMU) and expense refunds. It is what your job really costs, worth keeping in mind when you negotiate.',
            )}
          />
        </div>
      </Section>

      <Section
        n="03"
        title={t('Les cotisations sociales', 'Social contributions')}
        lead={t(
          'Elles financent votre retraite, les prestations familiales, les accidents du travail et votre assurance maladie. Elles se calculent sur le brut, jamais en dessous du SMIG, sans plafond.',
          'They fund your pension, family benefits, work accidents and your health insurance. They are computed on gross pay, never below the minimum wage, with no ceiling.',
        )}
      >
        <Contributions slip={slip} rules={rules} />
      </Section>

      <Section
        n="04"
        title={t("L'impôt sur le revenu, pas à pas", 'Income tax, step by step')}
        lead={t(
          "L'IRPP se calcule sur l'année, puis l'employeur en retient un douzième chaque mois. Le barème est progressif : chaque taux ne frappe que la part du revenu qui tombe dans sa tranche.",
          'The IRPP is computed over the year, then the employer withholds one twelfth each month. The scale is progressive: each rate only applies to the part of income within its bracket.',
        )}
      >
        <div className="u-split tax">
          <ol className="steps big">
            {slip.irppSteps.map((st) => (
              <li key={st.label} className={st.kind}>
                <span>{st.label}</span>
                <span className="s-amt">
                  {st.kind === 'minus' ? '− ' : ''}
                  {fcfa(st.amount)}
                </span>
                {st.note && <span className="s-note">{st.note}</span>}
              </li>
            ))}
          </ol>
          <div className="u-card">
            <h3 className="u-h3">{t('Le barème, tranche par tranche', 'The scale, bracket by bracket')}</h3>
            <TaxStairs slip={slip} />
            <Brackets slip={slip} />
          </div>
        </div>
      </Section>

      <Section n="05" title={t('Les règles qui s’appliquent', 'The rules that apply')} lead={t('Les repères à connaître, chacun avec son texte.', 'The key figures, each with its legal text.')}>
        <Facts rules={rules} />
      </Section>

      <Link to="sources" className="next-link wide">
        <span>
          <strong>{t('Les textes officiels', 'The official texts')}</strong>
          <span>{t('13 textes archivés et transcrits page par page, et ce que le simulateur ne couvre pas encore.', '13 texts archived and transcribed page by page, and what the simulator does not cover yet.')}</span>
        </span>
        <Icon.arrow />
      </Link>
    </article>
  );
}

function Section({ n, title, lead, children }: { n: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="u-section">
      <div className="u-head">
        <span className="u-n">{n}</span>
        <div>
          <h2>{title}</h2>
          {lead && <p>{lead}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Amount3({ name, value, text, tone }: { name: string; value: number; text: string; tone: string }) {
  const { fcfa } = useFmt();
  return (
    <div className={`trio-card ${tone}`}>
      <div className="t-name">{name}</div>
      <div className="t-value">{fcfa(value)}</div>
      <p>{text}</p>
    </div>
  );
}

function Contributions({ slip, rules }: { slip: Payslip; rules: Rules }) {
  const { t, lang } = useRoute();
  const { fcfa, pct } = useFmt();
  const purpose: Record<string, [string, string]> = {
    cnss_pension_employee: ['Votre future pension de retraite', 'Your future retirement pension'],
    cnss_pension_employer: ['Votre future pension de retraite', 'Your future retirement pension'],
    cnss_family: ['Allocations familiales et congé de maternité', 'Family allowances and maternity leave'],
    cnss_work_risk: ['Accidents du travail et maladies professionnelles', 'Work accidents and occupational illness'],
    amu: ['Vos soins de santé', 'Your health care'],
  };
  const rows = slip.lines.filter((l) => l.kind === 'contribution');
  return (
    <div className="table-wrap u-card flush">
      <table className="u-table">
        <thead>
          <tr>
            <th>{t('Cotisation', 'Contribution')}</th>
            <th>{t('À quoi elle sert', 'What it pays for')}</th>
            <th className="r">{t('Vous', 'You')}</th>
            <th className="r">{t('Employeur', 'Employer')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => {
            const url = refUrl(rules, l.ref);
            return (
              <tr key={l.id}>
                <td>
                  <b>{l.label}</b>
                  {url && (
                    <a className="mini-cite" href={url} target="_blank" rel="noreferrer">
                      {refLabel(rules, lang, l.ref)}
                    </a>
                  )}
                </td>
                <td>{t(...(purpose[l.id] ?? ['', '']))}</td>
                <td className="r num">
                  {l.employee ? fcfa(l.employee) : '·'}
                  {l.rate !== undefined && l.employee ? <small>{pct(l.rate)}</small> : null}
                </td>
                <td className="r num">
                  {l.employer ? fcfa(l.employer) : '·'}
                  {l.employerRate !== undefined && l.employer ? <small>{pct(l.employerRate)}</small> : null}
                </td>
              </tr>
            );
          })}
          <tr className="sum">
            <td colSpan={2}>{t('Total', 'Total')}</td>
            <td className="r num">{fcfa(slip.employeeContributions)}</td>
            <td className="r num">{fcfa(slip.employerContributions)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Brackets({ slip }: { slip: Payslip }) {
  const { t } = useRoute();
  const { money, pct, fcfa } = useFmt();
  return (
    <table className="u-table compact">
      <thead>
        <tr>
          <th>{t('Tranche annuelle', 'Annual bracket')}</th>
          <th className="r">{t('Taux', 'Rate')}</th>
          <th className="r">{t('Votre part', 'Your part')}</th>
          <th className="r">{t('Impôt', 'Tax')}</th>
        </tr>
      </thead>
      <tbody>
        {slip.irppBrackets.map((b) => (
          <tr key={b.from} className={b.taxed ? '' : 'off'}>
            <td className="num">{b.to === null ? `${t('plus de', 'over')} ${money(b.from)}` : `${money(b.from)} ${t('à', 'to')} ${money(b.to)}`}</td>
            <td className="r num">{pct(b.rate, 0)}</td>
            <td className="r num">{b.taxed ? money(b.taxed) : '·'}</td>
            <td className="r num">{b.tax ? money(b.tax) : '·'}</td>
          </tr>
        ))}
        <tr className="sum">
          <td colSpan={3}>{t('Impôt du mois', 'Tax for the month')}</td>
          <td className="r num">{fcfa(slip.irpp)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Facts({ rules }: { rules: Rules }) {
  const { t, lang } = useRoute();
  const { fcfa, pct } = useFmt();
  const facts = [
    { k: fcfa(rules.minimum_wage.smig_monthly), l: t('SMIG par mois, soit 302,89 F de l’heure', 'minimum wage a month, 302.89 F an hour'), ref: rules.minimum_wage.ref },
    { k: `${rules.working_time.weekly_hours} h`, l: t(`par semaine ; le taux horaire divise le salaire par ${rules.working_time.monthly_hours} h`, `a week; the hourly rate divides the salary by ${rules.working_time.monthly_hours} h`), ref: rules.working_time.ref_hours },
    { k: '+20 % · +40 %', l: t('heures supplémentaires de jour, de la 41e à la 48e heure puis au-delà ; +65 % à +100 % la nuit et les jours fériés', 'daytime overtime, 41st to 48th hour then beyond; +65 % to +100 % at night and on holidays'), ref: rules.overtime.ref },
    { k: `2 % → ${pct(rules.seniority.cap, 0)}`, l: t(`prime d'ancienneté : 2 % à deux ans, ${pct(seniorityRate(10, rules), 0)} à dix ans, sur le minimum de la catégorie`, `seniority bonus: 2 % at two years, ${pct(seniorityRate(10, rules), 0)} at ten years, on the category minimum`), ref: rules.seniority.ref },
    { k: '28 %', l: t('abattement pour frais professionnels avant l’impôt, sur la part jusqu’à 10 M par an', 'flat deduction for work expenses before tax, on the part up to 10 M a year'), ref: rules.irpp.ref_deductions },
    { k: '10 000 F', l: t('de revenu en moins par personne à charge et par mois, six au plus', 'less taxable income per dependent per month, six at most'), ref: rules.irpp.ref_dependents },
  ];
  return (
    <div className="facts">
      {facts.map((f) => {
        const url = refUrl(rules, f.ref);
        return (
          <div key={f.k} className="fact">
            <div className="f-k">{f.k}</div>
            <p>{f.l}</p>
            {url && (
              <a className="mini-cite" href={url} target="_blank" rel="noreferrer">
                <Icon.book /> {refLabel(rules, lang, f.ref)}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
