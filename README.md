<p align="center"><img src="public/logo.svg" width="72" alt="monsalaire logo"></p>

# monsalaire

**Votre bulletin de paie au Togo, calculé sous vos yeux.** Saisissez votre salaire : le brut, les cotisations CNSS et AMU,
l'IRPP et le net se recalculent à chaque chiffre. Chaque ligne s'explique et renvoie au texte qui la fonde.

*A free, open-source payslip simulator for Togo. Type a salary and watch the payslip update live: gross, social
contributions, income tax, net pay and employer cost, every line explained and linked to its legal source.*

## What it does

- **Gross to net** and **net to gross** ("I want 400 000 F net: what base salary should I ask for?").
- Bonuses and allowances, benefits in kind (housing, car...), justified expense reimbursements.
- Seniority bonus and minimum wage grid of the 2026 interprofessional collective agreement (CCIT, categories E1 to C4).
- Overtime at the five legal rates, 13th month taxed at the margin, advances and other deductions.
- Employer cost, split by contribution, and where each franc goes.
- The IRPP computation step by step, bracket by bracket.
- Shareable links (the simulation lives in the URL), print-ready payslip, light and dark themes, phone first.

Everything runs in the browser: no account, no server, no data collected.

## How the law is encoded

Three layers, kept apart so that a new finance law never requires touching the engine:

| Layer | Where | What |
|---|---|---|
| Sources | [`sources/`](sources/README.md) | The legal texts used, with links and the exact articles relied upon |
| Rules | [`rules/tg/2026.json`](rules/tg/2026.json) | Rates, brackets, floors, caps, grids, each with its source, article, validity dates and status |
| Engine | [`src/engine/`](src/engine) | Pure TypeScript: `computePayslip(input, rules)` and `baseForTargetNet(...)` |

The engine picks the rule set in force on the simulation date (`rulesFor(date)`). To update for a new year, add
`rules/tg/2027.json` with its `valid_from`, list it in `src/engine/index.ts`, and add test cases.

### Togo, private sector (rules 2026.1)

| Item | Rule | Source |
|---|---|---|
| CNSS | 4 % employee (pension), 17.5 % employer (3 % family, 2 % work risk, 12.5 % pension); base floored at the SMIG, no ceiling | cnss.tg |
| AMU | 5 % employee, 5 % employer (10 % total, at least half paid by the employer) | Decree 2023-096/PR |
| IRPP | Annual: gross taxable − employee contributions − 28 % flat allowance (on the part up to 10 M) − 120 000 F per dependent (max 6); rounded down to 1 000; progressive scale 0 to 35 %; tax rounded down to 10; withheld monthly | CGI art. 26, 72, 73, 74 |
| SMIG | 52 500 F per month | since 1 January 2023 |
| Overtime | +20 %, +40 %, +65 %, night +65 % and +100 %; hourly rate = base / 173.33 | CCIT 2026 art. 36 |
| Seniority | 2 % after 2 years, +1 point per year from the 4th, capped at 35 %, on the category minimum | CCIT 2026 art. 40 |

The test suite (`src/engine/payroll.test.ts`) checks the engine against cases worked out by hand from the CGI.

**Not covered yet:** public servants (CRT, INAM), self-employed and informal workers, life-insurance deduction, the
former payroll tax (TS, abolished in 2018 according to an official notice). See `not_modeled` in the rules file.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine tests
npm run build    # static site in dist/
```

Stack: Vite, React, TypeScript, plain CSS tokens. The build is a static site that any host can serve.

## Roadmap

- Other regimes (civil servants, self-employed), life-insurance deduction, monthly IRPP regularisation.
- Sector agreements and the full annual history of rules.
- **Compare countries**: the same gross in Togo, Benin, Senegal, Côte d'Ivoire..., then corrected for the cost of living
  (purchasing power parity), to compare what a similar income is really worth. The rule format already carries a
  `country` field for this.

## Contributing

Found a rate that changed, a rule that is wrong, or a case that is not covered? Open an issue with the legal text
(link, article, date). Rules are data: most fixes are a JSON change plus a test.

## Disclaimer

An indicative simulation for private-sector employees under the general regime. It does not replace your employer's
payslip or professional advice.

## License

[MIT](LICENSE)
