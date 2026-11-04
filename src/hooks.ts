import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A number that glides to its new value (ease-out), so the payslip visibly moves as the user types. */
export function useTweened(target: number, duration = 420): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    if (reduced()) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setValue(v);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

/** True for a short moment after `value` changes: drives the gold flash on a payslip line. */
export function useChanged(value: number): boolean {
  const prev = useRef(value);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setOn(true);
    const t = setTimeout(() => setOn(false), 700);
    return () => clearTimeout(t);
  }, [value]);
  return on;
}

export type Theme = 'system' | 'light' | 'dark';

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('monsalaire-theme') as Theme) || 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('monsalaire-theme', theme);
    } catch {
      /* private mode: the choice simply is not remembered */
    }
  }, [theme]);
  return [theme, setTheme];
}
