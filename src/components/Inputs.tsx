import { useState } from 'react';
import type { Rules } from '../engine';
import { categoryMinimum, seniorityRate } from '../engine';
import { fcfa, pct } from '../format';
import type { AppState } from '../state';
import { defaultState } from '../state';
import { CloseIcon, Field, MoneyInput, Section, Stepper } from './fields';

type Set = (patch: Partial<AppState>) => void;

export function Inputs({ s, set, rules, computedBase }: { s: AppState; set: Set; rules: Rules; computedBase: number }) {
  const cash = rules.pay_items.filter((i) => i.cash && (i.cnss || i.irpp));
  const kind = rules.pay_items.filter((i) => !i.cash);
  const reimb = rules.pay_items.filter((i) => i.cash && !i.cnss && !i.irpp);
  const catMin = categoryMinimum(rules, s.category, s.echelon);
  const senRate = seniorityRate(s.seniorityYears, rules);
  const otCount = Object.values(s.overtime).reduce((a, b) => a + (b || 0), 0);

  const sum = (ids: string[]) => ids.reduce((a, id) => a + (s.items[id] || 0), 0);
  const count = (list: { id: string }[]) => list.filter((i) => i.id in s.items).length;

  return (
    <aside className="panel" aria-label="Paramètres">
      <div className="segmented" role="group" aria-label="Type de calcul">
        <button type="button" aria-pressed={s.mode === 'gross'} onClick={() => set({ mode: 'gross', base: s.mode === 'net' ? computedBase : s.base })}>
          Je connais mon brut
        </button>
        <button type="button" aria-pressed={s.mode === 'net'} onClick={() => set({ mode: 'net' })}>
          Je vise un net
        </button>
      </div>

      {s.mode === 'gross' ? (
        <Field label="Salaire de base mensuel" hint="Le salaire fixe de votre contrat, avant primes et retenues.">
          {(id) => <MoneyInput id={id} big value={s.base} onChange={(base) => set({ base })} />}
        </Field>
      ) : (
        <Field
          label="Net à payer souhaité"
          hint={
            <>
              Salaire de base à demander : <strong className="num">{fcfa(computedBase)}</strong>, avec les primes ci-dessous.
            </>
          }
        >
          {(id) => <MoneyInput id={id} big value={s.targetNet} onChange={(targetNet) => set({ targetNet })} />}
        </Field>
      )}

      <Field label="Personnes à charge" hint="Conjoint sans revenu, enfants de moins de 21 ans (25 ans s'ils étudient), proches à charge. Six au plus.">
        {() => <Stepper label="Personnes à charge" value={s.dependents} max={rules.irpp.dependents.max} onChange={(dependents) => set({ dependents })} />}
      </Field>

      <Section title="Primes et indemnités" badge={count(cash) ? fcfa(sum(cash.map((i) => i.id))) : undefined}>
        <ItemList list={cash} s={s} set={set} placeholder="Ajouter une prime" />
      </Section>

      <Section title="Avantages en nature" badge={count(kind) ? fcfa(sum(kind.map((i) => i.id))) : undefined}>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Logement, véhicule, électricité fournis par l'employeur : ils comptent dans le brut et sont imposés, sans être versés en argent.
        </p>
        <ItemList list={kind} s={s} set={set} placeholder="Ajouter un avantage" />
      </Section>

      <Section title="Ancienneté et catégorie" badge={senRate ? `+${pct(senRate)}` : s.category ? `${s.category}${'ABC'[s.echelon]}` : undefined}>
        <Field label="Années dans l'entreprise" hint={senRate ? `Prime d'ancienneté de ${pct(senRate)}.` : "La prime démarre à 2 % après deux ans."}>
          {() => <Stepper label="Années d'ancienneté" value={s.seniorityYears} max={50} onChange={(seniorityYears) => set({ seniorityYears })} />}
        </Field>
        <div className="row2">
          <Field label="Catégorie">
            {(id) => (
              <select id={id} className="select" value={s.category} onChange={(e) => set({ category: e.target.value, echelon: 0 })}>
                <option value="">Je ne sais pas</option>
                {rules.categories.groups.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {Object.keys(rules.categories.grid)
                      .filter((c) => c.startsWith(g.id))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            )}
          </Field>
          <Field label="Échelon">
            {(id) => (
              <select
                id={id}
                className="select"
                value={s.echelon}
                disabled={!s.category || (rules.categories.grid[s.category]?.length ?? 0) < 2}
                onChange={(e) => set({ echelon: Number(e.target.value) })}
              >
                {(rules.categories.grid[s.category] ?? [0]).map((_, i) => (
                  <option key={i} value={i}>
                    {'ABC'[i]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <p className="field-hint" style={{ marginTop: -6 }}>
          {catMin
            ? `Minimum conventionnel : ${fcfa(catMin)} par mois. La prime d'ancienneté se calcule sur ce montant.`
            : 'Grille de la convention collective interprofessionnelle de 2026, de E1 (SMIG) à C4.'}
        </p>
      </Section>

      <Section title="Heures supplémentaires" badge={otCount ? `${otCount} h` : undefined}>
        {rules.overtime.rates.map((ot) => (
          <div className="item-row" key={ot.id} style={{ gridTemplateColumns: '1fr 110px' }}>
            <label htmlFor={`ot-${ot.id}`}>
              {ot.label} <span className="num" style={{ color: 'var(--fg-subtle)' }}>+{Math.round(ot.rate * 100)} %</span>
            </label>
            <MoneyInput
              id={`ot-${ot.id}`}
              unit="h"
              value={s.overtime[ot.id] || 0}
              onChange={(v) => set({ overtime: { ...s.overtime, [ot.id]: Math.min(v, 300) } })}
            />
          </div>
        ))}
        <p className="field-hint">Heures du mois. Taux horaire = salaire de base ÷ {rules.working_time.monthly_hours} h.</p>
      </Section>

      <Section title="Ce mois-ci" badge={s.exceptional || s.otherDeductions || count(reimb) ? '•' : undefined}>
        <Field label="Treizième mois ou prime exceptionnelle" hint="Versement ponctuel ce mois-ci. Il n'est pas imposé comme s'il était touché douze fois.">
          {(id) => <MoneyInput id={id} value={s.exceptional} onChange={(exceptional) => set({ exceptional })} />}
        </Field>
        {reimb.map((i) => (
          <Field key={i.id} label={i.label} hint="Ni cotisé ni imposé, sur justificatifs.">
            {(id) => (
              <MoneyInput
                id={id}
                value={s.items[i.id] || 0}
                onChange={(v) => {
                  const items = { ...s.items };
                  if (v) items[i.id] = v;
                  else delete items[i.id];
                  set({ items });
                }}
              />
            )}
          </Field>
        ))}
        <Field label="Avances et autres retenues" hint="Avance sur salaire, prêt, mutuelle : retirées du net.">
          {(id) => <MoneyInput id={id} value={s.otherDeductions} onChange={(otherDeductions) => set({ otherDeductions })} />}
        </Field>
      </Section>

      <button type="button" className="btn reset" onClick={() => set({ ...defaultState(), mode: s.mode })}>
        Tout remettre à zéro
      </button>
    </aside>
  );
}

function ItemList({ list, s, set, placeholder }: { list: Rules['pay_items']; s: AppState; set: Set; placeholder: string }) {
  const [pick, setPick] = useState('');
  const present = list.filter((i) => i.id in s.items);
  const missing = list.filter((i) => !(i.id in s.items));
  const add = (id: string) => {
    if (!id) return;
    set({ items: { ...s.items, [id]: s.items[id] ?? 0 } });
    setPick('');
  };
  return (
    <>
      {present.map((i) => (
        <div className="item-row" key={i.id}>
          <label htmlFor={`it-${i.id}`}>{i.label}</label>
          <MoneyInput id={`it-${i.id}`} value={s.items[i.id] || 0} onChange={(v) => set({ items: { ...s.items, [i.id]: v } })} />
          <button
            type="button"
            className="icon-btn"
            aria-label={`Retirer ${i.label}`}
            onClick={() => {
              const items = { ...s.items };
              delete items[i.id];
              set({ items });
            }}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      {missing.length > 0 && (
        <div className="add-row">
          <select className="select" aria-label={placeholder} value={pick} onChange={(e) => add(e.target.value)}>
            <option value="">{placeholder}…</option>
            {missing.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
