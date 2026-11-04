import { emptyInput, type PayInput, type WorkerStatus } from './engine';

export type Mode = 'gross' | 'net';

export interface AppState {
  mode: Mode;
  status: WorkerStatus;
  base: number;
  targetNet: number;
  spouses: number;
  children: number;
  otherDependents: number;
  category: string;
  echelon: number;
  seniorityYears: number;
  /** Pay items the user added, by id (0 is allowed: the row stays visible). */
  items: Record<string, number>;
  overtime: Record<string, number>;
  meals: number;
  missions: { oneMeal: number; twoMeals: number; night: number };
  exceptional: number;
  voluntaryPension: number;
  lifeInsurance: number;
  otherDeductions: number;
  workRisk: number;
}

export const defaultState = (): AppState => ({
  mode: 'gross',
  status: 'employee',
  base: 250000,
  targetNet: 250000,
  spouses: 0,
  children: 0,
  otherDependents: 0,
  category: '',
  echelon: 0,
  seniorityYears: 0,
  items: {},
  overtime: {},
  meals: 0,
  missions: { oneMeal: 0, twoMeals: 0, night: 0 },
  exceptional: 0,
  voluntaryPension: 0,
  lifeInsurance: 0,
  otherDeductions: 0,
  workRisk: 0,
});

export function toInput(s: AppState): PayInput {
  return {
    ...emptyInput(),
    status: s.status,
    baseSalary: s.base,
    category: s.category || null,
    echelon: s.echelon,
    seniorityYears: s.seniorityYears,
    items: s.items,
    overtimeHours: s.overtime,
    mealAllowances: s.meals,
    missions: s.missions,
    exceptional: s.exceptional,
    spouses: s.spouses,
    children: s.children,
    otherDependents: s.otherDependents,
    voluntaryPension: s.voluntaryPension,
    lifeInsuranceAnnual: s.lifeInsurance,
    otherDeductions: s.otherDeductions,
    workRiskSurcharge: s.workRisk,
  };
}

/** Short, readable URL hash so a simulation can be shared: #b=250000&e=2&i.prime_transport=20000 */
export function encode(s: AppState): string {
  const p = new URLSearchParams();
  const put = (k: string, v: number | string) => {
    if (v) p.set(k, String(v));
  };
  if (s.mode === 'net') {
    p.set('m', 'net');
    p.set('n', String(s.targetNet));
  } else p.set('b', String(s.base));
  if (s.status === 'apprentice') p.set('s', 'apprenti');
  put('c', s.spouses);
  put('e', s.children);
  put('p', s.otherDependents);
  if (s.category) p.set('cat', `${s.category}${'ABC'[s.echelon] ?? 'A'}`);
  put('a', s.seniorityYears);
  for (const [k, v] of Object.entries(s.items)) p.set(`i.${k}`, String(v));
  for (const [k, v] of Object.entries(s.overtime)) put(`h.${k}`, v);
  put('pa', s.meals);
  put('m1', s.missions.oneMeal);
  put('m2', s.missions.twoMeals);
  put('m3', s.missions.night);
  put('x', s.exceptional);
  put('rv', s.voluntaryPension);
  put('av', s.lifeInsurance);
  put('r', s.otherDeductions);
  put('rp', s.workRisk);
  return p.toString();
}

export function decode(hash: string): AppState {
  const s = defaultState();
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const num = (k: string, max = 999_999_999) => {
    const n = Number(p.get(k));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
  };
  if (p.get('m') === 'net') s.mode = 'net';
  if (p.has('b')) s.base = num('b');
  if (p.has('n')) s.targetNet = num('n');
  if (p.get('s') === 'apprenti') s.status = 'apprentice';
  s.spouses = num('c', 6);
  s.children = num('e', 20);
  s.otherDependents = num('p', 20);
  // Links made before dependents were split: d = total.
  if (p.has('d') && !p.has('e')) s.children = num('d', 20);
  const c = p.get('cat') ?? p.get('c');
  if (c && /^[EMC]\d[ABC]?$/.test(c)) {
    s.category = c.slice(0, 2);
    s.echelon = Math.max(0, 'ABC'.indexOf(c[2] ?? 'A'));
  }
  s.seniorityYears = num('a', 60);
  for (const [k, v] of p.entries()) {
    const n = Math.max(0, Number(v) || 0);
    if (k.startsWith('i.')) s.items[k.slice(2)] = n;
    if (k.startsWith('h.')) s.overtime[k.slice(2)] = Math.min(n, 300);
  }
  s.meals = num('pa', 31);
  s.missions = { oneMeal: num('m1', 31), twoMeals: num('m2', 31), night: num('m3', 31) };
  s.exceptional = num('x');
  s.voluntaryPension = num('rv');
  s.lifeInsurance = num('av');
  s.otherDeductions = num('r');
  s.workRisk = num('rp', 2);
  return s;
}
