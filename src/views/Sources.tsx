import library from '../../sources/sources.json';
import { Icon } from '../components/fields';
import { REPO } from '../components/Chrome';
import type { Ref, Rules } from '../engine';
import { refUrl, useFmt } from '../format';
import { useRoute } from '../i18n';

interface Doc {
  id: string;
  publisher: string;
  date: string;
  pages?: number;
  method: string;
  short_fr: string;
  use_fr: string;
  short_en: string;
  use_en: string;
}

const TEXT = `${REPO}/blob/main/sources/text`;
const ORIG = `${REPO}/blob/main/sources/originals`;
const accent = (id: string) => (id.startsWith('cgi') || id.startsWith('otr') ? '#c8102e' : id.startsWith('ccit') || id.startsWith('code-travail') || id.startsWith('arrete-3790') ? '#e9b730' : '#0d6b47');

export function Sources({ rules }: { rules: Rules }) {
  const { t, lang } = useRoute();
  const { date } = useFmt();
  const docs = (library as Doc[]).filter((d) => d.id !== 'ccit-2011');
  const pages = (library as Doc[]).reduce((a, d) => a + (d.pages ?? 0), 0);

  const checks: { what: string; value: string; ref: Ref }[] = [
    { what: t('SMIG', 'Minimum wage'), value: t('52 500 F par mois, 302,89 F de l’heure', '52,500 F a month, 302.89 F an hour'), ref: rules.minimum_wage.ref },
    { what: t('Durée du travail', 'Working week'), value: t('40 h par semaine', '40 h a week'), ref: rules.working_time.ref_hours },
    { what: t('Taux CNSS', 'CNSS rates'), value: t('4 % salarié, 17,5 % employeur', '4% employee, 17.5% employer'), ref: rules.social.cnss.ref },
    { what: t('Assiette CNSS', 'CNSS base'), value: t('tout le brut, plancher SMIG, sans plafond', 'total gross pay, minimum wage floor, no cap'), ref: rules.social.cnss.ref_base },
    { what: t('Taux AMU', 'AMU rates'), value: t('5 % salarié, 5 % employeur', '5% employee, 5% employer'), ref: rules.social.amu.ref },
    { what: t('Déductions avant impôt', 'Deductions before tax'), value: t('cotisations, 28 % jusqu’à 10 M, retraite volontaire, assurance vie', 'contributions, 28% up to 10 M, voluntary pension, life insurance'), ref: rules.irpp.ref_deductions },
    { what: t('Charges de famille', 'Dependants'), value: t('10 000 F par personne et par mois, 6 au plus', '10,000 F per person per month, up to 6'), ref: rules.irpp.ref_dependents },
    { what: t('Barème de l’IRPP', 'Income tax brackets'), value: t('0 % à 35 %, par tranches annuelles', '0% to 35%, annual brackets'), ref: rules.irpp.ref },
    { what: t('Heures supplémentaires', 'Overtime'), value: t('+20 %, +40 %, +65 %, +100 %', '+20%, +40%, +65%, +100%'), ref: rules.overtime.ref },
    { what: t('Prime d’ancienneté', 'Seniority bonus'), value: t('2 % à 2 ans, puis +1 point par an, 35 % au plus', '2% at 2 years, then +1 point a year, up to 35%'), ref: rules.seniority.ref },
    { what: t('Grille des salaires', 'Pay scale'), value: t('E1 52 500 F à C4 246 500 F', 'E1 52,500 F to C4 246,500 F'), ref: rules.categories.ref },
  ];
  const srcTitle = (id: string) => {
    const s = rules.sources[id];
    return s ? (lang === 'en' && s.title_en ? s.title_en : s.title) : id;
  };

  return (
    <article className="doc-page">
      <header className="page-hero">
        <div className="kicker">{t('Les textes', 'Sources')}</div>
        <h1>
          {t('Rien n’est inventé,', 'Nothing is made up,')} <em>{t('tout est sourcé', 'everything is sourced')}</em>
        </h1>
        <p className="lead">
          {t(
            `Chaque taux du simulateur vient d’un texte officiel. Les ${(library as Doc[]).length} textes utilisés (${pages} pages) sont archivés dans le dépôt, avec une transcription page par page que chacun peut relire.`,
            `Every rate in the simulator comes from an official text. The ${(library as Doc[]).length} texts used (${pages} pages) are archived in the repository, with a page-by-page transcription anyone can check.`,
          )}
        </p>
        <div className="sim-chip">
          <span>
            {t('Règles', 'Rules')} <b>{rules.version}</b> · {t('vérifiées le', 'checked on')} <b>{date(rules.verified_on)}</b>
          </span>
          <a className="sim-edit" href={`${REPO}/tree/main/sources`} target="_blank" rel="noreferrer">
            {t('Voir sur GitHub', 'View on GitHub')} <Icon.arrow />
          </a>
        </div>
      </header>

      <section className="u-section">
        <div className="u-head">
          <span className="u-n">01</span>
          <div>
            <h2>{t('La bibliothèque', 'The library')}</h2>
            <p>{t('Le PDF d’origine et sa transcription fidèle, sans reformulation.', 'Each original PDF alongside a word-for-word transcription.')}</p>
          </div>
        </div>
        <div className="lib">
          {docs.map((d) => (
            <div key={d.id} className="doc" style={{ ['--accent' as string]: accent(d.id) }}>
              <span className="thumb" aria-hidden="true" />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="d-title">{lang === 'en' ? d.short_en : d.short_fr}</span>
                <span className="d-meta">
                  {d.publisher} · {d.date.slice(0, 4)}
                  {d.pages ? ` · ${d.pages} p.` : ''}
                </span>
                <span className="d-use">{lang === 'en' ? d.use_en : d.use_fr}</span>
                <span className="d-links">
                  <a href={`${TEXT}/${d.id}.md`} target="_blank" rel="noreferrer">
                    {t('Transcription', 'Transcription')}
                  </a>
                  <a href={`${ORIG}/${d.id}.pdf`} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                  {d.method === 'ocr' && <span className="ocr">{t('scan, lu par OCR', 'scanned, read by OCR')}</span>}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="u-section">
        <div className="u-head">
          <span className="u-n">02</span>
          <div>
            <h2>{t('Ce qui a été vérifié, et où', 'What was checked, and where')}</h2>
            <p>{t('Chaque ligne renvoie à la page exacte du texte.', 'Each line links to the exact page of the text.')}</p>
          </div>
        </div>
        <div className="table-wrap u-card flush">
          <table className="u-table">
            <thead>
              <tr>
                <th>{t('Règle', 'Rule')}</th>
                <th>{t('Valeur', 'Value')}</th>
                <th>{t('Texte', 'Text')}</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.what}>
                  <td>
                    <b>{c.what}</b>
                  </td>
                  <td>{c.value}</td>
                  <td>
                    <a href={refUrl(rules, c.ref) ?? '#'} target="_blank" rel="noreferrer" className="mini-cite inline">
                      {srcTitle(c.ref.source)}, {c.ref.article}
                      {c.ref.page ? `, p. ${c.ref.page}` : ''}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="u-section">
        <div className="u-head">
          <span className="u-n">03</span>
          <div>
            <h2>{t('Les limites, dites franchement', 'Limitations, stated plainly')}</h2>
          </div>
        </div>
        <div className="u-split even">
          <div className="u-card">
            <h3 className="u-h3">{t('Ce qui reste à trancher', 'Open questions')}</h3>
            <p className="muted-p">{t('Les textes admettent deux lectures. Le choix du simulateur est indiqué.', 'These points of law are open to interpretation. The simulator’s reading is stated.')}</p>
            <ul className="clean">
              {((lang === 'en' && rules.open_questions_en) || rules.open_questions).map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="u-card">
            <h3 className="u-h3">{t('Pas encore couvert', 'Not covered yet')}</h3>
            <p className="muted-p">{t('Pour un salarié du privé au régime général, le reste est pris en compte.', 'Everything else is covered for private-sector employees under the general regime.')}</p>
            <ul className="clean">
              {((lang === 'en' && rules.not_modeled_en) || rules.not_modeled).map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
        <a className="next-link wide" href={`${REPO}/issues/new?template=rule-error.yml`} target="_blank" rel="noreferrer">
          <span>
            <strong>{t('Une règle a changé, ou elle est fausse ?', 'Has a rule changed, or is one wrong?')}</strong>
            <span>{t('Signalez-la avec le texte (lien, article, date). Les règles sont des données : la correction est rapide.', 'Report it with the source (link, article, date). Rules are stored as data, so fixes are quick.')}</span>
          </span>
          <Icon.arrow />
        </a>
      </section>
    </article>
  );
}
