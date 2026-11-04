import { describe, expect, it } from 'vitest';
import { baseForTargetNet, computePayslip, emptyInput, rulesFor, seniorityRate } from './index';

const rules = rulesFor('2026-11-01');
const slip = (baseSalary: number, dependents = 0, extra = {}) =>
  computePayslip({ ...emptyInput(), baseSalary, dependents, ...extra }, rules);

// Reference cases worked out by hand from CGI art. 26, 72-74 (also published by lqdd.org, IRPP 2026 page).
describe('IRPP on wages', () => {
  it('150 000 F, single: 8 370 F a year', () => {
    const s = slip(150000);
    expect(s.irppAnnual).toBe(8370);
    expect(s.irpp).toBe(698);
    expect(s.employeeContributions).toBe(13500);
    expect(s.netPay).toBe(150000 - 13500 - 698);
  });

  it('300 000 F, 3 dependents: 32 940 F a year, 2 745 F a month', () => {
    const s = slip(300000, 3);
    expect(s.irppAnnual).toBe(32940);
    expect(s.irpp).toBe(2745);
    expect(s.netPay).toBe(270255);
  });

  it('800 000 F, 4 dependents: 343 900 F a year', () => {
    const s = slip(800000, 4);
    expect(s.irppAnnual).toBe(343900);
    expect(s.irpp).toBe(28658);
  });

  it('caps dependents at 6', () => {
    expect(slip(500000, 9).irpp).toBe(slip(500000, 6).irpp);
  });

  it('applies the 28 % allowance only up to 10 M a year', () => {
    const s = slip(5000000);
    const after = 60000000 - 60000000 * 0.09;
    expect(s.irppSteps[2].amount).toBe(-2800000);
    expect(s.irppSteps[4].amount).toBe(Math.floor((after - 2800000) / 1000) * 1000);
  });
});

describe('employer cost', () => {
  it('200 000 F gross costs 245 000 F', () => {
    expect(slip(200000).employerCost).toBe(245000);
  });
});

describe('floors and benefits', () => {
  it('contributions never go below the SMIG base', () => {
    const s = slip(40000);
    expect(s.socialBase).toBe(52500);
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it('benefits in kind are taxed but not paid in cash', () => {
    const a = slip(300000);
    const b = slip(300000, 0, { items: { aen_logement: 50000 } });
    expect(b.grossTotal).toBe(350000);
    expect(b.netPay).toBeLessThan(a.netPay);
  });

  it('expense reimbursements are neither taxed nor subject to contributions', () => {
    const a = slip(300000);
    const b = slip(300000, 0, { items: { frais_rembourses: 30000 } });
    expect(b.irpp).toBe(a.irpp);
    expect(b.employeeContributions).toBe(a.employeeContributions);
    expect(b.netPay).toBe(a.netPay + 30000);
  });
});

describe('seniority (CCIT 2026, art. 40)', () => {
  it.each([
    [1, 0], [2, 0.02], [3, 0.02], [4, 0.03], [5, 0.04], [10, 0.09], [20, 0.19], [36, 0.35], [45, 0.35],
  ])('%i years -> %f', (y, r) => expect(seniorityRate(y, rules)).toBeCloseTo(r));

  it('is computed on the category minimum', () => {
    const s = slip(250000, 0, { category: 'M2', echelon: 0, seniorityYears: 10 });
    expect(s.seniority.amount).toBe(Math.round(115000 * 0.09));
  });
});

describe('overtime', () => {
  it('pays 8 hours at +20 %', () => {
    const s = slip(173330, 0, { overtimeHours: { ot_20: 8 } });
    expect(s.lines.find((l) => l.id === 'ot_20')!.employee).toBe(Math.round(8 * 1000 * 1.2));
  });
});

describe('13th month', () => {
  it('taxes the one-off payment at the margin, not as twelve payments', () => {
    const a = slip(300000);
    const b = slip(300000, 0, { exceptional: 300000 });
    expect(b.irpp - a.irpp).toBeLessThan(300000 * 0.1);
    expect(b.irpp).toBeGreaterThan(a.irpp);
  });
});

describe('net to gross', () => {
  it('finds the base salary for a target net', () => {
    const input = { ...emptyInput(), dependents: 2 };
    const base = baseForTargetNet(400000, input, rules);
    expect(computePayslip({ ...input, baseSalary: base }, rules).netPay).toBeGreaterThanOrEqual(400000);
    expect(computePayslip({ ...input, baseSalary: base - 1 }, rules).netPay).toBeLessThan(400000);
  });
});
