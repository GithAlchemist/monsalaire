import { annualIrpp, type AnnualIrpp } from './irpp';
import type { IrppStep, PayInput, PayLine, Payslip, Rules } from './types';

const round = (n: number) => Math.round(n);
const pos = (n: number | undefined) => Math.max(0, n || 0);

export const emptyInput = (): PayInput => ({
  status: 'employee',
  baseSalary: 0,
  category: null,
  echelon: 0,
  seniorityYears: 0,
  items: {},
  overtimeHours: {},
  mealAllowances: 0,
  missions: { oneMeal: 0, twoMeals: 0, night: 0 },
  exceptional: 0,
  spouses: 0,
  children: 0,
  otherDependents: 0,
  voluntaryPension: 0,
  lifeInsuranceAnnual: 0,
  otherDeductions: 0,
  workRiskSurcharge: 0,
});

/** Seniority bonus rate (CCIT 2026, art. 40): 2 % after 2 years, then one more point each year from the 4th, capped. */
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

export function dependentsCount(input: Pick<PayInput, 'spouses' | 'children' | 'otherDependents'>, rules: Rules): number {
  return Math.min(pos(input.spouses) + pos(input.children) + pos(input.otherDependents), rules.irpp.dependents.max);
}

const pct = (r: number) => `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} F`;

