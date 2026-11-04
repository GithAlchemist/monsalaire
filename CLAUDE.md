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
- Layout: `src/pages/[...path].astro` builds the 8 simulator addresses from `APP_PAGES`/`PATHS` (`src/i18n.tsx`); head, hreflang, Open Graph
  and JSON-LD in `src/layouts/Base.astro`; titles and descriptions in `src/seo.ts`; `sitemap.xml` and `llms.txt`
  (key figures generated from the rules file) are endpoints in `src/pages/`; React views in `src/views/`.
- Social previews `public/og-fr.png`, `og-en.png`: `docs/brand/og/render.sh` (headless Chrome, outside the sandbox).
- Articles: Markdown in `src/content/articles/<fr|en>/<slug>.md`, schema in `src/content.config.ts`, authors in
  `src/content/authors/`, images in `src/assets/articles/<translationKey>/`. Static Astro pages (no React app):
  `src/pages/articles/` and `src/pages/en/articles/` call the views in `src/blog/` (index, theme, article, RSS);
  header and footer are the same React components as islands (`src/components/BlogChrome.tsx`). Build-time rules for
  the Markdown (alt text, captions, no dashes, French non-breaking spaces) in `src/blog/markdown.ts`.
  **To publish an article, follow `docs/PUBLIER_UN_ARTICLE.md`.** Covers: `docs/brand/covers/render.mjs`.
- Astro caches rendered Markdown in `.astro/` and `node_modules/.astro/`: delete both after changing
  `src/blog/markdown.ts`, or the change will not show.

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
  `monsalaire.aconta.io`). Work on a branch and open a PR; check the build and the pages before merging.
- English is written as natural British English, never translated word for word; English typography (`4%`,
  `250,000 F`, no space before a colon).
