---
titre: Objets d'élevage
slug: objets-d-elevage
statut: valide
confiance: haute
version_dofus: "3.x"
derniere_verif: 2026-09-05
sources:
  - url: https://www.next-stage.fr/2026/04/tuto-elevage-dragodinde-dofus-guide-complet-a-z.html
    titre: Tuto élevage de dragodinde sur Dofus - guide complet de A à Z
    date: 2026-04
  - url: https://www.dofuspourlesnoobs.com/guide-de-l-eleveur.html
    titre: Guide de l'éleveur (édition 2026)
    date: 2026-03
  - url: https://dofuselevage.fr/guide
    titre: Guide — Refonte de l'élevage
    date: 2026
  - url: https://guidactik.com/dofus/guide-complet-de-lelevage-sur-dofus-3/
    titre: Guide complet de l'élevage sur DOFUS 3
    date: 2026-03
  - url: https://api.dofusdu.de/dofus3/v1/fr/items/resources/search?query=élevage
    titre: DofusDude API - recherche d'items ressources (carburants d'enclos)
    date: 2026-09
  - url: https://wiki-dofus.eu/w/Objets_pour_enclos
    titre: Objets pour enclos - Wiki Dofus
    date: 2010-08
tags: [dragodinde, elevage, objets]
---

## En bref
Depuis la mise à jour 3.5 de Dofus, il n'existe plus d'« objets d'élevage » classiques (abreuvoir,
mangeoire, baffeur, caresseur, dragofesse, foudroyeur) que l'on pose un par un sur une monture. Ils
ont été remplacés par des **carburants d'enclos** : ce sont des objets qui remplissent les jauges de
l'enclos entier (maturité, sérénité, endurance, amour, expérience) au fil du temps, jusqu'à
épuisement de leur durabilité. Les six familles historiques existent toujours par leur nom, mais
sous forme de carburant à choisir en taille (Minuscule à Gigantesque, qui fixe la durabilité) et en
palier (Extrait à Élixir, qui fixe le niveau requis et la vitesse de remplissage). Les anciens objets
d'élevage encore en inventaire au moment du passage à la 3.5 ont été convertis automatiquement en
poussière d'élevage. On achète les carburants en hôtel de vente, on les fabrique via le métier
Éleveur, ou on échange de la poussière d'élevage contre les versions Gigantesques chez un PNJ dédié.

## Détails

### Le changement de système en 3.5
Deux sources concordantes et datées de 2026 confirment la suppression des objets d'élevage
traditionnels : le guide de dofuspourlesnoobs.com indique que « les objets d'élevage, les potions
d'expérience de monture, les potions d'enclos de guildes et les filets de capture sont supprimés »,
et dofuselevage.fr confirme que « les anciens objets d'élevage seront automatiquement convertis en
Poussière d'enclos » et que « les objets d'élevage sont remplacés par des carburants d'enclos ». Le
site next-stage.fr, à jour d'avril 2026, décrit le même mécanisme de conversion des objets restants
en poussière d'élevage. L'API DofusDude, interrogée sur le mot « élevage », renvoie la « Poussière
d'élevage » et des prototypes de carburants, mais pas de type d'objet nommé « Carburant d'enclos » :
ce nom est celui des guides, pas un libellé confirmé par l'API.

### Mangeoire (jauge d'expérience)
Fait monter la jauge d'**expérience** de l'enclos ; remplace l'ancienne mécanique d'énergie,
supprimée avec la refonte (dofuspourlesnoobs.com). Se décline en carburants « Extrait/Philtre/
Potion/Élixir de Mangeoire », chacun en cinq tailles (Minuscule à Gigantesque). S'achète en hôtel de
vente ou se fabrique via le métier Éleveur ; seule la version Gigantesque est vendue par le PNJ
Adèle Vage contre de la poussière d'élevage. L'usure suit la durabilité de la taille choisie (1 000
à 5 000 selon next-stage.fr et dofuspourlesnoobs.com) : une fois épuisée, le carburant disparaît et
doit être remplacé.

### Abreuvoir (jauge de maturité)
Fait monter la **maturité** ; d'après le wiki-dofus.eu (page datée de 2010, donc antérieure à la
3.5 et à prendre comme repère historique seulement), l'abreuvoir n'agissait « que si votre dragodinde
est dans l'état équilibré », c'est-à-dire une sérénité proche du centre. Le guide
dofuspourlesnoobs.com reprend cette logique pour le carburant actuel, l'associant à une « sérénité
moyenne ». Mêmes tailles, mêmes paliers (Extrait à Élixir) et mêmes canaux d'achat/fabrication que
la mangeoire.

