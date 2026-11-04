import { annualIrpp } from './irpp';
import type { IrppStep, PayInput, PayLine, Payslip, Rules } from './types';

const round = (n: number) => Math.round(n);

export const emptyInput = (): PayInput => ({
  baseSalary: 0,
  category: null,
  echelon: 0,
  seniorityYears: 0,
  items: {},
  overtimeHours: {},
  exceptional: 0,
  dependents: 0,
  otherDeductions: 0,
});

/** Seniority bonus rate (CCIT 2026, art. 40): 2 % after 2 years, then +1 point per year from the 4th year, capped. */
export function seniorityRate(years: number, rules: Rules): number {
  const s = rules.seniority;
  const y = Math.floor(Math.max(0, years));
  if (y < s.first_step_years) return 0;
  if (y < s.yearly_from_year) return s.first_step_rate;
  const rate = s.first_step_rate + (y - s.yearly_from_year + 1) * s.yearly_increment;
  return Math.min(s.cap, Math.round(rate * 10000) / 10000);
}

export function categoryMinimum(rules: Rules, category?: string | null, echelon = 0): number | null {
  if (!category) return null;
  const steps = rules.categories.grid[category];
  if (!steps) return null;
  return steps[Math.min(Math.max(0, echelon), steps.length - 1)];
}

const pct = (r: number) => `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} F`;

