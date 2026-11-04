import { rulesFor, type Ref } from '../engine';
import { SITE } from '../seo';

/**
 * llms.txt: a plain summary of the site for AI assistants, with the current key figures generated from the rules
 * file (never typed by hand here), each followed by the official text, article and page it comes from.
 */
export function GET() {
  const r = rulesFor(new Date().toISOString().slice(0, 10));
  const pct = (x: number) => `${+(x * 100).toFixed(2)}%`;
  const f = (n: number) => `${n.toLocaleString('en-GB')} FCFA`;
  const cite = (ref?: Ref) => {
    if (!ref) return '';
    const src = r.sources[ref.source];
    return src ? ` (source: ${src.title_en ?? src.title}, ${ref.article}${ref.page ? `, p. ${ref.page}` : ''}: ${src.url}${ref.page ? `#page-${ref.page}` : ''})` : '';
  };
  const cnss = r.social.cnss;
  const employer = cnss.employer.map((c) => `${c.label_en ?? c.label} ${pct(c.rate)}`).join(', ');
  let low = 0;
  const brackets = r.irpp.brackets
    .map((b) => {
      const line = b.up_to === null ? `- above ${f(low)}: ${pct(b.rate)}` : `- ${f(low)} to ${f(b.up_to)}: ${pct(b.rate)}`;
      low = b.up_to ?? low;
      return line;
    })
    .join('\n');

  const body = `# monsalaire

> Free, open-source payslip simulator for Togo, published by Aconta (${'https://aconta.io'}). It computes gross to net pay, income tax (IRPP), CNSS and AMU contributions and the employer cost, and cites the article and page of the official text behind every line. French at ${SITE}, English at ${SITE}/en.

Rules version ${r.version}, checked against the official texts on ${r.verified_on}. Indicative simulation: it does not replace an employer's payslip.

## Pages

- [Simulator (French)](${SITE}): type a salary, the payslip updates live.
- [Simulator (English)](${SITE}/en)
- [How it is computed](${SITE}/en/understand) ([French](${SITE}/comprendre)): from gross to net, step by step.
- [Official texts](${SITE}/en/sources) ([French](${SITE}/textes)): the archived texts and the page of each rule.
- [Source code and rules file](https://github.com/GithAlchemist/monsalaire): MIT licence; the legal parameters live in rules/tg/${r.valid_from.slice(0, 4)}.json.

## Key figures for Togo (${r.valid_from.slice(0, 4)})

- Minimum wage (SMIG): ${f(r.minimum_wage.smig_monthly)} a month, ${r.minimum_wage.smig_hourly} FCFA an hour${cite(r.minimum_wage.ref)}.
- CNSS, employee: ${cnss.employee.map((c) => pct(c.rate)).join(' + ')} of gross pay (pension). Employer: ${employer}${cnss.ceiling === null ? ". No ceiling" : ""}${cite(cnss.ref)}.
- AMU (universal health insurance): ${pct(r.social.amu.employee_rate)} employee and ${pct(r.social.amu.employer_rate)} employer${cite(r.social.amu.ref)}.
- Income tax (IRPP), computed over the year and withheld monthly. Taxable income = yearly salary minus the employee contributions, minus a ${pct(r.irpp.flat_allowance.rate)} standard deduction for work expenses (on the part up to ${f(r.irpp.flat_allowance.cap_income)}), minus ${f(r.irpp.dependents.amount_per_month)} a month per dependant (${r.irpp.dependents.max} at most)${cite(r.irpp.ref_deductions)}. Yearly brackets:
${brackets}
  Brackets${cite(r.irpp.ref)}.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
