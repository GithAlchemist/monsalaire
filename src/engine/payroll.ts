import { annualIrpp, type AnnualIrpp } from './irpp';
import type { IrppStep, Lang, PayInput, PayLine, Payslip, Rules } from './types';

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

/** Label of a rule entry in the requested language (French is the reference text). */
export const labelOf = (o: { label: string; label_en?: string }, lang: Lang) => (lang === 'en' && o.label_en ? o.label_en : o.label);

/** Compute a full monthly payslip from the input and the rules in force. Texts are written in `lang`. */
export function computePayslip(input: PayInput, rules: Rules, lang: Lang = 'fr'): Payslip {
  const en = lang === 'en';
  const tr = (fr: string, e: string) => (en ? e : fr);
  const loc = en ? 'en-GB' : 'fr-FR';
  const pct = (r: number) => `${(r * 100).toLocaleString(loc, { maximumFractionDigits: 2 })} %`;
  const fcfa = (n: number) => `${Math.round(n).toLocaleString(loc)} F`;

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
    label: tr('Salaire de base', 'Base salary'),
    kind: 'earning',
    employee: round(base),
    employer: 0,
    explain: tr(
      'Le salaire fixe du contrat pour un mois complet. Il ne peut pas être inférieur au minimum de votre catégorie, ni au SMIG.',
      'The fixed salary of the contract for a full month. It cannot be lower than the minimum of your category, nor than the minimum wage (SMIG).',
    ),
    ref: rules.categories.ref,
  });

  const catMin = categoryMinimum(rules, input.category, input.echelon);
  const senRate = seniorityRate(input.seniorityYears, rules);
  const senBase = catMin ?? base;
  const seniorityAmount = round(senBase * senRate);
  if (senRate > 0) {
    const years = Math.floor(input.seniorityYears);
    lines.push({
      id: 'seniority',
      label: tr("Prime d'ancienneté", 'Seniority bonus'),
      kind: 'earning',
      base: senBase,
      rate: senRate,
      employee: seniorityAmount,
      employer: 0,
      explain:
        tr(
          `${pct(senRate)} après ${years} ans dans l'entreprise : 2 % à partir de deux ans, puis un point de plus chaque année dès la quatrième, 35 % au plus. `,
          `${pct(senRate)} after ${years} years with the company: 2 % from two years, then one more point each year from the fourth, 35 % at most. `,
        ) +
        (catMin
          ? tr(
              `Elle se calcule sur le minimum de la catégorie ${input.category} (${fcfa(catMin)}), pas sur le salaire réel.`,
              `It is computed on the minimum wage of category ${input.category} (${fcfa(catMin)}), not on the actual salary.`,
            )
          : tr(
              'Elle se calcule sur le minimum de votre catégorie : sans catégorie choisie, elle est estimée ici sur le salaire de base.',
              'It is computed on the minimum of your category: with no category chosen, it is estimated here on the base salary.',
            )),
      ref: rules.seniority.ref,
    });
  }

  let overtimeTotal = 0;
  for (const ot of rules.overtime.rates) {
    const hours = pos(input.overtimeHours?.[ot.id]);
    if (!hours) continue;
    const amount = round(hours * hourlyRate * (1 + ot.rate));
    overtimeTotal += amount;
    const withSur = wt.hourly_base_items.some((id) => items[id]);
    lines.push({
      id: ot.id,
      label: tr(`Heures supplémentaires +${Math.round(ot.rate * 100)} %`, `Overtime +${Math.round(ot.rate * 100)} %`),
      kind: 'earning',
      quantity: hours,
      unit: 'h',
      base: Math.round(hourlyRate),
      rate: 1 + ot.rate,
      employee: amount,
      employer: 0,
      explain: tr(
        `${labelOf(ot, lang)}. ${hours} h au taux horaire de ${fcfa(hourlyRate)} (salaire de base${withSur ? ' et sursalaire' : ''} divisé par ${wt.monthly_hours} h), majoré de ${Math.round(ot.rate * 100)} %.`,
        `${labelOf(ot, lang)}. ${hours} h at the hourly rate of ${fcfa(hourlyRate)} (base salary${withSur ? ' and additional salary' : ''} divided by ${wt.monthly_hours} h), plus ${Math.round(ot.rate * 100)} %.`,
      ),
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
      label: labelOf(item, lang),
      kind,
      employee: amount,
      employer: 0,
      explain:
        kind === 'benefit'
          ? tr(
              "Avantage en nature : il n'est pas versé en argent, mais il compte dans le brut. Il est imposé et soumis à la CNSS pour sa valeur réelle, puis retiré du net à payer.",
              'Benefit in kind: it is not paid in cash, but it counts in the gross. It is taxed and subject to CNSS at its real value, then taken out of the net pay.',
            )
          : kind === 'reimbursement'
            ? tr(
                'Les frais réellement engagés pour le travail et remboursés sur justificatifs ne sont ni imposés ni cotisés.',
                'Expenses actually incurred for work and refunded against receipts are neither taxed nor subject to contributions.',
              )
            : tr(
                'Élément de salaire : il est imposé et soumis aux cotisations, comme le salaire de base.',
                'Part of the salary: it is taxed and subject to contributions, like the base salary.',
              ),
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
      label: tr('Primes de panier', 'Meal allowances'),
      kind: 'reimbursement',
      quantity: meals,
      unit: '×',
      base: round(al.meal.hours_multiplier * e1Hourly),
      employee: amount,
      employer: 0,
      explain: tr(
        `Due après au moins six heures de travail de nuit, ou une longue journée prolongée. Elle vaut trois fois le salaire horaire du manœuvre (${fcfa(al.meal.hours_multiplier * e1Hourly)}). Traitée ici comme un remboursement de frais de repas, sans impôt ni cotisation.`,
        `Due after at least six hours of night work, or a long extended day. It is worth three times the labourer's hourly wage (${fcfa(al.meal.hours_multiplier * e1Hourly)}). Treated here as a meal expense refund, with no tax or contribution.`,
      ),
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
      label: tr('Frais de mission', 'Mission allowances'),
      kind: 'reimbursement',
      quantity: pos(m.oneMeal) + pos(m.twoMeals) + pos(m.night),
      unit: 'j',
      employee: missionAmount,
      employer: 0,
      explain: tr(
        `Barème minimum de la convention, sur le taux horaire de base de la catégorie (${fcfa(catHourly)}) : 3 fois pour un repas, 5 fois pour deux repas, 10 fois pour deux repas et une nuit. Ce sont des frais, non imposés.`,
        `Minimum scale of the collective agreement, on the category's hourly base rate (${fcfa(catHourly)}): 3 times for one meal, 5 times for two meals, 10 times for two meals and a night. These are expenses, not taxed.`,
      ),
      ref: al.mission.ref,
    });
  }

  const exceptional = round(pos(input.exceptional));
  if (exceptional) {
    lines.push({
      id: 'exceptional',
      label: tr('Treizième mois ou prime exceptionnelle', '13th month or one-off bonus'),
      kind: 'earning',
      employee: exceptional,
      employer: 0,
      explain: tr(
        "Versement ponctuel. Son impôt est calculé à part : on mesure ce qu'il ajoute à l'impôt de l'année, au lieu de le traiter comme s'il était touché douze fois.",
        'One-off payment. Its tax is computed separately: what it adds to the tax of the year, instead of treating it as if it were received twelve times.',
      ),
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
    warnings.push(
      tr(
        `Le salaire est inférieur au SMIG (${fcfa(smig)} par mois, arrêté 3790 du 31 décembre 2022). Les cotisations sont calculées sur le SMIG, qui est leur plancher légal.`,
        `The salary is below the minimum wage (${fcfa(smig)} a month, order 3790 of 31 December 2022). Contributions are computed on the minimum wage, their legal floor.`,
      ),
    );
  }
  if (catMin && base > 0 && base < catMin) {
    warnings.push(
      tr(
        `Le salaire de base est inférieur au minimum de la catégorie ${input.category} (${fcfa(catMin)}) fixé par la convention collective de 2026.`,
        `The base salary is below the minimum of category ${input.category} (${fcfa(catMin)}) set by the 2026 collective agreement.`,
      ),
    );
  }

  const cnss = rules.social.cnss;
  const surcharge = [0, ...cnss.work_risk_surcharges][Math.min(Math.max(0, input.workRiskSurcharge || 0), cnss.work_risk_surcharges.length)];
  let employeeContributions = 0;
  let employerContributions = 0;
  for (const c of cnss.employee) {
    const amount = round(cnssBase * c.rate);
    employeeContributions += amount;
    lines.push({
      id: c.id,
      label: labelOf(c, lang),
      kind: 'contribution',
      base: cnssBase,
      rate: c.rate,
      employee: amount,
      employer: 0,
      explain: tr(
        'Votre part de la cotisation retraite, versée à la CNSS. Elle ouvre vos droits à la pension. Elle se calcule sur tout le brut, avantages en nature compris, jamais moins que le SMIG, sans plafond.',
        'Your share of the pension contribution, paid to the CNSS (national social security fund). It builds your pension rights. It is computed on the whole gross, benefits in kind included, never below the minimum wage, with no ceiling.',
      ),
      ref: cnss.ref,
    });
  }
  for (const c of cnss.employer) {
    const rate = c.id === 'cnss_work_risk' ? c.rate * (1 + surcharge) : c.rate;
    const amount = round(cnssBase * rate);
    employerContributions += amount;
    lines.push({
      id: c.id,
      label: labelOf(c, lang),
      kind: 'contribution',
      base: cnssBase,
      employerRate: rate,
      employee: 0,
      employer: amount,
      explain:
        c.id === 'cnss_work_risk' && surcharge
          ? tr(
              `Taux majoré de ${Math.round(surcharge * 100)} % : l'employeur n'a pas corrigé les risques relevés lors d'un contrôle de prévention.`,
              `Rate increased by ${Math.round(surcharge * 100)} %: the employer did not fix the risks found during a prevention inspection.`,
            )
          : tr(
              "Payée par l'employeur en plus du salaire brut. Elle ne réduit pas votre net, mais elle fait partie de ce que vous coûtez.",
              'Paid by the employer on top of the gross salary. It does not reduce your net, but it is part of what you cost.',
            ),
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
    label: tr('Assurance maladie universelle (AMU)', 'Universal health insurance (AMU)'),
    kind: 'contribution',
    base: amuBase,
    rate: amu.employee_rate,
    employerRate: amu.employer_rate,
    employee: amuEmployee,
    employer: amuEmployer,
    explain:
      tr(
        `Finance votre couverture santé : ${pct(amu.employee_rate + amu.employer_rate)} du salaire de base et des primes, moitié pour vous, moitié pour l'employeur.`,
        `Funds your health cover: ${pct(amu.employee_rate + amu.employer_rate)} of the base salary and bonuses, half paid by you, half by the employer.`,
      ) + (benefitsInKind ? tr(' Les avantages en nature ne sont pas soumis à l’AMU.', ' Benefits in kind are not subject to the AMU.') : ''),
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
    {
      kind: 'base',
      label: tr('Revenu imposable de l’année', 'Taxable income of the year'),
      amount: display.grossTaxable,
      note: exceptional
        ? tr('Salaire imposable du mois × 12, plus le versement exceptionnel', 'Taxable salary of the month × 12, plus the one-off payment')
        : tr('Salaire imposable du mois × 12, avantages en nature compris', 'Taxable salary of the month × 12, benefits in kind included'),
    },
    { kind: 'minus', label: tr('Cotisations CNSS et AMU', 'CNSS and AMU contributions'), amount: display.pension + display.social, note: tr('Déduites avant tout calcul', 'Deducted before anything else') },
    {
      kind: 'minus',
      label: tr(`Abattement forfaitaire de ${pct(ir.flat_allowance.rate)}`, `Flat deduction of ${pct(ir.flat_allowance.rate)}`),
      amount: round(display.flatAllowance),
      note: tr(`Pour les frais professionnels, sur la part qui ne dépasse pas ${fcfa(ir.flat_allowance.cap_income)}`, `For work expenses, on the part up to ${fcfa(ir.flat_allowance.cap_income)}`),
    },
  ];
  if (display.voluntaryPension)
    irppSteps.push({ kind: 'minus', label: tr('Épargne retraite volontaire', 'Voluntary pension savings'), amount: round(display.voluntaryPension), note: tr(`Dans la limite de ${pct(ir.voluntary_pension_cap)} du revenu net`, `Within ${pct(ir.voluntary_pension_cap)} of net income`) });
  if (display.lifeInsurance)
    irppSteps.push({
      kind: 'minus',
      label: tr('Primes d’assurance vie', 'Life insurance premiums'),
      amount: round(display.lifeInsurance),
      note: tr(`${fcfa(ir.life_insurance.base_cap)} au plus, plus ${fcfa(ir.life_insurance.per_child)} par enfant`, `${fcfa(ir.life_insurance.base_cap)} at most, plus ${fcfa(ir.life_insurance.per_child)} per child`),
    });
  irppSteps.push(
    {
      kind: 'minus',
      label: tr(`Charges de famille (${dependents} personne${dependents > 1 ? 's' : ''})`, `Dependents (${dependents} ${dependents > 1 ? 'people' : 'person'})`),
      amount: display.dependentsDeduction,
      note: tr(`${fcfa(ir.dependents.amount_per_month)} par personne et par mois, ${ir.dependents.max} au plus`, `${fcfa(ir.dependents.amount_per_month)} per person per month, ${ir.dependents.max} at most`),
    },
    { kind: 'result', label: tr('Revenu net imposable', 'Net taxable income'), amount: display.taxableIncome, note: tr('Arrondi au millier inférieur', 'Rounded down to the thousand') },
    {
      kind: 'result',
      label: tr('Impôt de l’année', 'Tax for the year'),
      amount: irppAnnual,
      note: exempt ? tr('Salaire d’apprenti sous contrat : exonéré', 'Apprentice under contract: exempt') : tr('Barème par tranches, arrondi à la dizaine inférieure', 'Progressive scale, rounded down to the ten'),
    },
  );

  const taxableMonthly = regularTaxable + exceptional;
  lines.push({
    id: 'irpp',
    label: tr('Impôt sur le revenu (IRPP)', 'Income tax (IRPP)'),
    kind: 'tax',
    base: taxableMonthly,
    employee: irpp,
    employer: 0,
    explain: exempt
      ? tr("Les salaires des apprentis sous contrat d'apprentissage sont exonérés d'impôt sur le revenu.", 'Wages of apprentices under an apprenticeship contract are exempt from income tax.')
      : tr(
          "Retenu chaque mois par l'employeur et reversé à l'OTR avant le 15 du mois suivant. Il se calcule sur l'année : douze mois de salaire imposable, moins les cotisations, un abattement de 28 % et vos charges de famille, puis le barème par tranches, divisé par douze.",
          'Withheld every month by the employer and paid to the OTR (tax office) by the 15th of the next month. It is computed over the year: twelve months of taxable salary, minus contributions, a 28 % flat deduction and your dependents, then the progressive scale, divided by twelve.',
        ),
    ref: exempt ? ir.ref_apprentice : ir.ref,
  });

  // 5. Net ---------------------------------------------------------------------------------------------------------
  if (voluntaryPension) {
    lines.push({
      id: 'voluntary_pension',
      label: tr('Épargne retraite volontaire', 'Voluntary pension savings'),
      kind: 'deduction',
      employee: voluntaryPension,
      employer: 0,
      explain: tr(
        "Versement volontaire à une retraite complémentaire, retenu sur le salaire. Il réduit l'impôt, dans la limite de 6 % du revenu net.",
        'Voluntary payment to a supplementary pension, withheld from the salary. It reduces the tax, within 6 % of net income.',
      ),
      ref: ir.ref_deductions,
    });
  }
  if (benefitsInKind) {
    lines.push({
      id: 'benefits_back',
      label: tr('Avantages en nature (reçus en nature)', 'Benefits in kind (received in kind)'),
      kind: 'deduction',
      employee: benefitsInKind,
      employer: 0,
      explain: tr(
        "Les avantages en nature ont été ajoutés au brut pour calculer l'impôt et les cotisations. Ils sont retirés ici, puisque vous les recevez autrement qu'en argent.",
        'Benefits in kind were added to the gross to compute tax and contributions. They are taken out here, since you receive them otherwise than in cash.',
      ),
    });
  }
  const otherDeductions = round(pos(input.otherDeductions));
  if (otherDeductions) {
    lines.push({
      id: 'other',
      label: tr('Avances et autres retenues', 'Advances and other deductions'),
      kind: 'deduction',
      employee: otherDeductions,
      employer: 0,
      explain: tr(
        'Avances sur salaire, remboursement de prêt, mutuelle : seules les retenues prévues par le Code du travail sont permises, dans la limite de la quotité cessible.',
        'Salary advances, loan repayments, mutual insurance: only the deductions allowed by the Labour Code are permitted, within the assignable share of the wage.',
      ),
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
