# SP2 : socle de l'application Electron

Date : 2026-09-05
Statut : design validé en brainstorm (navigation B, lecteur A, thème sombre par défaut avec
interrupteur, zod, protection de branche via `gh`). Ce spec détaille la vision
(`2026-09-05-vision-outil-dofus-design.md`, §5 et §9) pour le sous-projet SP2.

## 1. Objectif et périmètre

**Livrable** : un installateur Windows `.exe` (NSIS), publié sur GitHub Releases, que le joueur
installe une fois et qui se met à jour seul. L'application :

- rend le wiki embarqué (fiches, statut, confiance, sources), navigation par dossier ;
- gère un profil local (serveur de jeu, pseudo facultatif) ;
- stocke les données du joueur en JSON dans le dossier utilisateur, avec export et import ;
- affiche sa version, vérifie et installe les mises à jour ;
- propose un thème sombre (par défaut) ou clair.

**Preuve de bout en bout exigée** : une release `v0.1.0` réelle installée chez le joueur, puis une
release `v0.1.1` que l'application détecte, télécharge et installe sans intervention manuelle
autre que « Redémarrer ».

**Hors périmètre SP2** (repoussé, pas abandonné) :

- notes personnelles par fiche, écran de suivi d'élevage, parcours cochable : SP3 ;
- client HTTP DofusDude et cache local : aucun consommateur avant SP3, il arrivera avec ;
- recherche plein texte dans le wiki (12 fiches, la liste suffit) ;
- signature de code (avertissement SmartScreen accepté, décision de la vision).

## 2. Cadrage de travail

- **Branche** `feature/sp2-socle-app`, worktree `.wt/feature-sp2-socle-app`, créée depuis le HEAD
  de `feature/dofus-progression-gains` (3 commits de docs non encore dans `main`, ils partent avec
  la PR SP2). PR vers `main`.
- **Compte GitHub** : `gh` reste actif sur le compte pro. Toute commande `gh` de ce chantier
  s'exécute avec `GH_TOKEN="$(gh auth token --user BahuaudDimitri)"` (testé le 2026-09-05 : repo,
  PR, Actions et API accessibles). Le remote `origin` passe par l'alias SSH `github-perso`.
- **Vérification** : `npm run verify` dans `app/`, lancé une fois, corrections en lot, relance une
  fois. La release réelle est la vérification finale.

## 3. Stack et versions

Versions relevées sur npm le 2026-09-05. Les contraintes de compatibilité ci-dessous ont été
vérifiées par `npm view <pkg> peerDependencies` et **imposent** de ne pas prendre « latest » partout.

| Couche | Paquet | Version | Contrainte |
|---|---|---|---|
| Runtime | `electron` | 44.x | |
| Bundler | `electron-vite` | 5.x | peer `vite ^5 || ^6 || ^7` : **Vite 8 refusé** |
| Bundler | `vite` | **7.3.x** | imposé par electron-vite 5 |
| Front | `vue` | 3.5.x | |
| Front | `vue-router` | 5.x | mode hash (fichier local) ; peer `vite ^7.3 || ^8`, `vue ^3.5.34` : compatible |
| Front | `pinia` | 4.x | profil et état de mise à jour ; peer `vue ^3.5.11`, `typescript >=5.6` |
| Front | `@vueuse/core` | 14.x | `useColorMode` pour le thème (recommandation shadcn-vue) |
| Langage | `typescript` | **5.9.x** | typescript-eslint : peer `typescript <6.1` ; TS 7 (port natif) refusé |
| UI | `tailwindcss`, `@tailwindcss/vite` | 4.3.x | plugin Vite, pas de PostCSS |
| UI | `shadcn-vue` (CLI) | 2.8.x | composants copiés dans `components/ui/` |
| Rendu md | `markdown-it` | 15.x | `html: false` |
| Frontmatter | `yaml` | 2.x | pas de `gray-matter` (dépend de `Buffer`) |
| Validation | `zod` | 4.x | schémas des fichiers JSON et de l'import |
| Packaging | `electron-builder` | 26.x | cible `nsis`, `--publish` explicite |
| MàJ | `electron-updater` | 6.x | provider GitHub, `releaseType: release` |
| Lint | `eslint` | 10.x | flat config ; eslint-plugin-vue 10 et typescript-eslint 8 acceptent `^10` |
| Lint | `typescript-eslint` 8.69, `eslint-plugin-vue` 10.10, `vue-eslint-parser` 10.4, `eslint-plugin-vuejs-accessibility` 2.6, `eslint-plugin-import-x` 4.17, `eslint-plugin-unicorn` 74, `@vitest/eslint-plugin` 1.6, `eslint-plugin-promise` 7.3, `eslint-plugin-n` 18.3, `eslint-plugin-security` 4.0, `eslint-plugin-sonarjs` 4.2, `eslint-plugin-regexp` 3.3, `eslint-config-prettier` 10.1, `globals` 17 | relevées le 2026-09-05 | toutes acceptent ESLint 10 (peers vérifiés, voir §11.4) |
| Format | `prettier`, `prettier-plugin-tailwindcss` | 3.9.x / 0.8.x | |
| Types SFC | `vue-tsc` | 3.3.x | peer `typescript >=5` |
| Tests | `vitest`, `@vue/test-utils`, `happy-dom` | 5.x / 2.x / courante | vitest 5 accepte vite 7 |
| Hooks | `husky`, `lint-staged` | 9.x / 17.x | |
| Node | local et CI | 24.x | electron-vite exige 20.19+ ou 22.12+ |

