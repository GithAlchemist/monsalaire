import { useId, type ReactNode } from 'react';
import { money, parseMoney } from '../format';

export function MoneyInput({
  value,
  onChange,
  big,
  label,
  id,
  unit = 'FCFA',
}: {
  value: number;
  onChange: (n: number) => void;
  big?: boolean;
  label?: string;
  id?: string;
  unit?: string;
}) {
  return (
    <div className={`money${big ? ' big' : ''}`}>
      <input
        id={id}
        aria-label={label}
        inputMode="numeric"
        autoComplete="off"
        value={value ? money(value) : ''}
        placeholder="0"
        onChange={(e) => onChange(parseMoney(e.target.value))}
        onFocus={(e) => e.target.select()}
      />
      <span className="unit">{unit}</span>
    </div>
  );
}

export function Field({ label, hint, aside, children }: { label: ReactNode; hint?: ReactNode; aside?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      {children(id)}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Moins" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="Plus" onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function Section({ title, badge, children, open }: { title: string; badge?: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>
        <span>{title}</span>
        {badge && <span className="badge">{badge}</span>}
        <svg className="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

export const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
