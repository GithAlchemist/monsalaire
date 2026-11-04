import type { Ref, Rules } from './engine';
import { useRoute, type Lang } from './i18n';

/** Number and date formats for a language: French spaces (250 000) or English commas (250,000). */
export function makeFmt(lang: Lang) {
  const loc = lang === 'en' ? 'en-GB' : 'fr-FR';
  const nf = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
  const money = (n: number) => nf.format(Math.round(n));
  return {
    money,
    fcfa: (n: number) => `${money(n)} F`,
    pct: (r: number, digits = 2) => `${(r * 100).toLocaleString(loc, { maximumFractionDigits: digits })}${lang === 'en' ? '' : '\u00a0'}%`,
    date: (iso: string) => new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    monthLabel: (d = new Date()) => {
      const s = d.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
  };
}

export type Fmt = ReturnType<typeof makeFmt>;

export function useFmt(): Fmt {
  return makeFmt(useRoute().lang);
}

export const parseMoney = (s: string) => {
  const digits = s.replace(/[^\d]/g, '');
  return digits ? Math.min(Number(digits), 999_999_999) : 0;
};

/** Link to the transcription of a source, at the cited page (GitHub anchors "## Page 25" as #page-25). */
export function refUrl(rules: Rules, ref?: Ref): string | null {
  if (!ref) return null;
  const src = rules.sources[ref.source];
  if (!src) return null;
  return ref.page ? `${src.url}#page-${ref.page}` : src.url;
}

export function refLabel(rules: Rules, lang: Lang, ref?: Ref): string | null {
  if (!ref) return null;
  const src = rules.sources[ref.source];
  if (!src) return null;
  const title = lang === 'en' && src.title_en ? src.title_en : src.title;
  return `${title}, ${ref.article}${ref.page ? `, p. ${ref.page}` : ''}`;
}
