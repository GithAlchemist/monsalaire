/**
 * Types shared by the payroll engine. The engine is pure: rules (data) + input -> payslip.
 * Legal parameters live in /rules/<country>/<year>.json, never in this code.
 */

/** Where a value comes from: a source id from /sources, the article and the page of the original PDF. */
export interface Ref {
  source: string;
  article: string;
  page?: number;
}

export interface Bracket {
  up_to: number | null;
  rate: number;
}

export interface PayItemRule {
  id: string;
  label: string;
  /** Subject to CNSS contributions. */
  cnss: boolean;
  /** Subject to AMU contributions. */
  amu: boolean;
  /** Subject to income tax (IRPP). */
  irpp: boolean;
  /** Paid in cash (false = benefit in kind: counted, not paid). */
  cash: boolean;
  hint?: string;
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
  verified_on: string;
  notes: string;
  minimum_wage: { smig_monthly: number; smig_hourly: number; valid_from: string; ref: Ref; status: string };
  working_time: { weekly_hours: number; monthly_hours: number; hourly_base_items: string[]; ref: Ref; ref_hours: Ref; status: string };
  social: {
    cnss: {
      employee: RateLine[];
      employer: RateLine[];
      work_risk_surcharges: number[];
      floor: string | null;
      ceiling: number | null;
      ref: Ref;
      ref_base: Ref;
      ref_surcharge: Ref;
      status: string;
    };
    amu: {
      employee_rate: number;
      employer_rate: number;
      floor: string | null;
      ceiling: number | null;
      valid_from: string;
      ref: Ref;
      ref_base: Ref;
      status: string;
    };
  };
  irpp: {
    method: string;
    pension_deduction_cap: number;
    flat_allowance: { rate: number; cap_income: number };
    voluntary_pension_cap: number;
    life_insurance: { base_cap: number; per_child: number; max_children: number };
    dependents: { amount_per_month: number; max: number };
    rounding: { taxable_income_down_to: number; tax_down_to: number };
    brackets: Bracket[];
    apprentice_exempt: boolean;
    ref: Ref;
    ref_deductions: Ref;
    ref_dependents: Ref;
    ref_apprentice: Ref;
    ref_withholding: Ref;
    ref_2026: Ref;
    status: string;
  };
  overtime: { rates: RateLine[]; ref: Ref; status: string };
  allowances: {
    meal: { hours_multiplier: number; base_category: string; ref: Ref };
    mission: { one_meal: number; two_meals: number; two_meals_and_night: number; ref: Ref };
    status: string;
  };
  seniority: {
    base: string;
    first_step_years: number;
    first_step_rate: number;
    yearly_from_year: number;
    yearly_increment: number;
    cap: number;
    ref: Ref;
    interpretation: string;
    status: string;
  };
  categories: {
    ref: Ref;
    ref_definitions: Ref;
    status: string;
    groups: { id: string; label: string }[];
    grid: Record<string, number[]>;
    examples: Record<string, string>;
  };
  pay_items: PayItemRule[];
  pay_items_ref: { irpp: Ref; exempt: Ref; cnss: Ref; amu: Ref };
  not_modeled: string[];
  open_questions: string[];
  sources: Record<string, SourceRef>;
}

export type WorkerStatus = 'employee' | 'apprentice';

export interface PayInput {
  status: WorkerStatus;
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
  /** Number of meal allowances (prime de panier) this month. */
  mealAllowances: number;
  /** Mission days this month, by kind. */
  missions: { oneMeal: number; twoMeals: number; night: number };
  /** One-off taxable payment this month (13th month, exceptional bonus). */
  exceptional: number;
  /** Dependents for IRPP (CGI art. 72): spouse(s) without income, children, other dependents. */
  spouses: number;
  children: number;
  otherDependents: number;
  /** Voluntary retirement savings withheld each month (CGI art. 26-8). */
  voluntaryPension: number;
  /** Life insurance premiums paid over the year (CGI art. 26-9). */
  lifeInsuranceAnnual: number;
  /** Advances, loan repayments and other deductions taken from the net. */
  otherDeductions: number;
  /** Work-risk rate surcharge applied to the employer (0 = none, 1 = +50 %, 2 = +100 %). */
  workRiskSurcharge: number;
}

export type LineKind = 'earning' | 'benefit' | 'reimbursement' | 'contribution' | 'tax' | 'deduction';

export interface PayLine {
  id: string;
  label: string;
  kind: LineKind;
  /** Base the rate applies to (when relevant). */
  base?: number;
  /** Rate or multiplier shown on the payslip (employee side). */
  rate?: number;
  /** Employer rate, when it differs from the employee one. */
  employerRate?: number;
  /** Quantity (hours, days) when relevant. */
  quantity?: number;
  unit?: string;
  /** Amount added to the employee's pay (earnings) or withheld (contributions, tax, deductions). */
  employee: number;
  /** Amount paid by the employer on top of gross (employer contributions). */
  employer: number;
  /** Plain-language explanation of this line. */
  explain: string;
  ref?: Ref;
}

export interface IrppStep {
  label: string;
  amount: number;
  note?: string;
  kind: 'base' | 'minus' | 'result';
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
  grossCash: number;
  benefitsInKind: number;
  reimbursements: number;
  cnssBase: number;
  amuBase: number;
  taxableMonthly: number;
  employeeContributions: number;
  employerContributions: number;
  irpp: number;
  irppAnnual: number;
  irppSteps: IrppStep[];
  irppBrackets: IrppBracketUse[];
  irppExempt: boolean;
  /** IRPP as a share of gross. */
  irppEffectiveRate: number;
  marginalRate: number;
  voluntaryPension: number;
  otherDeductions: number;
  /** Money actually paid to the employee (net à payer). */
  netPay: number;
  /** Gross minus employee contributions and tax: the usual "salaire net". */
  netSalary: number;
  employerCost: number;
  dependents: number;
  seniority: { rate: number; base: number; amount: number; approximate: boolean };
  hourlyRate: number;
  warnings: string[];
}
