# Prompt de la session suivante : monsalaire

Tu reprends **monsalaire** (`~/Codebase/monsalaire`, dépôt public `GithAlchemist/monsalaire`, licence MIT), le
simulateur de bulletin de paie au Togo de Kévin. Slogan : « Les salaires en perspective. » / « Salaries in
perspective. ». Kévin travaille avec deux comptes Claude sur le même Mac et n'est pas sûr de garder l'abonnement perso :
cette session doit pouvoir être reprise à tout moment, par n'importe lequel des deux.

Lis d'abord, dans cet ordre : `CLAUDE.md`, `docs/STATUS.md` (état, décisions, notes de travail), `sources/README.md`
(chaque règle, son texte, son article et sa page), puis la fiche mémoire
`~/Codebase/General Manual Memory/projets/monsalaire.md` et la dernière note de session qu'elle cite.

## Où on en est (fin du 04/11/2026)

- Tout est sur `main` et poussé. Pas de déploiement : **ne pas déployer sur Vercel sans que Kévin le demande**
  (`vercel.json` est prêt : toutes les adresses renvoient vers `index.html`).
- Moteur TypeScript pur (`src/engine/`), règles en données (`rules/tg/2026.json`, version 2026.2, vérifiées le
  04/11/2026 sur 13 textes officiels archivés dans `sources/`), 32 tests verts.
- Site bilingue (`src/i18n.tsx`) : `/`, `/comprendre`, `/textes`, `/conditions` en français ; `/en`, `/en/understand`,
  `/en/sources`, `/en/terms` en anglais. L'accueil est compact et s'arrête au bulletin (avertissement d'une ligne qui se
  déroule), puis le footer de projet libre.
- **Logo** (dernier travail de la session) : celui de Kévin, l'Afrique avec trois barres et un arc, le logotype
  « monsalaire » au point du i doré, le slogan et un filet vert, or, rouge. Original : `docs/brand/logo-original.png`.
  Découpes : `public/brand/` (`symbol`, `wordmark`, `lockup`, chacun avec une version `-dark` où le vert foncé devient
  crème), icônes `public/favicon-64.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`. Le logo est centré dans
  l'en-tête sur téléphone, à gauche sur ordinateur. Police des titres : Outfit (la plus proche de celle du logo),
  corps en Geist, chiffres en Geist Mono. Couleurs reprises du logo : vert foncé `#073f2a`, vert `#209b44`, or
  `#f5b102`, rouge `#e60514`.
- README bilingue (`README.md` en anglais, `README.fr.md`) avec le logo, des captures (`docs/screenshots/`), le schéma
  des trois couches et la feuille de route ; `CONTRIBUTING.md` ; modèles de tickets (règle fausse, nouveau pays, bug).

- **Passage à Astro** (même jour, plus tard) : chaque adresse est une vraie page HTML construite à l'avance, puis
  l'application React prend le relais. Métadonnées par page, hreflang, aperçus LinkedIn (`public/og-fr.png`,
  `og-en.png`, générés par `docs/brand/og/render.sh`), données structurées, `sitemap.xml`, `robots.txt`, `llms.txt`
  généré depuis les règles, page 404. Domaine prévu : `monsalaire.aconta.io`.
- **Signature « par Aconta »** à côté du logo (ordinateur), en bas du pied de page et une colonne « Autres projets »
  vers aconta.io, liens marqués `utm_source=monsalaire`. Aconta ne fait pas de paie : ne jamais le laisser entendre,
  pas d'argumentaire (Kévin, 04/11).

## À faire ensuite, par ordre de valeur

0. **Déploiement**, dès que Kévin le demande : projet Vercel depuis le dépôt, domaine `monsalaire.aconta.io`, puis
   Search Console et Bing Webmaster Tools avec `sitemap.xml`, et vérifier l'aperçu LinkedIn. Ensuite le blog et les
   pages de données (comparatif du SMIG entre pays d'abord), voir `docs/STATUS.md`.

1. **Vectoriser le logo.** Les découpes sont des PNG (nets jusqu'à environ 2x la taille d'affichage). Un SVG fidèle du
   symbole et du logotype rendrait le favicon et le README plus nets. Demander à Kévin s'il a le fichier source
   vectoriel avant de redessiner.
2. **Trancher l'article 40 de la convention 2026** (prime d'ancienneté) avec un juriste ou un cabinet de paie
   togolais : « 1 % par année de présence à partir de la quatrième année » se lit « +1 point par an » (choix actuel,
   3 % à 4 ans) ou « taux = nombre d'années » (4 % à 4 ans).
3. **Autres régimes** : agents publics (retraite CRT, santé INAM, AMU 5 % et 5 % aussi), indépendants (CNSS 21,5 %),
   économie informelle (19,5 %). Chercher les textes officiels d'abord (même méthode que `sources/`).
4. **Indemnités de fin de contrat** : départ à la retraite imposé pour moitié (CGI art. 21), licenciement imposé en
   partie (art. 22).
5. **Comparer les pays**, le but de long terme de Kévin : un fichier de règles par pays (`rules/<cc>/<année>.json`,
   le moteur clé déjà les règles par pays), en commençant par le Bénin ou le Sénégal, puis une correction par le coût
   de la vie (facteurs de parité de pouvoir d'achat de la Banque mondiale). Présenter un plan à Kévin avant de coder.
6. **Chaque janvier** : nouvelle loi de finances et Cahier fiscal de l'OTR, vérifier CGI art. 17 à 26 et 72 à 74, SMIG,
   décrets CNSS et AMU ; nouveau `rules/tg/<année>.json` si quelque chose change, avec un test.
7. (Le déploiement est passé en tête de liste, point 0.)

## Règles de travail (Kévin)

- Bilingue toujours : chaque texte d'interface en paire `t('Français', 'English')`, chaque libellé de règle avec son
  `label_en`, les deux README tenus ensemble.
- La loi vit dans `rules/`, jamais dans le moteur ; chaque valeur cite `{ source, article, page }` ; chaque changement
  de règle vient avec un test calculé à la main. Une valeur trouvée dans un seul guide non sourcé est une question
  ouverte, pas une règle.
- Code, commentaires et commits en anglais ; échanges avec Kévin en français. Jamais de tiret cadratin ni
  demi-cadratin. Dire explicitement ce qui n'a pas été vérifié.
- Vérifier chaque changement visible dans le navigateur intégré (bureau, téléphone 375 px, thème sombre, les deux
  langues) avant de dire que c'est fait. Serveur : configuration `monsalaire-dev` de `~/Codebase/.claude/launch.json`
  (port 3150).
- En fin de travail : `docs/STATUS.md` et ce fichier à jour, commit et push sur `main`, fiche mémoire à jour.

## Outils et pièges

- Téléchargements de textes, OCR (`sources/tools/ocr.swift`, macOS Vision), Chrome sans écran (captures, découpe du
  logo) : à lancer hors du bac à sable.
- Captures pour le README : Chrome sans écran avec `--lang=fr-FR` ou `--lang=en-US` (l'accueil suit la langue de
  l'appareil à la première visite), `--force-device-scale-factor=2`, serveur de développement lancé.
- Le site de l'OTR a migré : ses PDF se listent par `https://www.otr.tg/wp-json/wp/v2/media?mime_type=application/pdf`.
- GitHub : `gh` est connecté au compte `GithAlchemist` sur ce Mac.