Toutes les versions sont épinglées en `^` dans `package.json` et gelées par `package-lock.json` ;
Dependabot propose les montées.

## 4. Structure du dépôt

```
/
  wiki/                          inchangé, lu par l'app au build
  app/
    package.json                 seul package.json du dépôt
    electron.vite.config.ts      trois cibles : main, preload, renderer
    electron-builder.yml         nsis, publish github (owner/repo explicites, releaseType release)
    eslint.config.js             flat config, voir §11
    prettier.config.js  .prettierignore
    tsconfig.json  tsconfig.node.json  tsconfig.web.json
    vitest.config.ts
    .husky/pre-commit            lint-staged
    resources/icon.ico
    src/
      main/                      index.ts, window.ts, store/ (fichiers JSON), updater.ts, ipc.ts
      preload/                   index.ts : contextBridge -> window.anka
      shared/                    ipc.ts (contrat typé), schemas/ (zod), wiki/ (parseur pur)
      renderer/
        index.html  src/main.ts  src/App.vue  src/router.ts
        src/assets/main.css      @import "tailwindcss" + tokens shadcn
        src/components/ui/       composants shadcn-vue générés (exemptés des règles design system)
        src/components/          composants maison (AppRail, FicheList, FicheReader, ...)
        src/pages/               WikiPage, ElevagePage (placeholder), ProfilPage, ParametresPage
        src/stores/              profile.ts, updater.ts (Pinia)
        src/lib/                 wiki-index.ts (import.meta.glob), utils.ts (cn)
    tests/
      lint/design-system.test.ts test qui prouve que le lint casse (fixtures : dossiers
                                 __lint_fixtures__/ dans src/, ignorés par `eslint .`)
      wiki/                      test « toutes les fiches du dépôt parsent »
  .github/
    workflows/ci.yml  release.yml
    dependabot.yml
  .gitignore                     node_modules, app/out, app/dist, .superpowers
```

Le wiki est hors de la racine Vite du renderer : `electron.vite.config.ts` déclare l'alias
`@wiki` → `<racine du dépôt>/wiki` et ajoute la racine du dépôt à `server.fs.allow` ; le glob
s'écrit `import.meta.glob('@wiki/**/*.md', ...)`, sans chemin relatif fragile.

## 5. Processus et contrat IPC

Trois processus, frontière stricte : le renderer n'a **aucun** accès Node (`nodeIntegration:
false`, `contextIsolation: true`, `sandbox: true`). Tout passe par `window.anka`, exposé par le
preload et typé par `src/shared/ipc.ts` :

```ts
export interface AnkaApi {
  store: {
    read<K extends StoreKey>(key: K): Promise<StoreData[K]>
    write<K extends StoreKey>(key: K, data: StoreData[K]): Promise<void>
  }
  transfer: {
    exportAll(): Promise<{ ok: true; path: string } | { ok: false; reason: 'cancelled' }>
    importAll(): Promise<
      | { ok: true; path: string }
      | { ok: false; reason: 'cancelled' | 'invalid'; details?: string }
    >
  }
  updater: {
    check(): Promise<void>
    quitAndInstall(): Promise<void>
    onState(cb: (state: UpdaterState) => void): () => void
  }
  app: { version(): Promise<string>; openExternal(url: string): Promise<void> }
}
```

Chaque canal IPC est nommé dans une constante unique (`IPC.store.read`, ...) partagée par main et
preload : pas de chaîne libre. `openExternal` refuse tout ce qui n'est pas `https://`.

## 6. Wiki

**Chargement** : `import.meta.glob('@wiki/**/*.md', { query: '?raw', import: 'default',
eager: true })` dans `lib/wiki-index.ts` (alias défini en §4). `CONVENTIONS.md`, `INDEX.md`, `JOURNAL.md` sont exclus
par un second glob négatif ; seules les fiches dans un sous-dossier sont retenues.

**Parseur pur** `src/shared/wiki/parse-fiche.ts`, sans dépendance à Vue ni Electron, testé seul :

