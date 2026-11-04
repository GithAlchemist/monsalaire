# monsalaire: where the project stands

Last update: 4 November 2026 (articles section, on a branch with a PR). This file is loaded by `CLAUDE.md`, so any Claude session (any account) starts from
it. Keep it current at the end of every session.

## In one paragraph

Free, open-source payslip simulator for Togo, published as "the open-source salary tool by Aconta" on
`monsalaire.aconta.io` (not deployed yet). The user types a salary; the payslip (gross, CNSS, AMU, IRPP, net,
employer cost) updates live, and every line opens its explanation and a link to the article and page of the official
text. Public repo `GithAlchemist/monsalaire` (MIT), owner Kévin. Long-term goal: compare the net of
a similar income across countries (Benin, Senegal, Côte d'Ivoire...), corrected for the cost of living.

## State

- `main` holds everything; no other branch. Rules version `2026.2`, verified on 4 November 2026 against the texts in
  `sources/` (13 official texts, 706 pages, original PDFs and page-by-page transcriptions).
- 32 engine tests pass (`npm test`), including the three IRPP reference cases (150 000, 300 000 and 800 000 F) and the
  English payslip.
- Four pages in French and English (`src/i18n.tsx`): simulator (compact hero, one-line disclaimer that opens, payslip,
  then the site footer), How it works (`src/pages/Understand.tsx`: waterfall, 100 F dots, three amounts,
  contributions table, tax steps and brackets, key rules), Legal texts (library, verification table, limits), Terms.
  Language: `/en/...` addresses, first visit follows the device, choice remembered. The simulation is kept in the
  home page hash and in localStorage, so the other pages use it.
- Bilingual README (`README.md`, `README.fr.md`) with banner (`docs/banner.svg`) and screenshots
  (`docs/screenshots/`, taken with headless Chrome at 2x), `CONTRIBUTING.md`, issue templates (rule error, new
  country, bug), PR template. `vercel.json` serves the prerendered pages without their `.html` extension.
- Logo by Kévin (4 November 2026): Africa with three bars and an arc, wordmark with a gold i-dot, tagline "Les salaires
  en perspective.". Original in `docs/brand/logo-original.png`; PNG cuts in `public/brand/` (symbol, wordmark, lockup,
  each with a `-dark` version) and icons in `public/`. Centred in the header on phones, left on larger screens.
  Headings in Outfit (closest to the logo font). Palette from the logo: #073f2a, #209b44, #f5b102, #e60514.
- UI checked in the browser on desktop, phone width (375 px, no horizontal scroll) and dark theme, in both languages.
- Local preview: `npm run dev`, or the `monsalaire-dev` entry of `~/Codebase/.claude/launch.json` (port 3150).

- 4 November 2026 (later): moved from a Vite single-page app to **Astro** with static output. Each of the 8
  addresses is real HTML at build time (the old SPA served an empty page to AI crawlers and LinkedIn previews), then
  the React app hydrates. Per page: title, description, canonical, hreflang fr/en/x-default, Open Graph and Twitter
  card (`public/og-fr.png`, `og-en.png`), JSON-LD (Organization Aconta, WebSite, WebPage, WebApplication on the home).
  `sitemap.xml` with hreflang, `robots.txt` open to every crawler, `llms.txt` generated from the rules file with the
  key figures and their sources, `404.html`. `vercel.json`: `cleanUrls`, no trailing slash. The first-visit language
  redirect of "/" now runs in an inline head script and skips crawlers and link-preview bots.
- "par Aconta" signature with the Aconta emblem (`public/brand/aconta-emblem.png`) next to the logo on desktop
  (hidden on phones), in the footer bottom line, and an "Autres projets" footer column linking to aconta.io. Every
  Aconta link carries `utm_source=monsalaire` and the place (`header`, `footer`, `footer-bottom`).

- Deployed on 4 November 2026: Vercel project `monsalaire` (team githalchemist), connected to the GitHub repo, so
  every push to `main` deploys to production. Addresses: https://monsalaire-aconta.vercel.app
  (`monsalaire.vercel.app` belongs to someone else) and https://monsalaire.aconta.io (live: CNAME `monsalaire` ->
  `0b89f626125f4d37.vercel-dns-017.com` on Cloudflare, DNS only, like bookme).