### Baffeur (jauge de sérénité, sens négatif)
Fait baisser la jauge de **sérénité** vers l'agressivité. Dans l'ancien système, le wiki-dofus.eu
notait qu'il s'utilisait quand la dragodinde était « trop sereine ». dofuspourlesnoobs.com confirme
que le carburant Baffeur actuel a la même fonction d'orientation de la sérénité. Mêmes tailles,
mêmes paliers, mêmes canaux d'obtention que les autres carburants.

### Caresseur (jauge de sérénité, sens positif)
Fait monter la jauge de **sérénité** vers l'amour/la douceur, à l'inverse du baffeur. Le wiki-dofus.eu
(2010) le décrivait comme rendant la monture « moins agressive » si elle l'était trop ; le mécanisme
d'orientation de sérénité est repris tel quel dans le carburant Caresseur de la 3.5 selon
dofuspourlesnoobs.com.

### Foudroyeur (jauge d'endurance)
Fait monter l'**endurance**, mais seulement quand la sérénité de l'enclos est négative (état
agressif), d'après dofuspourlesnoobs.com. Mêmes tailles et paliers que les autres carburants.

### Dragofesse (jauge d'amour)
Fait monter la jauge d'**amour**, réservée aux enclos en sérénité positive (dofuspourlesnoobs.com).
Mêmes tailles et paliers.

### Autres objets liés à l'élevage (introduits en 3.5)
guidactik.com (guide daté du 3 mars 2026) décrit trois objets distincts des carburants, utilisés lors
de l'accouplement plutôt que sur les jauges d'enclos : la **Kromakina**, qui permet d'appliquer la
capacité « Caméléon(e) » aux enfants ; l'**Animakina**, qui permet d'appliquer une capacité spéciale
aléatoire aux enfants et facilite le gain de points dans les jauges ; et l'**Optimakina**, qui
augmente de 10 % la chance qu'un enfant naisse d'une génération supérieure. Cette source ne précise
ni prix, ni durabilité, ni lieu d'obtention pour ces trois objets.

## Pièges fréquents
- Chercher à acheter un « abreuvoir » ou un « baffeur » comme objet unique posé sur une monture :
  ce système a disparu en 3.5, remplacé par les carburants d'enclos.
- Confondre la **taille** du carburant (Minuscule à Gigantesque, qui fixe sa durabilité) avec son
  **palier** (Extrait à Élixir, qui fixe le niveau requis et le plafond de remplissage de jauge).
- Utiliser un Extrait en pensant remplir la jauge à 100 % : un Extrait ne monte la jauge que
  jusqu'à 40 % selon dofuspourlesnoobs.com, il faut un Élixir pour atteindre le maximum.
- Utiliser Dragofesse ou Foudroyeur sans vérifier le signe de la sérénité de l'enclos : ces deux
  carburants exigent respectivement une sérénité positive et négative.
- Croire que toutes les tailles de carburant s'achètent au même PNJ : seule la version Gigantesque
  est vendue par Adèle Vage contre poussière d'élevage ; les autres tailles passent par l'artisanat
  (métier Éleveur) ou l'hôtel de vente.

## Chiffres

Lecture de l'infographie des jauges d'enclos du Guide de l'éleveur (édition 2026) : l'enclos a six jauges
sur 100 000, une par famille de carburant. Le palier du carburant fixe jusqu'où monte la jauge d'enclos
(Extrait 40 000, Philtre 70 000, Potion 90 000, Élixir 100 000), et la hauteur de la jauge d'enclos fixe
le débit vers la monture : +10 points toutes les 10 secondes entre 0 et 40 000, +20 entre 40 000 et
70 000, +30 entre 70 000 et 90 000, +40 au-dessus. Un Extrait suffit donc à remplir une jauge de monture
(20 000), environ quatre fois moins vite qu'un Élixir si celui-ci tient son palier maximal en
continu (déduction du rédacteur à partir des débits, pas une lecture directe). L'infographie affiche « 0/2 jauges activées » : deux
jauges d'enclos actives au plus en même temps.

