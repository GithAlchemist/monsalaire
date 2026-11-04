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

export interface AnnualIrppInput {
  /** Gross taxable income of the year, cash and benefits in kind. */
  grossTaxable: number;
  /** Compulsory pension contributions withheld (CNSS employee share). */
  pension: number;
  /** Compulsory social and health insurance contributions withheld (AMU employee share). */
  social: number;
  /** Voluntary retirement savings of the year. */
  voluntaryPension: number;
  /** Life insurance premiums of the year. */
  lifeInsurance: number;
  dependents: number;
  children: number;
}

export interface AnnualIrpp {
  grossTaxable: number;
  pension: number;
  social: number;
  afterContributions: number;
  flatAllowance: number;
  afterAllowance: number;
  voluntaryPension: number;
  lifeInsurance: number;
  dependentsDeduction: number;
  taxableIncome: number;
  tax: number;
  uses: IrppBracketUse[];
  marginal: number;
}

/**
 * Annual IRPP on wages, in the order of the CGI (version 2025):
 * - art. 26 al. 1 and 2: compulsory pension (within 6 % of gross) and social/health contributions come off the gross;
 * - art. 26, last paragraph: flat 28 % deduction on that amount, for the part up to 10 M;
 * - art. 26 al. 8 and 9: voluntary pension (within 6 %) and life insurance premiums (within 200 000 F + 30 000 F per
 *   child, up to 6 children);
 * - art. 72 and 73: 10 000 F per dependent per month, 6 dependents at most;
 * - art. 74: rounded down to the thousand, progressive scale, tax rounded down to the ten.
 */
export function annualIrpp(i: AnnualIrppInput, rules: Rules): AnnualIrpp {
  const r = rules.irpp;
  const pension = Math.min(i.pension, i.grossTaxable * r.pension_deduction_cap);
  const afterContributions = Math.max(0, i.grossTaxable - pension - i.social);
  const flatAllowance = Math.min(afterContributions, r.flat_allowance.cap_income) * r.flat_allowance.rate;
  const afterAllowance = afterContributions - flatAllowance;
  const voluntaryPension = Math.min(Math.max(0, i.voluntaryPension), afterAllowance * r.voluntary_pension_cap);
  const li = r.life_insurance;
  const lifeInsurance = Math.min(Math.max(0, i.lifeInsurance), li.base_cap + li.per_child * Math.min(Math.max(0, i.children), li.max_children));
  const n = Math.min(Math.max(0, Math.floor(i.dependents)), r.dependents.max);
  const dependentsDeduction = n * r.dependents.amount_per_month * 12;
  const taxableIncome = floorTo(
    Math.max(0, afterAllowance - voluntaryPension - lifeInsurance - dependentsDeduction),
    r.rounding.taxable_income_down_to,
  );
  const { tax, uses, marginal } = progressiveTax(taxableIncome, r.brackets);
  return {
    grossTaxable: i.grossTaxable,
    pension,
    social: i.social,
    afterContributions,
    flatAllowance,
    afterAllowance,
    voluntaryPension,
    lifeInsurance,
    dependentsDeduction,
    taxableIncome,
    tax: floorTo(tax, r.rounding.tax_down_to),
    uses,
    marginal,
  };
}