```ts
export interface Fiche {
  slug: string            // nom de fichier sans extension, doit égaler le frontmatter
  dossier: string         // 'dragodindes' | 'kamas' | 'progression' | ...
  titre: string
  statut: 'hypothese' | 'valide' | 'obsolete'
  confiance: 'haute' | 'moyenne' | 'basse'
  versionDofus: string
  derniereVerif: string   // ISO date
  sources: { url: string; titre: string; date: string }[]
  tags: string[]
  sections: Record<'En bref' | 'Détails' | 'Pièges fréquents' | 'Chiffres' | 'À challenger', string>
}
export function parseFiche(path: string, raw: string): Fiche   // lève FicheFormatError
```

Frontmatter via `yaml`, validé par un schéma zod `FicheSchema` (mêmes règles que
`wiki/CONVENTIONS.md`). Les sections sont découpées sur les titres `## ` de niveau 2, dans
l'ordre imposé ; une section manquante ou en désordre lève `FicheFormatError` avec le chemin.

**Rendu** : `markdown-it` avec `html: false`, `linkify: false`, `typographer: false`. Deux
règles de rendu maison :

- lien vers `xxx.md` ou `./xxx.md` (33 occurrences dans le wiki) réécrit en `#/wiki/<slug>` ;
  slug inconnu : rendu en texte simple avec `title="fiche absente"` et une ligne de warning en
  dev ;
- lien `https://` : `target="_blank"` et interception au clic pour `app.openExternal`.

**Test de gate du wiki** : `tests/wiki/all-fiches.test.ts` lit **toutes** les fiches du dépôt
depuis Node (pas via Vite), les passe à `parseFiche`, et vérifie que `INDEX.md` liste exactement
les mêmes slugs. Il remplace la boucle grep de SP1 et fait échouer `verify` si une fiche future
casse le format.

**Navigation (variante B validée)** :

- **rail** gauche, icônes seules avec infobulle : Wiki, Élevage, Profil, Paramètres ;
- **liste** : groupes par dossier (titre du dossier en capitale), une ligne par fiche avec titre
  et un badge de statut (`valide` vert sémantique, `hypothese` ambre, `obsolete` grisé) ; la
  fiche `digest-debutant` du dossier est épinglée en première position ;
- **lecteur** (variante A validée) : en-tête avec titre, badges statut et confiance, « vérifiée
  le JJ/MM/AAAA », liste des sources cliquables ; encadré « En bref » ouvert ; quatre
  `Accordion` shadcn fermés pour Détails, Pièges fréquents, Chiffres, À challenger ; l'état
  ouvert/fermé n'est pas persisté.

Route : `#/wiki/:slug?`. Sans slug, le lecteur ouvre `dragodindes/digest-debutant`.

## 7. Données locales

**Un fichier JSON par domaine** dans `app.getPath('userData')/data/`, écrit par le processus
main uniquement. SP2 ne crée que `profile.json` ; SP3 ajoutera `elevage.json` sur le même
mécanisme.

```ts
// src/shared/schemas/profile.ts
export const ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  serveur: z.string().trim().max(60).default(''),
  pseudo: z.string().trim().max(40).default(''),
})
```

Règles :

- `read` : fichier absent → valeur par défaut du schéma ; fichier invalide → erreur remontée au
  renderer (toast) et **jamais** d'écrasement silencieux ;
- `write` : validation zod, écriture dans `<fichier>.tmp` puis `rename` (atomique) ;
- **migrations** : `schemaVersion` par fichier ; une table `migrations[key][from] = fn` dans main,
  vide en SP2 mais le mécanisme et son test existent ;
- **export** : `dialog.showSaveDialog`, nom par défaut `anka-export-AAAA-MM-JJ.json`, contenu
  `{ exportVersion: 1, exportedAt, appVersion, data: { profile: {...} } }` ;
- **import** : `dialog.showOpenDialog`, validation zod du bundle entier avant toute écriture,
  puis remplacement domaine par domaine ; confirmation `AlertDialog` côté renderer avant l'appel.
  Un bundle invalide ne modifie rien et affiche la raison.

**Thème** : préférence d'appareil, pas donnée du joueur. `useColorMode` (`@vueuse/core`) avec
persistance `localStorage` par défaut, mode initial `dark`, classe `dark` sur `<html>`.
L'interrupteur (sombre / clair / système) est dans Paramètres. Le thème ne fait pas partie de
l'export.

## 8. Mise à jour automatique et release

Faits vérifiés dans la doc electron-builder le 2026-09-05 (dépôt `electron-userland/electron-builder`,
`website/docs/features/auto-update.md` et `publish.md`, source `publishOptions.ts`) :