/** Compute a full monthly payslip from the input and the rules in force. */
export function computePayslip(input: PayInput, rules: Rules): Payslip {
  const lines: PayLine[] = [];
  const warnings: string[] = [];
  const base = Math.max(0, input.baseSalary || 0);
  const hourlyRate = base / rules.working_time.monthly_hours;

  // 1. Earnings -------------------------------------------------------------------------------------------------
  lines.push({
    id: 'base',
    label: 'Salaire de base',
    kind: 'earning',
    employee: round(base),
    employer: 0,
    explain: 'Le salaire fixe prévu au contrat pour un mois complet de travail.',
  });

  // Seniority bonus
  const catMin = categoryMinimum(rules, input.category, input.echelon);
  const senRate = seniorityRate(input.seniorityYears, rules);
  const senBase = catMin ?? base;
  const seniorityAmount = round(senBase * senRate);
  if (senRate > 0) {
    lines.push({
      id: 'seniority',
      label: "Prime d'ancienneté",
      kind: 'earning',
      base: senBase,
      rate: senRate,
      employee: seniorityAmount,
      employer: 0,
      explain:
        `${pct(senRate)} après ${Math.floor(input.seniorityYears)} ans de présence. ` +
        (catMin
          ? `Calculée sur le minimum de la catégorie ${input.category} (${fcfa(catMin)}), comme le prévoit la convention.`
          : "La convention la calcule sur le minimum de votre catégorie : sans catégorie choisie, elle est estimée ici sur le salaire de base."),
      sourceId: rules.seniority.source,
      article: rules.seniority.article,
    });
  }

  // Overtime
  let overtimeTotal = 0;
  for (const ot of rules.overtime.rates) {
    const hours = Math.max(0, input.overtimeHours[ot.id] || 0);
    if (!hours) continue;
    const amount = round(hours * hourlyRate * (1 + ot.rate));
    overtimeTotal += amount;
    lines.push({
      id: ot.id,
      label: `Heures supplémentaires +${Math.round(ot.rate * 100)} %`,
      kind: 'earning',
      quantity: hours,
      base: Math.round(hourlyRate * 100) / 100,
      rate: 1 + ot.rate,
      employee: amount,
      employer: 0,
      explain: `${ot.label} : ${hours} h × taux horaire ${fcfa(hourlyRate)} (salaire de base ÷ ${rules.working_time.monthly_hours} h) × ${(1 + ot.rate).toLocaleString('fr-FR')}.`,
      sourceId: rules.overtime.source,
      article: rules.overtime.article,
    });
  }

  // Bonuses, allowances, benefits in kind, reimbursements
  let socialExtra = 0;
  let taxableExtra = 0;
  let cashExtra = 0;
  let benefitsInKind = 0;
  let reimbursements = 0;
  for (const item of rules.pay_items) {
    const amount = round(Math.max(0, input.items[item.id] || 0));
    if (!amount) continue;
    const kind = !item.cash ? 'benefit' : !item.cnss && !item.irpp ? 'reimbursement' : 'earning';
    if (item.cnss) socialExtra += amount;
    if (item.irpp) taxableExtra += amount;
    if (item.cash) cashExtra += amount;
    if (kind === 'benefit') benefitsInKind += amount;
    if (kind === 'reimbursement') reimbursements += amount;
    lines.push({
      id: item.id,
      label: item.label,
      kind,
      employee: amount,
      employer: 0,
      explain:
        kind === 'benefit'
          ? "Un avantage en nature n'est pas versé en argent, mais il compte dans le brut : il est soumis aux cotisations et à l'impôt, puis retiré du net à payer."
          : kind === 'reimbursement'
            ? "Le remboursement de frais réellement engagés pour le travail n'est ni cotisé ni imposé, à condition d'être justifié."
            : 'Élément de rémunération soumis aux cotisations et à l’impôt.',
      sourceId: kind === 'reimbursement' ? 'cnss-taux' : 'cgi',
      article: kind === 'reimbursement' ? undefined : 'art. 17 et 20',
    });
  }

  const exceptional = round(Math.max(0, input.exceptional || 0));
  if (exceptional) {
    lines.push({
      id: 'exceptional',
      label: 'Treizième mois ou prime exceptionnelle',
      kind: 'earning',
      employee: exceptional,
      employer: 0,
      explain:
        "Versement ponctuel. Son impôt est calculé à part : on mesure ce qu'il ajoute à l'impôt de l'année, pour ne pas le traiter comme s'il était touché douze fois.",
      sourceId: 'ccit-2026',
      article: 'art. 42',
    });
  }

  // 2. Gross ----------------------------------------------------------------------------------------------------
  const regularSocial = round(base + seniorityAmount + overtimeTotal + socialExtra);
  const regularTaxable = round(base + seniorityAmount + overtimeTotal + taxableExtra);
  const grossCash = round(base + seniorityAmount + overtimeTotal + cashExtra - reimbursements + exceptional);
  const grossTotal = grossCash + benefitsInKind;

  // 3. Social contributions --------------------------------------------------------------------------------------
  const smig = rules.minimum_wage.smig_monthly;
  const rawSocialBase = regularSocial + exceptional;
  const socialBase = base > 0 ? Math.max(rawSocialBase, rules.social.cnss.floor ? smig : 0) : 0;
  if (base > 0 && rawSocialBase < smig) {
    warnings.push(
      `Le salaire est inférieur au SMIG (${fcfa(smig)} par mois). Les cotisations sont tout de même calculées sur le SMIG, qui est le plancher légal.`,
    );
  }
  if (catMin && base > 0 && base < catMin) {
    warnings.push(
      `Le salaire de base est inférieur au minimum de la catégorie ${input.category} (${fcfa(catMin)}) prévu par la convention collective de 2026.`,
    );
  }

  let employeeContributions = 0;
  let employerContributions = 0;
  const cnss = rules.social.cnss;
  for (const c of cnss.employee) {
    const amount = round(socialBase * c.rate);
    employeeContributions += amount;
    lines.push({
      id: c.id,
      label: c.label,
      kind: 'contribution',
      base: socialBase,
      rate: c.rate,
      employee: amount,
      employer: 0,
      explain: 'Votre part de la cotisation retraite, versée à la CNSS. Elle ouvre vos droits à la pension.',
      sourceId: cnss.source,
    });
  }
  for (const c of cnss.employer) {
    const amount = round(socialBase * c.rate);
    employerContributions += amount;
    lines.push({
      id: c.id,
      label: c.label,
      kind: 'contribution',
      base: socialBase,
      rate: c.rate,
      employee: 0,
      employer: amount,
      explain: "Payée par l'employeur en plus du salaire brut. Elle ne réduit pas votre net, mais elle fait partie de ce que vous coûtez.",
      sourceId: cnss.source,
    });
  }
  const amu = rules.social.amu;
  const amuEmployee = round(socialBase * amu.employee_rate);
  const amuEmployer = round(socialBase * amu.employer_rate);
  employeeContributions += amuEmployee;
  employerContributions += amuEmployer;
  lines.push({
    id: 'amu',
    label: 'Assurance maladie universelle (AMU)',
    kind: 'contribution',
    base: socialBase,
    rate: amu.employee_rate,
    employee: amuEmployee,
    employer: amuEmployer,
    explain: `Finance votre couverture santé. ${pct(amu.employee_rate + amu.employer_rate)} au total, partagés entre vous (${pct(amu.employee_rate)}) et l'employeur (${pct(amu.employer_rate)}).`,
    sourceId: amu.source,
  });

  // 4. IRPP -------------------------------------------------------------------------------------------------------
  const rate = (cnss.employee.reduce((s, c) => s + c.rate, 0) + amu.employee_rate);
  const regularContribAnnual = round(Math.max(regularSocial, base > 0 && cnss.floor ? smig : 0) * rate) * 12;
  const annualRegular = annualIrpp(regularTaxable * 12, regularContribAnnual, input.dependents, rules);
  let irpp = round(annualRegular.tax / 12);
  let irppAnnual = annualRegular.tax;
  let display = annualRegular;
  if (exceptional) {
    const withExc = annualIrpp(
      regularTaxable * 12 + exceptional,
      regularContribAnnual + round(exceptional * rate),
      input.dependents,
      rules,
    );
    irpp += withExc.tax - annualRegular.tax;
    irppAnnual = withExc.tax;
    display = withExc;
  }

  const ir = rules.irpp;
  const nDep = Math.min(Math.max(0, Math.floor(input.dependents)), ir.dependents.max);
  const irppSteps: IrppStep[] = [
    { label: 'Revenu imposable brut sur l’année', amount: display.grossTaxable, note: exceptional ? 'Salaire du mois × 12, plus le versement exceptionnel' : 'Salaire imposable du mois × 12' },
    { label: 'Cotisations salariales (CNSS et AMU)', amount: -display.contributions, note: 'Déductibles avant l’impôt (art. 26)' },
    { label: `Abattement forfaitaire de ${pct(ir.flat_allowance.rate)}`, amount: -round(display.flatAllowance), note: `Sur la part qui ne dépasse pas ${fcfa(ir.flat_allowance.cap_income)} (art. 26)` },
    { label: `Charges de famille (${nDep} personne${nDep > 1 ? 's' : ''})`, amount: -display.dependentsDeduction, note: `${fcfa(ir.dependents.amount_per_month)} par personne et par mois, ${ir.dependents.max} au plus (art. 72 et 73)` },
    { label: 'Revenu net imposable', amount: display.taxableIncome, note: 'Arrondi au millier inférieur (art. 74)' },
    { label: 'Impôt annuel', amount: irppAnnual, note: 'Barème progressif, arrondi à la dizaine inférieure (art. 74)' },
  ];

  const taxableMonthly = regularTaxable + exceptional;
  lines.push({
    id: 'irpp',
    label: 'Impôt sur le revenu (IRPP)',
    kind: 'tax',
    base: taxableMonthly,
    employee: irpp,
    employer: 0,
    explain:
      "Retenu chaque mois par l'employeur et reversé à l'OTR. Il se calcule sur l'année : on ajoute les douze mois, on retire les cotisations, un abattement de 28 % et vos charges de famille, puis on applique le barème par tranches et on divise par douze.",
    sourceId: ir.source,
    article: 'art. 26, 72 à 74',
  });

  // 5. Net ---------------------------------------------------------------------------------------------------------
  const otherDeductions = round(Math.max(0, input.otherDeductions || 0));
  if (benefitsInKind) {
    lines.push({
      id: 'benefits_back',
      label: 'Avantages en nature (déjà reçus)',
      kind: 'deduction',
      employee: benefitsInKind,
      employer: 0,
      explain: "Les avantages en nature ont été ajoutés au brut pour le calcul des cotisations et de l'impôt. Ils sont retirés ici car vous les recevez sous une autre forme qu'en argent.",
    });
  }
  if (otherDeductions) {
    lines.push({
      id: 'other',
      label: 'Avances et autres retenues',
      kind: 'deduction',
      employee: otherDeductions,
      employer: 0,
      explain: "Avances sur salaire, remboursements de prêt ou autres retenues convenues avec l'employeur.",
    });
  }

  const netSalary = grossTotal - employeeContributions - irpp;
  const netPay = netSalary - benefitsInKind + reimbursements - otherDeductions;
  const employerCost = grossTotal + reimbursements + employerContributions;

  return {
    rulesVersion: rules.version,
    lines,
    grossTotal,
    grossCash,
    benefitsInKind,
    reimbursements,
    socialBase,
    taxableMonthly,
    employeeContributions,
    employerContributions,
    irpp,
    irppAnnual,
    irppSteps,
    irppBrackets: display.uses,
    irppEffectiveRate: grossTotal > 0 ? irpp / grossTotal : 0,
    marginalRate: display.marginal,
    otherDeductions,
    netPay,
    netSalary,
    employerCost,
    seniority: { rate: senRate, base: senBase, amount: seniorityAmount, approximate: !catMin },
    hourlyRate,
    warnings,
  };
}

/**
 * Reverse calculation: the base salary needed to reach a target net pay, every other input unchanged.
 * Net is non-decreasing in the base salary, so a bisection on whole francs converges.
 */
export function baseForTargetNet(target: number, input: PayInput, rules: Rules): number {
  const net = (b: number) => computePayslip({ ...input, baseSalary: b }, rules).netPay;
  if (target <= net(0)) return 0;
  let lo = 0;
  let hi = Math.max(1000, target * 2);
  while (net(hi) < target) hi *= 2;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (net(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}
