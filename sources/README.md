# Legal library

Every rule in [`rules/tg/2026.json`](../rules/tg/2026.json) points to a document of this library, with the article
and the page of the original PDF. The library holds, for each text:

- the original PDF in [`originals/`](originals), with its SHA-256 recorded in [`sources.json`](sources.json);
- a complete, page-by-page Markdown transcription in [`text/`](text), without rewording;
- where it came from and what the simulator uses it for, in [`sources.json`](sources.json).

Scanned documents are transcribed by OCR (macOS Vision, see [`tools/ocr.swift`](tools/ocr.swift)). OCR can misread
a digit: every figure used by the simulator was checked by hand against the page image of the original.

## The texts

| Text | Date | Pages | Transcription | Used for |
|---|---|---|---|---|
| [Code général des impôts et Livre des procédures fiscales](text/cgi-lpf-2025.md) (OTR, updated September 2025) | 18/09/2025 | 361 | text | IRPP on wages |
| [Cahier fiscal: main provisions of the 2026 finance law](text/otr-cahier-fiscal-2026.md) (OTR) | 30/10/2026 | 24 | OCR | Check that 2026 changes nothing on wages |
| [Convention collective interprofessionnelle](text/ccit-2026.md), filed on 19 May 2026 | 19/05/2026 | 76 | OCR | Overtime, allowances, seniority, grid |
| [Convention collective interprofessionnelle 2011](text/ccit-2011.md) (replaced) | 12/12/2011 | 63 | text | History |
| [Code de sécurité sociale, law 2011-006](text/code-securite-sociale-2011.md) | 21/02/2011 | 43 | OCR | CNSS base, floor, no ceiling |
| [Decree 2012-038 on CNSS rates](text/decret-2012-038-taux-cnss.md) (Journal officiel) | 27/06/2012 | 1 | text | CNSS rates |
| [Order 003/2012 on work-risk surcharges](text/arrete-2012-003-risques-professionnels.md) | 19/01/2012 | 2 | text | Employer surcharge |
| [Order 002/2012 applying the Social Security Code](text/arrete-2012-002-application-css.md) | 2012 | 43 | text | Late payment, other regimes |
| [Law 2021-022 on universal health insurance (AMU)](text/loi-2021-022-amu.md) | 18/10/2021 | 25 | text | AMU legal basis |
| [Decree 2023-096 on AMU contributions](text/decret-2023-096-taux-amu.md) (Journal officiel) | 04/10/2023 | 6 | text | AMU base and rates |
| [Decree 2023-097 on AMU management](text/decret-2023-097-gestion-amu.md) | 04/10/2023 | 3 | OCR | Who collects AMU |
| [Labour Code, law 2021-012](text/code-travail-2021.md) (Journal officiel) | 18/06/2021 | 58 | text | Wage, SMIG, deductions, 40 h |
| [Order 3790 on the SMIG](text/arrete-3790-smig-2022.md) | 31/12/2022 | 1 | text | SMIG |

Download addresses, official pages and hashes are in [`sources.json`](sources.json). The OTR site moved in 2026 and
its former download links no longer work: the 2025 tax code comes from a byte-identical copy, noted as such.

## What was checked, and where

Pages are pages of the PDF (the `## Page N` headings of the transcriptions), not the printed page numbers.

