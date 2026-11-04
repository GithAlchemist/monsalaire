import type { Lang, Page } from './i18n';

/** Public address of the site: canonical links, sitemap and social previews are built from it. */
export const SITE = 'https://monsalaire.aconta.io';

/** Aconta, the publisher. Every link to it carries the place it comes from, to be counted in Aconta's analytics. */
export const ACONTA = 'https://aconta.io';
export const acontaLink = (place: string) => `${ACONTA}/?utm_source=monsalaire&utm_medium=referral&utm_campaign=${place}`;

/** Title and description of every page, in both languages: read by search engines, AI assistants and link previews. */
export const META: Record<Lang, Record<Page, { title: string; description: string }>> = {
  fr: {
    home: {
      title: 'monsalaire · calcul du salaire net au Togo (IRPP, CNSS, AMU)',
      description:
        'Simulateur gratuit de bulletin de paie au Togo : du brut au net, IRPP, CNSS, AMU et coût employeur calculés sous vos yeux. Chaque ligne cite l’article et la page du texte officiel.',
    },
    understand: {
      title: 'Comprendre le calcul du salaire au Togo · monsalaire',
      description:
        'Comment passe-t-on du brut au net au Togo ? Cotisations CNSS et AMU, abattement, barème de l’IRPP par tranches et coût employeur, expliqués pas à pas avec un exemple chiffré.',
    },
    sources: {
      title: 'Les textes officiels de la paie au Togo · monsalaire',
      description:
        'Code général des impôts, Code de sécurité sociale, décrets CNSS et AMU, Code du travail, convention collective, SMIG : les textes officiels archivés et la page où se trouve chaque règle.',
    },
    terms: {
      title: 'Conditions d’utilisation et confidentialité · monsalaire',
      description: 'Simulation indicative, gratuite et libre. Aucune donnée collectée, aucun traceur : le calcul se fait dans votre navigateur.',
    },
  },
  en: {
    home: {
      title: 'monsalaire · net salary calculator for Togo (income tax, CNSS, AMU)',
      description:
        'Free payslip simulator for Togo: from gross to net, income tax (IRPP), CNSS, AMU and employer cost computed as you type. Every line cites the article and page of the official text.',
    },
    understand: {
      title: 'How salaries are computed in Togo · monsalaire',
      description:
        'How does gross pay become net pay in Togo? CNSS and AMU contributions, allowance, income tax brackets and employer cost, explained step by step with a worked example.',
    },
    sources: {
      title: 'Official texts behind payroll in Togo · monsalaire',
      description:
        'Tax code, social security code, CNSS and AMU decrees, labour code, collective agreement, minimum wage: the official texts, archived, and the page where each rule is found.',
    },
    terms: {
      title: 'Terms of use and privacy · monsalaire',
      description: 'Indicative, free and open-source simulation. No data collected, no trackers: the computation runs in your browser.',
    },
  },
};