| Objet / mesure | Jauge concernée | Effet / valeur | Durabilité | Source |
|---|---|---|---|---|
| Taille Minuscule (tous carburants) | — | — | 1 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Taille Petit | — | — | 2 000 | Guide de l'éleveur (édition 2026) ; Guide — Refonte de l'élevage |
| Taille Normal/Standard | — | — | 3 000 | Guide de l'éleveur (édition 2026) ; Guide — Refonte de l'élevage |
| Taille Grand | — | — | 4 000 | Guide de l'éleveur (édition 2026) ; Guide — Refonte de l'élevage |
| Taille Gigantesque | — | — | 5 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Palier Extrait | la jauge d'enclos de sa famille (six jauges d'enclos sur 100 000, une par famille) | remplit la jauge jusqu'à 40 % ; niveau 5 (taille Minuscule) à 45 (Gigantesque) | — | Guide de l'éleveur (édition 2026) ; DofusDude API - recherche d'items ressources |
| Palier Philtre | la jauge d'enclos de sa famille (six jauges d'enclos sur 100 000, une par famille) | remplit la jauge jusqu'à 70 % ; niveau 55 (Minuscule) à 95 (Gigantesque) | — | Guide de l'éleveur (édition 2026) ; DofusDude API - recherche d'items ressources |
| Palier Potion | la jauge d'enclos de sa famille (six jauges d'enclos sur 100 000, une par famille) | remplit la jauge jusqu'à 90 % ; niveau 105 (Minuscule) à 145 (Gigantesque) | — | Guide de l'éleveur (édition 2026) ; DofusDude API - recherche d'items ressources |
| Palier Élixir | la jauge d'enclos de sa famille (six jauges d'enclos sur 100 000, une par famille) | remplit la jauge jusqu'à 100 % ; niveau 155 (Minuscule) à 195 (Gigantesque) | — | Guide de l'éleveur (édition 2026) ; DofusDude API - recherche d'items ressources |
| Débit palier 1 (jauge d'enclos entre 0 et 40 000) | toutes | consomme 10 de carburant, la monture gagne 10 dans la jauge, toutes les 10 secondes | — | Guide de l'éleveur (édition 2026), texte et infographie |
| Débit palier 4 (jauge d'enclos entre 90 000 et 100 000) | toutes | consomme 40 de carburant, la monture gagne 40 dans la jauge, toutes les 10 secondes | — | Guide de l'éleveur (édition 2026), texte et infographie |
| Conversion des anciens objets | — | 0,55 poussière d'élevage par point de durabilité restante (arrondi au supérieur) | — | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Prix Gigantesque Extrait chez Adèle Vage | — | 50 poussière d'élevage | 5 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Prix Gigantesque Philtre chez Adèle Vage | — | 200 poussière d'élevage | 5 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Prix Gigantesque Potion chez Adèle Vage | — | 800 poussière d'élevage | 5 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Prix Gigantesque Élixir chez Adèle Vage | — | 3 200 poussière d'élevage | 5 000 | Tuto élevage de dragodinde sur Dofus - guide complet de A à Z ; Guide de l'éleveur (édition 2026) |
| Bonus Optimakina | — | +10 % de chance que l'enfant soit d'une génération supérieure | — | Guide complet de l'élevage sur DOFUS 3 |

## À challenger
- Les plafonds par palier portent sur les jauges d'enclos, pas sur celles de la monture : lu sur
  l'infographie du Guide de l'éleveur (édition 2026), pas dans son texte. Une seule source, à
  confirmer en jeu, ainsi que la limite de deux jauges d'enclos actives à la fois.
- Les valeurs de consommation par tick (10/20/30/40 toutes les 10 secondes selon le tier) ne
  viennent que d'une seule source ouverte (Guide de l'éleveur, édition 2026) : pas de deuxième page
  qui les recoupe explicitement avec les mêmes chiffres, même si les plafonds de jauge par palier
  (40/70/90/100 %) sont corroborés indépendamment par Guide — Refonte de l'élevage. À vérifier en
  jeu si possible.
- Guide — Refonte de l'élevage ne porte pas de date de publication affichée ; sa contemporanéité
  avec la 3.5 est déduite de son contenu (identique aux deux autres sources datées), pas d'un
  horodatage lu sur la page.
- Les seuils numériques précis de sérénité qui autorisaient chaque objet dans l'ancien système
  (ex. plage négative/positive exacte) ne sont documentés que par une page wiki-dofus.eu datée de
  2010 (Dofus 2/Retro) : ils ne sont pas repris dans « Chiffres » car non confirmés pour la 3.5, et
  la logique qualitative (sérénité positive/négative/moyenne) n'est reprise que telle que formulée
  par Guide de l'éleveur (édition 2026).
- Guide complet de l'élevage sur DOFUS 3 (guidactik.com) ne donne aucun prix, durabilité ni lieu
  d'obtention pour la Kromakina, l'Animakina et l'Optimakina : ces objets sont mentionnés mais
  incomplètement documentés.
- Un objet « Génétons » est apparu dans une synthèse de recherche automatique évoquant un guide
  dafous.app, mais cette page a renvoyé une erreur 403 lors de la tentative d'ouverture : son
  existence et son rôle exact n'ont pas pu être vérifiés directement et ne sont donc pas repris ici.