| Rule | Value | Text | Article | Page |
|---|---|---|---|---|
| SMIG | 52 500 F a month, 302.89 F an hour, from 1 January 2023 | Order 3790 | art. 1 | 1 |
| Legal working week | 40 h (2 400 h a year in agriculture) | Labour Code | art. 180 | 29 |
| CNSS rates | 3 % family, 2 % work risk, 16.5 % pension: 17.5 % employer, 4 % employee | Decree 2012-038 | art. 1 to 3 | 1 |
| CNSS base | all pay incl. bonuses, commissions, benefits in kind; excludes expense refunds and family benefits; never below the SMIG; **no ceiling** | Social Security Code | art. 12 | 4 |
| Work-risk rate | single rate, +50 % then +100 % for employers who ignore prevention orders | Order 003/2012 | art. 1, 4, 5 | 1 |
| AMU base | base salary and all taxable bonuses and allowances; excludes expense refunds and family benefits; never below the SMIG | Decree 2023-096 | art. 9 and 10 | 3 |
| AMU rate | 10 %: 5 % employer, 5 % employee, due from 1 January 2024 | Decree 2023-096 | art. 12, 29, 47 | 3 to 6 |
| Taxable wages | wages, allowances, bonuses (seniority, overtime...), benefits in kind | CGI | art. 17, 19, 25 | 22 to 25 |
| Benefits in kind | real value; housing at rent; car at one third of its costs | CGI | art. 20 | 23 |
| Exemptions | expense allowances actually used as intended; family benefits; apprentices' wages | CGI | art. 23 | 24 |
| Deductions | compulsory pension (within 6 %), social and health contributions; 28 % flat deduction on the part up to 10 M; voluntary pension (within 6 %); life insurance (200 000 F + 30 000 F per child, 6 children at most) | CGI | art. 26 | 25 and 26 |
| Dependents | spouse without income, children under 21 (25 if studying), children taken in, dependent relatives under the same roof; 6 at most; 10 000 F per person per month, off the taxable income | CGI | art. 72 and 73 | 40 and 41 |
| Scale | 0 % to 900 000; 3 %; 10 % from 3 M; 15 % from 6 M; 20 % from 9 M; 25 % from 12 M; 30 % from 15 M; 35 % above 20 M; income rounded down to the thousand, tax to the ten | CGI | art. 74 | 41 |
| Withholding | by the employer at each payment, paid to the OTR by the 15th of the next month | LPF | art. 26 and 27 | 223 |
| 2026 finance law | no change to the wage tax articles | Cahier fiscal 2026 | overview | 5 |
| Overtime | +20 % (41st to 48th hour), +40 % (beyond), +65 % (Sunday, rest day, holiday), night +65 % and +100 %; hourly rate = (base + sursalaire) / 173.33 | CCIT 2026 | art. 36 | 35 and 36 |
| Mission costs | 3, 5 or 10 times the category hourly base rate | CCIT 2026 | art. 38 | 37 |
| Meal allowance | 3 times the hourly wage of the company's ordinary labourer | CCIT 2026 | art. 39 | 37 and 38 |
| Seniority | 2 % after 2 years; 1 % per year from the 4th year; 35 % at most; on the category minimum | CCIT 2026 | art. 40 | 39 |
| 13th month | may be granted, not compulsory | CCIT 2026 | art. 42 | 39 |
| Grid | E1 52 500 to C4 246 500 F, three echelons per category from E2 | CCIT 2026 | annex II | 72 to 74 |
| In force | from the day after filing: 20 May 2026 | CCIT 2026 | art. 3 | 7 |

## Open questions

These are listed in the rules file (`open_questions`) and shown on the site.

1. **Seniority, CCIT art. 40.** "1 % par année de présence à partir de la quatrième année" can be read as one more
   point per year (3 % at 4 years, the simulator's choice, which matches published worked examples) or as a rate
   equal to the years of presence (4 % at 4 years).
2. **AMU and benefits in kind.** Decree 2023-096 lists base salary and taxable bonuses and allowances, without
   benefits in kind, which the Social Security Code includes for the CNSS. The simulator leaves them out of the AMU.
3. **Apprentices.** The CGI exempts their wages from IRPP; no text found removes their social contributions, so
   the simulator keeps them.

## Updating the library

```bash
python3 sources/tools/build_library.py            # download what is missing, transcribe what changed
python3 sources/tools/build_library.py --force cgi-lpf-2026   # redo one text
```

To add a text: add an entry to `sources.json` (id, title, publisher, date, download_url, method `text` or `ocr`,
used_for), run the script, read the transcription, then cite it from the rules with `{ source, article, page }`.
Each January: fetch the new finance law and the OTR "Cahier fiscal", check articles 17 to 26 and 72 to 74, and copy
`rules/tg/<year>.json` with its new `valid_from` if anything changed.
