import type { Lang } from '../i18n';

/**
 * The fixed list of article themes. The id is what an article's front matter names (`theme: smig`); the slug is the
 * address of the theme page in each language. Add a theme here, never in an article.
 */
export const THEMES = [
  {
    id: 'smig',
    fr: {
      name: 'SMIG et minimums',
      slug: 'smig-et-minimums',
      blurb: 'Le salaire minimum légal, les minimums des conventions collectives et leur évolution.',
    },
    en: {
      name: 'Minimum wages',
      slug: 'minimum-wages',
      blurb: 'The legal minimum wage, the minimums set by collective agreements and how they change.',
    },
  },
  {
    id: 'impot',
    fr: {
      name: 'Impôt et cotisations',
      slug: 'impot-et-cotisations',
      blurb: 'IRPP, CNSS, AMU : ce qui est retenu sur la paie, à quel taux et pourquoi.',
    },
    en: {
      name: 'Tax and contributions',
      slug: 'tax-and-contributions',
      blurb: 'Income tax, CNSS and AMU: what comes off a payslip, at what rate and why.',
    },
  },
  {
    id: 'comparaisons',
    fr: {
      name: 'Comparaisons entre pays',
      slug: 'comparaisons-entre-pays',
      blurb: 'Salaires, minimums et prélèvements comparés entre le Togo et ses voisins.',
    },
    en: {
      name: 'Country comparisons',
      slug: 'country-comparisons',
      blurb: 'Pay, minimum wages and deductions compared between Togo and its neighbours.',
    },
  },
  {
    id: 'guides',
    fr: {
      name: 'Guides pratiques',
      slug: 'guides-pratiques',
      blurb: 'Lire son bulletin, négocier un salaire, embaucher : des réponses concrètes.',
    },
    en: {
      name: 'Practical guides',
      slug: 'practical-guides',
      blurb: 'Reading a payslip, negotiating pay, hiring someone: practical answers.',
    },
  },
  {
    id: 'textes',
    fr: {
      name: 'Actualité des textes',
      slug: 'actualite-des-textes',
      blurb: 'Lois de finances, décrets, arrêtés et conventions : ce qui change et à partir de quand.',
    },
    en: {
      name: 'Legal updates',
      slug: 'legal-updates',
      blurb: 'Finance acts, decrees, orders and agreements: what changes and from when.',
    },
  },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const THEME_IDS = THEMES.map((t) => t.id) as [ThemeId, ...ThemeId[]];

export const themeOf = (id: ThemeId) => THEMES.find((t) => t.id === id)!;
export const themeName = (id: ThemeId, lang: Lang) => themeOf(id)[lang].name;