- NSIS est une cible auto-updatable ; la signature n'est obligatoire que sur macOS ;
- la publication doit être **explicite** (`--publish always` ou `never`) ;
- le provider GitHub crée par défaut une release **brouillon** (`releaseType: draft`), que
  l'updater ne voit pas : on fixe `releaseType: release` ;
- `owner` et `repo` doivent être explicites dans `publish` (avertissement de la doc sur la
  détection depuis `.git/config`) ;
- `electron-updater` est CJS : import par défaut puis destructuration `const { autoUpdater } =
  electronUpdater` ;
- ne pas appeler `setFeedURL` : `app-update.yml` est généré au build.

Configuration `electron-builder.yml` :

```yaml
appId: fr.anka.app
productName: Anka
directories: { output: dist, buildResources: resources }
files: [out/**]
win: { target: [nsis], icon: resources/icon.ico }
nsis: { oneClick: true, perMachine: false, allowToChangeInstallationDirectory: false }
publish: { provider: github, owner: BahuaudDimitri, repo: Anka, releaseType: release }
```

Comportement dans main (`updater.ts`) : en production seulement, `autoUpdater.autoDownload =
true`, `checkForUpdates()` 5 s après le démarrage puis à la demande ; les événements
(`checking`, `update-available`, `download-progress`, `update-downloaded`, `update-not-available`,
`error`) sont réduits en un `UpdaterState` envoyé au renderer. Le joueur voit dans Paramètres :
version courante, bouton « Vérifier », état, et « Redémarrer pour installer » qui appelle
`quitAndInstall()`. L'installation n'est jamais forcée pendant l'utilisation.

**Release** (`release.yml`, déclencheur `push` sur tag `v*`) :

1. contrôle que `v${package.json.version}` égale le tag, sinon échec ;
2. `npm ci`, `npm run verify` ;
3. `npm run build` (electron-vite) puis `electron-builder --win --publish always` avec
   `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` ; permissions du job `contents: write` ;
4. artefacts attendus dans la release : `Anka-Setup-<version>.exe`, `.exe.blockmap`, `latest.yml`.

Le tag est posé par la session (`git tag v0.1.0 && git push origin v0.1.0`) après merge dans
`main`. Preuve finale : installer v0.1.0, tager v0.1.1, constater la mise à jour.

## 9. Écrans

| Route | Contenu |
|---|---|
| `#/wiki/:slug?` | rail + liste + lecteur (§6) |
| `#/elevage` | rail + carte « L'écran de suivi d'élevage arrive avec SP3 », lien vers la fiche `parcours-debutant` |
| `#/profil` | formulaire `Input` serveur, `Input` pseudo, bouton Enregistrer (désactivé sans changement), toast de confirmation |
| `#/parametres` | thème (`RadioGroup` ou `Select` : sombre, clair, système) ; export / import (boutons + `AlertDialog` avant import) ; version, bouton Vérifier, état de mise à jour, bouton Redémarrer ; lien vers le dépôt GitHub et mention DofusDude |

Composants shadcn-vue installés en SP2 : `button`, `input`, `label`, `badge`, `accordion`,
`alert-dialog`, `select`, `radio-group`, `tooltip`, `scroll-area`, `separator`, `sonner`
(toasts), `card`. Rien d'autre sans besoin.

Fenêtre : 1200 × 800 par défaut, minimum 900 × 600, taille et position mémorisées dans
`window-state.json` (même mécanisme de store, `schemaVersion: 1`), barre de titre native.

## 10. Tests

Tous en Vitest, lancés par `npm test` et donc par `verify`. Environnement `node` par défaut,
`happy-dom` pour les fichiers `*.dom.test.ts`.

| Test | Ce qu'il prouve |
|---|---|
| `shared/wiki/parse-fiche.test.ts` | frontmatter complet accepté ; clé manquante, statut inconnu, section absente ou en désordre, slug différent du nom de fichier : chaque cas lève `FicheFormatError` avec un message qui nomme le champ |
| `tests/wiki/all-fiches.test.ts` | toutes les fiches du dépôt parsent ; `INDEX.md` et les fichiers listent les mêmes slugs |
| `shared/wiki/render.test.ts` | lien `xxx.md` → `#/wiki/xxx` ; lien inconnu → texte ; `https` → `target=_blank` ; HTML brut échappé |
| `main/store/json-store.test.ts` (fs temporaire) | absent → défaut ; invalide → erreur sans écrasement ; écriture atomique (pas de `.tmp` résiduel) ; migration appelée sur `schemaVersion` inférieur |
| `shared/schemas/transfer.test.ts` | bundle valide accepté ; `exportVersion` inconnu, domaine inconnu, profil invalide : refusés avec raison |
| `main/updater-state.test.ts` | réduction des événements electron-updater en `UpdaterState` (pure) |
| `tests/lint/design-system.test.ts` | voir §11.4 : ESLint programmatique sur sept fixtures, la bonne règle remonte avec le bon nombre d'erreurs ; la même fixture sous `components/ui/` ne remonte rien ; chaque fixture est ignorée par `eslint .` |
| `renderer/components/FicheReader.dom.test.ts` | En bref rendu ouvert, quatre accordéons fermés, badges statut et confiance présents |

