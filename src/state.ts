import { emptyInput, type PayInput } from './engine';

export type Mode = 'gross' | 'net';

export interface AppState {
  mode: Mode;
  base: number;
  targetNet: number;
  dependents: number;
  category: string;
  echelon: number;
  seniorityYears: number;
  /** Pay items the user added, by id (0 is allowed: the row stays visible). */
  items: Record<string, number>;
  overtime: Record<string, number>;
  exceptional: number;
  otherDeductions: number;
}

export const defaultState = (): AppState => ({
  mode: 'gross',
  base: 250000,
  targetNet: 250000,
  dependents: 0,
  category: '',
  echelon: 0,
  seniorityYears: 0,
  items: {},
  overtime: {},
  exceptional: 0,
  otherDeductions: 0,
});

export function toInput(s: AppState): PayInput {
  return {
    ...emptyInput(),
    baseSalary: s.base,
    category: s.category || null,
    echelon: s.echelon,
    seniorityYears: s.seniorityYears,
    items: s.items,
    overtimeHours: s.overtime,
    exceptional: s.exceptional,
    dependents: s.dependents,
    otherDeductions: s.otherDeductions,
  };
}

/** Short, readable URL hash so a simulation can be shared: #b=250000&d=2&i.prime_transport=20000 */
export function encode(s: AppState): string {
  const d = defaultState();
  const p = new URLSearchParams();
  if (s.mode !== d.mode) p.set('m', s.mode);
  if (s.mode === 'gross') p.set('b', String(s.base));
  else p.set('n', String(s.targetNet));
  if (s.dependents) p.set('d', String(s.dependents));
  if (s.category) p.set('c', `${s.category}${'ABC'[s.echelon] ?? 'A'}`);
  if (s.seniorityYears) p.set('a', String(s.seniorityYears));
  for (const [k, v] of Object.entries(s.items)) p.set(`i.${k}`, String(v));
  for (const [k, v] of Object.entries(s.overtime)) if (v) p.set(`h.${k}`, String(v));
  if (s.exceptional) p.set('x', String(s.exceptional));
  if (s.otherDeductions) p.set('r', String(s.otherDeductions));
  return p.toString();
}

export function decode(hash: string): AppState {
  const s = defaultState();
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const num = (v: string | null) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  if (p.get('m') === 'net') s.mode = 'net';
  if (p.has('b')) s.base = num(p.get('b'));
  if (p.has('n')) s.targetNet = num(p.get('n'));
  s.dependents = num(p.get('d'));
  const c = p.get('c');
  if (c && /^[EMC]\d[ABC]?$/.test(c)) {
    s.category = c.slice(0, 2);
    s.echelon = Math.max(0, 'ABC'.indexOf(c[2] ?? 'A'));
  }
  s.seniorityYears = num(p.get('a'));
  for (const [k, v] of p.entries()) {
    if (k.startsWith('i.')) s.items[k.slice(2)] = num(v);
    if (k.startsWith('h.')) s.overtime[k.slice(2)] = num(v);
  }
  s.exceptional = num(p.get('x'));
  s.otherDeductions = num(p.get('r'));
  return s;
}
