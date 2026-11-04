# Contributing to monsalaire · Contribuer

**English below · [Français plus bas](#français)**

Thank you for helping. monsalaire is only as good as its rules, so the most valuable contribution is a correction
backed by an official text.

## Report a rule

Open a [rule issue](https://github.com/GithAlchemist/monsalaire/issues/new?template=rule-error.yml) with:

- the rule (for example "AMU employee rate");
- the value you believe is right, and the value the simulator uses;
- the text: title, article, date, and a link or a copy of the page.

## Work on the code

```bash
npm install
npm run dev     # the site, http://localhost:5173
npm test        # engine tests
npm run build   # type check and production build
```

House rules:

- **The law lives in `rules/<country>/<year>.json`.** Never hard-code a rate in the engine. Every value carries
  `{ source, article, page }` pointing to a document of `sources/`.
- **Every rule change comes with a test** in `src/engine/payroll.test.ts`, worked out by hand from the text.
- **Both languages.** Interface texts are written as pairs, `t('Français', 'English')`; rule labels have a `label_en`.
- Code, comments and commit messages in English. No em dash or en dash in texts.
- A value that only one unsourced guide gives is not a rule. Write it as an open question.

## Update the rules for a new year

1. Fetch the new finance law and the OTR "Cahier fiscal"; add them to `sources/sources.json` and run
   `python3 sources/tools/build_library.py` (scanned documents need macOS for OCR).
2. Read CGI art. 17 to 26 and 72 to 74, the CNSS and AMU decrees, the minimum wage.
3. If anything changed, copy `rules/tg/<year>.json` to the new year with its `valid_from`, change the values and
   their references, register the file in `src/engine/index.ts`, and add tests.

## Add a country

1. Build its legal library in `sources/` (official texts only, transcribed page by page).
2. Write `rules/<cc>/<year>.json` with the same structure, every value referenced.
3. Add worked cases to the tests, then the country to the interface and the footer.

---

## Français

Merci de votre aide. monsalaire ne vaut que par ses règles : la contribution la plus utile est une correction
appuyée sur un texte officiel.

### Signaler une règle

Ouvrez un [ticket « règle »](https://github.com/GithAlchemist/monsalaire/issues/new?template=rule-error.yml) avec :
la règle concernée, la valeur juste et celle du simulateur, et le texte (titre, article, date, lien ou copie de la
page).

### Travailler sur le code

Mêmes commandes que ci-dessus. Règles de la maison : la loi vit dans `rules/<pays>/<année>.json`, jamais dans le
moteur ; chaque valeur cite `{ source, article, page }` ; chaque changement de règle vient avec un test calculé à la
main ; les textes de l'interface s'écrivent en paires `t('Français', 'English')` ; code et commits en anglais ; pas de
tiret cadratin ni demi-cadratin ; une valeur donnée par un seul guide non sourcé est une question ouverte, pas une
règle.

### Nouvelle année, nouveau pays

Voir les étapes en anglais ci-dessus : ajouter les textes à la bibliothèque, les lire, créer le fichier de règles
de l'année ou du pays avec ses références, puis les tests.