Pas de test end-to-end Electron en SP2 : la release réelle en tient lieu.

## 11. Qualité de code

### Gate unique

```json
"scripts": {
  "dev": "electron-vite dev",
  "build": "electron-vite build",
  "lint": "eslint . --max-warnings 0",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "vue-tsc --noEmit -p tsconfig.web.json && tsc --noEmit -p tsconfig.node.json",
  "test": "vitest run",
  "verify": "npm run lint && npm run format:check && npm run typecheck && npm run test",
  "dist": "npm run build && electron-builder --win --publish never",
  "prepare": "cd .. && husky app/.husky"
}
```

`lint-staged` : `*.{ts,vue,js}` → `eslint --fix --max-warnings 0` puis `prettier --write` ;
`*.{md,json,yml,css}` → `prettier --write`.

### Règles design system (contrat de la vision §9)

Appliquées à `src/renderer/**/*.vue` **sauf** `src/renderer/src/components/ui/**` :

```js
'vue/no-restricted-html-elements': ['error',
  { element: 'button',   message: 'Utiliser <Button> de @/components/ui/button' },
  { element: 'input',    message: 'Utiliser <Input> de @/components/ui/input' },
  { element: 'select',   message: 'Utiliser <Select> de @/components/ui/select' },
  { element: 'textarea', message: 'Utiliser <Textarea> de @/components/ui/textarea' },
  { element: 'dialog',   message: 'Utiliser <Dialog> ou <AlertDialog> de @/components/ui' },
  { element: 'table',    message: 'Utiliser <Table> de @/components/ui/table' },
],
'vue/no-restricted-class': ['error',
  // couleur Tailwind brute : préfixe utilitaire, nom de palette, nuance 50..950, opacité et variantes facultatives
  '/^(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|outline|decoration|divide|from|via|to|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\\d{2,3})?(?:\\/\\d{1,3})?$/',
],
'no-restricted-imports': ['error', { patterns: [
  { group: ['vuetify', 'vuetify/*', 'element-plus', 'element-plus/*', 'primevue', 'primevue/*',
            'naive-ui', 'quasar', 'quasar/*', 'ant-design-vue', 'ant-design-vue/*',
            '@headlessui/vue', 'bootstrap-vue-next', 'radix-vue'],
    message: 'Une seule bibliothèque UI : shadcn-vue (reka-ui) dans @/components/ui' },
]}],
```

Limite documentée : `vue/no-restricted-class` ne voit que les classes **statiques** (doc lue le
2026-09-05). Les bindings `:class` dynamiques passent ; la revue de PR le surveille, et §11.4
dit si un complément outillé existe.

### Test qui prouve que le lint casse

`tests/lint/design-system.test.ts` instancie `new ESLint({ cwd: app, ignore: false })` et linte
des fixtures volontairement fautives placées **dans l'arborescence réelle** (dossiers
`__lint_fixtures__/` sous `src/renderer/src/`, `src/renderer/src/components/ui/`, `src/main/`,
`src/shared/`), pour que les blocs `files:` de la config s'appliquent tels quels. Ces dossiers sont
dans `ignores`, donc invisibles pour `npm run lint` ; le test le prouve avec `isPathIgnored()`. La
liste des fixtures et des erreurs attendues est dans le tableau de §11.4. Le même test couvre
ainsi le design system, l'étanchéité renderer / Node, la sécurité `BrowserWindow` et les zones
d'import.

### Presets et règles au-delà du design system

Le jeu complet (plugins retenus et écartés, `eslint.config.js` par zone main / preload /
renderer / shared / tests / config, règles activées avec justification, liste « non vérifié »)
est produit par une recherche dédiée et consigné dans l'annexe §11.4 ci-dessous. Principes fixés
dès maintenant :

- base `eslint-plugin-vue` `flat/recommended` + `typescript-eslint` `strictTypeChecked` et
  `stylisticTypeChecked` avec `projectService`, `eslint-config-prettier` en dernier ;
- `components/ui/**` est exempté des règles design system et des règles TS strictes qui
  cassent le code généré (`no-explicit-any`, `no-unsafe-*`), pas du reste ;
- zéro warning toléré (`--max-warnings 0`) : une règle est `error` ou absente ;
- aucune règle de formatage : Prettier seul (avec `prettier-plugin-tailwindcss` pour l'ordre des
  classes).

