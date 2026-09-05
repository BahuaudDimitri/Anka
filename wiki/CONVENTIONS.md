# Conventions du wiki

Ce wiki est lu par un joueur et par un LLM. Chaque fiche doit être compréhensible seule.
Langue : français. Nom de fichier : kebab-case, identique au `slug`.

## Gabarit d'une fiche

```markdown
---
titre: Générations de dragodindes
slug: generations
statut: hypothese          # hypothese | valide | obsolete
confiance: moyenne          # haute | moyenne | basse
version_dofus: "3.x"
derniere_verif: 2026-09-05
sources:
  - url: https://exemple.fr/guide
    titre: Guide élevage Dofus 3
    date: 2025-11
tags: [dragodinde, elevage]
---

## En bref
Trois à six phrases qu'un débutant lit en moins d'une minute. Pas de jargon non expliqué.

## Détails
Le fonctionnement complet, structuré en sous-titres.

## Pièges fréquents
Liste des erreurs que font les débutants, une ligne chacune.

## Chiffres
Tableau des valeurs numériques (durées, coûts, seuils). Chaque ligne cite sa source par son titre.

## À challenger
Ce dont le rédacteur doute, ou ce que seul le terrain peut confirmer. Vide si rien.
```

Les cinq sections sont obligatoires, dans cet ordre, avec ces titres exacts.

## Règles

- `slug` est le nom du fichier sans extension ; les notes perso de l'app s'y rattachent.
- `statut: valide` exige **deux sources concordantes** datées Dofus 3 (2025 ou plus récent), ou une
  confirmation terrain du joueur consignée dans `JOURNAL.md`. Sinon `hypothese`.
- `confiance` reflète la qualité des sources : `haute` = sources officielles ou recoupées trois
  fois ; `moyenne` = deux guides communautaires concordants ; `basse` = une seule source ou
  sources en désaccord.
- Toute valeur numérique dans « Chiffres » cite sa source. Un chiffre sans source n'entre pas.
- On ne supprime jamais une fiche. Une fiche dépassée passe en `obsolete` avec la raison dans
  `JOURNAL.md`.
- Un guide Dofus 2 ou Dofus Retro n'alimente qu'une `hypothese`, jamais un `valide`.
- Quand deux sources se contredisent, la fiche le dit dans « À challenger » et reste `hypothese`.
- Source interdite : tout domaine `dofusdb.fr` (licence incompatible avec ce projet).
- `INDEX.md` liste toutes les fiches avec titre, slug, statut, confiance et `derniere_verif`. Il
  est mis à jour à chaque création ou changement de statut.
- `JOURNAL.md` reçoit une ligne datée par changement de statut :
  `2026-09-05 · generations · hypothese → valide · raison`.
