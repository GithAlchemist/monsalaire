import { useId, type ReactNode } from 'react';
import { parseMoney, useFmt } from '../format';
import { useRoute } from '../i18n';

export function MoneyInput({
  value,
  onChange,
  big,
  label,
  id,
  unit = 'FCFA',
  max = 999_999_999,
}: {
  value: number;
  onChange: (n: number) => void;
  big?: boolean;
  label?: string;
  id?: string;
  unit?: string;
  max?: number;
}) {
  const { money } = useFmt();
  return (
    <div className={`money${big ? ' big' : ''}`}>
      <input
        id={id}
        aria-label={label}
        inputMode="numeric"
        autoComplete="off"
        value={value ? money(value) : ''}
        placeholder="0"
        onChange={(e) => onChange(Math.min(parseMoney(e.target.value), max))}
        onFocus={(e) => e.target.select()}
      />
      <span className="unit">{unit}</span>
    </div>
  );
}

export function Field({ label, aside, hint, children }: { label: ReactNode; aside?: ReactNode; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <div className="f-label">
        <label htmlFor={id}>{label}</label>
        {aside && <span className="aside">{aside}</span>}
      </div>
      {children(id)}
      {hint && <div className="f-hint">{hint}</div>}
    </div>
  );
}

export function Counter({ label, value, onChange, min = 0, max = 20, disabledPlus }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; disabledPlus?: boolean }) {
  const { t } = useRoute();
  return (
    <div className="counter" role="group" aria-label={label}>
      <span className="c-label">{label}</span>
      <div className="c-row">
        <button type="button" aria-label={`${label}${t(' :', ':')} ${t('moins', 'fewer')}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`${label}${t(' :', ':')} ${t('plus', 'more')}`} disabled={value >= max || disabledPlus} onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}

export function Seg<T extends string | number>({ value, options, onChange, label, small }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; small?: boolean }) {
  return (
    <div className={`seg${small ? ' small' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section({ title, icon, badge, children, open }: { title: string; icon: ReactNode; badge?: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="sec" open={open}>
      <summary>
        <span className="s-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="s-name">{title}</span>
        {badge && <span className="s-badge">{badge}</span>}
        <svg className="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="sec-body">{children}</div>
    </details>
  );
}

const I = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const Icon = {
  plus: () => <I d="M12 5v14M5 12h14" />,
  gift: () => <I d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />,
  home: () => <I d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  badge: () => <I d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1" />,
  clock: () => <I d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" />,
  calendar: () => <I d="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" />,
  shield: () => <I d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  x: () => <I d="M6 6l12 12M18 6 6 18" size={14} />,
  check: () => <I d="M20 6 9 17l-5-5" size={15} />,
  share: () => <I d="M4 12v8h16v-8M16 6l-4-4-4 4M12 2v13" />,
  print: () => <I d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />,
  sun: () => <I d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />,
  moon: () => <I d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />,
  auto: () => <I d="M12 22a10 10 0 1 0 0-20v20z" />,
  github: () => <I d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22" />,
  alert: () => <I d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />,
  book: () => <I d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM20 17v5H6.5A2.5 2.5 0 0 1 4 19.5" size={13} />,
  arrow: () => <I d="M5 12h14M13 6l6 6-6 6" size={14} />,
  chevron: () => <I d="M9 6l6 6-6 6" size={15} />,
  info: () => <I d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01" />,
  globe: () => <I d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" size={14} />,
};
