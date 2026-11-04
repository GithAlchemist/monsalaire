# monsalaire: where the project stands

Last update: 4 November 2026. This file is loaded by `CLAUDE.md`, so any Claude session (any account) starts from
it. Keep it current at the end of every session.

## In one paragraph

Free, open-source payslip simulator for Togo. The user types a salary; the payslip (gross, CNSS, AMU, IRPP, net,
employer cost) updates live, and every line opens its explanation and a link to the article and page of the official
text. Public repo `GithAlchemist/monsalaire` (MIT), owner Kévin. Not deployed yet. Long-term goal: compare the net of
a similar income across countries (Benin, Senegal, Côte d'Ivoire...), corrected for the cost of living.

## State

- `main` holds everything; no other branch. Rules version `2026.2`, verified on 4 November 2026 against the texts in
  `sources/` (13 official texts, 706 pages, original PDFs and page-by-page transcriptions).
- 31 engine tests pass (`npm test`), including the three IRPP reference cases (150 000, 300 000 and 800 000 F).
- UI checked in the browser on desktop, phone width (375 px, no horizontal scroll) and dark theme; gross to net and
  net to gross both checked (400 000 F target gives exactly 400 000 F).
- Local preview: `npm run dev`, or the `monsalaire-dev` entry of `~/Codebase/.claude/launch.json` (port 3150).

## Decisions taken with Kévin (do not reopen without asking him)

- Name `monsalaire` (not "Togolet"): the tool will compare countries.
- Engine in TypeScript in the browser (not Python): the payslip must change at every keystroke without a server; the
  site stays static. Legal parameters are data in `rules/`, never constants in the engine.
- Look: Togolese flag and OTR colours (forest green, gold, a touch of red) on the structure of the Aconta design
  system (Geist, mono figures, Instrument Serif accents, documents on paper). No separate design system.
- Code, comments, README and commit messages in English; the interface in French.
- Seniority bonus (CCIT 2026 art. 40) read as "2 % at 2 and 3 years, then one more point a year" (3 % at 4 years);
  the other reading is shown on the site as an open question.
- AMU base excludes benefits in kind (decree 2023-096 art. 9 does not list them); CNSS includes them (code art. 12).
- **No Vercel deployment until Kévin asks.**

## Next steps

1. Have a Togolese labour lawyer or payroll firm settle the reading of CCIT art. 40 (seniority).
2. Other regimes: civil servants (CRT pension, INAM health), self-employed (21.5 % CNSS), informal economy (19.5 %).
3. End-of-contract payments (CGI art. 21 and 22), mortgage interest deduction (art. 26-5).
4. Country comparison: one rules file per country (`rules/<cc>/<year>.json`, the engine already keys rules by
   country), then a purchasing-power correction (World Bank PPP conversion factors).
5. Every January: fetch the new finance law and the OTR "Cahier fiscal", check CGI art. 17 to 26 and 72 to 74, add
   `rules/tg/<year>.json` with its `valid_from` if anything changed, and a test.
6. Deployment on Vercel when Kévin decides (static Vite build, `npm run build`, output `dist/`).

## Working notes

- The OTR site moved to WordPress in 2026: old download links return the home page. Its PDFs are listed by
  `https://www.otr.tg/wp-json/wp/v2/media?mime_type=application/pdf`.
- Downloads and OCR must run outside the command sandbox (proxy certificate; macOS Vision returns empty pages inside
  it). `sources/tools/build_library.py` compiles `sources/tools/ocr.swift` on first use. Always check an OCR figure
  against the page image.
- Verify UI changes in the browser pane before saying they work; `html { scroll-behavior: smooth }` delays scripted
  scrolls, use `behavior: 'instant'` when taking screenshots.
- Pushing: this is Kévin's personal public repo; commit and push only when he asks.

## Where else to look

- Shared memory on Kévin's Mac (both Claude accounts see it): `~/Codebase/General Manual Memory/projets/monsalaire.md`
  and the session notes it lists; `memoire-auto/ocr-vision-sans-tesseract.md`.
- `sources/README.md`: every rule, the text, article and page it comes from, and the open questions.
