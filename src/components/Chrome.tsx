import { useEffect, useState } from 'react';
import type { Rules } from '../engine';
import { useFmt } from '../format';
import { useTheme, type Theme } from '../hooks';
import { Link, useRoute, type Lang, type Page } from '../i18n';
import { Icon } from './fields';

export const REPO = 'https://github.com/GithAlchemist/monsalaire';

/** The brand: Africa symbol and wordmark, each with a light version for the dark theme. */
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`logo logo-${size}`}>
      <img className="only-light" src="/brand/symbol.png" alt="" />
      <img className="only-dark" src="/brand/symbol-dark.png" alt="" />
      <img className="only-light wm" src="/brand/wordmark.png" alt="monsalaire" />
      <img className="only-dark wm" src="/brand/wordmark-dark.png" alt="monsalaire" />
    </span>
  );
}

export function LangSwitch({ compact }: { compact?: boolean }) {
  const { lang, page, t } = useRoute();
  const other: Lang = lang === 'fr' ? 'en' : 'fr';
  return (
    <Link to={page} lang={other} className={`btn lang-btn${compact ? ' icon' : ''}`} hrefLang={other} title={t('Read in English', 'Lire en français')}>
      <Icon.globe />
      <span>{other === 'en' ? 'EN' : 'FR'}</span>
    </Link>
  );
}