### 11.4 Annexe : jeu de règles complet

Source : recherche dédiée du 2026-09-05, consignée dans
`2026-09-05-sp2-lint-rules-research.md` (même dossier) avec, pour chaque plugin, la méthode de
vérification du nom des règles (doc officielle ou `npm pack` + lecture du paquet) et les peer
dependencies relevées. Ce qui suit est la version **retenue**, après quatre corrections au
rapport :

1. **aucun `warn`** : `--max-warnings 0` rend un warn équivalent à une erreur, donc chaque règle
   est `error` ou absente (sept règles proposées en `warn` passent en `error`) ;
2. `no-restricted-imports` utilise `patterns` et non `paths`, sinon `primevue/button` passe ;
3. `security/detect-object-injection` est désactivée (bruit connu sur tout accès `obj[clé]`, dont
   la table de migrations) ;
4. trois règles unicorn hostiles aux idiomes Vue sont ajustées **partout**, pas seulement dans
   `components/ui/` : `unicorn/name-replacements` off (`props`, `ref`, `emit`, `e`),
   `unicorn/no-null` off (JSON et IPC), `unicorn/filename-case` en kebab-case **ou** PascalCase
   (composants `.vue` en PascalCase, fichiers `.ts` en kebab-case, convention du guide de style Vue).

Plugins retenus (versions et peers vérifiés ESLint 10 + flat config) : `@eslint/js`,
`typescript-eslint`, `eslint-plugin-vue` + `vue-eslint-parser`, `eslint-plugin-vuejs-accessibility`,
`eslint-plugin-import-x`, `eslint-plugin-unicorn`, `@vitest/eslint-plugin`, `eslint-plugin-promise`,
`eslint-plugin-n` (main et preload), `eslint-plugin-security` (main et preload),
`eslint-plugin-sonarjs` (quatre règles), `eslint-plugin-regexp`, `eslint-config-prettier`, `globals`.
Écartés : `eslint-plugin-import` (peer plafonné à ESLint 9), `eslint-plugin-perfectionist`
(recoupe `import-x/order`, tri intrusif), `eslint-plugin-tailwindcss` (pas compatible Tailwind v4).

Chemins : le renderer electron-vite vit sous `src/renderer/src/`, donc les composants générés sont
`src/renderer/src/components/ui/**`.

