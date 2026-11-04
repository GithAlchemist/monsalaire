import { useState } from 'react';
import { categoryMinimum, seniorityRate, type Rules } from '../engine';
import { fcfa, pct } from '../format';
import { defaultState, type AppState } from '../state';
import { Counter, Field, Icon, MoneyInput, Section, Seg } from './fields';

type Set = (patch: Partial<AppState>) => void;

const PRESETS = [52500, 100000, 250000, 500000, 1000000];
const presetLabel = (n: number) => (n === 52500 ? 'SMIG' : n >= 1000000 ? `${n / 1000000} M` : `${n / 1000} k`);

export function Controls({ s, set, rules, computedBase }: { s: AppState; set: Set; rules: Rules; computedBase: number }) {
  const cash = rules.pay_items.filter((i) => i.cash && (i.cnss || i.irpp));
  const kind = rules.pay_items.filter((i) => !i.cash);
  const catMin = categoryMinimum(rules, s.category, s.echelon);
  const senRate = seniorityRate(s.seniorityYears, rules);
  const otHours = Object.values(s.overtime).reduce((a, b) => a + (b || 0), 0);
  const sum = (list: { id: string }[]) => list.reduce((a, i) => a + (s.items[i.id] || 0), 0);
  const has = (list: { id: string }[]) => list.some((i) => i.id in s.items);
  const deps = s.spouses + s.children + s.otherDependents;
  const maxDeps = rules.irpp.dependents.max;
  const missionDays = s.missions.oneMeal + s.missions.twoMeals + s.missions.night;
  const monthCount = (s.exceptional ? 1 : 0) + (s.items.frais_rembourses ? 1 : 0) + (s.otherDeductions ? 1 : 0) + (s.meals ? 1 : 0) + (missionDays ? 1 : 0);
  const savings = s.voluntaryPension || s.lifeInsurance;
  const target = s.mode === 'gross' ? s.base : s.targetNet;

  return (
    <aside className="controls" aria-label="Vos paramètres" id="parametres">
      <div className="c-title">
        <h2>Vos paramètres</h2>
        <button type="button" className="c-reset" onClick={() => set({ ...defaultState(), mode: s.mode })}>
          Tout effacer
        </button>
      </div>

      <Seg
        label="Type de calcul"
        value={s.mode}
        onChange={(mode) => set({ mode, ...(mode === 'gross' && s.mode === 'net' ? { base: computedBase } : {}), ...(mode === 'net' && s.mode === 'gross' ? { targetNet: s.targetNet || 250000 } : {}) })}
        options={[
          { value: 'gross', label: 'Du brut au net' },
          { value: 'net', label: 'Du net au brut' },
        ]}
      />

      {s.mode === 'gross' ? (
        <Field label="Salaire de base mensuel" aside="avant primes">
          {(id) => (
            <>
              <MoneyInput id={id} big value={s.base} onChange={(base) => set({ base })} />
              <Presets value={target} onPick={(base) => set({ base })} />
            </>
          )}
        </Field>
      ) : (
        <Field
          label="Net que vous voulez toucher"
          aside="par mois"
          hint={
            <>
              Salaire de base à demander : <strong>{fcfa(computedBase)}</strong>, avec les primes et la situation ci-dessous.
            </>
          }
        >
          {(id) => (
            <>
              <MoneyInput id={id} big value={s.targetNet} onChange={(targetNet) => set({ targetNet })} />
              <Presets value={target} onPick={(targetNet) => set({ targetNet })} />
            </>
          )}
        </Field>
      )}

      <Field label="Personnes à charge" aside={`${Math.min(deps, maxDeps)} sur ${maxDeps} au plus`} hint="Conjoint sans revenu, enfants de moins de 21 ans (25 s'ils étudient), parents invalides qui vivent chez vous.">
        {() => (
          <div className="family">
            <Counter label="Conjoint" value={s.spouses} max={4} disabledPlus={deps >= maxDeps} onChange={(spouses) => set({ spouses })} />
            <Counter label="Enfants" value={s.children} max={maxDeps} disabledPlus={deps >= maxDeps} onChange={(children) => set({ children })} />
            <Counter label="Autres" value={s.otherDependents} max={maxDeps} disabledPlus={deps >= maxDeps} onChange={(otherDependents) => set({ otherDependents })} />
          </div>
        )}
      </Field>

      <Field label="Statut">
        {() => (
          <Seg
            small
            label="Statut"
            value={s.status}
            onChange={(status) => set({ status })}
            options={[
              { value: 'employee', label: 'Salarié du privé' },
              { value: 'apprentice', label: 'Apprenti sous contrat' },
            ]}
          />
        )}
      </Field>

      <div style={{ marginTop: 8 }} />

      <Section title="Primes et indemnités" icon={<Icon.gift />} badge={has(cash) ? fcfa(sum(cash)) : undefined}>
        <ItemList list={cash} s={s} set={set} placeholder="Ajouter une prime" />
      </Section>

      <Section title="Avantages en nature" icon={<Icon.home />} badge={has(kind) ? fcfa(sum(kind)) : undefined}>
        <p className="note">Fournis par l'employeur au lieu d'être payés. Ils sont imposés pour leur valeur réelle sans être versés en argent.</p>
        <ItemList list={kind} s={s} set={set} placeholder="Ajouter un avantage" />
      </Section>

      <Section title="Catégorie et ancienneté" icon={<Icon.badge />} badge={s.category ? `${s.category}${(rules.categories.grid[s.category]?.length ?? 0) > 1 ? 'ABC'[s.echelon] : ''}${senRate ? ` · +${pct(senRate)}` : ''}` : senRate ? `+${pct(senRate)}` : undefined}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 96px', gap: 8 }}>
          <Field label="Catégorie (convention 2026)">
            {(id) => (
              <select id={id} className="select" value={s.category} onChange={(e) => set({ category: e.target.value, echelon: 0 })}>
                <option value="">Je ne sais pas</option>
                {rules.categories.groups.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {Object.keys(rules.categories.grid)
                      .filter((c) => c.startsWith(g.id))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c} · {rules.categories.examples[c]}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            )}
          </Field>
          <Field label="Échelon">
            {(id) => (
              <select id={id} className="select" value={s.echelon} disabled={(rules.categories.grid[s.category]?.length ?? 0) < 2} onChange={(e) => set({ echelon: Number(e.target.value) })}>
                {(rules.categories.grid[s.category] ?? [0]).map((_, i) => (
                  <option key={i} value={i}>
                    {'ABC'[i]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <p className="f-hint">
          {catMin ? (
            <>
              Minimum de la catégorie : <strong>{fcfa(catMin)}</strong> par mois.
            </>
          ) : (
            'De E1 (manœuvre, au SMIG) à C4 (doctorat, direction). La catégorie fixe votre salaire minimum et la base de la prime d’ancienneté.'
          )}
        </p>
        <Field label="Années dans l'entreprise" aside={senRate ? `prime de ${pct(senRate)}` : 'prime dès 2 ans'}>
          {() => (
            <div className="stepper-row">
              <Counter label="Ancienneté (ans)" value={s.seniorityYears} max={50} onChange={(seniorityYears) => set({ seniorityYears })} />
            </div>
          )}
        </Field>
      </Section>

      <Section title="Heures supplémentaires" icon={<Icon.clock />} badge={otHours ? `${otHours} h` : undefined}>
        {rules.overtime.rates.map((ot) => (
          <div className="item-row two" key={ot.id}>
            <label htmlFor={`ot-${ot.id}`}>
              {ot.label}
              <small>majorées de {Math.round(ot.rate * 100)} %</small>
            </label>
            <MoneyInput id={`ot-${ot.id}`} unit="h" max={300} value={s.overtime[ot.id] || 0} onChange={(v) => set({ overtime: { ...s.overtime, [ot.id]: v } })} />
          </div>
        ))}
        <p className="f-hint">Heures du mois. Taux horaire : salaire de base et sursalaire divisés par {rules.working_time.monthly_hours} h.</p>
      </Section>

      <Section title="Ce mois-ci" icon={<Icon.calendar />} badge={monthCount ? `${monthCount}` : undefined}>
        <Field label="Treizième mois ou prime exceptionnelle" hint="Imposé à part, sans le compter comme s'il était touché douze fois.">
          {(id) => <MoneyInput id={id} value={s.exceptional} onChange={(exceptional) => set({ exceptional })} />}
        </Field>
        <Field label="Primes de panier" aside="3 × le taux horaire du manœuvre" hint="Après six heures de travail de nuit ou une très longue journée.">
          {() => (
            <div className="stepper-row">
              <Counter label="Nombre de primes" value={s.meals} max={31} onChange={(meals) => set({ meals })} />
            </div>
          )}
        </Field>
        <Field label="Jours de mission" hint="Barème minimum de la convention : 3, 5 ou 10 fois le taux horaire de votre catégorie. Non imposé.">
          {() => (
            <div className="family">
              <Counter label="Un repas" value={s.missions.oneMeal} max={31} onChange={(v) => set({ missions: { ...s.missions, oneMeal: v } })} />
              <Counter label="Deux repas" value={s.missions.twoMeals} max={31} onChange={(v) => set({ missions: { ...s.missions, twoMeals: v } })} />
              <Counter label="Avec nuit" value={s.missions.night} max={31} onChange={(v) => set({ missions: { ...s.missions, night: v } })} />
            </div>
          )}
        </Field>
        <Field label="Frais réels remboursés" hint="Sur justificatifs : ni imposés, ni cotisés.">
          {(id) => (
            <MoneyInput
              id={id}
              value={s.items.frais_rembourses || 0}
              onChange={(v) => {
                const items = { ...s.items };
                if (v) items.frais_rembourses = v;
                else delete items.frais_rembourses;
                set({ items });
              }}
            />
          )}
        </Field>
        <Field label="Avances et autres retenues" hint="Avance sur salaire, prêt, mutuelle : retirées du net.">
          {(id) => <MoneyInput id={id} value={s.otherDeductions} onChange={(otherDeductions) => set({ otherDeductions })} />}
        </Field>
      </Section>

      <Section title="Épargne et côté employeur" icon={<Icon.shield />} badge={savings || s.workRisk ? '•' : undefined}>
        <Field label="Épargne retraite volontaire" aside="par mois" hint="Retenue sur le salaire, elle réduit l'impôt dans la limite de 6 % du revenu net.">
          {(id) => <MoneyInput id={id} value={s.voluntaryPension} onChange={(voluntaryPension) => set({ voluntaryPension })} />}
        </Field>
        <Field
          label="Primes d'assurance vie"
          aside="par an"
          hint={`Contrat d'au moins six ans. Déductible jusqu'à ${fcfa(rules.irpp.life_insurance.base_cap + rules.irpp.life_insurance.per_child * Math.min(s.children, rules.irpp.life_insurance.max_children))} pour vous (200 000 F plus 30 000 F par enfant).`}
        >
          {(id) => <MoneyInput id={id} value={s.lifeInsurance} onChange={(lifeInsurance) => set({ lifeInsurance })} />}
        </Field>
        <Field label="Taux risques professionnels de l'employeur" hint="Majoré quand l'employeur n'a pas corrigé les risques relevés lors d'un contrôle.">
          {() => (
            <Seg
              small
              label="Majoration des risques professionnels"
              value={s.workRisk}
              onChange={(workRisk) => set({ workRisk })}
              options={[
                { value: 0, label: 'Normal' },
                { value: 1, label: '+50 %' },
                { value: 2, label: '+100 %' },
              ]}
            />
          )}
        </Field>
      </Section>
    </aside>
  );
}

function Presets({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <div className="presets" role="group" aria-label="Montants courants">
      {PRESETS.map((p) => (
        <button key={p} type="button" className="chip" aria-pressed={value === p} onClick={() => onPick(p)}>
          {presetLabel(p)}
        </button>
      ))}
    </div>
  );
}

function ItemList({ list, s, set, placeholder }: { list: Rules['pay_items']; s: AppState; set: Set; placeholder: string }) {
  const [pick, setPick] = useState('');
  const present = list.filter((i) => i.id in s.items);
  const missing = list.filter((i) => !(i.id in s.items));
  return (
    <>
      {present.map((i) => (
        <div className="item-row" key={i.id}>
          <label htmlFor={`it-${i.id}`}>
            {i.label}
            {i.hint && <small>{i.hint}</small>}
          </label>
          <MoneyInput id={`it-${i.id}`} value={s.items[i.id] || 0} onChange={(v) => set({ items: { ...s.items, [i.id]: v } })} />
          <button
            type="button"
            className="x-btn"
            aria-label={`Retirer ${i.label}`}
            onClick={() => {
              const items = { ...s.items };
              delete items[i.id];
              set({ items });
            }}
          >
            <Icon.x />
          </button>
        </div>
      ))}
      {missing.length > 0 && (
        <select
          className="select add-select"
          aria-label={placeholder}
          value={pick}
          onChange={(e) => {
            const id = e.target.value;
            if (id) set({ items: { ...s.items, [id]: 0 } });
            setPick('');
            requestAnimationFrame(() => document.getElementById(`it-${id}`)?.focus());
          }}
        >
          <option value="">+ {placeholder}</option>
          {missing.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
