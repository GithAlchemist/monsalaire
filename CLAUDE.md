# monsalaire

Open-source payslip simulator for Togo (public repo `GithAlchemist/monsalaire`, MIT). The payslip updates live as
the user types; every line is explained and linked to its legal source. Long-term goal: compare net pay across
countries for similar incomes, corrected for the cost of living.

Memory card: `General Manual Memory/projets/monsalaire.md` (read it before working here).

## Stack and commands

Vite + React + TypeScript, plain CSS tokens (`src/styles.css`), no backend.

- `npm run dev` (or the `monsalaire-dev` config in Codebase `.claude/launch.json`, port 3150)
- `npm test` (vitest, engine only), `npm run build`

## Rules of this repo

- Code, comments, README and commits in English (open source). The interface text is in French.
- Legal parameters live only in `rules/<country>/<year>.json`, each with `source`, `article`, `status`. Never
  hard-code a rate in the engine.
- Every rule change comes with a test case in `src/engine/payroll.test.ts` worked out from the legal text.
- `status: to_verify` is shown as such; never invent a ceiling or a rate found in only one unsourced guide.
- No Vercel deployment until Kévin asks.
