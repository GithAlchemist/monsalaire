import type { Bracket, IrppBracketUse, Rules } from './types';

const floorTo = (value: number, step: number) => Math.floor(value / step) * step;

/** Progressive tax on an annual taxable income, bracket by bracket. */
export function progressiveTax(income: number, brackets: Bracket[]): { tax: number; uses: IrppBracketUse[]; marginal: number } {
  let tax = 0;
  let from = 0;
  let marginal = 0;
  const uses: IrppBracketUse[] = [];
  for (const b of brackets) {
    const to = b.up_to;
    const top = to === null ? income : Math.min(income, to);
    const taxed = Math.max(0, top - from);
    const part = taxed * b.rate;
    uses.push({ from, to, rate: b.rate, taxed, tax: part });
    if (taxed > 0) marginal = b.rate;
    tax += part;
    if (to === null) break;
    from = to;
  }
  return { tax, uses, marginal };
}

export interface AnnualIrpp {
  grossTaxable: number;
  contributions: number;
  afterContributions: number;
  flatAllowance: number;
  afterAllowance: number;
  dependentsDeduction: number;
  taxableIncome: number;
  tax: number;
  uses: IrppBracketUse[];
  marginal: number;
}

/**
 * Annual IRPP on wages, in the legal order of the CGI:
 * gross taxable - employee social contributions (art. 26) - 28 % flat allowance on the part up to 10 M (art. 26)
 * - 10 000 F per dependent per month, max 6 (art. 72-73), rounded down to the thousand, progressive scale (art. 74),
 * tax rounded down to the ten.
 */
export function annualIrpp(grossTaxable: number, contributions: number, dependents: number, rules: Rules): AnnualIrpp {
  const r = rules.irpp;
  const afterContributions = Math.max(0, grossTaxable - (r.deduct_social_contributions ? contributions : 0));
  const flatAllowance = Math.min(afterContributions, r.flat_allowance.cap_income) * r.flat_allowance.rate;
  const afterAllowance = afterContributions - flatAllowance;
  const n = Math.min(Math.max(0, Math.floor(dependents)), r.dependents.max);
  const dependentsDeduction = n * r.dependents.amount_per_month * 12;
  const taxableIncome = floorTo(Math.max(0, afterAllowance - dependentsDeduction), r.rounding.taxable_income_down_to);
  const { tax, uses, marginal } = progressiveTax(taxableIncome, r.brackets);
  return {
    grossTaxable,
    contributions,
    afterContributions,
    flatAllowance,
    afterAllowance,
    dependentsDeduction,
    taxableIncome,
    tax: floorTo(tax, r.rounding.tax_down_to),
    uses,
    marginal,
  };
}
