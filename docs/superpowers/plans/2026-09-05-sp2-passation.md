# Passation — fin de SP2 (socle app Electron), reprise sur SP3

Date : 2026-09-05. **Ce document est le point d'entrée pour la suite.** Lire §1, §3, §5 puis §8.
Le fichier `~/.claude/passation/Anka--feature-sp2-socle-app.md` porte l'historique horodaté de la
session ; ce doc en est la mise en forme.

## 1. Où on en est

| Lot | Sujet | État |
|---|---|---|
| SP1 | Wiki élevage dragodindes (12 fiches) | mergé (PR #1) |
| SP2 | Socle app Electron : wiki embarqué, profil, export/import, thème, mise à jour auto, lint design system, CI, release | **mergé (PR #2), release v0.1.0 puis v0.1.1 publiées, mise à jour automatique constatée par le joueur** |
| SP2 fix | Publication de release par `gh release create` + contrôle des artefacts | mergé (PR #7) |
| SP2 bump | Version 0.1.1 | mergé (PR #8) |
| SP3 | Écran de suivi élevage + parcours cochable + notes perso | à faire, contrat `wiki/dragodindes/modele-donnees.md` |
| SP4 | Analyse générale Dofus (progression, kamas) | à faire, indépendant |

**État git déclaré** : `origin/main` = `12bb2c2` (merge PR #8), tags `v0.1.0` (`0c0b287`) et
`v0.1.1` (`12bb2c2`) poussés, releases publiées non brouillon avec exe + blockmap + `latest.yml`.
Branches distantes mergées conservées : `feature/dofus-progression-gains`, `feature/sp2-socle-app`,
`fix/release-upload`, `chore/v0.1.1`. Worktrees locaux : `.wt/feature-dofus-progression-gains`
(SP1, mergé, à supprimer), `.wt/feature-sp2-socle-app` (sur `chore/v0.1.1`, mergé, à supprimer
depuis une session qui n'y tourne pas). Protection de `main` active : check `verify` requis,
branche à jour exigée, force push et suppression interdits.

**PR ouvertes** : quatre PR Dependabot (#3 checkout v7, #4 setup-node v7, #5 upload-artifact v7,
#6 groupe dev npm). Non traitées : à merger une par une après CI verte, ou à fermer.

Documents : spec `docs/superpowers/specs/2026-09-05-sp2-socle-app-design.md` (annexe §11.4 =
registre de tous les écarts au plan, points 1 à 16, plus §8 amendé pour la publication) ; recherche
lint `2026-09-05-sp2-lint-rules-research.md` ; plan `docs/superpowers/plans/2026-09-05-sp2-socle-app.md`
(20 tâches, exécuté en entier ; **écarts d'exécution** : icônes `@lucide/vue` et non `lucide-vue-next`,
`v-html` sur un `div` enfant, publication de release réécrite, tâche de nettoyage ajoutée).

## 2. Ce qui reste, dans l'ordre

1. **Dependabot** : 4 PR. Les actions v7 tournent sur Node 24 (le run annonce la dépréciation de
   Node 20 pour les v4). Merger après CI verte.
2. **SP3** : brainstorm court, spec, plan. Réutiliser le socle : `JsonStore` (nouveau fichier
   `elevage.json`, `schemaVersion`, migrations), `AnkaApi` (nouveau domaine dans `StoreData` et
   dans le bundle d'export, `ExportBundleSchema` strict à étendre), page `ElevagePage.vue`
   (placeholder à remplacer), composants shadcn à ajouter par la CLI (`table`, `dialog`,
   `checkbox`, `progress`…). Contrat de données : `wiki/dragodindes/modele-donnees.md`.
3. **Icône définitive** (placeholder indigo actuellement) : tâche joueur, remplacer
   `app/resources/icon.png` (256 px minimum).
4. **SP4** en parallèle possible sur une autre branche.

## 3. Décisions

**Verrouillées** (spec SP2, ne pas rouvrir) : navigation trois volets (rail, liste, lecteur) ;
lecteur « En bref » ouvert + accordéons ; thème sombre par défaut avec interrupteur
sombre/clair/système dans `localStorage` (hors export) ; zod pour tout JSON ; `npm run verify`
gate unique, zéro warning ; toute règle ESLint désactivée est commentée **et** listée au spec
§11.4 ; `components/ui/**` généré par la CLI shadcn-vue, jamais édité à la main, exempté du
design system ; renderer sans Node (`sandbox`, `contextIsolation`, pas de `nodeIntegration`,
vérifié par lint) ; publication de release par `gh release create` avec contrôle des artefacts,
jamais par le publisher electron-builder ; `gh` via `GH_TOKEN` du compte perso sans basculer le
compte actif ; Vite 7.3 et TypeScript 5.9 tant que electron-vite 5 et typescript-eslint
n'acceptent pas Vite 8 et TS 6+.

**Ouvertes** (ne tranche pas à la place du joueur) : traitement des PR Dependabot (merger ou
fermer) ; suppression des branches distantes mergées ; icône définitive ; couverture de tests des
pages Profil et Paramètres (aucun test dédié, la release réelle en tient lieu) ; serveur de jeu du
joueur (saisi dans l'app, pas connu de la session).

## 4. UNVERIFIED

- **Pages Profil, Paramètres, thème, store updater** : aucun test unitaire dédié (vérif phase D,
  remarque). Comportement constaté à la main par le joueur sur 0.1.0 et 0.1.1 seulement.
- **Micro-course** dans `stores/updater.ts::start()` entre `onState` et `getState` : théorique,
  jamais observée.
- **Liens inter-dossiers** du rendu markdown (`kamas/xxx.md`) : testés unitairement, aucun cas
  réel dans le wiki (un seul dossier).
- **Comportement de l'updater quand Windows se ferme pendant l'installation** : doc electron-builder
  lue (electron-updater 6 n'a pas la garde de fin de session de la v7), non testé.
- **`exactOptionalPropertyTypes` retiré côté renderer** pour reka-ui : les optionnels du renderer
  sont moins stricts que main/preload/shared ; aucune régression connue.

## 5. Les pièges de CE chantier

**Faux verts**
- **Publisher electron-builder (`--publish always`)** : run vert, release créée, seul le
  `.blockmap` envoyé, « creating GitHub release » journalisé deux fois, process sorti en succès
  7 s après le début de l'upload de l'exe. Mode de panne : release inutilisable, CI verte. Remplacé
  par `gh release create` + étape de contrôle qui échoue si un artefact manque.
- **`releaseType` par défaut = `draft`** dans la config GitHub d'electron-builder (source
  `publishOptions.ts`) : une release brouillon est invisible pour electron-updater. La config
  `publish` reste dans `electron-builder.yml` parce qu'elle génère `app-update.yml`.
- **Résumé texte de `rtk`** : « Prettier: All files formatted correctly » sur une erreur ENOENT
  (exit 2). Le code de sortie est juste, le texte ment. Mémoire `outillage-rtk-resume-trompeur`.
- **`vue-tsc -b`** lancé à la main par des implémenteurs a laissé des `.tsbuildinfo` (gitignorés
  depuis) ; le script `typecheck` est bien `--noEmit -p`, à ne jamais changer.
- **`npm ci` en CI avec un npm plus récent que le local** : `Missing @emnapi/core` (peers
  optionnelles de `@napi-rs/wasm-runtime`). Régénérer le lock avec `npx -y npm@latest install`
  avant de pousser, sans toucher au npm global.

**Tests qui ne testaient rien (attrapés par les vérificateurs)**
- Test « pas de `.tmp` résiduel » aveugle à l'atomicité : corrigé par un test où la cible est un
  dossier (`rename` EPERM → `.tmp` présent), cassé par mutation puis vert.
- `v-html` posé sur `AccordionContent` fuit sur le wrapper toujours monté de reka-ui : le contenu
  fermé était visible. Le test DOM l'a attrapé ; `v-html` va sur un `div` enfant.

**Pièges de harnais**
- **Hook de sécurité local** : bloque tout Write/Edit dont le contenu contient le nom de méthode
  `RegExp#exec` suivi d'une parenthèse ouvrante, même en commentaire. On écrit `str.match(re)` ;
  les deux règles `prefer-regexp-exec` sont coupées.
- **`ELECTRON_RUN_AS_NODE=1` hérité du shell** : `electron .` tourne sous Node, `app` vaut
  `undefined`, erreur trompeuse dans electron-updater. `unset ELECTRON_RUN_AS_NODE` d'abord.
  `ELECTRON_ENABLE_LOGGING=1` et `--remote-debugging-port` permettent un smoke test avec preuve
  (script `smoke-cdp.mjs` du scratchpad : à recopier dans `app/scripts/` en SP3 si utile).
  Mémoire `outillage-electron-run-as-node`.
- **Garde-fou worktree** : `export GH_TOKEN=$(…) && gh …` refusé dans Bash. Passer par PowerShell :
  `$env:GH_TOKEN = (gh auth token --user BahuaudDimitri); gh …`. Les jq/templates avec `\(…)`
  sont mangés par PowerShell : préférer `--json` brut ou `--jq` sans interpolation de chaînes.
- **Vérificateurs et implémenteurs en parallèle** : le vérificateur audite dans un worktree
  temporaire sur le SHA exact (`git worktree add C:/vt-sp2-<sha> <sha>` + `npm ci`), sinon
  l'arbre en cours d'écriture contamine son `verify`.
- **Deux implémenteurs jamais en parallèle** sur le même worktree.

**Environnement et outillage**
- **CLI shadcn-vue** : `add` fonctionne sans `init` si `components.json` et `tsconfig.json`
  (racine `app/`, avec `paths`) existent ; elle installe **`@lucide/vue`** (pas `lucide-vue-next`)
  et le met en `dependencies` (à remettre en `devDependencies`). Ses composants sont
  incompatibles avec `exactOptionalPropertyTypes` (retiré de `tsconfig.web.json` seulement).
- `prettier-plugin-tailwindcss` plante si `tailwindStylesheet` pointe vers un fichier absent.
- **lint-staged sous Windows** : ligne de commande trop longue à 63 fichiers → `--relative` ;
  les fixtures ignorées font échouer `--max-warnings 0` → `--no-warn-ignored`.
- **Fixtures de lint** exclues des tsconfig (imports volontairement inexistants) et lintées via
  `projectService.allowDefaultProject` (pas de `**` accepté).
- **Preload CJS obligatoire** avec `sandbox: true` → pas de `"type": "module"`, configs en `.mjs`.
- **Frontmatter YAML** : un `titre:` contenant « : » doit être quoté (3 fiches SP1 corrigées).
- **markdown-it 15** : plus de `lib/`, types embarqués, `attrGet()` renvoie `string | number | null`.
- Règles lint qui mordent le plus sur du code « normal » : `unicorn/no-array-sort` (`toSorted`),
  `unicorn/no-array-callback-reference`, `unicorn/consistent-boolean-name` (`isX`),
  `unicorn/no-negated-condition`, `unicorn/prefer-simple-condition-first`,
  `unicorn/max-nested-calls` (3), `unicorn/consistent-function-scoping`,
  `unicorn/no-top-level-assignment-in-function` (tests : objet `ctx`), `regexp/no-super-linear-backtracking`,
  `vitest/no-conditional-expect`, `@typescript-eslint/prefer-string-starts-ends-with`,
  `@typescript-eslint/restrict-template-expressions` (`String(n)`), `import-x/default`,
  `import-x/no-named-as-default`, `vue/no-v-text-v-html-on-component`.

## 6. Ce qui a bien marché, à refaire

- **Plan avec code complet par tâche + un `cc-forge:implementeur` frais par tâche**, prompt qui
  donne la plage de lignes exacte du plan, les noms exacts déjà livrés, la liste des règles lint
  qui ont mordu, et l'interdiction de désactiver une règle sans commentaire ni entrée au spec.
  18 tâches en ~4 h, chaque rapport avec sorties brutes et codes de sortie.
- **`cc-forge:verificateur` par phase**, spec + diff sans narration, dans un worktree isolé, avec
  tests de mutation : 1 KO (gouvernance), 3 OK ; il a trouvé le test aveugle à l'atomicité et
  validé le sélecteur `BrowserWindow` non vérifié par la recherche.
- **Le test qui prouve que le lint casse** (7 fixtures) et **le gate de format du wiki réel** :
  ce dernier a trouvé trois fiches invalides dès son premier run.
- **Consigne « gates sans `rtk`, code de sortie affiché »** dans tous les prompts après le faux
  vert de la tâche 2.
- **Smoke test CDP** de l'app buildée avant packaging : preuve positive du rendu en 30 s.
- **Étape de contrôle des artefacts dans le workflow de release** : transforme le faux vert du
  publisher en échec explicite.

## 7. Table claim | preuve | commande

| Claim | Preuve | Commande |
|---|---|---|
| Gate unique vert sur `main` | CI `verify pass` sur PR #2 (3m18s), #7 (2m49s), #8 (3m03s) ; local : 75 tests, exit 0 | `cd app && npm run verify` |
| Lint casse sur les six garde-fous | 14 tests `tests/lint`, mutation manuelle par le vérificateur A | `npx vitest run tests/lint` |
| Wiki : 12 fiches parsent, INDEX synchrone | 15 tests, mutations fiche/INDEX détectées (vérif B) | `npx vitest run tests/wiki` |
| Store atomique, migrations | 9 tests, mutation écriture directe détectée | `npx vitest run src/main/store` |
| Frontière renderer/Node | vérif C points 7 à 9, `no-restricted-syntax` testé | `tests/lint/design-system.test.ts` |
| App buildée rend le wiki | sonde CDP : dark, rail 4, 12 fiches, digest, 4 accordéons, `window.anka`, « Anka 0.1.0 » | `unset ELECTRON_RUN_AS_NODE; npx electron . --remote-debugging-port=9333` + `smoke-cdp.mjs` |
| Protection de `main` | `{"contexts":["verify"],"strict":true,"force":false,"deletions":false}` | `gh api repos/BahuaudDimitri/Anka/branches/main/protection` |
| Release v0.1.0 publiée, 3 artefacts | `isDraft:false`, exe 111 890 725 o, blockmap, latest.yml 337 o | `gh release view v0.1.0 --json isDraft,assets` |
| Release v0.1.1 publiée, Latest | `isDraft:false`, exe 111 890 697 o, blockmap, latest.yml | `gh release view v0.1.1 --json isDraft,assets` |
| Installation 0.1.0 | constat joueur : wiki, Paramètres 0.1.0, « à jour » | gate 1 (AskUserQuestion) |
| **Mise à jour automatique 0.1.0 → 0.1.1** | **constat joueur : toast « prête », Redémarrer, Paramètres affiche 0.1.1** | gate 2 (AskUserQuestion) |
| Premier publisher electron-builder défaillant | log run 33979206084 : upload exe démarré 16:56:04, étape finie 16:56:11, assets = blockmap seul | `gh run view 33979206084 --log` |

Compte d'échecs de référence de la suite : 0 (75 tests verts).

## 8. Par où reprendre

```bash
cd C:/Users/DimitriBahuaud/Documents/Anka
git fetch origin --prune
git worktree list                                     # supprimer les worktrees SP1 et SP2 (mergés)
git worktree remove .wt/feature-dofus-progression-gains
git worktree remove .wt/feature-sp2-socle-app
git worktree add .wt/feature-sp3-suivi-elevage -b feature/sp3-suivi-elevage origin/main
cd .wt/feature-sp3-suivi-elevage/app && npm ci && npm run verify   # 75 tests attendus
```

Puis : relire `wiki/dragodindes/modele-donnees.md` et `parcours-debutant.md` (contrat SP3), le
spec SP2 §5 et §7 (contrat IPC et stores à étendre), et brainstormer SP3 (écran de suivi,
parcours cochable, notes perso par slug). Avant de coder : `npx -y npm@latest install` si le npm
local est toujours en 11.6 ; `unset ELECTRON_RUN_AS_NODE` avant tout `npm run dev`.

Après SP3 : SP4 (fiches kamas et progression, même méthode que SP1 ; les liens inter-dossiers
sont déjà gérés par le rendu).