/** Compute a full monthly payslip from the input and the rules in force. */
export function computePayslip(input: PayInput, rules: Rules): Payslip {
  const lines: PayLine[] = [];
  const warnings: string[] = [];
  const base = pos(input.baseSalary);
  const items = input.items ?? {};
  const wt = rules.working_time;
  const hourlyBase = base + wt.hourly_base_items.reduce((s, id) => s + pos(items[id]), 0);
  const hourlyRate = hourlyBase / wt.monthly_hours;
  const apprentice = input.status === 'apprentice';

  // 1. Earnings -------------------------------------------------------------------------------------------------
  lines.push({
    id: 'base',
    label: 'Salaire de base',
    kind: 'earning',
    employee: round(base),
    employer: 0,
    explain: 'Le salaire fixe du contrat pour un mois complet. Il ne peut pas être inférieur au minimum de votre catégorie, ni au SMIG.',
    ref: rules.categories.ref,
  });

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
        `${pct(senRate)} après ${Math.floor(input.seniorityYears)} ans dans l'entreprise : 2 % à partir de deux ans, puis un point de plus chaque année dès la quatrième, 35 % au plus. ` +
        (catMin
          ? `Elle se calcule sur le minimum de la catégorie ${input.category} (${fcfa(catMin)}), pas sur le salaire réel.`
          : 'Elle se calcule sur le minimum de votre catégorie : sans catégorie choisie, elle est estimée ici sur le salaire de base.'),
      ref: rules.seniority.ref,
    });
  }

  let overtimeTotal = 0;
  for (const ot of rules.overtime.rates) {
    const hours = pos(input.overtimeHours?.[ot.id]);
    if (!hours) continue;
    const amount = round(hours * hourlyRate * (1 + ot.rate));
    overtimeTotal += amount;
    lines.push({
      id: ot.id,
      label: `Heures supplémentaires +${Math.round(ot.rate * 100)} %`,
      kind: 'earning',
      quantity: hours,
      unit: 'h',
      base: Math.round(hourlyRate),
      rate: 1 + ot.rate,
      employee: amount,
      employer: 0,
      explain: `${ot.label}. ${hours} h au taux horaire de ${fcfa(hourlyRate)} (salaire de base${wt.hourly_base_items.some((id) => items[id]) ? ' et sursalaire' : ''} divisé par ${wt.monthly_hours} h), majoré de ${Math.round(ot.rate * 100)} %.`,
      ref: rules.overtime.ref,
    });
  }

  let cnssExtra = 0;
  let amuExtra = 0;
  let taxableExtra = 0;
  let cashExtra = 0;
  let benefitsInKind = 0;
  let reimbursements = 0;
  for (const item of rules.pay_items) {
    const amount = round(pos(items[item.id]));
    if (!amount) continue;
    const kind = !item.cash ? 'benefit' : !item.cnss && !item.irpp ? 'reimbursement' : 'earning';
    if (item.cnss) cnssExtra += amount;
    if (item.amu) amuExtra += amount;
    if (item.irpp) taxableExtra += amount;
    if (item.cash && kind === 'earning') cashExtra += amount;
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
          ? "Avantage en nature : il n'est pas versé en argent, mais il compte dans le brut. Il est imposé et soumis à la CNSS pour sa valeur réelle, puis retiré du net à payer."
          : kind === 'reimbursement'
            ? "Les frais réellement engagés pour le travail et remboursés sur justificatifs ne sont ni imposés ni cotisés."
            : 'Élément de salaire : il est imposé et soumis aux cotisations, comme le salaire de base.',
      ref: kind === 'reimbursement' ? rules.pay_items_ref.exempt : rules.pay_items_ref.irpp,
    });
  }

  // CCIT allowances computed from the grid: meal allowance and mission costs (expense allowances, not taxed).
  const al = rules.allowances;
  const e1Hourly = (rules.categories.grid[al.meal.base_category]?.[0] ?? 0) / wt.monthly_hours;
  const meals = pos(input.mealAllowances);
  if (meals) {
    const amount = round(meals * al.meal.hours_multiplier * e1Hourly);
    reimbursements += amount;
    lines.push({
      id: 'meal',
      label: 'Primes de panier',
      kind: 'reimbursement',
      quantity: meals,
      unit: '×',
      base: round(al.meal.hours_multiplier * e1Hourly),
      employee: amount,
      employer: 0,
      explain: `Due après au moins six heures de travail de nuit, ou une longue journée prolongée. Elle vaut trois fois le salaire horaire du manœuvre (${fcfa(al.meal.hours_multiplier * e1Hourly)}). Traitée ici comme un remboursement de frais de repas, sans impôt ni cotisation.`,
      ref: al.meal.ref,
    });
  }
  const catHourly = (catMin ?? base) / wt.monthly_hours;
  const m = input.missions ?? { oneMeal: 0, twoMeals: 0, night: 0 };
  const missionAmount = round(
    (pos(m.oneMeal) * al.mission.one_meal + pos(m.twoMeals) * al.mission.two_meals + pos(m.night) * al.mission.two_meals_and_night) * catHourly,
  );
  if (missionAmount) {
    reimbursements += missionAmount;
    lines.push({
      id: 'mission',
      label: 'Frais de mission',
      kind: 'reimbursement',
      quantity: pos(m.oneMeal) + pos(m.twoMeals) + pos(m.night),
      unit: 'j',
      employee: missionAmount,
      employer: 0,
      explain: `Barème minimum de la convention, sur le taux horaire de base de la catégorie (${fcfa(catHourly)}) : 3 fois pour un repas, 5 fois pour deux repas, 10 fois pour deux repas et une nuit. Ce sont des frais, non imposés.`,
      ref: al.mission.ref,
    });
  }

  const exceptional = round(pos(input.exceptional));
  if (exceptional) {
    lines.push({
      id: 'exceptional',
      label: 'Treizième mois ou prime exceptionnelle',
      kind: 'earning',
      employee: exceptional,
      employer: 0,
      explain:
        "Versement ponctuel. Son impôt est calculé à part : on mesure ce qu'il ajoute à l'impôt de l'année, au lieu de le traiter comme s'il était touché douze fois.",
      ref: { source: 'ccit-2026', article: 'art. 42', page: 39 },
    });
  }

  // 2. Gross ----------------------------------------------------------------------------------------------------
  const regular = base + seniorityAmount + overtimeTotal;
  const regularCnss = round(regular + cnssExtra);
  const regularAmu = round(regular + amuExtra);
  const regularTaxable = round(regular + taxableExtra);
  const grossCash = round(regular + cashExtra + exceptional);
  const grossTotal = grossCash + benefitsInKind;

  // 3. Social contributions --------------------------------------------------------------------------------------
  const smig = rules.minimum_wage.smig_monthly;
  const floor = (v: number) => (base > 0 ? Math.max(v, smig) : 0);
  const cnssBase = floor(regularCnss + exceptional);
  const amuBase = floor(regularAmu + exceptional);
  if (base > 0 && regularCnss + exceptional < smig) {
    warnings.push(`Le salaire est inférieur au SMIG (${fcfa(smig)} par mois, arrêté 3790 du 31 décembre 2022). Les cotisations sont calculées sur le SMIG, qui est leur plancher légal.`);
  }
  if (catMin && base > 0 && base < catMin) {
    warnings.push(`Le salaire de base est inférieur au minimum de la catégorie ${input.category} (${fcfa(catMin)}) fixé par la convention collective de 2026.`);
  }

  const cnss = rules.social.cnss;
  const surcharge = [0, ...cnss.work_risk_surcharges][Math.min(Math.max(0, input.workRiskSurcharge || 0), cnss.work_risk_surcharges.length)];
  let employeeContributions = 0;
  let employerContributions = 0;
  let pensionEmployee = 0;
  for (const c of cnss.employee) {
    const amount = round(cnssBase * c.rate);
    employeeContributions += amount;
    pensionEmployee += amount;
    lines.push({
      id: c.id,
      label: c.label,
      kind: 'contribution',
      base: cnssBase,
      rate: c.rate,
      employee: amount,
      employer: 0,
      explain: 'Votre part de la cotisation retraite, versée à la CNSS. Elle ouvre vos droits à la pension. Elle se calcule sur tout le brut, avantages en nature compris, jamais moins que le SMIG, sans plafond.',
      ref: cnss.ref,
    });
  }
  for (const c of cnss.employer) {
    const rate = c.id === 'cnss_work_risk' ? c.rate * (1 + surcharge) : c.rate;
    const amount = round(cnssBase * rate);
    employerContributions += amount;
    lines.push({
      id: c.id,
      label: c.label,
      kind: 'contribution',
      base: cnssBase,
      employerRate: rate,
      employee: 0,
      employer: amount,
      explain:
        c.id === 'cnss_work_risk' && surcharge
          ? `Taux majoré de ${Math.round(surcharge * 100)} % : l'employeur n'a pas corrigé les risques relevés lors d'un contrôle de prévention.`
          : "Payée par l'employeur en plus du salaire brut. Elle ne réduit pas votre net, mais elle fait partie de ce que vous coûtez.",
      ref: c.id === 'cnss_work_risk' && surcharge ? cnss.ref_surcharge : cnss.ref,
    });
  }
  const amu = rules.social.amu;
  const amuEmployee = round(amuBase * amu.employee_rate);
  const amuEmployer = round(amuBase * amu.employer_rate);
  employeeContributions += amuEmployee;
  employerContributions += amuEmployer;
  lines.push({
    id: 'amu',
    label: 'Assurance maladie universelle (AMU)',
    kind: 'contribution',
    base: amuBase,
    rate: amu.employee_rate,
    employerRate: amu.employer_rate,
    employee: amuEmployee,
    employer: amuEmployer,
    explain: `Finance votre couverture santé : ${pct(amu.employee_rate + amu.employer_rate)} du salaire de base et des primes, moitié pour vous, moitié pour l'employeur.${benefitsInKind ? ' Les avantages en nature ne sont pas soumis à l’AMU.' : ''}`,
    ref: amu.ref,
  });

  // 4. IRPP -------------------------------------------------------------------------------------------------------
  const cnssEmpRate = cnss.employee.reduce((s, c) => s + c.rate, 0);
  const regPension = round(floor(regularCnss) * cnssEmpRate) * 12;
  const regSocial = round(floor(regularAmu) * amu.employee_rate) * 12;
  const voluntaryPension = round(pos(input.voluntaryPension));
  const children = pos(input.children);
  const dependents = dependentsCount(input, rules);
  const annualInput = {
    grossTaxable: regularTaxable * 12,
    pension: regPension,
    social: regSocial,
    voluntaryPension: voluntaryPension * 12,
    lifeInsurance: pos(input.lifeInsuranceAnnual),
    dependents,
    children,
  };
  const ir = rules.irpp;
  const exempt = apprentice && ir.apprentice_exempt;
  const regularYear = annualIrpp(annualInput, rules);
  let display: AnnualIrpp = regularYear;
  let irppAnnual = exempt ? 0 : regularYear.tax;
  let irpp = exempt ? 0 : round(regularYear.tax / 12);
  if (exceptional) {
    const withExc = annualIrpp(
      {
        ...annualInput,
        grossTaxable: annualInput.grossTaxable + exceptional,
        pension: regPension + round(exceptional * cnssEmpRate),
        social: regSocial + round(exceptional * amu.employee_rate),
      },
      rules,
    );
    display = withExc;
    if (!exempt) {
      irpp += withExc.tax - regularYear.tax;
      irppAnnual = withExc.tax;
    }
  }

  const irppSteps: IrppStep[] = [
    { kind: 'base', label: 'Revenu imposable de l’année', amount: display.grossTaxable, note: exceptional ? 'Salaire imposable du mois × 12, plus le versement exceptionnel' : 'Salaire imposable du mois × 12, avantages en nature compris' },
    { kind: 'minus', label: 'Cotisations CNSS et AMU', amount: display.pension + display.social, note: 'Déduites avant tout calcul' },
    { kind: 'minus', label: `Abattement forfaitaire de ${pct(ir.flat_allowance.rate)}`, amount: round(display.flatAllowance), note: `Pour les frais professionnels, sur la part qui ne dépasse pas ${fcfa(ir.flat_allowance.cap_income)}` },
  ];
  if (display.voluntaryPension) irppSteps.push({ kind: 'minus', label: 'Épargne retraite volontaire', amount: round(display.voluntaryPension), note: `Dans la limite de ${pct(ir.voluntary_pension_cap)} du revenu net` });
  if (display.lifeInsurance) irppSteps.push({ kind: 'minus', label: 'Primes d’assurance vie', amount: round(display.lifeInsurance), note: `${fcfa(ir.life_insurance.base_cap)} au plus, plus ${fcfa(ir.life_insurance.per_child)} par enfant` });
  irppSteps.push(
    { kind: 'minus', label: `Charges de famille (${dependents} personne${dependents > 1 ? 's' : ''})`, amount: display.dependentsDeduction, note: `${fcfa(ir.dependents.amount_per_month)} par personne et par mois, ${ir.dependents.max} au plus` },
    { kind: 'result', label: 'Revenu net imposable', amount: display.taxableIncome, note: 'Arrondi au millier inférieur' },
    { kind: 'result', label: 'Impôt de l’année', amount: irppAnnual, note: exempt ? 'Salaire d’apprenti sous contrat : exonéré' : 'Barème par tranches, arrondi à la dizaine inférieure' },
  );

  const taxableMonthly = regularTaxable + exceptional;
  lines.push({
    id: 'irpp',
    label: 'Impôt sur le revenu (IRPP)',
    kind: 'tax',
    base: taxableMonthly,
    employee: irpp,
    employer: 0,
    explain: exempt
      ? "Les salaires des apprentis sous contrat d'apprentissage sont exonérés d'impôt sur le revenu."
      : "Retenu chaque mois par l'employeur et reversé à l'OTR avant le 15 du mois suivant. Il se calcule sur l'année : douze mois de salaire imposable, moins les cotisations, un abattement de 28 % et vos charges de famille, puis le barème par tranches, divisé par douze.",
    ref: exempt ? ir.ref_apprentice : ir.ref,
  });

  // 5. Net ---------------------------------------------------------------------------------------------------------
  if (voluntaryPension) {
    lines.push({
      id: 'voluntary_pension',
      label: 'Épargne retraite volontaire',
      kind: 'deduction',
      employee: voluntaryPension,
      employer: 0,
      explain: "Versement volontaire à une retraite complémentaire, retenu sur le salaire. Il réduit l'impôt, dans la limite de 6 % du revenu net.",
      ref: ir.ref_deductions,
    });
  }
  if (benefitsInKind) {
    lines.push({
      id: 'benefits_back',
      label: 'Avantages en nature (reçus en nature)',
      kind: 'deduction',
      employee: benefitsInKind,
      employer: 0,
      explain: "Les avantages en nature ont été ajoutés au brut pour calculer l'impôt et les cotisations. Ils sont retirés ici, puisque vous les recevez autrement qu'en argent.",
    });
  }
  const otherDeductions = round(pos(input.otherDeductions));
  if (otherDeductions) {
    lines.push({
      id: 'other',
      label: 'Avances et autres retenues',
      kind: 'deduction',
      employee: otherDeductions,
      employer: 0,
      explain: "Avances sur salaire, remboursement de prêt, mutuelle : seules les retenues prévues par le Code du travail sont permises, dans la limite de la quotité cessible.",
      ref: { source: 'code-travail-2021', article: 'art. 173', page: 27 },
    });
  }

  const netSalary = grossTotal - employeeContributions - irpp;
  const netPay = netSalary - benefitsInKind - voluntaryPension + reimbursements - otherDeductions;
  const employerCost = grossTotal + reimbursements + employerContributions;

  return {
    rulesVersion: rules.version,
    lines,
    grossTotal,
    grossCash,
    benefitsInKind,
    reimbursements,
    cnssBase,
    amuBase,
    taxableMonthly,
    employeeContributions,
    employerContributions,
    irpp,
    irppAnnual,
    irppSteps,
    irppBrackets: display.uses,
    irppExempt: exempt,
    irppEffectiveRate: grossTotal > 0 ? irpp / grossTotal : 0,
    marginalRate: exempt ? 0 : display.marginal,
    voluntaryPension,
    otherDeductions,
    netPay,
    netSalary,
    employerCost,
    dependents,
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
