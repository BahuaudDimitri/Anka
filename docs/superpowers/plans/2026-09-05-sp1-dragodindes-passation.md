# Passation — fin de SP1 (wiki élevage dragodindes), reprise sur SP2 (socle app)

Date : 2026-09-05. **Ce document est le point d'entrée du chantier.** Lire §1, §3 et §5, puis §8
pour reprendre. Le reste sert de référence.

## 1. Où on en est

| Lot | Sujet | Décisions portées | État |
|---|---|---|---|
| Cadrage | Vision de l'outil + spec SP1 | architecture monorepo wiki embarqué, stack Electron + Vue 3 + shadcn-vue, DofusDude, coût zéro, garde-fous lint/CI | committé sur la branche |
| SP1 | Wiki élevage dragodindes : 12 fiches, digest, modèle de données | format des fiches, règles de statut, exclusion DofusDB | **livré, poussé, PR à ouvrir par le joueur** |
| SP2 | Socle app Electron | à spécifier (voir §2) | à faire |
| SP3 | Écran de suivi élevage + parcours cochable | dépend de SP1 (`modele-donnees.md`) et SP2 | à faire |
| SP4 | Analyse générale Dofus (progression, kamas) | même méthode que SP1 | à faire |

**État git déclaré** : branche `feature/dofus-progression-gains`, SHA local `2f2df3a` = distant
(`origin/feature/dofus-progression-gains`), arbre propre, 26 commits devant `main` (`03d4396`).
**PR non ouverte** au moment d'écrire : le joueur l'ouvre lui-même depuis son compte perso, lien
https://github.com/BahuaudDimitri/Anka/pull/new/feature/dofus-progression-gains ; le corps de PR
prêt est reproduit en §7.

Documents du chantier :
- `docs/superpowers/specs/2026-09-05-vision-outil-dofus-design.md` — vision ; **amendée deux fois
  après validation** : §9 garde-fous qualité (lint shadcn, CI) ajouté ; ligne SP3 amendée avec
  « parcours débutant cochable ».
- `docs/superpowers/specs/2026-09-05-sp1-recherche-dragodindes-wiki-design.md` — spec SP1.
- `docs/superpowers/plans/2026-09-05-sp1-recherche-dragodindes-wiki.md` — plan SP1, exécuté en
  entier ; **écart d'exécution** : les fiches ont été écrites en parallèle par 9 subagents Sonnet
  (le plan disait séquentiel), et les tâches 11 à 13 par le pilote.
- `wiki/CONVENTIONS.md`, `wiki/INDEX.md`, `wiki/JOURNAL.md`, `wiki/dragodindes/*.md` (12 fiches).
- `README.md`, `.gitattributes` (LF forcé).

## 2. Ce qui reste, dans l'ordre

1. **PR SP1** : ouverte par le joueur, corps en §7. Rien à faire côté session sauf si la revue
   demande des changements.
2. **Spec SP2 — socle app** (pas encore écrit). Doit couvrir, d'après la vision §5 et §9 :
   electron-vite + Vue 3 + TypeScript, Tailwind v4 + shadcn-vue, electron-builder NSIS,
   electron-updater sur GitHub Releases (repo public, pas de signature de code), stockage JSON dans
   `userData` avec export/import, rendu du wiki via `import.meta.glob('/wiki/**/*.md')` avec parsing
   du frontmatter (champs : titre, slug, statut, confiance, version_dofus, derniere_verif, sources,
   tags), profil avec serveur, notes perso par slug ; ESLint 9 flat + eslint-plugin-vue +
   typescript-eslint, Prettier, vue-tsc, Vitest, husky + lint-staged, `npm run verify` ; règles
   `vue/no-restricted-html-elements` (button, input, select, textarea, dialog, table hors
   `components/ui/`), `vue/no-restricted-class` (palette Tailwind brute interdite),
   `no-restricted-imports` ; workflows GitHub Actions PR (verify + build) et tag `v*` (release) ;
   Dependabot ; **un test qui prouve que le lint casse** sur un `<button>` natif. Brainstorm court
   (la vision fige déjà presque tout), puis spec, plan, exécution.
