import { describe, expect, it } from 'vitest';
import { baseForTargetNet, computePayslip, emptyInput, rulesFor, seniorityRate, type PayInput } from './index';

const rules = rulesFor('2026-11-01');
const slip = (baseSalary: number, extra: Partial<PayInput> = {}) => computePayslip({ ...emptyInput(), baseSalary, ...extra }, rules);
const line = (s: ReturnType<typeof slip>, id: string) => s.lines.find((l) => l.id === id);

// Reference cases worked out by hand from the CGI 2025 (art. 26, 72, 73, 74), see sources/README.md.
describe('IRPP on wages (CGI art. 26, 72 to 74)', () => {
  it('150 000 F, no dependent: 8 370 F a year', () => {
    // 1 800 000 - 72 000 (CNSS) - 90 000 (AMU) = 1 638 000; - 28 % = 1 179 360 -> 1 179 000; (1 179 000 - 900 000) x 3 %
    const s = slip(150000);
    expect(s.irppAnnual).toBe(8370);
    expect(s.irpp).toBe(698);
    expect(s.employeeContributions).toBe(13500);
    expect(s.netPay).toBe(150000 - 13500 - 698);
  });

  it('300 000 F, married with 2 children: 32 940 F a year, 2 745 F a month', () => {
    const s = slip(300000, { spouses: 1, children: 2 });
    expect(s.irppAnnual).toBe(32940);
    expect(s.irpp).toBe(2745);
    expect(s.netPay).toBe(270255);
  });

  it('800 000 F, married with 3 children: 343 900 F a year', () => {
    const s = slip(800000, { spouses: 1, children: 3 });
    expect(s.irppAnnual).toBe(343900);
    expect(s.irpp).toBe(28658);
  });

  it('caps dependents at 6', () => {
    expect(slip(500000, { children: 9 }).irpp).toBe(slip(500000, { children: 6 }).irpp);
    expect(slip(500000, { spouses: 1, children: 4, otherDependents: 3 }).dependents).toBe(6);
  });

  it('applies the 28 % allowance only up to 10 M a year', () => {
    const s = slip(5000000);
    expect(s.irppSteps.find((x) => x.label.startsWith('Abattement'))!.amount).toBe(2800000);
  });

  it('deducts life insurance within 200 000 F + 30 000 F per child', () => {
    const a = slip(600000, { children: 2 });
    const b = slip(600000, { children: 2, lifeInsuranceAnnual: 1000000 });
    const capped = 200000 + 2 * 30000;
    const step = b.irppSteps.find((x) => x.label.includes('assurance vie'))!;
    expect(step.amount).toBe(capped);
    expect(a.irppAnnual - b.irppAnnual).toBeGreaterThan(0);
  });

  it('caps voluntary pension savings at 6 % of net income', () => {
    const s = slip(400000, { voluntaryPension: 100000 });
    const step = s.irppSteps.find((x) => x.label.includes('retraite volontaire'))!;
    const afterAllowance = (4800000 - 4800000 * 0.09) * 0.72;
    expect(step.amount).toBe(Math.round(afterAllowance * 0.06));
    expect(line(s, 'voluntary_pension')!.employee).toBe(100000);
  });

  it('exempts apprentices from IRPP but keeps contributions (CGI art. 23-4)', () => {
    const s = slip(300000, { status: 'apprentice' });
    expect(s.irpp).toBe(0);
    expect(s.employeeContributions).toBe(27000);
  });
});

