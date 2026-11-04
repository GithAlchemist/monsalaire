/**
 * Types shared by the payroll engine. The engine is pure: rules (data) + input -> payslip.
 * Legal parameters live in /rules/<country>/<year>.json, never in this code.
 */

export interface Bracket {
  up_to: number | null;
  rate: number;
}

export interface PayItemRule {
  id: string;
  label: string;
  /** Subject to social contributions (CNSS, AMU). */
  cnss: boolean;
  /** Subject to income tax (IRPP). */
  irpp: boolean;
  /** Paid in cash (false = benefit in kind: counted, not paid). */
  cash: boolean;
}

export interface RateLine {
  id: string;
  label: string;
  rate: number;
}

export interface SourceRef {
  title: string;
  publisher: string;
  url: string;
}

export interface Rules {
  country: string;
  currency: string;
  version: string;
  valid_from: string;
  valid_to: string | null;
  status: string;
  notes: string;
  minimum_wage: { smig_monthly: number; smig_hourly: number; valid_from: string; source: string; status: string };
  working_time: { weekly_hours: number; monthly_hours: number; source: string; article: string; status: string };
  social: {
    cnss: {
      employee: RateLine[];
      employer: RateLine[];
      base: string;
      floor: string | null;
      ceiling: number | null;
      ceiling_status: string;
      source: string;
      status: string;
    };
    amu: {
      employee_rate: number;
      employer_rate: number;
      base: string;
      ceiling: number | null;
      ceiling_status: string;
      note: string;
      source: string;
      status: string;
    };
  };
  irpp: {
    method: string;
    deduct_social_contributions: boolean;
    flat_allowance: { rate: number; cap_income: number; applies_to: string; source: string; article: string };
    dependents: { amount_per_month: number; max: number; applies_to: string; source: string; article: string };
    rounding: { taxable_income_down_to: number; tax_down_to: number; source: string; article: string };
    brackets: Bracket[];
    source: string;
    article: string;
    status: string;
  };
  overtime: { rates: RateLine[]; source: string; article: string; status: string };
  seniority: {
    base: string;
    first_step_years: number;
    first_step_rate: number;
    yearly_from_year: number;
    yearly_increment: number;
    cap: number;
    source: string;
    article: string;
    status: string;
  };
  categories: {
    source: string;
    article: string;
    status: string;
    groups: { id: string; label: string }[];
    grid: Record<string, number[]>;
  };
  pay_items: PayItemRule[];
  not_modeled: string[];
  sources: Record<string, SourceRef>;
}

export interface PayInput {
  /** Monthly base salary (salaire de base), FCFA. */
  baseSalary: number;
  /** CCIT category, e.g. "M2". Optional. */
  category?: string | null;
  /** Echelon index in the category (0 = A, 1 = B, 2 = C). */
  echelon?: number;
  /** Years of presence in the company. */
  seniorityYears: number;
  /** Bonuses, allowances and benefits in kind, by pay item id (monthly amounts). */
  items: Record<string, number>;
  /** Overtime hours this month, by overtime rate id. */
  overtimeHours: Record<string, number>;
  /** One-off taxable payment this month (13th month, exceptional bonus). */
  exceptional: number;
  /** People counted as dependents for IRPP (capped by the rules). */
  dependents: number;
  /** Advances, loan repayments and other deductions taken from the net. */
  otherDeductions: number;
}

export type LineKind = 'earning' | 'benefit' | 'reimbursement' | 'contribution' | 'tax' | 'deduction';

export interface PayLine {
  id: string;
  label: string;
  kind: LineKind;
  /** Base the rate applies to (when relevant). */
  base?: number;
  /** Rate or multiplier shown on the payslip. */
  rate?: number;
  /** Quantity (hours) when relevant. */
  quantity?: number;
  /** Amount added to the employee's pay (earnings) or withheld (contributions, tax, deductions). */
  employee: number;
  /** Amount paid by the employer on top of gross (employer contributions). */
  employer: number;
  /** Plain-language explanation of this line. */
  explain: string;
  sourceId?: string;
  article?: string;
}

export interface IrppStep {
  label: string;
  amount: number;
  note?: string;
}

export interface IrppBracketUse {
  from: number;
  to: number | null;
  rate: number;
  taxed: number;
  tax: number;
}

export interface Payslip {
  rulesVersion: string;
  lines: PayLine[];
  /** Everything earned this month, cash and benefits in kind (salaire brut). */
  grossTotal: number;
  /** Cash part of gross. */
  grossCash: number;
  benefitsInKind: number;
  reimbursements: number;
  socialBase: number;
  taxableMonthly: number;
  employeeContributions: number;
  employerContributions: number;
  irpp: number;
  irppAnnual: number;
  irppSteps: IrppStep[];
  irppBrackets: IrppBracketUse[];
  /** Effective IRPP rate on the gross. */
  irppEffectiveRate: number;
  marginalRate: number;
  otherDeductions: number;
  /** Money actually paid to the employee (net à payer). */
  netPay: number;
  /** Net before other deductions, the usual "salaire net". */
  netSalary: number;
  employerCost: number;
  seniority: { rate: number; base: number; amount: number; approximate: boolean };
  hourlyRate: number;
  warnings: string[];
}