3. **SP3** après SP2 : lit `wiki/dragodindes/modele-donnees.md` comme contrat ; inclut le
   parcours cochable (`parcours-debutant.md`, étapes soir 1 à 7).
4. **SP4** indépendant de SP2/SP3, peut se faire en parallèle sur une autre branche.

## 3. Décisions

**Verrouillées** (ne pas rouvrir) :
- Architecture A : monorepo, wiki markdown embarqué au build, une release par mise à jour du wiki.
- Vue 3 + shadcn-vue (pas React), Electron (pas Tauri), Prettier (pas Biome, support `.vue`).
- Données locales JSON + export/import ; pas de backend ; repo public ; releases GitHub ; pas de
  certificat de signature (SmartScreen accepté).
- **DofusDB exclu même en lecture** (licence NCPUL-AI 1.0 : interdit code IA > 50 % et exposition
  à des agents IA). Source statique = DofusDude `api.dofusdu.de` (GPL-3.0, gratuit).
- Format de fiche : en-tête YAML 8 champs, 5 sections fixes dans l'ordre, `valide` = 2 sources
  concordantes datées 2025+ Dofus 3 (une source antérieure au 27/02/2026 décrit l'ancien système
  et ne compte pas), jamais de suppression, `slug` = nom de fichier.
- Le statut de `astuce-parchemins` reste `hypothese` jusqu'à vérification en jeu par le joueur,
  même avec des sources concordantes (demande explicite).
- SP3 inclut un écran de parcours cochable (demande joueur du 2026-09-05).

**Ouvertes** (ne tranche pas à la place du joueur) :
- Compte GitHub pour les opérations `gh` : remote perso `BahuaudDimitri/Anka` via alias SSH
  `github-perso`, mais `gh` authentifié sur le compte pro `dimitri-allovoisins`. Le push SSH
  marche ; `gh pr create` / `gh pr list` ne voient pas le repo. Le joueur a choisi d'ouvrir la PR
  lui-même. Pour SP2 (releases, Actions), il faudra soit `gh auth login` sur le compte perso,
  soit tout piloter depuis l'UI GitHub. **À lui de choisir.**
- Serveur de jeu : le joueur n'a pas nommé son serveur (multi-compte, un seul perso). Le profil
  de l'app le demandera.
- Six jauges d'enclos et « 2 jauges actives au plus » : lu sur une infographie, à confirmer en
  jeu avant d'en faire une contrainte dure dans l'écran SP3.

## 4. UNVERIFIED

