---
titre: Modèle de données pour l'écran de suivi d'élevage
slug: modele-donnees
statut: hypothese
confiance: moyenne
version_dofus: "3.5"
derniere_verif: 2026-09-05
sources:
  - url: https://www.dofuspourlesnoobs.com/guide-de-l-eleveur.html
    titre: Guide de l'éleveur (édition 2026)
    date: 2026-02-27
  - url: https://www.next-stage.fr/2026/04/tuto-elevage-dragodinde-dofus-guide-complet-a-z.html
    titre: Tuto élevage de dragodinde sur Dofus - guide complet de A à Z
    date: 2026-04
  - url: https://guidactik.com/dofus/guide-complet-de-lelevage-sur-dofus-3/
    titre: Guide complet de l'élevage sur DOFUS 3
    date: 2026-03
  - url: https://www.dofuspourlesnoobs.com/les-dragodindes.html
    titre: Les Dragodindes (Dofus pour les Noobs)
    date: 2026-02-23
tags: [dragodinde, modele, sp3]
---

## En bref
Cette fiche n'explique pas le jeu : elle liste ce que l'application devra permettre de saisir et de
suivre pour une dragodinde, avec le type, les bornes et la fiche du wiki qui justifie chaque valeur.
Elle sert de contrat entre le wiki et l'écran de suivi (sous-projet SP3). Les bornes viennent des
fiches [jauges](jauges.md), [générations et couleurs](generations-et-couleurs.md) et
[capacités](capacites.md). Le statut reste `hypothese` : c'est la construction de l'écran qui
validera que rien ne manque.

## Détails

### Objet « Dragodinde »

| Attribut | Type | Bornes / valeurs | Unité | Obligatoire | Fiche |
|---|---|---|---|---|---|
| nom | texte | 1 à 40 caractères, libre (nom donné par le joueur ou nom de la race) | — | oui | — |
| couleurs | liste de 1 ou 2 valeurs | Amande, Rousse, Dorée, Indigo, Ébène, Orchidée, Pourpre, Ivoire, Turquoise, Prune, Émeraude | — | oui | generations-et-couleurs |
| generation | entier | 1 à 10 ; impaire = monocolore, paire = bicolore (cohérence à vérifier avec `couleurs`) | — | oui | generations-et-couleurs |
| sexe | énumération | mâle, femelle | — | oui | reproduction |
| niveau | entier | 1 à 200 | niveau | non | generations-et-couleurs |
| endurance | entier | 0 à 20 000 | points | oui | jauges |
| maturite | entier | 0 à 20 000 | points | oui | jauges |
| amour | entier | 0 à 20 000 | points | oui | jauges |
| serenite | entier | -5 000 à 5 000 | points | oui | jauges |
| fecondite | énumération dérivée | fertile (au moins une jauge < 20 000), fécond(e) (les trois à 20 000), stérile (a déjà reproduit) | — | calculé | reproduction |
| etat | énumération | en enclos, en étable, en inventaire, en vente, vendue, perdue | — | oui | elevage-vue-d-ensemble, certificats-et-hdv-montures |
| reproductions_restantes | entier | 0 ou 1 (une seule reproduction possible en 3.5) | — | oui | reproduction |
| capacites | liste de 0 à 2 valeurs | Amoureuse, Endurante, Précoce, Sage, Reproducteur, Caméléone | — | non | capacites |
| objectif | énumération | monter les jauges, reproduire, vendre, garder pour lignée, extraire | — | non | parcours-debutant |
| enclos | référence | identifiant d'un enclos du joueur (voir objet « Enclos ») | — | non | elevage-vue-d-ensemble |
| parent_pere, parent_mere | référence | identifiant d'une autre dragodinde du joueur, ou vide si capturée ou achetée | — | non | generations-et-couleurs |
| date_maj | date-heure | horodatage de la dernière saisie | — | oui, automatique | — |
| notes | texte | libre | — | non | — |

Règles de cohérence que l'écran doit faire respecter :
- Si `generation` est impaire, `couleurs` compte une valeur ; si paire, deux valeurs.
- `fecondite` n'est jamais saisie : elle se déduit des trois jauges et de `reproductions_restantes`.
- Quand `reproductions_restantes` passe à 0, `fecondite` devient `stérile` quelles que soient les jauges.
- Une dragodinde `vendue` ou `perdue` sort des listes actives mais reste consultable (historique de lignée).

### Objet « Enclos »