- Footer: "créé par Kévin" links to https://kevin.aconta.io; contact address `monsalaire@aconta.io` (footer and
  Terms). The aconta.io catch-all (ImproveMX) forwards it to Kévin's Gmail; one address per product lets him filter. `vercel.json` declares Astro and `dist`.
- Vercel Web Analytics and Speed Insights injected in production (`src/analytics.ts`), the address hash (the
  user's figures) cut before sending; privacy texts say so.
- English rewritten on 4 November 2026 (Kévin: the English read as translated French). British English, natural
  phrasing, English typography: `4%` (no space), `250,000 F`, no space before a colon. `pct` in `src/format.ts` and
  the engine handle the space per language. Rule: write the English as an English writer would, never word for word.

- Articles section (branch `claude/admiring-lamport-pdtaas`, PR to `main`): Astro content collections
  (`src/content.config.ts`): `articles` in Markdown or MDX, one file per language (`src/content/articles/fr|en/<slug>.md`)
  linked by `translationKey`, strict schema (title, description, dates, theme from a fixed list of five, tags, author,
  1200 x 630 cover with alt text, featured, draft, at least one source); `authors` (Kévin, `kevin.aconta.io`, bio to
  complete). Pages, static HTML with the site header and footer as React islands: `/articles` (featured article,
  latest, a section per theme), `/articles/theme/<slug>` (filter without JavaScript, empty themes built with noindex),
  `/articles/<slug>` (cover, dates, author, reading time, table of contents from 4 sections, figures and tables,
  sources, related articles, discreet simulator link), same under `/en`. SEO: canonical, hreflang when a translation
  exists, Open Graph article with the cover as JPEG, JSON-LD BlogPosting (author Person, publisher Aconta, dates,
  citations) and BreadcrumbList, sitemap, `llms.txt`, an RSS feed per language. Build-time rules
  (`src/blog/markdown.ts`, `src/blog/data.ts`): cover exactly 1200 x 630, alt text and caption on every image, no em
  or en dash, French non-breaking spaces before `:` `;` `?` `!`. Images through Astro (AVIF and WebP, responsive
  sizes, lazy except the cover). Covers generated by `docs/brand/covers/render.mjs`. Sample article "SMIG au Togo
  en 2026 : ce que dit le texte" / "Togo's minimum wage in 2026: what the law says" (marked as a sample in its front
  matter, can be deleted). Publishing guide for Kévin and any Claude session: `docs/PUBLIER_UN_ARTICLE.md`.
  Header nav has "Articles"; footer has an "Articles" column; the phone sub-navigation fits four items from 360 px.
- Working rule changed (task of 4 November 2026): nothing is pushed to `main` directly any more, since every push
  deploys to production. Work on a branch, open a PR, merge when checked.

- Design pass (4 November 2026, Kévin: "it looks AI-made"): IBM Plex Sans for text and figures (tabular-nums) instead
  of Geist and Geist Mono; Remix Icon everywhere (`Icon` in `src/components/fields.tsx`, paths from the `remixicon`
  package); sentence-case labels instead of tracked capitals; flatter corners; no decorative gradients; the full Aconta
  logo (light and dark PNG in `public/brand/`) in the "par Aconta" signature; footer brand on one row; no hero subtitle
  on phones. Rule: a line only breaks when the screen runs out of room (no max-width on titles or short texts, no
  balanced wrapping), except the reading column of an article body.

## Decisions taken with Kévin (do not reopen without asking him)

- Name `monsalaire` (not "Togolet"): the tool will compare countries.
- Engine in TypeScript in the browser (not Python): the payslip must change at every keystroke without a server; the
  site stays static. Legal parameters are data in `rules/`, never constants in the engine.
- Look: Kévin's logo and its colours (dark green, green, gold, red) on the structure of the Aconta design system
  (Geist body, mono figures, Outfit headings, documents on paper). No separate design system.
- Bilingual from the start (Kévin, 4 November 2026): site, payslip and README in French and English.
- Home page compact: it stops at the payslip; explanations live on How it works, sources on Legal texts.
- Seniority bonus (CCIT 2026 art. 40) read as "2 % at 2 and 3 years, then one more point a year" (3 % at 4 years);
  the other reading is shown on the site as an open question.