- **Commit `715ce5a` (infographie des jauges d'enclos)** : relu par le pilote sur l'image
  `tuto3i48jauges_orig.png` du Guide de l'éleveur, mais **pas repassé par le subagent
  vérificateur** (le cap de 2 passes était atteint ; un complément lui a été envoyé, sans réponse
  au moment de la coupure). Quatre fiches touchées : objets, jauges, parcours, modele-donnees.
- **Tout ce qui est marqué « à confirmer en jeu »** dans les « À challenger » : débit +10/10 s au
  palier Extrait, taux Génétons → parchemins chez Eugène Éton, emplacement de l'HDV des montures,
  capacité de l'étable (250), palier d'enclos 40 niveaux, prix post-3.5 (aucun trouvé).
- **Rentabilité** : aucune source post-3.5 chiffrée ; 4 fils du forum officiel Dofus en 403
  (dont « Élevage : plus on y passe du temps, plus on perd des kamas »). Un humain avec un
  navigateur peut les ouvrir : meilleure piste pour faire évoluer la fiche.
- **Aucun test automatisé** : SP1 est zéro code par spec. Les contrôles sont des boucles grep
  (§7) lancées à la main.

## 5. Les pièges de CE chantier

**Faux verts / sources trompeuses**
- **Guides Dofus 3 datés 2026 qui décrivent l'ancien système.** dofastuces.fr (13/06/2026) et
  gambin.co (14/02/2026) se présentent comme Dofus 3 mais décrivent le système pré-3.5 (jauges à
  10 000, gestation, objets d'élevage). Mode de panne : un subagent les compte comme sources
  concordantes 2026 et valide une mécanique morte. Règle appliquée : toute source antérieure au
  27/02/2026 ou qui parle de gestation / d'énergie / d'objets d'élevage physiques = pré-3.5.
- **Les briefs de recherche eux-mêmes portaient des prémisses fausses** (« cinq jauges dont
  l'énergie », « la sérénité détermine le sexe du bébé », « capacités négatives »). Les subagents
  ont bien signalé « prémisse non confirmée » au lieu de la satisfaire ; garder cette consigne
  (« n'invente aucun chiffre de mémoire, dis si tu ne trouves rien »).
- **WebFetch ne lit pas les images.** Le Guide de l'éleveur 2026 porte l'essentiel de sa
  mécanique dans ~60 captures et infographies ; la lecture texte avait laissé un doute que
  l'image `tuto3i48jauges_orig.png` tranche. Méthode : `curl` la page, extraire les `src` des
  `<img>`, télécharger dans le scratchpad, lire avec l'outil Read.
- **Une ligne « Chiffres » peut citer une source qui ne le dit pas** (niveau 60 attribué au Guide
  de l'éleveur, qui ne le mentionne pas ; « nom confirmé par l'API DofusDude » que l'API ne
  renvoie pas). Seul le vérificateur qui rouvre chaque URL l'attrape.

**Pièges de harnais**
- **`git add wiki/` pendant que des subagents écrivent dans le dossier** a committé 4 fiches non
  relues. Corrigé par `reset --soft`. Règle : chemins explicites uniquement tant qu'un agent
  écrit dans l'arbre.
- **Les alertes envoyées aux subagents arrivent après leur fin** : ils étaient tous idle quand
  l'alerte 3.5 est partie ; l'envoi les a réveillés et ils ont révisé leurs fiches **après** mon
  premier commit. Toujours faire `git status` / `git diff` avant d'indexer, et relire les diffs
  des fiches déjà committées.
- **Les rapports de subagents arrivent par lots et en désordre** (une réponse à la première
  alerte peut arriver après l'envoi de la seconde). Vérifier l'état du fichier sur disque plutôt
  que de se fier au dernier rapport.
- **Cap de 2 passes de vérification** : un commit tardif (infographie) est resté hors passe. Si
  une découverte arrive après la passe 2, la marquer UNVERIFIED plutôt que relancer.

**Environnement et outillage**
- Heredoc bash long qui casse : piège permanent, en mémoire
  (`outillage-heredoc-bash-windows`). Écrire via l'outil Write puis exécuter.
- `gh` sur le mauvais compte (voir §3 ouvertes).
- `rtk grep` tombe en passthrough (`rg` absent du PATH) : utiliser `grep` ou l'outil Grep.
- Warnings CRLF à chaque commit avant `.gitattributes` : réglé (`* text=auto eol=lf`).
- 403 systématiques sur forum.dofus.com, dafous.app, jeuxvideo.com via WebFetch : ne pas
  insister, les lister comme non citables.

## 6. Ce qui a bien marché, à refaire

- **Un subagent Sonnet par fiche, en parallèle, qui n'écrit que son fichier, sans git ni INDEX** ;
  le pilote relit, indexe et committe. 9 fiches en ~15 min. Conditions : un prompt par fiche avec
  requêtes exactes, prompt WebFetch imposé, règles de statut dures, autocontrôle grep à la fin,
  rapport structuré (sources ouvertes / rejetées, divergences).
- **Relecture du pilote ciblée sur les affirmations lourdes** (un WebFetch sur la source
  primaire avec 5 ou 6 questions groupées) plutôt que relecture intégrale : a confirmé
  reproduction unique, naissance immédiate, Génétons, Makinas en un appel.
- **Vérificateur adversarial `cc-forge:verificateur` sans la narration des rédacteurs**, qui
  rouvre chaque URL citée : a trouvé 1 CONTREDIT, 2 NON-SOURCÉ et 3 incohérences inter-fiches
  que 9 rédacteurs et le pilote avaient laissés passer. Le renvoyer sur un diff précis pour la
  passe 2 (même agent, contexte conservé) coûte peu.
- **Refuser une fiche avec la liste des faits établis** (rentabilité) plutôt que la corriger
  soi-même : la seconde version était honnête (modèle de coût à inconnues nommées).
- **Le journal `JOURNAL.md` à chaque changement de statut, avec la raison** : c'est lui qui
  permet à cette passation d'être courte.

## 7. Table claim | preuve | commande

| Claim | Preuve | Commande |
|---|---|---|
| 12 fiches au format | 0 ligne MANQUE sur les 8 clés et 5 sections | boucle grep du plan SP1, § « Contrôle de format » |
| INDEX = fichiers | `fiches=12 index=12 OK` | `ls wiki/dragodindes/*.md \| wc -l` ; `grep -c '^\| .* \| .* \| .* \| .* \| 20' wiki/INDEX.md` |
| Zéro dofusdb.fr | `dofusdb absent: OK` | `grep -rl dofusdb.fr wiki/ --exclude=CONVENTIONS.md` |
| Sources vérifiées | passe 1 : ~27 URL rouvertes, 6 défauts corrigés (`248ed60`, `b51ca6c`) ; passe 2 : tout OK | rapports du subagent `verif-wiki-sp1` (conversation SP1) |
| Commit infographie | lu par le pilote, image `tuto3i48jauges_orig.png` | **UNVERIFIED** par subagent et en jeu |
| Digest lisible en 5 min | 1 017 mots | `wc -w wiki/dragodindes/digest-debutant.md` |
| Local = distant | `2f2df3a` des deux côtés, arbre propre | `git rev-parse HEAD @{push}; git status --porcelain` |
| PR ouverte | **UNVERIFIED** : `gh pr list` vide, compte pro sans accès ; le joueur l'ouvre | https://github.com/BahuaudDimitri/Anka/pull/new/feature/dofus-progression-gains |
| Refonte 3.5 le 28/02/2026 | « Mis en ligne le 28/02/2026 » | WebFetch dofuspourlesnoobs.com/mise-a-jour-305.html |
| Reproduction unique, naissance immédiate, Génétons 1→250, certificats supprimés | citations textuelles | WebFetch dofuspourlesnoobs.com/guide-de-l-eleveur.html |

Compte d'échecs de référence : sans objet (pas de suite de tests en SP1).

Corps de PR prêt (à coller par le joueur) : voir le dernier message de la session SP1, ou
reconstruire depuis cette table et `wiki/INDEX.md`.

## 8. Par où reprendre

```bash
cd C:/Users/DimitriBahuaud/Documents/Anka
git fetch origin
git log --oneline origin/main -1                       # SP1 mergée ? sinon la PR est encore ouverte
git worktree list                                      # la worktree feature-dofus-progression-gains existe encore
# Nouvelle branche pour SP2, depuis main si SP1 est mergée, sinon depuis feature/dofus-progression-gains
git worktree add .wt/feature-sp2-socle-app -b feature/sp2-socle-app origin/main
```

Puis, avant de coder : relire `docs/superpowers/specs/2026-09-05-vision-outil-dofus-design.md`
**en entier, y compris §9** (ajouté après validation), et vérifier que la stack n'a pas bougé
(versions courantes d'electron-vite, shadcn-vue, Tailwind v4). Brainstorm court pour SP2, spec,
plan, puis exécution par subagents.

Après SP2 : SP3 (écran de suivi + parcours cochable) avec `wiki/dragodindes/modele-donnees.md`
comme contrat ; SP4 en parallèle possible.
