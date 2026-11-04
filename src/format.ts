const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** 250 000 (narrow no-break spaces, as French typography wants). */
export const money = (n: number) => nf.format(Math.round(n));
export const fcfa = (n: number) => `${money(n)} F`;
export const pct = (r: number, digits = 2) =>
  `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`;

export const monthLabel = (d = new Date()) => {
  const s = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const parseMoney = (s: string) => {
  const digits = s.replace(/[^\d]/g, '');
  return digits ? Math.min(Number(digits), 999_999_999) : 0;
};