- AMU base excludes benefits in kind (decree 2023-096 art. 9 does not list them); CNSS includes them (code art. 12).
- Published by Aconta on `monsalaire.aconta.io`; logo and colours of monsalaire kept. Links to aconta.io only in
  obvious places (header signature, footer), no pitch, and never imply Aconta does payroll: it does not (Aconta is a
  money tracker for very small businesses that replaces the notebook and the Excel file).
- Blog later on this site (not on aconta.io): every LinkedIn post of Kévin (minimum wage compared across West
  African countries, minimum wage corrected for the cost of living...) gets a durable, sourced data page and a dated
  article here. Aim: become the reference source on salaries, cited by search engines and AI assistants.
- Home: no "laws in force" badge above the title (the date is in the disclaimer); title on one line at every width,
  subtitle on one line from 700 px. Later: a country selector inside the calculation controls (Kévin).

## Next steps

1. Have a Togolese labour lawyer or payroll firm settle the reading of CCIT art. 40 (seniority).
2. Other regimes: civil servants (CRT pension, INAM health), self-employed (21.5 % CNSS), informal economy (19.5 %).
3. End-of-contract payments (CGI art. 21 and 22), mortgage interest deduction (art. 26-5).
4. Country selector in the calculation controls, then country comparison: one rules file per country (`rules/<cc>/<year>.json`, the engine already keys rules by
   country), then a purchasing-power correction (World Bank PPP conversion factors).
5. Every January: fetch the new finance law and the OTR "Cahier fiscal", check CGI art. 17 to 26 and 72 to 74, add
   `rules/tg/<year>.json` with its `valid_from` if anything changed, and a test.
6. After the Cloudflare CNAME is in place: check https://monsalaire.aconta.io, then Google Search Console (a domain property on aconta.io covers the subdomains) and
   Bing Webmaster Tools (ChatGPT search leans on Bing), submit `sitemap.xml`. Check a LinkedIn preview with the
   LinkedIn Post Inspector.
7. Articles: the section is built (see above). Next: Kévin's first LinkedIn posts as articles (minimum wage compared
   across West African countries, minimum wage corrected for the cost of living), each with its sources; one page per
   real question ("SMIG Togo 2026", "taux CNSS Togo", "barème IRPP Togo"), answer in the first sentence. Complete
   Kévin's bio (`src/content/authors/kevin.json`) and add an avatar and `sameAs` (LinkedIn) if he wants.
8. Later, not built on purpose: several authors (the `authors` collection is ready, add a JSON file each); an optional
   account (email) offered after a salary calculation to receive salary analyses, which needs a backend, consent and a
   privacy text update; a newsletter; a CMS (for now Kévin sends the content and Claude publishes it through a PR).
   Possible improvements: pagination of the articles index past about 30 articles, an article-specific cover template
   per theme.

## Working notes

- The OTR site moved to WordPress in 2026: old download links return the home page. Its PDFs are listed by
  `https://www.otr.tg/wp-json/wp/v2/media?mime_type=application/pdf`.
- Downloads and OCR must run outside the command sandbox (proxy certificate; macOS Vision returns empty pages inside
  it). `sources/tools/build_library.py` compiles `sources/tools/ocr.swift` on first use. Always check an OCR figure
  against the page image.
- Verify UI changes in the browser pane before saying they work; `html { scroll-behavior: smooth }` delays scripted
  scrolls, use `behavior: 'instant'` when taking screenshots.
- Pushing: Kévin wants every piece of work ready to be picked up by his other Claude account at any time. Commit and
  push a branch at the end of each piece of work, with this file updated, and open a PR to `main` (a merge deploys).
- Screenshots for the README: headless Chrome with `--lang=fr-FR` or `en-US` (the home page follows the device
  language on a first visit), `--force-device-scale-factor=2`, dev server running.

## Where else to look

- Shared memory on Kévin's Mac (both Claude accounts see it): `~/Codebase/General Manual Memory/projets/monsalaire.md`
  and the session notes it lists; `memoire-auto/ocr-vision-sans-tesseract.md`.
- `sources/README.md`: every rule, the text, article and page it comes from, and the open questions.
