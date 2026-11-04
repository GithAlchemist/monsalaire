# Publier un article sur monsalaire

Guide pour Kévin et pour toute session Claude qui publie un article. Le principe : Kévin envoie le contenu, Claude
crée les fichiers, vérifie, ouvre une PR ; la fusion dans `main` met l'article en ligne.

Rubrique : https://monsalaire.aconta.io/articles (français) et https://monsalaire.aconta.io/en/articles (anglais).

## 1. Ce que Kévin envoie

Le minimum :

- le **texte** de l'article, en français (ou en anglais), brut ou en Markdown ; le post LinkedIn suffit comme point de
  départ, Claude le développe en article complet si Kévin le demande ;
- les **sources** de chaque chiffre : titre du texte ou du rapport, lien, article et page si possible ;
- le **thème** (voir la liste au point 4), s'il n'est pas évident.

En option : les images (graphiques, photos) avec leur légende et leur source ; une couverture prête (1200 x 630 px),
sinon Claude en génère une ; l'article à mettre « à la une » ; la date de publication si elle n'est pas le jour même.

Claude écrit la version anglaise (anglais britannique naturel, jamais du mot à mot, typographie anglaise : `4%`,
`250,000 F`, pas d'espace avant les deux-points) sauf si Kévin dit de ne publier qu'en français. Une seule langue
est possible : la page de l'article existe alors dans cette langue seulement.

## 2. Où vont les fichiers

```
src/content/articles/fr/<slug>.md       l'article en français     -> /articles/<slug>
src/content/articles/en/<slug>.md       l'article en anglais      -> /en/articles/<slug>
src/assets/articles/<cle>/cover-fr.png  couverture française (1200 x 630)
src/assets/articles/<cle>/cover-en.png  couverture anglaise (ou une seule cover.png commune)
src/assets/articles/<cle>/...           images du corps de l'article
src/content/authors/<id>.json           les auteurs (kevin.json existe déjà)
```

- Le **nom du fichier est l'adresse** : minuscules, chiffres et tirets, sans accent (`smig-afrique-ouest-2026`). Le slug
  français et le slug anglais peuvent différer (`smig-togo-2026` et `togo-minimum-wage-2026`).
- `<cle>` est la `translationKey` de l'article, commune aux deux langues.
- `.mdx` est possible si l'article a besoin d'un composant ; le Markdown simple suffit presque toujours.
- Un fichier dont le nom commence par `_` est ignoré (brouillon de travail).

## 3. L'en-tête (front matter)

Exemple complet : `src/content/articles/fr/smig-togo-2026.md`.

```yaml
---
title: "SMIG au Togo en 2026 : ce que dit le texte"     # 10 à 110 caractères, la réponse ou la question
description: "Le SMIG togolais est de 52 500 F CFA par mois en 2026..."   # 70 à 180 caractères (Google, LinkedIn)
date: 2026-11-04                     # date de publication
updated: 2026-12-01                  # facultatif : date de la dernière mise à jour de fond
lang: fr                             # fr ou en, comme le dossier
translationKey: smig-togo-2026       # identique dans la version fr et la version en
theme: smig                          # smig, impot, comparaisons, guides ou textes
tags: [SMIG, Togo, salaire minimum]  # facultatif
author: kevin                        # facultatif, kevin par défaut (fichier src/content/authors/kevin.json)
cover: ../../../assets/articles/smig-togo-2026/cover-fr.png
coverAlt: "Ce que montre la couverture, en une phrase"   # obligatoire, 15 caractères au moins
featured: true                       # facultatif : l'article à la une de la page Articles
draft: false                         # facultatif : true = visible seulement avec npm run dev
sources:                             # au moins une source
  - title: "Arrêté n° 3790 du 31 décembre 2022 portant révision du SMIG et du SMAG"
    publisher: "Ministère du Travail"          # facultatif
    article: "art. 1"                          # facultatif
    page: 1                                    # facultatif (nombre ou texte)
    url: "https://..."
---
```

Les sources s'affichent en fin d'article et partent dans les données structurées (`citation`) que lisent Google et les
assistants IA. Pour un texte déjà archivé dans `sources/`, le lien est celui de sa transcription sur GitHub, à la page :
`https://github.com/GithAlchemist/monsalaire/blob/main/sources/text/<id>.md#page-<n>`. Un nouveau texte officiel
important mérite d'être archivé dans `sources/` (voir `sources/README.md`).

Les thèmes (liste fixe, `src/blog/themes.ts`) :

| `theme` | Français | Anglais |
|---|---|---|
| `smig` | SMIG et minimums | Minimum wages |
| `impot` | Impôt et cotisations | Tax and contributions |
| `comparaisons` | Comparaisons entre pays | Country comparisons |
| `guides` | Guides pratiques | Practical guides |
| `textes` | Actualité des textes | Legal updates |

Ajouter un thème : une entrée dans `src/blog/themes.ts` (id, nom, slug et phrase de présentation dans les deux
langues), jamais dans un article.

## 4. Écrire le corps

- **La réponse dans la première phrase** : « Au Togo, le SMIG est de 52 500 F CFA par mois en 2026. » C'est cette
  phrase que reprennent Google et les assistants.
- Des intertitres `##` (et `###` au besoin). À partir de 4 intertitres `##`, un sommaire s'affiche.
- Chaque chiffre a sa source, citée dans le texte (« arrêté 3790, article 1er ») et listée dans `sources`.
- Une section « À retenir » en fin d'article, en liste à puces, aide les lecteurs pressés et les assistants.
- Règles de la maison : jamais de tiret cadratin ni demi-cadratin, utiliser deux-points, virgule ou
  parenthèses ; le signe moins des montants est `−` ; ne jamais dire ni laisser entendre qu'Aconta fait de la paie.
- Le lien discret vers le simulateur, les sources et les articles liés s'ajoutent tout seuls en fin de page.

**Tableaux** : en Markdown, colonne de montants alignée à droite avec `---:`. Ils sont lisibles par les moteurs et
les assistants, et défilent sur téléphone.

```markdown
| Ligne du bulletin | Montant |
|---|---:|
| Salaire brut | 52 500 F |
```

**Graphique en barres** : en HTML dans le Markdown, les chiffres restent du texte. `--v` est la longueur de la barre
(en % de la plus grande valeur du graphique) ; classes `alt` (or) et `alt2` (gris) pour varier les couleurs.

```html
<figure class="chart">
  <div class="bars" role="img" aria-label="Ce que montre le graphique, chiffres compris.">
    <div class="bar" style="--v: 100%"><span>Togo</span><b>52 500 F</b></div>
    <div class="bar alt" style="--v: 72%"><span>Bénin</span><b>52 000 F</b></div>
  </div>
  <figcaption>Légende du graphique. Source : ...</figcaption>
</figure>
```

## 5. Les images

Règles (celles marquées ✔ sont vérifiées à la construction : un article qui ne les respecte pas fait échouer
`npm run build` avec le fichier et la ligne) :

- ✔ **Couverture** : exactement **1200 x 630 px** (PNG ou JPEG), c'est aussi l'aperçu sur LinkedIn, WhatsApp, X.
- ✔ **Texte alternatif** obligatoire pour la couverture (`coverAlt`) et pour chaque image du corps.
- ✔ **Légende** obligatoire pour chaque image du corps, avec sa source, entre guillemets après le chemin :
  `![Ce que montre l'image](../../../assets/articles/<cle>/graphique.png "Légende. Source : INSEED, 2025.")`
  Une image seule dans son paragraphe devient une figure avec sa légende.
- Fichiers dans `src/assets/articles/<cle>/` (jamais dans `public/`) : Astro les optimise (AVIF et WebP, plusieurs
  tailles, chargement différé sauf la couverture). Envoyer des originaux nets, 1600 px de large au plus suffit.
- **Graphiques** : de préférence un tableau ou le graphique en barres HTML ci-dessus, ou un SVG avec du vrai texte.
  Une image de graphique est illisible pour Google et les assistants ; si c'en est une, mettre les chiffres dans la
  légende ou dans un tableau à côté.
- Pas de photo de personne identifiable sans son accord ; citer l'auteur de toute image qui n'est pas de nous.

**Générer une couverture** (gabarit vert, chiffre ou titre) :

```bash
node docs/brand/covers/render.mjs src/assets/articles/<cle>/cover-fr.png '{"lang":"fr","kicker":"SMIG · Togo · 2026","figure":"52 500 F","unit":"par mois","line":"Le salaire minimum garanti, en vigueur depuis le 1er janvier 2023."}'
```

Avec un titre au lieu d'un chiffre : `{"lang":"en","kicker":"...","title":"...","line":"..."}`. Le script utilise
Playwright s'il est installé, sinon Chrome (variable `CHROME` si Chrome n'est pas à l'emplacement macOS habituel) ;
il a besoin du réseau pour les polices.

## 6. Vérifier

```bash
npm test
```

```bash
npm run build
```

`npm test` vérifie les fichiers d'articles (dossier, nom, langue, tirets) ; `npm run build` applique toutes les
règles (en-tête, couverture, images, légendes) et construit le site. Puis `npm run dev` et ouvrir l'article à
`http://localhost:3150/articles/<slug>` : sur ordinateur, sur téléphone (375 px) et en thème sombre, dans les deux
langues. Vérifier aussi la page Articles, la page du thème, et que le bouton de langue mène à la traduction.

## 7. Publier

Chaque push sur `main` part en production : on ne pousse jamais directement sur `main`.

1. Créer une branche (`article/<slug>`), y committer l'article, sa traduction et ses images.
2. Ouvrir une PR vers `main` ; Vercel construit un aperçu de la PR, à relire (texte, aperçu LinkedIn).
3. Fusionner la PR : le site est en ligne quelques minutes plus tard.
4. Après publication : coller l'adresse dans le LinkedIn Post Inspector pour rafraîchir l'aperçu, puis publier le post
   LinkedIn avec le lien vers l'article.

Le sitemap, le flux RSS (`/articles/rss.xml`, `/en/articles/rss.xml`), `llms.txt`, les données structurées
(BlogPosting, auteur, éditeur Aconta, dates, citations) et les liens hreflang entre les deux langues se mettent à
jour tout seuls.

## Mettre à jour ou retirer un article

- Mise à jour de fond (nouveau chiffre, nouveau texte) : modifier le texte et mettre `updated:` à la date du jour. Ne
  jamais changer le nom du fichier d'un article publié : son adresse casserait.
- Retirer : supprimer ses fichiers et son dossier d'images. L'article d'exemple (`smig-togo-2026` /
  `togo-minimum-wage-2026`) se supprime ainsi s'il ne sert plus.

## Ajouter un auteur

Un fichier `src/content/authors/<id>.json` : `name`, `url` (sa page, qui sert aussi dans les données structurées),
`bio` en `fr` et `en`, facultativement `avatar` (image carrée de 160 px au moins, à côté du fichier) et `sameAs`
(profils LinkedIn, etc.). Puis `author: <id>` dans l'en-tête des articles concernés. La bio de Kévin est à compléter
dans `src/content/authors/kevin.json`.
