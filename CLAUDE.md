# monsalaire

Open-source payslip simulator for Togo (public repo `GithAlchemist/monsalaire`, MIT). The payslip updates live as
the user types; every line is explained and linked to its legal source. Long-term goal: compare net pay across
countries for similar incomes, corrected for the cost of living.

Memory card: `General Manual Memory/projets/monsalaire.md` (read it before working here).

Where the project stands, decisions and next steps (read first, update at the end of every session):

@docs/STATUS.md

Brief for the next session (French, written for Kévin's other Claude account as much as this one):

@docs/PROMPT_SESSION_SUIVANTE.md

## Stack and commands

Astro (static output) + one React island per page + TypeScript, plain CSS tokens (`src/styles.css`), no backend.
Every address is prerendered to real HTML at build time (search engines, AI crawlers and link previews read it),
then `src/App.tsx` hydrates and restores the simulation from the hash or localStorage.

- `npm run dev` (or the `monsalaire-dev` config in Codebase `.claude/launch.json`, port 3150)
- `npm test` (vitest, engine only), `npm run build` (inside the command sandbox, prefix with
  `ASTRO_TELEMETRY_DISABLED=1`: Astro's telemetry writes to `~/Library/Preferences/astro`)
- Layout: `src/pages/[...path].astro` builds the 8 addresses from `PATHS` (`src/i18n.tsx`); head, hreflang, Open Graph
  and JSON-LD in `src/layouts/Base.astro`; titles and descriptions in `src/seo.ts`; `sitemap.xml` and `llms.txt`
  (key figures generated from the rules file) are endpoints in `src/pages/`; React views in `src/views/`.
- Social previews `public/og-fr.png`, `og-en.png`: `docs/brand/og/render.sh` (headless Chrome, outside the sandbox).

## Rules of this repo

- Code, comments and commits in English. The site is bilingual from day one: every interface text is a pair
  `t('Français', 'English')`, every rule label has a `label_en`, the engine writes its explanations in the requested
  language. READMEs: `README.md` (English) and `README.fr.md` (French), kept in step.
- Pages: `/`, `/comprendre`, `/textes`, `/conditions` in French; `/en`, `/en/understand`, `/en/sources`,
  `/en/terms` in English (`src/i18n.tsx`). The home page stops at the payslip, then the site footer.
- Legal parameters live only in `rules/<country>/<year>.json`, each with `source`, `article`, `status`. Never
  hard-code a rate in the engine.
- Every rule change comes with a test case in `src/engine/payroll.test.ts` worked out from the legal text.
- `status: to_verify` is shown as such; never invent a ceiling or a rate found in only one unsourced guide.
- Published by Aconta: "par Aconta" signature in the header, "Autres projets" in the footer, links built with
  `acontaLink(place)` (`src/seo.ts`). Aconta does no payroll: never say or imply it manages salaries, and no pitch
  or "why Aconta offers this" paragraph (Kévin, 4 November 2026).
- Deployed: every push to `main` goes to production on Vercel (https://monsalaire-aconta.vercel.app, then
  `monsalaire.aconta.io`). Check the build and the pages before pushing.
- English is written as natural British English, never translated word for word; English typography (`4%`,
  `250,000 F`, no space before a colon).
