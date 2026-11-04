import { REPO } from '../components/Chrome';
import { Link, useRoute } from '../i18n';

export function Terms() {
  const { t } = useRoute();
  return (
    <article className="doc-page narrow">
      <header className="page-hero">
        <h1>
          {t("Conditions d'utilisation", 'Terms of use')} <em>{t('et confidentialité', 'and privacy')}</em>
        </h1>
        <p className="lead">{t('Courtes, parce qu’il n’y a presque rien à cacher : pas de compte, et vos montants ne quittent pas votre navigateur.', 'Short, because there’s little to declare: no sign-up, and your figures never leave your browser.')}</p>
      </header>

      <div className="prose">
        <h2>{t('Ce qu’est monsalaire', 'About monsalaire')}</h2>
        <p>
          {t(
            'monsalaire est un simulateur gratuit et libre. Il calcule un bulletin de paie indicatif pour un salarié du secteur privé au Togo, au régime général, d’après les textes officiels listés sur la page',
            'monsalaire is a free, open-source simulator. It computes an indicative payslip for a private-sector employee in Togo under the general regime, based on the official texts listed on the page',
          )}{' '}
          <Link to="sources">{t('Les textes', 'Sources')}</Link>.
        </p>

        <h2>{t('Une simulation, pas un bulletin officiel', 'A simulation, not an official payslip')}</h2>
        <p>
          {t(
            'Le résultat est une estimation. Il ne remplace ni le bulletin de votre employeur, ni l’avis d’un comptable, d’un juriste ou de l’administration (OTR, CNSS, inspection du travail). Les auteurs ne peuvent être tenus responsables d’une décision prise sur la base de ce calcul.',
            'The result is an estimate. It is no substitute for your employer’s payslip or for advice from an accountant, a lawyer or the authorities (OTR, CNSS, labour inspectorate). The authors accept no liability for decisions made on the basis of this calculation.',
          )}
        </p>

        <h2 id="confidentialite">{t('Confidentialité', 'Privacy')}</h2>
        <ul>
          <li>{t('Tout le calcul se fait dans votre navigateur. Aucun chiffre saisi n’est envoyé à un serveur.', 'All calculations run in your browser. Nothing you type is sent to a server.')}</li>
          <li>
            {t(
              'Le simulateur s’utilise sans compte, sans cookie et sans publicité.',
              'The simulator needs no account, no cookies and no advertising.',
            )}
          </li>
          <li>
            {t(
              'Si vous créez un compte pour recevoir nos analyses, nous gardons votre email, votre mot de passe sous forme chiffrée irréversible (ou, avec Google, l’identifiant de votre compte Google) et votre langue, et rien d’autre : aucun montant de vos simulations. Un cookie de session vous garde connecté. Vous pouvez supprimer votre compte à tout moment, sous le bulletin. Si vous nous écrivez, nous gardons votre nom, votre email et votre message pour vous répondre.',
              'If you create an account to receive our analyses, we keep your email, your password in irreversibly hashed form (or, with Google, your Google account ID) and your language, and nothing else: none of your simulation figures. A session cookie keeps you logged in. You can delete your account at any time, under the payslip. If you write to us, we keep your name, email and message so we can reply.',
            )}
          </li>
          <li>
            {t(
              'Une mesure d’audience anonyme et sans cookie (Vercel Web Analytics et Speed Insights) compte les pages vues et leur vitesse d’affichage. Elle ne reçoit ni les montants saisis ni la partie de l’adresse qui les contient, et ne permet pas de vous identifier.',
              'Anonymous, cookie-free analytics (Vercel Web Analytics and Speed Insights) count page views and load times. They never receive the figures you type or the part of the address that contains them, and cannot identify you.',
            )}
          </li>
          <li>
            {t(
              'Votre navigateur garde seulement, chez vous, la langue, le thème et votre dernière simulation, pour les retrouver à la prochaine visite. Vider les données du site les efface.',
              'Your browser stores only your language, theme and last simulation, on your device, so they are there next time. Clearing the site’s data removes them.',
            )}
          </li>
          <li>
            {t(
              'Un lien partagé contient les paramètres de la simulation dans son adresse : ne le partagez qu’avec qui vous voulez.',
              'A shared link contains your simulation’s figures in its address, so only share it with people you choose.',
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
          . {t('Pour tout le reste :', 'For anything else:')} <Link to="contact">{t('nous écrire', 'contact us')}</Link>.{' '}
          {t('monsalaire a été créé par', 'monsalaire was created by')}{' '}
          <a href="https://kevin.aconta.io" target="_blank" rel="author noopener">
            Kévin
          </a>
          {t(', et il est publié par Aconta.', ' and is published by Aconta.')}
        </p>
      </div>
    </article>
  );
}
