# SP1 : recherche sur l'élevage de dragodindes et format du wiki

Date : 2026-09-05
Cadre : `2026-09-05-vision-outil-dofus-design.md`
Statut : validé en brainstorm.

## 1. Objectif

Produire la première tranche de la base de connaissance : tout ce qu'un joueur débutant en élevage
doit savoir pour décider s'il se lance, puis pour se lancer. Zéro code. Ce sous-projet fixe aussi
le format des fiches que tous les modules suivants réutiliseront, et produit le modèle de données
dont l'écran de suivi (SP3) a besoin.

## 2. Format d'une fiche (`wiki/CONVENTIONS.md`)

Une fiche est un fichier markdown en français, nommé en kebab-case, avec un en-tête YAML et des
sections fixes dans cet ordre.

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

Règles :

- `slug` est le nom du fichier sans extension ; les notes perso de l'app s'y rattachent.
- `statut: valide` exige **deux sources concordantes** datées Dofus 3 (2025 ou plus récent), ou une
  confirmation terrain du joueur consignée dans `JOURNAL.md`. Sinon `hypothese`.
- `confiance` reflète la qualité des sources : `haute` = sources officielles ou recoupées trois
  fois ; `moyenne` = deux guides communautaires concordants ; `basse` = une seule source ou
  sources en désaccord.
- Toute valeur numérique dans « Chiffres » cite sa source. Un chiffre sans source n'entre pas.
- On ne supprime jamais une fiche. Une fiche dépassée passe en `obsolete` avec la raison dans
  `JOURNAL.md`.
- `INDEX.md` liste toutes les fiches avec titre, slug, statut, confiance et `derniere_verif`. Il
  est mis à jour à chaque création ou changement de statut.
- `JOURNAL.md` reçoit une ligne datée par changement de statut : `2026-09-05 · generations ·
  hypothese → valide · raison`.

## 3. Questions auxquelles le wiki doit répondre

### Axe A : mécanique de l'élevage
- Où élever : enclos publics et privés, étable, coût et accès.
- Les objets d'élevage : familles, rôle de chacun, ce qu'ils font aux jauges, usure.
- Les jauges : maturité, énergie, amour, endurance, sérénité. Ce qu'elles font, comment elles
  montent et descendent, les seuils qui comptent.
- Reproduction : fécondité, gestation, conditions pour accoupler, nombre de portées.
- Générations et couleurs : la logique d'obtention des générations supérieures, l'arbre
  généalogique, les couleurs pures et bicolores.
- Capacités : ce qu'elles sont, comment elles se transmettent, lesquelles ont de la valeur.
- Certificats et HDV des montures : comment stocker, transporter, vendre.

### Axe B : l'astuce « dragodindes contre parchemins »
Traitée comme une hypothèse. Le wiki doit dire : cette mécanique existe-t-elle réellement en
Dofus 3, comment fonctionne-t-elle exactement, quel est le chemin complet de la dragodinde au
kama, est-ce rentable aujourd'hui pour un joueur avec peu de temps. Si l'astuce s'avère fausse
ou dépassée, la fiche le dit et propose la mécanique réelle la plus proche.

### Axe C : rentabilité en contexte
Contexte fixé : serveur multi-compte, un seul personnage, sessions courtes.
- Coût de démarrage (enclos, objets d'élevage, premières montures).
- Temps réel investi par session et cadence minimale pour que ça marche.
- Kamas espérés par semaine, fourchette basse et haute, avec la méthode d'estimation.
- Ce qui plombe la rentabilité en multi-compte (concurrence, prix bas).
- Alternatives si l'élevage n'est pas adapté au profil.

### Axe D : parcours débutant
Une fiche « par quoi commencer demain soir », pas à pas, avec les prérequis (niveau, kamas,
quêtes éventuelles) et le premier objectif atteignable en une semaine.

### Axe E : modèle de données pour l'écran de suivi
Un document `wiki/dragodindes/modele-donnees.md` qui liste, pour une dragodinde, tout ce que le
joueur doit pouvoir saisir ou suivre : identité (nom, couleur, génération, sexe, niveau), les
cinq jauges avec leurs bornes, état (enclos, étable, certificat, en gestation), reproductions
restantes, capacités, objectif visé. Pour chaque attribut : type, bornes, unité, obligatoire ou
non, et la fiche du wiki qui l'explique. Ce document est l'entrée de SP3.

## 4. Sources et méthode

- Priorité aux guides et vidéos datés 2025-2026 portant explicitement sur Dofus 3. Un guide
  Dofus 2 n'alimente qu'une `hypothese`, jamais un `valide`.
- Sources acceptées : forum et site officiels Ankama, guides communautaires (JeuxOnline,
  Dofus pour les Noobs et équivalents), Reddit, transcriptions de vidéos. DofusDude pour les
  listes d'objets et de montures.
- **DofusDB exclu**, même en lecture, par prudence sur sa licence.
- Les recherches se font en session Claude Code (recherche web et lecture de pages). Chaque page
  utilisée est citée dans `sources` avec sa date de publication quand elle est connue.
- Quand deux sources se contredisent, la fiche le dit dans « À challenger » et reste `hypothese`.

## 5. Livrables

| Fichier | Contenu |
|---|---|
| `wiki/CONVENTIONS.md` | le format et les règles de la section 2 |
| `wiki/INDEX.md` | table des fiches |
| `wiki/JOURNAL.md` | vide au départ, en-tête et format de ligne |
| `wiki/dragodindes/*.md` | six à dix fiches couvrant les axes A à D |
| `wiki/dragodindes/digest-debutant.md` | une fiche qui enchaîne les « En bref » des autres dans l'ordre de lecture d'un débutant, avec liens |
| `wiki/dragodindes/modele-donnees.md` | axe E |

## 6. Critères d'acceptation

- Chaque fiche respecte le format : en-tête complet, cinq sections présentes, aucun chiffre sans
  source.
- L'axe B a une réponse tranchée : réel ou non, et si réel, le chemin complet est décrit.
- Le digest se lit en moins de cinq minutes et un lecteur sans connaissance du jeu comprend
  quoi faire en premier.
- `modele-donnees.md` permet de dessiner l'écran SP3 sans rouvrir les autres fiches.
- `INDEX.md` est cohérent avec les fichiers présents (même nombre de lignes que de fiches).
- Le joueur a relu le digest et coché ce qu'il veut challenger : ces points sont consignés dans
  « À challenger » des fiches concernées.

## 7. Hors périmètre

- Muldos, volkornes et autres montures : mentionnés seulement si un guide les cite comme
  alternative rentable ; pas de fiche dédiée en SP1.
- Prix HDV chiffrés au kama près : on donne des ordres de grandeur sourcés, le suivi des prix
  réels arrive avec l'app.
- Tout code, y compris un script de validation du format : ce sera fait en SP2 quand l'app
  parsera les fiches.