export function Header({ onShare, copied }: { onShare?: () => void; copied?: boolean }) {
  const { t, page } = useRoute();
  const [theme, setTheme] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
  const label: Record<Theme, string> = {
    system: t('Thème : celui de l’appareil', 'Theme: device'),
    light: t('Thème : clair', 'Theme: light'),
    dark: t('Thème : sombre', 'Theme: dark'),
  };
  const nav: { to: Page; label: string }[] = [
    { to: 'home', label: t('Simulateur', 'Simulator') },
    { to: 'understand', label: t('Comprendre', 'How it works') },
    { to: 'sources', label: t('Les textes', 'Legal texts') },
  ];
  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap header-in">
        <Link to="home" className="brand" aria-label={t('monsalaire, accueil', 'monsalaire, home')}>
          <Logo />
        </Link>
        <nav className="nav" aria-label={t('Pages', 'Pages')}>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} aria-current={page === n.to ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="h-start">
          {onShare && (
            <button type="button" className="btn has-label" onClick={onShare} aria-label={t('Partager cette simulation', 'Share this simulation')}>
              <Icon.share />
              <span className="label-md">{copied ? t('Lien copié', 'Link copied') : t('Partager', 'Share')}</span>
            </button>
          )}
        </div>
        <div className="header-actions">
          {onShare && (
            <button type="button" className="btn icon hide-xs" onClick={() => window.print()} aria-label={t('Imprimer le bulletin', 'Print the payslip')}>
              <Icon.print />
            </button>
          )}
          <LangSwitch />
          <button type="button" className="btn icon hide-xs" onClick={() => setTheme(next[theme])} aria-label={label[theme]} title={label[theme]}>
            {theme === 'light' ? <Icon.sun /> : theme === 'dark' ? <Icon.moon /> : <Icon.auto />}
          </button>
          <a className="btn icon hide-xs" href={REPO} target="_blank" rel="noreferrer" aria-label={t('Code source sur GitHub', 'Source code on GitHub')}>
            <Icon.github />
          </a>
        </div>
      </div>
      <nav className="subnav wrap" aria-label={t('Pages', 'Pages')}>
        {nav.map((n) => (
          <Link key={n.to} to={n.to} aria-current={page === n.to ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer({ rules }: { rules: Rules }) {
  const { t } = useRoute();
  const { date } = useFmt();
  const issue = (template: string) => `${REPO}/issues/new?template=${template}`;
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            <Link to="home" className="brand" aria-label="monsalaire">
              <Logo size="lg" />
            </Link>
            <p className="tagline">{t('Les salaires en perspective.', 'Salaries in perspective.')}</p>
            <p>{t('Le bulletin de paie, calculé sous vos yeux et expliqué ligne par ligne. Libre, gratuit, sans compte.', 'Your payslip, computed before your eyes and explained line by line. Free, open source, no account.')}</p>
            <p className="f-meta">
              {t('Règles', 'Rules')} {rules.version} · {t('vérifiées le', 'checked on')} {date(rules.verified_on)}
            </p>
            <div className="f-actions">
              <LangSwitch />
              <ThemeButton />
            </div>
          </div>
          <div>
            <h3>{t('Simulateur', 'Simulator')}</h3>
            <ul>
              <li>
                <Link to="home">{t('Calculer mon salaire', 'Compute my salary')}</Link>
              </li>
              <li>
                <Link to="understand">{t('Comprendre le calcul', 'How it is computed')}</Link>
              </li>
              <li>
                <Link to="sources">{t('Les textes officiels', 'Official texts')}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>{t('Pays', 'Countries')}</h3>
            <ul>
              <li>
                <Link to="home">Togo</Link> <span className="pill on">{t('en ligne', 'live')}</span>
              </li>
              <li>
                {t('Bénin', 'Benin')} <span className="pill">{t('bientôt', 'soon')}</span>
              </li>
              <li>
                {t('Sénégal', 'Senegal')} <span className="pill">{t('bientôt', 'soon')}</span>
              </li>
              <li>
                Côte d'Ivoire <span className="pill">{t('bientôt', 'soon')}</span>
              </li>
              <li>
                <a href={issue('new-country.yml')} target="_blank" rel="noreferrer">
                  {t('Proposer un pays', 'Suggest a country')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3>{t('Projet libre', 'Open source')}</h3>
            <ul>
              <li>
                <a href={REPO} target="_blank" rel="noreferrer">
                  {t('Code source', 'Source code')}
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
                  {t('Contribuer', 'Contribute')}
                </a>
              </li>
              <li>
                <a href={issue('rule-error.yml')} target="_blank" rel="noreferrer">
                  {t('Signaler une règle fausse', 'Report a wrong rule')}
                </a>
              </li>
              <li>
                <a href={`${REPO}#roadmap`} target="_blank" rel="noreferrer">
                  {t('Feuille de route', 'Roadmap')}
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
                  {t('Licence MIT', 'MIT licence')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3>{t('À savoir', 'Legal')}</h3>
            <ul>
              <li>
                <Link to="terms">{t("Conditions d'utilisation", 'Terms of use')}</Link>
              </li>
              <li>
                <Link to="terms">{t('Confidentialité', 'Privacy')}</Link>
              </li>
              <li className="f-note">{t('Aucune donnée collectée, aucun traceur.', 'No data collected, no trackers.')}</li>
            </ul>
          </div>
        </div>
        <div className="f-bottom">
          <span>© 2026 monsalaire · {t('projet libre sous licence MIT', 'open source under the MIT licence')}</span>
          <span>{t('Simulation indicative : elle ne remplace pas le bulletin de votre employeur.', 'Indicative simulation: it does not replace your employer’s payslip.')}</span>
        </div>
      </div>
    </footer>
  );
}

function ThemeButton() {
  const { t } = useRoute();
  const [theme, setTheme] = useTheme();
  const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
  const label: Record<Theme, string> = {
    system: t('Thème : celui de l’appareil', 'Theme: device'),
    light: t('Thème : clair', 'Theme: light'),
    dark: t('Thème : sombre', 'Theme: dark'),
  };
  return (
    <button type="button" className="btn" onClick={() => setTheme(next[theme])} aria-label={label[theme]}>
      {theme === 'light' ? <Icon.sun /> : theme === 'dark' ? <Icon.moon /> : <Icon.auto />}
      <span>{label[theme].split(': ').pop()?.split(' : ').pop()}</span>
    </button>
  );
}
