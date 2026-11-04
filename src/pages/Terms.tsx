import { REPO } from '../components/Chrome';
import { Link, useRoute } from '../i18n';

export function Terms() {
  const { t } = useRoute();
  return (
    <article className="doc-page narrow">
      <header className="page-hero">
        <div className="kicker">{t('À savoir', 'Legal')}</div>
        <h1>
          {t("Conditions d'utilisation", 'Terms of use')} <em>{t('et confidentialité', 'and privacy')}</em>
        </h1>
        <p className="lead">{t('Courtes, parce qu’il n’y a presque rien à cacher : pas de compte, pas de donnée collectée.', 'Short, because there is almost nothing to hide: no account, no data collected.')}</p>
      </header>

      <div className="prose">
        <h2>{t('Ce qu’est monsalaire', 'What monsalaire is')}</h2>
        <p>
          {t(
            'monsalaire est un simulateur gratuit et libre. Il calcule un bulletin de paie indicatif pour un salarié du secteur privé au Togo, au régime général, d’après les textes officiels listés sur la page',
            'monsalaire is a free, open-source simulator. It computes an indicative payslip for a private-sector employee in Togo under the general regime, based on the official texts listed on the page',
          )}{' '}
          <Link to="sources">{t('Les textes', 'Legal texts')}</Link>.
        </p>

        <h2>{t('Une simulation, pas un bulletin officiel', 'A simulation, not an official payslip')}</h2>
        <p>
          {t(
            'Le résultat est une estimation. Il ne remplace ni le bulletin de votre employeur, ni l’avis d’un comptable, d’un juriste ou de l’administration (OTR, CNSS, inspection du travail). Les auteurs ne peuvent être tenus responsables d’une décision prise sur la base de ce calcul.',
            'The result is an estimate. It replaces neither your employer’s payslip nor the advice of an accountant, a lawyer or the administration (OTR, CNSS, labour inspectorate). The authors cannot be held liable for any decision taken on the basis of this calculation.',
          )}
        </p>

        <h2 id="confidentialite">{t('Confidentialité', 'Privacy')}</h2>
        <ul>
          <li>{t('Tout le calcul se fait dans votre navigateur. Aucun chiffre saisi n’est envoyé à un serveur.', 'All calculation happens in your browser. No figure you type is sent to a server.')}</li>
          <li>
            {t(
              'Pas de compte, pas de cookie, pas de mesure d’audience, pas de publicité.',
              'No account, no cookie, no audience measurement, no advertising.',
            )}
          </li>
          <li>
            {t(
              'Votre navigateur garde seulement, chez vous, la langue, le thème et votre dernière simulation, pour les retrouver à la prochaine visite. Vider les données du site les efface.',
              'Your browser only keeps, on your device, the language, the theme and your last simulation, to find them on your next visit. Clearing the site data erases them.',
            )}
          </li>
          <li>
            {t(
              'Un lien partagé contient les paramètres de la simulation dans son adresse : ne le partagez qu’avec qui vous voulez.',
              'A shared link carries the simulation’s parameters in its address: share it only with whom you choose.',
            )}
          </li>
          <li>{t('Les polices d’écriture sont chargées depuis Google Fonts.', 'Fonts are loaded from Google Fonts.')}</li>
        </ul>

        <h2>{t('Licence et contributions', 'Licence and contributions')}</h2>
        <p>
          {t('Le code est publié sous licence MIT : vous pouvez le réutiliser, le modifier et le redistribuer. Les textes de loi archivés sont des documents publics. Code et corrections :', 'The code is published under the MIT licence: you may reuse, modify and redistribute it. The archived legal texts are public documents. Code and corrections:')}{' '}
          <a href={REPO} target="_blank" rel="noreferrer">
            github.com/GithAlchemist/monsalaire
          </a>
          .
        </p>

        <h2>{t('Contact', 'Contact')}</h2>
        <p>
          {t('Pour signaler une erreur ou proposer une amélioration, ouvrez un ticket sur GitHub.', 'To report an error or suggest an improvement, open an issue on GitHub.')}{' '}
          <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
            {t('Tickets du projet', 'Project issues')}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
