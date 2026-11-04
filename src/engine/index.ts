import tg2026 from '../../rules/tg/2026.json';
import type { Rules } from './types';

export * from './types';
export { computePayslip, baseForTargetNet, seniorityRate, categoryMinimum, dependentsCount, emptyInput } from './payroll';
export { annualIrpp, progressiveTax } from './irpp';

/** Every rule set shipped with the app, newest first. Add a file in /rules and list it here. */
export const RULESETS: Rules[] = [tg2026 as Rules];

/** The rule set in force on a given date (ISO yyyy-mm-dd). Falls back to the oldest one. */
export function rulesFor(date: string, country = 'TG'): Rules {
  const sets = RULESETS.filter((r) => r.country === country);
  return (
    sets.find((r) => r.valid_from <= date && (r.valid_to === null || date <= r.valid_to)) ?? sets[sets.length - 1]
  );
}
