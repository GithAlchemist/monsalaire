import type { Ref, Rules } from './engine';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** 250 000 (narrow no-break spaces, as French typography wants). */
export const money = (n: number) => nf.format(Math.round(n));
export const fcfa = (n: number) => `${money(n)} F`;
export const pct = (r: number, digits = 2) => `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`;

export const monthLabel = (d = new Date()) => {
  const s = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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

export function refLabel(rules: Rules, ref?: Ref): string | null {
  if (!ref) return null;
  const src = rules.sources[ref.source];
  if (!src) return null;
  return `${src.title}, ${ref.article}${ref.page ? `, p. ${ref.page}` : ''}`;
}
