import { useState } from 'react';
import { categoryMinimum, labelOf, seniorityRate, type Rules } from '../engine';
import { useFmt } from '../format';
import { useRoute } from '../i18n';
import { defaultState, type AppState } from '../state';
import { Counter, Field, Icon, MoneyInput, Section, Seg } from './fields';

type Set = (patch: Partial<AppState>) => void;

const PRESETS = [52500, 100000, 250000, 500000, 1000000];

export function Controls({ s, set, rules, computedBase }: { s: AppState; set: Set; rules: Rules; computedBase: number }) {
  const { t, lang } = useRoute();
  const { fcfa, pct } = useFmt();
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
  const examples = (lang === 'en' && rules.categories.examples_en) || rules.categories.examples;
  const li = rules.irpp.life_insurance;
  const liCap = li.base_cap + li.per_child * Math.min(s.children, li.max_children);

  return (
    <aside className="controls" aria-label={t('Vos paramètres', 'Your details')} id="parametres">
      <div className="c-title">
        <h2>{t('Vos paramètres', 'Your details')}</h2>
        <button type="button" className="c-reset" onClick={() => set({ ...defaultState(), mode: s.mode })}>
          {t('Tout effacer', 'Clear all')}
        </button>
      </div>

      <Seg
        label={t('Type de calcul', 'Calculation type')}
        value={s.mode}
        onChange={(mode) => set({ mode, ...(mode === 'gross' && s.mode === 'net' ? { base: computedBase } : {}), ...(mode === 'net' && s.mode === 'gross' ? { targetNet: s.targetNet || 250000 } : {}) })}
        options={[
          { value: 'gross', label: t('Du brut au net', 'Gross to net') },
          { value: 'net', label: t('Du net au brut', 'Net to gross') },
        ]}
      />

      {s.mode === 'gross' ? (
        <Field label={t('Salaire de base mensuel', 'Monthly base salary')} aside={t('avant primes', 'before bonuses')}>
          {(id) => (
            <>
              <MoneyInput id={id} big value={s.base} onChange={(base) => set({ base })} />
              <Presets value={target} onPick={(base) => set({ base })} />
            </>
          )}
        </Field>
      ) : (
        <Field
          label={t('Net que vous voulez toucher', 'Target net pay')}
          aside={t('par mois', 'a month')}
          hint={
            <>
              {t('Salaire de base à demander :', 'Base salary to ask for:')} <strong>{fcfa(computedBase)}</strong>
              {t(', avec les primes et la situation ci-dessous.', ', given the bonuses and details below.')}
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

      <Field
        label={t('Personnes à charge', 'Dependants')}
        aside={t(`${Math.min(deps, maxDeps)} sur ${maxDeps} au plus`, `${Math.min(deps, maxDeps)} of ${maxDeps} max`)}
        hint={t(
          "Conjoint sans revenu, enfants de moins de 21 ans (25 s'ils étudient), parents invalides qui vivent chez vous.",
          'A spouse with no income, children under 21 (25 if in education) and disabled relatives living with you.',
        )}
      >
        {() => (
          <div className="family">
            <Counter label={t('Conjoint', 'Spouse')} value={s.spouses} max={4} disabledPlus={deps >= maxDeps} onChange={(spouses) => set({ spouses })} />
            <Counter label={t('Enfants', 'Children')} value={s.children} max={maxDeps} disabledPlus={deps >= maxDeps} onChange={(children) => set({ children })} />
            <Counter label={t('Autres', 'Other')} value={s.otherDependents} max={maxDeps} disabledPlus={deps >= maxDeps} onChange={(otherDependents) => set({ otherDependents })} />
          </div>
        )}
      </Field>

      <Field label={t('Statut', 'Status')}>
        {() => (
          <Seg
            small
            label={t('Statut', 'Status')}
            value={s.status}
            onChange={(status) => set({ status })}
            options={[
              { value: 'employee', label: t('Salarié du privé', 'Private-sector employee') },
              { value: 'apprentice', label: t('Apprenti sous contrat', 'Apprentice') },
            ]}
          />
        )}
      </Field>

      <div style={{ marginTop: 8 }} />

      <Section title={t('Primes et indemnités', 'Bonuses and allowances')} icon={<Icon.gift />} badge={has(cash) ? fcfa(sum(cash)) : undefined}>
        <ItemList list={cash} s={s} set={set} placeholder={t('Ajouter une prime', 'Add a bonus')} />
      </Section>

      <Section title={t('Avantages en nature', 'Benefits in kind')} icon={<Icon.home />} badge={has(kind) ? fcfa(sum(kind)) : undefined}>
        <p className="note">
          {t(
            "Fournis par l'employeur au lieu d'être payés. Ils sont imposés pour leur valeur réelle sans être versés en argent.",
            'Things your employer provides instead of paying you for them. They are taxed at their actual value even though no cash changes hands.',
          )}
        </p>
        <ItemList list={kind} s={s} set={set} placeholder={t('Ajouter un avantage', 'Add a benefit')} />
      </Section>

      <Section
        title={t('Catégorie et ancienneté', 'Category and seniority')}
        icon={<Icon.badge />}
        badge={s.category ? `${s.category}${(rules.categories.grid[s.category]?.length ?? 0) > 1 ? 'ABC'[s.echelon] : ''}${senRate ? ` · +${pct(senRate)}` : ''}` : senRate ? `+${pct(senRate)}` : undefined}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 96px', gap: 8 }}>
          <Field label={t('Catégorie (convention 2026)', 'Category (2026 collective agreement)')}>
            {(id) => (
              <select id={id} className="select" value={s.category} onChange={(e) => set({ category: e.target.value, echelon: 0 })}>
                <option value="">{t('Je ne sais pas', "I don't know")}</option>
                {rules.categories.groups.map((g) => (
                  <optgroup key={g.id} label={labelOf(g, lang)}>
                    {Object.keys(rules.categories.grid)
                      .filter((c) => c.startsWith(g.id))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c} · {examples[c]}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            )}
          </Field>
          <Field label={t('Échelon', 'Step')}>
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
              {t('Minimum de la catégorie :', 'Category minimum:')} <strong>{fcfa(catMin)}</strong> {t('par mois.', 'a month.')}
            </>
          ) : (
            t(
              'De E1 (manœuvre, au SMIG) à C4 (doctorat, direction). La catégorie fixe votre salaire minimum et la base de la prime d’ancienneté.',
              'From E1 (labourer, at the minimum wage) to C4 (doctorate, management). The category sets your minimum pay and the basis for the seniority bonus.',
            )
          )}
        </p>
        <Field label={t("Années dans l'entreprise", 'Years with the company')} aside={senRate ? t(`prime de ${pct(senRate)}`, `${pct(senRate)} bonus`) : t('prime dès 2 ans', 'bonus after 2 years')}>
          {() => (
            <div className="stepper-row">
              <Counter label={t('Ancienneté (ans)', 'Seniority (years)')} value={s.seniorityYears} max={50} onChange={(seniorityYears) => set({ seniorityYears })} />
            </div>
          )}
        </Field>
      </Section>

      <Section title={t('Heures supplémentaires', 'Overtime')} icon={<Icon.clock />} badge={otHours ? `${otHours} h` : undefined}>
        {rules.overtime.rates.map((ot) => (
          <div className="item-row two" key={ot.id}>
            <label htmlFor={`ot-${ot.id}`}>
              {labelOf(ot, lang)}
              <small>{t(`majorées de ${Math.round(ot.rate * 100)} %`, `paid ${Math.round(ot.rate * 100)}% extra`)}</small>
            </label>
            <MoneyInput id={`ot-${ot.id}`} unit="h" max={300} value={s.overtime[ot.id] || 0} onChange={(v) => set({ overtime: { ...s.overtime, [ot.id]: v } })} />
          </div>
        ))}
        <p className="f-hint">
          {t(
            `Heures du mois. Taux horaire : salaire de base et sursalaire divisés par ${rules.working_time.monthly_hours} h.`,
            `Hours this month. Hourly rate: base salary and salary supplement divided by ${rules.working_time.monthly_hours} h.`,
          )}
        </p>
      </Section>

      <Section title={t('Ce mois-ci', 'This month')} icon={<Icon.calendar />} badge={monthCount ? `${monthCount}` : undefined}>
        <Field label={t('Treizième mois ou prime exceptionnelle', '13th month or one-off bonus')} hint={t("Imposé à part, sans le compter comme s'il était touché douze fois.", 'Taxed on its own, not as if you received it every month.')}>
          {(id) => <MoneyInput id={id} value={s.exceptional} onChange={(exceptional) => set({ exceptional })} />}
        </Field>
        <Field
          label={t('Primes de panier', 'Meal allowances')}
          aside={t('3 × le taux horaire du manœuvre', "3 × the labourer's hourly rate")}
          hint={t('Après six heures de travail de nuit ou une très longue journée.', 'After six hours of night work or a very long day.')}
        >
          {() => (
            <div className="stepper-row">
              <Counter label={t('Nombre de primes', 'Number of allowances')} value={s.meals} max={31} onChange={(meals) => set({ meals })} />
            </div>
          )}
        </Field>
        <Field
          label={t('Jours de mission', 'Business travel days')}
          hint={t(
            'Barème minimum de la convention : 3, 5 ou 10 fois le taux horaire de votre catégorie. Non imposé.',
            "Minimum rates under the agreement: 3, 5 or 10 times your category's hourly rate. Tax-free.",
          )}
        >
          {() => (
            <div className="family">
              <Counter label={t('Un repas', 'One meal')} value={s.missions.oneMeal} max={31} onChange={(v) => set({ missions: { ...s.missions, oneMeal: v } })} />
              <Counter label={t('Deux repas', 'Two meals')} value={s.missions.twoMeals} max={31} onChange={(v) => set({ missions: { ...s.missions, twoMeals: v } })} />
              <Counter label={t('Avec nuit', 'Overnight')} value={s.missions.night} max={31} onChange={(v) => set({ missions: { ...s.missions, night: v } })} />
            </div>
          )}
        </Field>
        <Field label={t('Frais réels remboursés', 'Expenses reimbursed')} hint={t('Sur justificatifs : ni imposés, ni cotisés.', 'With receipts: no tax, no contributions.')}>
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
        <Field label={t('Avances et autres retenues', 'Advances and other deductions')} hint={t('Avance sur salaire, prêt, mutuelle : retirées du net.', 'Salary advance, loan, top-up health insurance: taken off your net pay.')}>
          {(id) => <MoneyInput id={id} value={s.otherDeductions} onChange={(otherDeductions) => set({ otherDeductions })} />}
        </Field>
      </Section>

      <Section title={t('Épargne et côté employeur', 'Savings and employer settings')} icon={<Icon.shield />} badge={savings || s.workRisk ? '•' : undefined}>
        <Field
          label={t('Épargne retraite volontaire', 'Voluntary pension savings')}
          aside={t('par mois', 'a month')}
          hint={t("Retenue sur le salaire, elle réduit l'impôt dans la limite de 6 % du revenu net.", 'Deducted from your pay; it lowers your tax, up to 6% of net income.')}
        >
          {(id) => <MoneyInput id={id} value={s.voluntaryPension} onChange={(voluntaryPension) => set({ voluntaryPension })} />}
        </Field>
        <Field
          label={t("Primes d'assurance vie", 'Life insurance premiums')}
          aside={t('par an', 'a year')}
          hint={t(
            `Contrat d'au moins six ans. Déductible jusqu'à ${fcfa(liCap)} pour vous (200 000 F plus 30 000 F par enfant).`,
            `Policies of six years or more. Deductible up to ${fcfa(liCap)} in your case (200,000 F plus 30,000 F per child).`,
          )}
        >
          {(id) => <MoneyInput id={id} value={s.lifeInsurance} onChange={(lifeInsurance) => set({ lifeInsurance })} />}
        </Field>
        <Field
          label={t("Taux risques professionnels de l'employeur", "Employer’s occupational risk rate")}
          hint={t("Majoré quand l'employeur n'a pas corrigé les risques relevés lors d'un contrôle.", 'Raised when the employer has not dealt with hazards found during an inspection.')}
        >
          {() => (
            <Seg
              small
              label={t('Majoration des risques professionnels', 'Occupational risk surcharge')}
              value={s.workRisk}
              onChange={(workRisk) => set({ workRisk })}
              options={[
                { value: 0, label: t('Normal', 'Normal') },
                { value: 1, label: t('+50 %', '+50%') },
                { value: 2, label: t('+100 %', '+100%') },
              ]}
            />
          )}
        </Field>
      </Section>
    </aside>
  );
}

function Presets({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  const { t } = useRoute();
  const label = (n: number) => (n === 52500 ? t('SMIG', 'Min. wage') : n >= 1000000 ? `${n / 1000000} M` : `${n / 1000} k`);
  return (
    <div className="presets" role="group" aria-label={t('Montants courants', 'Common amounts')}>
      {PRESETS.map((p) => (
        <button key={p} type="button" className="chip" aria-pressed={value === p} onClick={() => onPick(p)}>
          {label(p)}
        </button>
      ))}
    </div>
  );
}

function ItemList({ list, s, set, placeholder }: { list: Rules['pay_items']; s: AppState; set: Set; placeholder: string }) {
  const { t, lang } = useRoute();
  const [pick, setPick] = useState('');
  const present = list.filter((i) => i.id in s.items);
  const missing = list.filter((i) => !(i.id in s.items));
  return (
    <>
      {present.map((i) => (
        <div className="item-row" key={i.id}>
          <label htmlFor={`it-${i.id}`}>
            {labelOf(i, lang)}
            {(lang === 'en' ? i.hint_en : i.hint) && <small>{lang === 'en' ? i.hint_en : i.hint}</small>}
          </label>
          <MoneyInput id={`it-${i.id}`} value={s.items[i.id] || 0} onChange={(v) => set({ items: { ...s.items, [i.id]: v } })} />
          <button
            type="button"
            className="x-btn"
            aria-label={`${t('Retirer', 'Remove')} ${labelOf(i, lang)}`}
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
              {labelOf(i, lang)}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
