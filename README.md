# Anka

Outil compagnon personnel pour Dofus 3 : une base de connaissance en markdown (le « wiki ») et,
à venir, une application Windows qui la rend et propose des écrans de suivi (élevage de
dragodindes, prix observés, progression).

Le cadrage complet est dans `docs/superpowers/specs/2026-09-05-vision-outil-dofus-design.md`.

## Le wiki

`wiki/` contient des fiches en français, une par mécanique du jeu, avec pour chacune ses sources
datées, son statut (`hypothese`, `valide`, `obsolete`) et son niveau de confiance. Le format et les
règles sont dans `wiki/CONVENTIONS.md`, la table des fiches dans `wiki/INDEX.md`, l'historique des
statuts dans `wiki/JOURNAL.md`.

Premier module : l'élevage de dragodindes, dans `wiki/dragodindes/`. Commencer par
`digest-debutant.md`.

## Sources de données

Les données statiques du jeu (objets, montures, recettes) viennent de l'API communautaire
[DofusDude](https://docs.dofusdu.de/) (`api.dofusdu.de`, code sous GPL-3.0). Les mécaniques
d'élevage viennent de guides communautaires cités dans chaque fiche. Aucune donnée n'est extraite du
client du jeu ni de l'hôtel de vente : les prix sont saisis à la main par le joueur.

Dofus est une marque d'Ankama. Ce projet n'est pas affilié à Ankama.

## Licence

MIT, voir `LICENSE`.