describe('social contributions (decree 2012-038, decree 2023-096)', () => {
  it('200 000 F gross costs the employer 245 000 F', () => {
    expect(slip(200000).employerCost).toBe(245000);
  });

  it('never goes below the SMIG base', () => {
    const s = slip(40000);
    expect(s.cnssBase).toBe(52500);
    expect(s.amuBase).toBe(52500);
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it('subjects benefits in kind to CNSS and IRPP but not to AMU', () => {
    const a = slip(300000);
    const b = slip(300000, { items: { aen_logement: 50000 } });
    expect(b.grossTotal).toBe(350000);
    expect(b.cnssBase).toBe(350000);
    expect(b.amuBase).toBe(300000);
    expect(b.irpp).toBeGreaterThan(a.irpp);
    expect(b.netPay).toBeLessThan(a.netPay);
  });

  it('leaves expense reimbursements out of tax and contributions', () => {
    const a = slip(300000);
    const b = slip(300000, { items: { frais_rembourses: 30000 } });
    expect(b.irpp).toBe(a.irpp);
    expect(b.employeeContributions).toBe(a.employeeContributions);
    expect(b.netPay).toBe(a.netPay + 30000);
  });

  it('doubles the work-risk rate at most (arrêté 003/2012)', () => {
    expect(line(slip(100000, { workRiskSurcharge: 1 }), 'cnss_work_risk')!.employer).toBe(3000);
    expect(line(slip(100000, { workRiskSurcharge: 2 }), 'cnss_work_risk')!.employer).toBe(4000);
  });
});

describe('seniority (CCIT 2026, art. 40)', () => {
  it.each([
    [1, 0], [2, 0.02], [3, 0.02], [4, 0.03], [5, 0.04], [10, 0.09], [20, 0.19], [36, 0.35], [45, 0.35],
  ])('%i years -> %f', (y, r) => expect(seniorityRate(y, rules)).toBeCloseTo(r));

  it('is computed on the category minimum (annex II)', () => {
    const s = slip(250000, { category: 'M2', echelon: 0, seniorityYears: 10 });
    expect(s.seniority.amount).toBe(Math.round(115000 * 0.09));
  });

  it('warns when the base salary is under the category minimum', () => {
    expect(slip(150000, { category: 'C1' }).warnings.some((w) => w.includes('C1'))).toBe(true);
  });
});

describe('overtime (CCIT 2026, art. 36)', () => {
  it('pays 8 hours at +20 %', () => {
    expect(line(slip(173330, { overtimeHours: { ot_20: 8 } }), 'ot_20')!.employee).toBe(Math.round(8 * 1000 * 1.2));
  });

  it('includes the sursalaire in the hourly rate, not other bonuses', () => {
    const s = slip(150000, { items: { sursalaire: 23330, prime_transport: 50000 }, overtimeHours: { ot_40: 1 } });
    expect(line(s, 'ot_40')!.employee).toBe(Math.round(1000 * 1.4));
  });
});

describe('allowances (CCIT 2026, art. 38 and 39)', () => {
  it('pays meal allowances at 3 times the E1 hourly wage, tax free', () => {
    const s = slip(200000, { mealAllowances: 4 });
    expect(line(s, 'meal')!.employee).toBe(Math.round(4 * 3 * (52500 / 173.33)));
    expect(s.irpp).toBe(slip(200000).irpp);
  });

  it('pays missions on the category hourly rate', () => {
    const s = slip(250000, { category: 'M2', missions: { oneMeal: 1, twoMeals: 1, night: 1 } });
    expect(line(s, 'mission')!.employee).toBe(Math.round(18 * (115000 / 173.33)));
  });
});

describe('13th month', () => {
  it('taxes the one-off payment at the margin, not as twelve payments', () => {
    const a = slip(300000);
    const b = slip(300000, { exceptional: 300000 });
    expect(b.irpp).toBeGreaterThan(a.irpp);
    expect(b.irpp - a.irpp).toBeLessThan(300000 * 0.1);
  });
});

describe('net to gross', () => {
  it('finds the base salary for a target net', () => {
    const input = { ...emptyInput(), children: 2 };
    const base = baseForTargetNet(400000, input, rules);
    expect(computePayslip({ ...input, baseSalary: base }, rules).netPay).toBeGreaterThanOrEqual(400000);
    expect(computePayslip({ ...input, baseSalary: base - 1 }, rules).netPay).toBeLessThan(400000);
  });
});

describe('rules file', () => {
  it('cites a source, an article and a page for every verified block', () => {
    const refs = [rules.minimum_wage.ref, rules.social.cnss.ref, rules.social.amu.ref, rules.irpp.ref, rules.overtime.ref, rules.seniority.ref, rules.categories.ref];
    for (const r of refs) {
      expect(r.source).toBeTruthy();
      expect(r.article).toBeTruthy();
      expect(r.page).toBeGreaterThan(0);
    }
  });
});

describe('languages', () => {
  it('writes the payslip in English with the same figures', () => {
    const input = { ...emptyInput(), baseSalary: 300000, spouses: 1, children: 2, items: { prime_transport: 20000 } };
    const fr = computePayslip(input, rules, 'fr');
    const en = computePayslip(input, rules, 'en');
    expect(en.netPay).toBe(fr.netPay);
    expect(en.lines.find((l) => l.id === 'base')!.label).toBe('Base salary');
    expect(en.lines.find((l) => l.id === 'prime_transport')!.label).toBe('Transport allowance');
    expect(en.lines.every((l) => !/[éèà]/.test(l.label))).toBe(true);
  });
});