```js
// app/eslint.config.js
import js from '@eslint/js'
import vitestPlugin from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import { importX } from 'eslint-plugin-import-x'
import pluginN from 'eslint-plugin-n'
import pluginPromise from 'eslint-plugin-promise'
import pluginRegexp from 'eslint-plugin-regexp'
import pluginSecurity from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import pluginVue from 'eslint-plugin-vue'
import vueA11y from 'eslint-plugin-vuejs-accessibility'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const UI_GENERATED = 'src/renderer/src/components/ui/**'
const LINT_FIXTURES = '**/__lint_fixtures__/**'
const TAILWIND_RAW_COLOR =
  '/^(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|outline|decoration|divide|from|via|to|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\\d{2,3})?(?:\\/\\d{1,3})?$/'
const FOREIGN_UI = ['vuetify', 'element-plus', 'primevue', 'naive-ui', 'quasar', 'ant-design-vue',
  '@headlessui/vue', 'bootstrap-vue-next', 'radix-vue']

export default tseslint.config(
  { ignores: ['out/**', 'dist/**', 'node_modules/**', '**/*.d.ts', 'coverage/**', LINT_FIXTURES] },

  // Base JS + TS typé, tout app/
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname, extraFileExtensions: ['.vue'] },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow': 'off',
      'no-eval': 'error',
    },
  },

  // Imports, tout app/
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/no-restricted-paths': ['error', { zones: [
        { target: './src/shared',   from: ['./src/main', './src/preload', './src/renderer'] },
        { target: './src/renderer', from: ['./src/main', './src/preload'] },
        { target: './src/preload',  from: ['./src/main', './src/renderer'] },
        { target: './src/main',     from: ['./src/renderer', './src/preload'] },
      ]}],
    },
  },

  // Robustesse générale, tout app/
  unicorn.configs.recommended,
  pluginRegexp.configs['flat/recommended'],
  pluginPromise.configs['flat/recommended'],
  {
    plugins: { sonarjs },
    rules: {
      'unicorn/name-replacements': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': ['error', { cases: { kebabCase: true, pascalCase: true } }],
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
    },
  },

  // Vue SFC (renderer)
  ...pluginVue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],
  {
    files: ['src/renderer/**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser, sourceType: 'module' } },
    rules: {
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] }],
      'vue/no-unused-refs': 'error',
      'vue/require-typed-ref': 'error',
      'vue/no-undef-components': 'error',
      'vue/component-api-style': ['error', ['script-setup']],
      // Design system (vision §9)
      'vue/no-restricted-html-elements': ['error',
        { element: 'button',   message: 'Utiliser <Button> de @/components/ui/button' },
        { element: 'input',    message: 'Utiliser <Input> de @/components/ui/input' },
        { element: 'select',   message: 'Utiliser <Select> de @/components/ui/select' },
        { element: 'textarea', message: 'Utiliser <Textarea> de @/components/ui/textarea' },
        { element: 'dialog',   message: 'Utiliser <Dialog> ou <AlertDialog> de @/components/ui' },
        { element: 'table',    message: 'Utiliser <Table> de @/components/ui/table' },
      ],
      'vue/no-restricted-class': ['error', TAILWIND_RAW_COLOR],
    },
  },
  {
    files: ['src/renderer/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: FOREIGN_UI.flatMap((n) => [n, `${n}/*`]),
        message: 'Une seule bibliothèque UI : shadcn-vue (reka-ui) dans @/components/ui',
      }]}],
      'no-restricted-globals': ['error', ...['require', 'process', 'module', '__dirname', '__filename']
        .map((name) => ({ name, message: 'Le renderer ne touche pas Node : passer par window.anka (preload/IPC).' }))],
      'import-x/no-nodejs-modules': 'error',
    },
  },

  // Composants shadcn-vue générés : exemptés du design system et des règles cassées par le code généré
  {
    files: [UI_GENERATED],
    rules: {
      'vue/no-restricted-html-elements': 'off',
      'vue/no-restricted-class': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'vuejs-accessibility/form-control-has-label': 'off', // le label vient du parent
      'vuejs-accessibility/label-has-for': 'off',
      // Restent actives : no-floating-promises, consistent-type-imports, no-unused-vars,
      // switch-exhaustiveness-check, import-x/*, unicorn (hors les trois ajustées).
    },
  },

  // main (Node)
  {
    files: ['src/main/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { n: pluginN, security: pluginSecurity },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      'n/no-process-exit': 'error',
      'n/no-deprecated-api': 'error',
      'n/prefer-node-protocol': 'error',
      'no-restricted-syntax': ['error',
        { selector: "NewExpression[callee.name='BrowserWindow'] Property[key.name='nodeIntegration'][value.value=true]",
          message: 'nodeIntegration reste false : le renderer ne doit jamais voir Node.' },
        { selector: "NewExpression[callee.name='BrowserWindow'] Property[key.name='contextIsolation'][value.value=false]",
          message: 'contextIsolation reste true.' },
        { selector: "NewExpression[callee.name='BrowserWindow'] Property[key.name='sandbox'][value.value=false]",
          message: 'sandbox reste true.' },
      ],
    },
  },

  // preload (Node + contextBridge)
  {
    files: ['src/preload/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { n: pluginN, security: pluginSecurity },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      'n/no-process-exit': 'error',
      'n/prefer-node-protocol': 'error',
    },
  },

  // shared : ni Node ni DOM ; la garde réelle est import-x/no-restricted-paths + import-x/no-nodejs-modules
  {
    files: ['src/shared/**/*.ts'],
    rules: { 'import-x/no-nodejs-modules': 'error' },
  },

  // tests
  {
    files: ['src/**/*.test.ts', 'tests/**/*.ts'],
    plugins: { vitest: vitestPlugin },
    languageOptions: { globals: globals.node },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'test' }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-identical-functions': 'off',
    },
  },

  // fichiers de config à la racine de app/
  {
    files: ['*.config.ts', '*.config.js', '*.config.mjs'],
    languageOptions: { globals: globals.node },
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'unicorn/prefer-module': 'off',
    },
  },

  eslintConfigPrettier, // toujours en dernier
)
```

**Règle de gouvernance** : toute désactivation d'une règle, globale ou par ligne
(`eslint-disable-next-line`), porte un commentaire qui dit pourquoi. Une règle qui bruite trois
fois de suite est retirée de la config avec sa justification dans ce spec, pas contournée.

**Fixtures de lint** : les fichiers volontairement fautifs vivent dans des dossiers
`__lint_fixtures__/` (ignorés par `eslint .`, voir `ignores`) et sont lintés uniquement par le
test `tests/lint/design-system.test.ts` via `new ESLint({ ignore: false })`. Le test vérifie aussi
`isPathIgnored()` sur chaque fixture, pour prouver que `npm run lint` ne les voit pas. Fixtures :

| Fichier | Attendu |
|---|---|
| `src/renderer/src/__lint_fixtures__/NativeButton.vue` | 1 erreur `vue/no-restricted-html-elements`, message contenant `<Button>` |
| `src/renderer/src/__lint_fixtures__/RawColor.vue` | `bg-red-500`, `hover:text-gray-700`, `dark:hover:border-slate-200/50`, `bg-black/40` : 4 erreurs `vue/no-restricted-class` ; `bg-primary text-muted-foreground border-border` : 0 |
| `src/renderer/src/__lint_fixtures__/ForeignUi.vue` | `import { NButton } from 'naive-ui'` et `import X from 'primevue/button'` : 2 erreurs `no-restricted-imports` |
| `src/renderer/src/__lint_fixtures__/NodeInRenderer.ts` | `import fs from 'node:fs'` : 1 erreur `import-x/no-nodejs-modules` ; `process.cwd()` : 1 erreur `no-restricted-globals` |
| `src/renderer/src/components/ui/__lint_fixtures__/NativeButton.vue` | 0 erreur design system |
| `src/main/__lint_fixtures__/insecure-window.ts` | `new BrowserWindow({ webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false } })` : 3 erreurs `no-restricted-syntax` (lève le « non vérifié » du rapport) |
| `src/shared/__lint_fixtures__/imports-main.ts` | `import '../main/index'` : 1 erreur `import-x/no-restricted-paths` |

**Hors lint, tenu par la revue** (détail dans le rapport §4) : couleurs brutes dans un `:class`
dynamique ; `webPreferences` construit dynamiquement puis spread ; cycles via `import()`.

## 12. CI, dépendances, protection de branche

**`ci.yml`** : déclencheurs `pull_request` et `push` sur `main` ; runner `windows-latest` ;
`actions/setup-node` Node 24 avec cache npm sur `app/package-lock.json` ; `npm ci` ;
`npm run verify` ; `npm run dist` (build sans publication) ; upload de l'installateur en artefact
7 jours. Concurrence : annulation du run précédent sur la même branche. Nom du job : `verify`.

**`release.yml`** : voir §8.

**`dependabot.yml`** : écosystème `npm` dans `/app`, hebdomadaire, groupé en deux groupes
(`electron` : electron, electron-builder, electron-updater, electron-vite ; `dev` : tout le reste
en devDependencies) ; écosystème `github-actions`, hebdomadaire.

**Protection de `main`** : posée via l'API avec le jeton perso une fois le premier run CI vert :
check requis `verify`, branche à jour avant merge, pas de force push, pas de suppression. Les
revues obligatoires ne sont pas activées (un seul contributeur).

## 13. Critères d'acceptation et preuves

| Claim | Preuve attendue | Commande |
|---|---|---|
| `verify` vert en local | sortie brute lint + format + typecheck + tests | `cd app && npm run verify` |
| Le lint casse sur un `<button>` natif | test `design-system.test.ts` vert, et une exécution manuelle de `eslint` sur la fixture qui échoue | `npx eslint src/renderer/__lint_fixtures__/NativeButton.vue` |
| Toutes les fiches parsent | test `all-fiches.test.ts` vert (12 fiches) | `npx vitest run tests/wiki` |
| CI verte sur la PR | run `verify` en `success`, pas `cancelled` ni `skipped` | `gh run list --branch feature/sp2-socle-app` (jeton perso) |
| Protection de `main` active | JSON de l'API avec `required_status_checks.contexts = ["verify"]` | `gh api repos/BahuaudDimitri/Anka/branches/main/protection` |
| Release v0.1.0 publiée, non brouillon | `isDraft: false`, 3 assets dont `latest.yml` | `gh release view v0.1.0 --json isDraft,assets` |
| Mise à jour auto | v0.1.0 installée, v0.1.1 taguée, l'app affiche « prêt : redémarrer » puis 0.1.1 dans Paramètres | constat du joueur + capture, UNVERIFIED tant que non fait |
| Export / import | export puis import du même fichier : profil identique ; import d'un JSON altéré : refusé, profil intact | manuel dans l'app, plus `transfer.test.ts` |

## 14. Risques et points ouverts

- **SmartScreen** : première installation avec avertissement « éditeur inconnu » (accepté par la
  vision). Si Windows bloque l'installateur téléchargé par l'updater, voie de repli :
  `autoDownload` reste mais l'installation passe par le clic joueur, déjà prévu.
- **Runner Windows** : `windows-latest` est plus lent que Linux (build Electron 5 à 8 min
  estimé). Accepté : gratuit sur repo public, et il évite Wine.
- **Icône** : aucune icône n'existe. SP2 génère un `.ico` placeholder (lettre A sur fond uni) ;
  l'icône définitive est une tâche joueur.
- **Vue 3.5 + Vite 7 + electron-vite 5** : combinaison courante en 2026 mais chaque montée
  Dependabot doit repasser `verify` et un `dist` local avant merge (la CI le fait).
- **Détection dynamique des classes** : voir §11.4.