| Attribut | Type | Bornes / valeurs | Unité | Obligatoire | Fiche |
|---|---|---|---|---|---|
| nom | texte | libre (ex. « Enclos public n°1 ») | — | oui | elevage-vue-d-ensemble |
| places | entier | 10 par enclos public d'après les guides | montures | oui | elevage-vue-d-ensemble |
| experience_enclos | entier | 0 à 100 000 | points | non | jauges |
| carburant_palier | énumération | Extrait, Philtre, Potion, Élixir | — | non | objets-d-elevage |
| carburant_famille | énumération | Mangeoire, Abreuvoir, Baffeur, Caresseur, Foudroyeur, Dragofesse | — | non | objets-d-elevage |
| carburant_taille | énumération | Minuscule, Petit, Normal, Grand, Gigantesque | — | non | objets-d-elevage |
| carburant_durabilite_restante | entier | 0 à 5 000 (borne haute selon la taille : 1 000 à 5 000) | points | non | objets-d-elevage |

### Objet « Prix observé »

Sert à construire, avec le temps, une base de prix par serveur. Rien n'est automatique : le joueur
saisit ce qu'il voit à l'hôtel de vente des créatures.

| Attribut | Type | Bornes / valeurs | Unité | Obligatoire | Fiche |
|---|---|---|---|---|---|
| sujet | énumération | dragodinde, carburant, Généton, parchemin, autre | — | oui | rentabilite-multi-compte |
| libelle | texte | ex. « Pourpre gén. 5 femelle » ou « Gigantesque Élixir de Mangeoire » | — | oui | — |
| serveur | texte | nom du serveur, pris du profil par défaut | — | oui | — |
| prix | entier | ≥ 0 | kamas | oui | — |
| date | date | jour de l'observation | — | oui | — |
| source | énumération | hôtel de vente, vente réalisée, achat réalisé, joueur | — | oui | — |

### Objet « Profil »

| Attribut | Type | Bornes / valeurs | Unité | Obligatoire | Fiche |
|---|---|---|---|---|---|
| serveur | texte | serveur principal du joueur | — | oui | — |
| niveau_metier_eleveur | entier | 1 à 200 | niveau | non | elevage-vue-d-ensemble |
| genetons | entier | ≥ 0, solde courant | Génétons | non | astuce-parchemins |
| poussiere_elevage | entier | ≥ 0, solde courant | poussière | non | objets-d-elevage |

## Pièges fréquents
- Prévoir un champ « gestation » ou « date de naissance prévue » : il n'y a plus de gestation en 3.5,
  la naissance est immédiate.
- Prévoir une jauge « énergie » sur la dragodinde : elle a été supprimée en 3.5, remplacée par
  l'expérience de l'enclos.
- Laisser saisir `fecondite` à la main : c'est une valeur dérivée, la saisie manuelle créerait des
  incohérences.
- Oublier `reproductions_restantes` : c'est la donnée qui change le plus la stratégie depuis la 3.5.
- Coder les couleurs par génération en dur dans l'écran : la table couleur/génération est encore
  mono-source (voir [générations et couleurs](generations-et-couleurs.md)), elle doit rester dans le
  wiki et être lue par l'app, pas dupliquée.

## Chiffres

| Donnée | Valeur | Source |
|---|---|---|
| Maximum de chaque jauge endurance, maturité, amour | 20 000 | Guide de l'éleveur (édition 2026) |
| Plage de sérénité | -5 000 à 5 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z |
| Maximum de l'expérience d'enclos | 100 000 | Guide de l'éleveur (édition 2026) |
| Reproductions par dragodinde | 1 | Guide de l'éleveur (édition 2026) |
| Capacités maximum par dragodinde | 2 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z |
| Places par enclos public | 10 | Guide complet de l'élevage sur DOFUS 3 |
| Durabilité d'un carburant selon la taille | 1 000 à 5 000 | Guide de l'éleveur (édition 2026) |
| Niveau minimum pour équiper une dragodinde | 60 | Les Dragodindes (Dofus pour les Noobs) |

## À challenger
- Les valeurs de `etat` sont une proposition : le jeu distingue peut-être d'autres états (par exemple
  « en cours d'extraction »). À ajuster quand le joueur aura observé l'interface du jeu.
- Le nombre de places par enclos (10) vient de deux guides mais son évolution avec le niveau du
  métier n'est pas claire (palier tous les 40 ou 50 niveaux selon la source).
- L'objet « Enclos » suppose un seul carburant actif par enclos. Si le jeu permet d'en empiler
  plusieurs, il faudra une liste.
- Le solde de Génétons et de poussière est saisi à la main : à vérifier si le joueur veut vraiment
  le suivre dans l'app ou si le jeu l'affiche assez clairement.
