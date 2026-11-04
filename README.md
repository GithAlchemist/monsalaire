<p align="center"><img src="public/logo.svg" width="72" alt="monsalaire logo"></p>

# monsalaire

**Votre bulletin de paie au Togo, calculé sous vos yeux.** Saisissez votre salaire : le brut, les cotisations CNSS et AMU,
l'IRPP et le net se recalculent à chaque chiffre. Chaque ligne s'explique et renvoie au texte qui la fonde.

*A free, open-source payslip simulator for Togo. Type a salary and watch the payslip update live: gross, social
contributions, income tax, net pay and employer cost, every line explained and linked to its legal source.*

## What it does

- **Gross to net** and **net to gross** ("I want 400 000 F net: what base salary should I ask for?").
- Spouse, children and other dependents; employee or apprentice (IRPP-exempt).
- Bonuses and allowances, benefits in kind (housing, car, utilities...), justified expense reimbursements.
- Category and echelon of the 2026 interprofessional collective agreement (E1 to C4), seniority bonus on the
  category minimum, meal allowances and mission costs from the agreement's scale.
- Overtime at the five rates of the agreement, 13th month taxed at the margin, voluntary pension and life
  insurance deductions, advances and other deductions, employer work-risk surcharge.
- Employer cost, a waterfall from what you cost to what you get, and where 100 F go.
- The IRPP computation step by step, bracket by bracket; every payslip line opens its explanation and links to the
  article and page of the official text.
- Shareable links (the simulation lives in the URL), print-ready payslip, month or year view, light and dark
  themes, phone first.

Everything runs in the browser: no account, no server, no data collected.

## How the law is encoded

Three layers, kept apart so that a new finance law never requires touching the engine:

| Layer | Where | What |
|---|---|---|
| Sources | [`sources/`](sources/README.md) | 13 official texts (706 pages): original PDFs, full page-by-page Markdown transcriptions, hashes, and the table of every article relied upon |
| Rules | [`rules/tg/2026.json`](rules/tg/2026.json) | Rates, brackets, floors, caps, grids, each with `{ source, article, page }`, validity dates and status |
| Engine | [`src/engine/`](src/engine) | Pure TypeScript: `computePayslip(input, rules)` and `baseForTargetNet(...)` |

The engine picks the rule set in force on the simulation date (`rulesFor(date)`). To update for a new year, add
`rules/tg/2027.json` with its `valid_from`, list it in `src/engine/index.ts`, and add test cases.

### Togo, private sector (rules 2026.2, checked on 4 November 2026)

| Item | Rule | Text |
|---|---|---|
| CNSS | 4 % employee (pension), 17.5 % employer (3 % family, 2 % work risk, 12.5 % pension); base = all pay incl. benefits in kind, floored at the SMIG, no ceiling | Decree 2012-038; Social Security Code art. 12 |
| AMU | 5 % employee, 5 % employer on base salary and taxable bonuses, floored at the SMIG | Decree 2023-096 art. 9, 10, 12, 29 |
| IRPP | Annual: gross taxable − CNSS and AMU − 28 % flat deduction (part up to 10 M) − voluntary pension (≤ 6 %) − life insurance (≤ 200 000 F + 30 000 F per child) − 120 000 F per dependent (max 6); rounded down to 1 000; scale 0 to 35 %; tax rounded down to 10; withheld monthly | CGI 2025 art. 20, 23, 26, 72 to 74; LPF art. 26, 27 |
| SMIG | 52 500 F a month, 302.89 F an hour | Order 3790 of 31/12/2022 |
| Overtime | +20 %, +40 %, +65 %, night +65 % and +100 %; hourly rate = (base + sursalaire) / 173.33 | CCIT 2026 art. 36 |
| Seniority | 2 % after 2 years, +1 point per year from the 4th, 35 % at most, on the category minimum | CCIT 2026 art. 40 |
| Grid | E1 52 500 F to C4 246 500 F | CCIT 2026 annex II |

The 2026 finance law does not change these articles (OTR Cahier fiscal 2026). The test suite
(`src/engine/payroll.test.ts`, 31 tests) checks the engine against cases worked out by hand from the texts.
Open questions (two possible readings of a text) are listed in `sources/README.md` and on the site.

**Not covered yet:** public servants (CRT, INAM), self-employed and informal workers, end-of-contract indemnities,
mortgage interest deduction.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine tests
npm run build    # static site in dist/
```

Stack: Vite, React, TypeScript, plain CSS tokens. The build is a static site that any host can serve.

Rebuild the legal library (downloads, hashes, transcriptions; OCR needs macOS):

```bash
python3 sources/tools/build_library.py
```

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
