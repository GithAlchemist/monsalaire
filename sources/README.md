# Sources

The legal texts behind every rule in [`rules/tg/2026.json`](../rules/tg/2026.json). Each rule carries a `source` id
from this list and, when known, an `article`. Status `to_verify` in the rules file means the figure comes from a
secondary source and still needs checking against the official text.

| Id | Text | Used for | Status |
|---|---|---|---|
| `cgi` | Code général des impôts du Togo, consolidated version published by the OTR ([otr.tg](https://www.otr.tg/index.php/fr/impots/reglementations-fiscales/code-general-des-impots.html)) | IRPP: taxable base (art. 17, 20), deductions and 28 % allowance (art. 26), dependents (art. 72, 73), scale and rounding (art. 74) | in force |
| `cnss-taux` | CNSS, contribution rates and base ([cnss.tg](https://cnss.tg/employeurs/cotisations-sociales/)) | CNSS rates by branch, base, SMIG floor | in force |
| `amu-decret-2023-096` | Decree 2023-096/PR on universal health insurance, official notice of the 10 % rate from 1 January 2024 ([republicoftogo.com](https://www.republicoftogo.com/content/download/112742/2907809/1)) | AMU rate and split | in force |
| `ccit-2026` | Convention collective interprofessionnelle du Togo, filed on 19 May 2026 (Lomé labour court, no. 001), in force since 20 May 2026 ([text](https://www.lqdd.org/textes-de-loi/convention-collective-interprofessionnelle-du-togo-ccit/)) | Overtime (art. 36), seniority (art. 40), 13th month (art. 42), minimum wage grid (annex II) | grid to verify |
| `smig-2023` | SMIG at 52 500 F per month from 1 January 2023 | Minimum wage, contribution floor | in force |

## Key provisions, as applied

- **CGI art. 26**: the net taxable amount is the gross (cash and benefits in kind) minus compulsory pension
  contributions, employee social and health contributions, and amounts withheld in return for benefits in kind;
  then a flat deduction of 28 % "sur la fraction du revenu n'excédant pas dix millions de francs CFA".
- **CGI art. 72 and 73**: 10 000 F per dependent and per month, at most six dependents (spouse without income,
  children under 21, or 25 if studying, disabled children, children taken in, dependent relatives living in the home).
  This reduces taxable income, not the tax.
- **CGI art. 74**: progressive annual scale (0 % to 900 000; 3 %; 10 % from 3 M; 15 % from 6 M; 20 % from 9 M; 25 %
  from 12 M; 30 % from 15 M; 35 % above 20 M). Taxable income rounded down to the thousand, tax to the ten.
- **CNSS**: base includes allowances, bonuses, commissions and benefits in kind; excludes expense reimbursements
  and family benefits; never below the SMIG.
- **CCIT 2026 art. 40**: seniority bonus of 2 % after two years, then 1 % per year from the fourth year, capped at
  35 %, computed on the minimum wage of the worker's category.

## Open questions

- A general CNSS or AMU ceiling: none published by the CNSS; some secondary guides mention one, without a source.
- The AMU split: the decree requires the employer to pay at least half of 10 %; 5 % and 5 % is assumed.
- The full CCIT 2026 annex II grid was taken from a secondary source and must be checked against the filed text.

Next step for this folder: keep the original PDFs (CGI, LPF, finance laws, social security code, AMU decrees,
labour code, CCIT) with a faithful Markdown transcription of the articles used.
