# SP2 socle app Electron — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer l'application Anka v0.1.0 : un `.exe` Windows qui rend le wiki embarqué, gère un profil local avec export/import, et se met à jour seul depuis GitHub Releases, avec un socle de qualité outillé (lint design system, `npm run verify`, CI, protection de branche).

**Architecture:** Monorepo, tout le code dans `app/`. Trois processus Electron étanches (main = fichiers JSON, dialogues, updater ; preload = `contextBridge` typé ; renderer = Vue 3 sans accès Node). Le wiki markdown de la racine est embarqué au build par `import.meta.glob` et parsé par un module pur testé. Les garde-fous sont des règles ESLint prouvées par un test qui les fait casser.

**Tech Stack:** Electron 44, electron-vite 5 + Vite 7.3, Vue 3.5 + vue-router 5 + Pinia 4, TypeScript 5.9, Tailwind v4 + shadcn-vue 2.8 (reka-ui), zod 4, markdown-it 15, `yaml` 2, electron-builder 26 + electron-updater 6, ESLint 10 flat config (14 plugins), Prettier 3.9, vue-tsc 3.3, Vitest 5, husky 9 + lint-staged 17, GitHub Actions windows-latest. Node 24.

**Spec de référence :** `docs/superpowers/specs/2026-09-05-sp2-socle-app-design.md` (et son annexe lint `2026-09-05-sp2-lint-rules-research.md`). En cas de doute, le spec gagne.

**Règles d'exécution propres à ce chantier :**

- Worktree : `C:/Users/DimitriBahuaud/Documents/Anka/.wt/feature-sp2-socle-app`, branche `feature/sp2-socle-app`. Toutes les commandes `npm` se lancent depuis `app/` (chemin absolu : `.../.wt/feature-sp2-socle-app/app`).
- Préfixe `rtk` sur les commandes shell (`rtk npm run verify`, `rtk git status`).
- `gh` : toujours `export GH_TOKEN="$(gh auth token --user BahuaudDimitri)"` avant, sans basculer le compte actif.
- Commits : messages en français, conventionnels (`feat(app): ...`, `chore(ci): ...`), trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Toujours `git add` avec des chemins explicites.
- Heredoc bash long = piège Windows : écrire les fichiers avec l'outil Write, pas avec `cat <<EOF`.
- `npm run verify` est le gate unique. Pendant une tâche, ne linter que les fichiers touchés (`npx eslint <fichiers>`) ; `verify` complet en fin de tâche, deux passes max.
- Gouvernance lint : toute règle désactivée (globalement ou par `eslint-disable-next-line`) porte un commentaire qui dit pourquoi ; une désactivation globale se reporte dans le spec §11.4 dans le même commit.
- Une version de paquet qui n'existe plus ou un peer refusé : ne pas forcer (`--legacy-peer-deps` interdit), remonter au pilote.

---

## Carte des fichiers

| Fichier | Responsabilité | Tâche |
|---|---|---|
| `app/package.json`, `app/tsconfig*.json`, `app/electron.vite.config.ts` | manifeste, compilation, bundling trois cibles, alias `@`, `@shared`, `@wiki` | 1 |
| `app/src/main/index.ts` | cycle de vie Electron, câblage | 1, 11, 12 |
| `app/src/preload/index.ts`, `app/src/preload/index.d.ts` | `window.anka` typé | 1, 11 |
| `app/src/renderer/index.html`, `src/main.ts`, `src/App.vue` | point d'entrée Vue | 1, 5, 13 |
| `app/eslint.config.mjs`, `app/prettier.config.mjs`, `app/.prettierignore` | lint et format | 2 |
| `app/vitest.config.ts`, `app/.husky/pre-commit` | tests, hook pre-commit, script `verify` | 3 |
| `app/tests/lint/design-system.test.ts` + 7 fixtures `__lint_fixtures__/` | preuve que le lint casse | 4 |
| `app/components.json`, `app/src/renderer/src/assets/main.css`, `src/lib/utils.ts`, `src/components/ui/**` | Tailwind v4, tokens shadcn, composants générés | 5 |
| `app/src/shared/schemas/profile.ts`, `window-state.ts`, `transfer.ts` | schémas zod, valeurs par défaut, bundle d'export | 6 |
| `app/src/shared/ipc.ts` | contrat IPC (canaux, types, `AnkaApi`) | 6 |
| `app/src/shared/wiki/parse-fiche.ts` | frontmatter + sections → `Fiche` | 7 |
| `app/src/shared/wiki/render-markdown.ts` | markdown → HTML, réécriture des liens | 8 |
| `app/tests/wiki/all-fiches.test.ts` | gate de format du wiki réel | 9 |
| `app/src/main/store/json-store.ts`, `store/index.ts` | lecture/écriture atomique, migrations | 10 |
| `app/src/main/window.ts`, `app/src/main/ipc.ts` | fenêtre, handlers IPC, dialogues export/import | 11 |
| `app/src/main/updater-state.ts`, `updater.ts` | réduction des événements updater, câblage electron-updater | 12 |
| `app/src/renderer/src/router.ts`, `components/AppRail.vue`, `stores/profile.ts`, `lib/wiki-index.ts`, `composables/use-theme.ts` | coquille, routes, état | 13 |
| `components/FicheList.vue`, `FicheReader.vue`, `pages/WikiPage.vue` | lecteur wiki (variantes B et A) | 14 |
| `pages/ProfilPage.vue`, `pages/ElevagePage.vue` | profil, placeholder SP3 | 15 |
| `stores/updater.ts`, `pages/ParametresPage.vue` | thème, export/import, mise à jour | 16 |
| `app/electron-builder.yml`, `app/resources/icon.png`, `app/scripts/make-placeholder-icon.mjs` | packaging NSIS, icône placeholder | 17 |
| `.github/workflows/ci.yml`, `release.yml`, `.github/dependabot.yml`, `README.md` | CI, release, dépendances | 18 |
| (GitHub) PR, protection de branche | livraison | 19 |
| (GitHub) tags `v0.1.0`, `v0.1.1` | preuve de mise à jour | 20 |

---

## Phase A — Squelette et garde-fous

### Task 1 : squelette electron-vite qui démarre

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`, `app/tsconfig.node.json`, `app/tsconfig.web.json`
- Create: `app/electron.vite.config.ts`
- Create: `app/src/main/index.ts`
- Create: `app/src/preload/index.ts`, `app/src/preload/index.d.ts`
- Create: `app/src/renderer/index.html`, `app/src/renderer/src/main.ts`, `app/src/renderer/src/App.vue`, `app/src/renderer/src/env.d.ts`

- [ ] **Step 1 : écrire `app/package.json`**

Pas de `"type": "module"` : le preload d'une fenêtre `sandbox: true` doit être CommonJS, et electron-vite sort main et preload en CJS par défaut. Les bibliothèques du renderer sont en `devDependencies` : Vite les bundle, elles n'ont pas à être embarquées dans l'installateur. Seul `electron-updater` tourne dans main à l'exécution.

```json
{
  "name": "anka",
  "version": "0.1.0",
  "private": true,
  "description": "Outil compagnon personnel pour Dofus 3",
  "main": "./out/main/index.js",
  "author": "Dimitri Bahuaud",
  "license": "MIT",
  "homepage": "https://github.com/BahuaudDimitri/Anka",
  "repository": { "type": "git", "url": "https://github.com/BahuaudDimitri/Anka.git" },
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "vue-tsc --noEmit -p tsconfig.web.json && tsc --noEmit -p tsconfig.node.json",
    "test": "vitest run",
    "verify": "npm run lint && npm run format:check && npm run typecheck && npm run test",
    "dist": "npm run build && electron-builder --win --publish never",
    "icon": "node scripts/make-placeholder-icon.mjs",
    "prepare": "cd .. && husky app/.husky"
  },
  "dependencies": {
    "electron-updater": "^6.8.9"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/vite": "^4.3.3",
    "@types/markdown-it": "^14.2.0",
    "@types/node": "^24.0.0",
    "@vitejs/plugin-vue": "^6.0.8",
    "@vitest/eslint-plugin": "^1.6.27",
    "@vue/test-utils": "^2.5.0",
    "@vueuse/core": "^14.4.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "electron": "^44.2.0",
    "electron-builder": "^26.15.3",
    "electron-vite": "^5.0.0",
    "eslint": "^10.10.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-import-resolver-typescript": "^4.4.5",
    "eslint-plugin-import-x": "^4.17.1",
    "eslint-plugin-n": "^18.3.0",
    "eslint-plugin-promise": "^7.3.0",
    "eslint-plugin-regexp": "^3.3.0",
    "eslint-plugin-security": "^4.0.1",
    "eslint-plugin-sonarjs": "^4.2.0",
    "eslint-plugin-unicorn": "^74.0.0",
    "eslint-plugin-vue": "^10.10.0",
    "eslint-plugin-vuejs-accessibility": "^2.6.0",
    "globals": "^17.12.0",
    "happy-dom": "^20.14.0",
    "husky": "^9.1.7",
    "lint-staged": "^17.5.0",
    "lucide-vue-next": "^1.0.0",
    "markdown-it": "^15.0.1",
    "pinia": "^4.0.3",
    "prettier": "^3.9.6",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "reka-ui": "^2.10.4",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4.3.3",
    "tw-animate-css": "^1.4.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.69.0",
    "vite": "^7.3.6",
    "vitest": "^5.0.0",
    "vue": "^3.5.42",
    "vue-eslint-parser": "^10.4.1",
    "vue-router": "^5.3.1",
    "vue-sonner": "^2.0.9",
    "vue-tsc": "^3.3.11",
    "yaml": "^2.9.0",
    "zod": "^4.5.4"
  },
  "lint-staged": {
    "*.{ts,vue,mjs,js}": ["eslint --fix --max-warnings 0", "prettier --write"],
    "*.{json,yml,yaml,css,md}": ["prettier --write"]
  }
}
```

Toutes les versions ont été relevées sur npm le 2026-09-05. `@types/node` reste en `^24` (aligné sur le Node utilisé) même si une 26.x existe. `typescript` reste en `~5.9` (typescript-eslint refuse 6.1+). Si `npm install` remonte un peer refusé, remonter au pilote au lieu de forcer.

- [ ] **Step 2 : écrire les trois `tsconfig`**

`app/tsconfig.json` (racine : sert aux éditeurs et à la CLI shadcn-vue qui lit `paths` ici) :

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.web.json" }],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/src/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

`app/tsconfig.node.json` (main, preload, shared, tests Node, fichiers de config) :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],
    "types": ["electron-vite/node", "node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@shared/*": ["./src/shared/*"] }
  },
  "include": [
    "electron.vite.config.ts",
    "vitest.config.ts",
    "eslint.config.mjs",
    "prettier.config.mjs",
    "scripts/**/*",
    "src/main/**/*",
    "src/preload/**/*",
    "src/shared/**/*",
    "tests/**/*"
  ]
}
```

`app/tsconfig.web.json` (renderer, shared, types du preload) :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/src/*"],
      "@shared/*": ["./src/shared/*"]
    }
  },
  "include": [
    "src/renderer/src/**/*",
    "src/renderer/src/**/*.vue",
    "src/shared/**/*",
    "src/preload/*.d.ts"
  ]
}
```

- [ ] **Step 3 : écrire `app/electron.vite.config.ts`**

```ts
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

const appRoot = __dirname
const repoRoot = resolve(appRoot, '..')
const shared = resolve(appRoot, 'src/shared')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': shared } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': shared } },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(appRoot, 'src/renderer/src'),
        '@shared': shared,
        '@wiki': resolve(repoRoot, 'wiki'),
      },
    },
    plugins: [vue(), tailwindcss()],
    server: { fs: { allow: [repoRoot] } },
  },
})
```

- [ ] **Step 4 : écrire le main minimal `app/src/main/index.ts`**

Version « hello » remplacée en tâche 11 ; elle sert à prouver que le build tourne.

```ts
import { join } from 'node:path'

import { app, BrowserWindow } from 'electron'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.on('ready-to-show', () => {
    win.show()
  })
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl !== undefined) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return win
}

void app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
```

- [ ] **Step 5 : écrire le preload minimal et sa déclaration de type**

`app/src/preload/index.ts` :

```ts
import { contextBridge } from 'electron'

const api = {
  ping: (): string => 'pong',
}

export type AnkaApiBootstrap = typeof api

contextBridge.exposeInMainWorld('anka', api)
```

`app/src/preload/index.d.ts` :

```ts
import type { AnkaApiBootstrap } from './index'

declare global {
  interface Window {
    anka: AnkaApiBootstrap
  }
}

export {}
```

- [ ] **Step 6 : écrire le renderer minimal**

`app/src/renderer/index.html` :

```html
<!doctype html>
<html lang="fr" class="dark">
  <head>
    <meta charset="UTF-8" />
    <title>Anka</title>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
    />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

`app/src/renderer/src/main.ts` :

```ts
import { createApp } from 'vue'

import App from './App.vue'

createApp(App).mount('#app')
```

`app/src/renderer/src/App.vue` :

```vue
<script setup lang="ts">
const ping = window.anka.ping()
</script>

<template>
  <main>
    <h1>Anka</h1>
    <p>preload : {{ ping }}</p>
  </main>
</template>
```

`app/src/renderer/src/env.d.ts` :

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}
```

- [ ] **Step 7 : installer et builder**

Run (depuis `app/`) : `rtk npm install`
Expected : installation sans `ERESOLVE`. Un `ERESOLVE` = peer refusé : lire quel paquet, ajuster la version dans `package.json`, ne jamais `--legacy-peer-deps`. Note : `prepare` échoue tant que `.husky/` n'existe pas (tâche 3) ; c'est attendu, `npm install` affiche l'erreur du script `prepare` mais l'installation est faite. Si le script bloque l'installation, lancer `npm install --ignore-scripts` pour cette tâche uniquement.

Run : `rtk npm run build`
Expected : `out/main/index.js`, `out/preload/index.js`, `out/renderer/index.html` créés, aucune erreur.

Run : `rtk npm run typecheck`
Expected : aucune erreur (deux commandes, `vue-tsc` puis `tsc`).

Run (facultatif, vérification visuelle) : `rtk npm run dev` puis fermer la fenêtre. La fenêtre affiche « Anka » et « preload : pong ».

- [ ] **Step 8 : commit**

```bash
rtk git add app/package.json app/package-lock.json app/tsconfig.json app/tsconfig.node.json app/tsconfig.web.json app/electron.vite.config.ts app/src
rtk git commit -m "feat(app): squelette electron-vite (main, preload sandboxé, renderer Vue)"
```

### Task 2 : Prettier et ESLint (jeu de règles complet)

**Files:**
- Create: `app/prettier.config.mjs`, `app/.prettierignore`
- Create: `app/eslint.config.mjs`

- [ ] **Step 1 : Prettier**

`app/prettier.config.mjs` :

```js
/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'all',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/renderer/src/assets/main.css',
}
```

`app/.prettierignore` :

```
out/
dist/
node_modules/
package-lock.json
src/renderer/src/components/ui/
```

Les composants générés par shadcn-vue ne sont pas reformatés : on garde le code amont tel quel pour pouvoir le régénérer.

- [ ] **Step 2 : ESLint, config complète**

`app/eslint.config.mjs`. C'est la config du spec §11.4 plus quatre ajustements motivés en commentaire (`unicorn/prefer-global-this` en renderer, `unicorn/prefer-top-level-await` en main CJS, `vue/no-undef-components` qui ignore `RouterView`/`RouterLink`, les deux `prefer-regexp-exec` coupées). Reporter ces ajustements dans le spec §11.4 dans le même commit.

```js
// @ts-check
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
const FOREIGN_UI = [
  'vuetify',
  'element-plus',
  'primevue',
  'naive-ui',
  'quasar',
  'ant-design-vue',
  '@headlessui/vue',
  'bootstrap-vue-next',
  'radix-vue',
]
const NODE_GLOBALS_FORBIDDEN_IN_RENDERER = ['require', 'process', 'module', '__dirname', '__filename']

export default tseslint.config(
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**', '**/*.d.ts', 'coverage/**', LINT_FIXTURES],
  },

  // ---- Base JS + TS typé, tout app/ ------------------------------------------------
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
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
      // On écrit `str.match(re)` plutôt que RegExp#exec : lisible, et le nom de cette méthode
      // suivi d'une parenthèse déclenche un hook de sécurité local qui bloque l'écriture des
      // fichiers en session. Spec §11.4.
      '@typescript-eslint/prefer-regexp-exec': 'off',
      'regexp/prefer-regexp-exec': 'off',
    },
  },

  // ---- Imports, tout app/ -----------------------------------------------------------
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/shared', from: ['./src/main', './src/preload', './src/renderer'] },
            { target: './src/renderer', from: ['./src/main', './src/preload'] },
            { target: './src/preload', from: ['./src/main', './src/renderer'] },
            { target: './src/main', from: ['./src/renderer', './src/preload'] },
          ],
        },
      ],
    },
  },

  // ---- Robustesse générale, tout app/ ----------------------------------------------
  unicorn.configs.recommended,
  pluginRegexp.configs['flat/recommended'],
  pluginPromise.configs['flat/recommended'],
  {
    plugins: { sonarjs },
    rules: {
      // Idiomes Vue (props, ref, emit, e) et null des JSON/IPC : voir spec §11.4
      'unicorn/name-replacements': 'off',
      'unicorn/no-null': 'off',
      // Composants .vue en PascalCase, fichiers .ts en kebab-case (guide de style Vue)
      'unicorn/filename-case': ['error', { cases: { kebabCase: true, pascalCase: true } }],
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
    },
  },

  // ---- Vue SFC (renderer) -----------------------------------------------------------
  ...pluginVue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],
  {
    files: ['src/renderer/**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, sourceType: 'module' },
    },
    rules: {
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] },
      ],
      'vue/no-unused-refs': 'error',
      'vue/require-typed-ref': 'error',
      // RouterView / RouterLink sont enregistrés globalement par vue-router
      'vue/no-undef-components': ['error', { ignorePatterns: ['^Router(View|Link)$'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      // Design system (vision §9) : shadcn-vue obligatoire
      'vue/no-restricted-html-elements': [
        'error',
        { element: 'button', message: 'Utiliser <Button> de @/components/ui/button' },
        { element: 'input', message: 'Utiliser <Input> de @/components/ui/input' },
        { element: 'select', message: 'Utiliser <Select> de @/components/ui/select' },
        { element: 'textarea', message: 'Utiliser <Textarea> de @/components/ui/textarea' },
        { element: 'dialog', message: 'Utiliser <Dialog> ou <AlertDialog> de @/components/ui' },
        { element: 'table', message: 'Utiliser <Table> de @/components/ui/table' },
      ],
      'vue/no-restricted-class': ['error', TAILWIND_RAW_COLOR],
    },
  },
  {
    files: ['src/renderer/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: FOREIGN_UI.flatMap((name) => [name, `${name}/*`]),
              message: 'Une seule bibliothèque UI : shadcn-vue (reka-ui) dans @/components/ui',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...NODE_GLOBALS_FORBIDDEN_IN_RENDERER.map((name) => ({
          name,
          message: 'Le renderer ne touche pas Node : passer par window.anka (preload/IPC).',
        })),
      ],
      'import-x/no-nodejs-modules': 'error',
      // `window` est le global explicite du renderer ; globalThis masquerait la frontière
      'unicorn/prefer-global-this': 'off',
    },
  },

  // ---- Composants shadcn-vue générés -------------------------------------------------
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
      // Le label des contrôles générés vient du composant parent
      'vuejs-accessibility/form-control-has-label': 'off',
      'vuejs-accessibility/label-has-for': 'off',
    },
  },

  // ---- main (Node) ------------------------------------------------------------------
  {
    files: ['src/main/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { n: pluginN, security: pluginSecurity },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      // Bruit connu sur tout accès obj[clé] (table de migrations) : spec §11.4
      'security/detect-object-injection': 'off',
      'n/no-process-exit': 'error',
      'n/no-deprecated-api': 'error',
      'n/prefer-node-protocol': 'error',
      // main est bundlé en CommonJS par electron-vite : pas de top-level await possible
      'unicorn/prefer-top-level-await': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "NewExpression[callee.name='BrowserWindow'] Property[key.name='nodeIntegration'][value.value=true]",
          message: 'nodeIntegration reste false : le renderer ne doit jamais voir Node.',
        },
        {
          selector:
            "NewExpression[callee.name='BrowserWindow'] Property[key.name='contextIsolation'][value.value=false]",
          message: 'contextIsolation reste true.',
        },
        {
          selector:
            "NewExpression[callee.name='BrowserWindow'] Property[key.name='sandbox'][value.value=false]",
          message: 'sandbox reste true.',
        },
      ],
    },
  },

  // ---- preload (Node + contextBridge) -----------------------------------------------
  {
    files: ['src/preload/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { n: pluginN, security: pluginSecurity },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      'n/no-process-exit': 'error',
      'n/prefer-node-protocol': 'error',
      'unicorn/prefer-top-level-await': 'off',
    },
  },

  // ---- shared : ni Node ni DOM --------------------------------------------------------
  {
    files: ['src/shared/**/*.ts'],
    rules: { 'import-x/no-nodejs-modules': 'error' },
  },

  // ---- tests ---------------------------------------------------------------------------
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

  // ---- fichiers de config et scripts à la racine de app/ -----------------------------
  {
    files: ['*.config.ts', '*.config.mjs', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'unicorn/prefer-module': 'off',
    },
  },

  eslintConfigPrettier, // toujours en dernier
)
```

- [ ] **Step 3 : lancer lint et format sur le squelette**

Run : `rtk npx prettier --write .` puis `rtk npm run lint`
Expected : la première commande reformate les fichiers de la tâche 1 ; la seconde sort **zéro** erreur. Si des erreurs remontent sur le squelette (par ex. `import-x/no-unresolved` sur `./App.vue` ou `@/…`), c'est le résolveur TypeScript : vérifier que `eslint-import-resolver-typescript` est installé et que `importX.flatConfigs.typescript` est bien présent. Si une règle d'un preset se révèle inapplicable au projet (bruit répété, pas un vrai défaut), la désactiver **avec un commentaire** et reporter dans le spec §11.4 ; ne pas contourner ligne à ligne.

Erreur attendue et normale : `import-x/no-unresolved` sur `'@wiki/...'` n'apparaît pas encore (aucun import). `@types/markdown-it` inutilisé n'est pas une erreur.

Run : `rtk npm run format:check`
Expected : `All matched files use Prettier code style!`

- [ ] **Step 4 : reporter les ajustements dans le spec**

Modifier `docs/superpowers/specs/2026-09-05-sp2-socle-app-design.md` §11.4, liste des corrections (après le point 4), ajouter :

```
5. `unicorn/prefer-global-this` off dans le renderer (`window` est le global explicite de la
   frontière renderer), `unicorn/prefer-top-level-await` off dans main et preload (bundle CJS),
   `vue/no-undef-components` ignore `RouterView` et `RouterLink` (enregistrés par vue-router),
   `@typescript-eslint/prefer-regexp-exec` et `regexp/prefer-regexp-exec` off (on écrit
   `str.match(re)` plutôt que RegExp#exec : le nom de cette méthode suivi d'une parenthèse
   déclenche un hook de sécurité local qui bloque l'écriture des fichiers en session).
```

- [ ] **Step 5 : commit**

```bash
rtk git add app/eslint.config.mjs app/prettier.config.mjs app/.prettierignore app/src app/electron.vite.config.ts docs/superpowers/specs/2026-09-05-sp2-socle-app-design.md
rtk git commit -m "chore(app): ESLint 10 flat config (14 plugins, design system) et Prettier"
```

### Task 3 : Vitest, `verify`, husky + lint-staged

**Files:**
- Create: `app/vitest.config.ts`
- Create: `app/src/shared/smoke.test.ts` (supprimé en tâche 6)
- Create: `app/.husky/pre-commit`

- [ ] **Step 1 : `app/vitest.config.ts`**

```ts
import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    // les tests DOM déclarent `// @vitest-environment happy-dom` en tête de fichier
    testTimeout: 20_000,
  },
})
```

- [ ] **Step 2 : un test de fumée pour prouver le câblage**

`app/src/shared/smoke.test.ts` :

```ts
import { expect, test } from 'vitest'

test('vitest tourne', () => {
  expect(1 + 1).toBe(2)
})
```

Run : `rtk npm test`
Expected : `1 passed`.

- [ ] **Step 3 : husky + lint-staged**

Run (depuis `app/`) : `rtk npx husky app/.husky` **ne marche pas depuis app/** : husky doit être initialisé depuis la racine git. Faire :

```bash
cd .. && rtk npx --prefix app husky app/.husky && cd app
```

Cela crée `app/.husky/` et pointe `core.hooksPath` dessus. Écrire `app/.husky/pre-commit` :

```sh
cd app && npx lint-staged
```

Vérifier : `rtk git config core.hooksPath` → `app/.husky`.

- [ ] **Step 4 : `verify` complet**

Run : `rtk npm run verify`
Expected : lint 0 erreur, format OK, typecheck OK, `1 passed`. Coller la sortie brute dans le rapport de tâche.

- [ ] **Step 5 : commit (le hook pre-commit tourne pour la première fois)**

```bash
rtk git add app/vitest.config.ts app/src/shared/smoke.test.ts app/.husky/pre-commit
rtk git commit -m "chore(app): vitest, gate verify, husky + lint-staged"
```

Expected : lint-staged s'exécute (`✔ Running tasks…`) puis le commit passe.

### Task 4 : le test qui prouve que le lint casse

**Files:**
- Create: `app/tests/lint/design-system.test.ts`
- Create: `app/src/renderer/src/__lint_fixtures__/NativeButton.vue`
- Create: `app/src/renderer/src/__lint_fixtures__/RawColor.vue`
- Create: `app/src/renderer/src/__lint_fixtures__/ForeignUi.vue`
- Create: `app/src/renderer/src/__lint_fixtures__/NodeInRenderer.ts`
- Create: `app/src/renderer/src/components/ui/__lint_fixtures__/NativeButton.vue`
- Create: `app/src/main/__lint_fixtures__/insecure-window.ts`
- Create: `app/src/shared/__lint_fixtures__/imports-main.ts`

- [ ] **Step 1 : écrire le test (il échoue : fixtures absentes)**

`app/tests/lint/design-system.test.ts` :

```ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { ESLint } from 'eslint'
import { beforeAll, describe, expect, test } from 'vitest'

const APP_ROOT = resolve(__dirname, '../..')
const fixture = (relative: string): string => resolve(APP_ROOT, relative)

const RENDERER_FIXTURES = 'src/renderer/src/__lint_fixtures__'
const UI_FIXTURES = 'src/renderer/src/components/ui/__lint_fixtures__'

const ALL_FIXTURES = [
  `${RENDERER_FIXTURES}/NativeButton.vue`,
  `${RENDERER_FIXTURES}/RawColor.vue`,
  `${RENDERER_FIXTURES}/ForeignUi.vue`,
  `${RENDERER_FIXTURES}/NodeInRenderer.ts`,
  `${UI_FIXTURES}/NativeButton.vue`,
  'src/main/__lint_fixtures__/insecure-window.ts',
  'src/shared/__lint_fixtures__/imports-main.ts',
]

// `ignore: false` : on force le lint des dossiers __lint_fixtures__ que la config ignore
const linter = new ESLint({ cwd: APP_ROOT, ignore: false })
// instance par défaut : sert à prouver que `eslint .` ignore bien ces fichiers
const defaultLinter = new ESLint({ cwd: APP_ROOT })

async function ruleIds(relative: string): Promise<string[]> {
  const [result] = await linter.lintFiles([fixture(relative)])
  if (result === undefined) throw new Error(`aucun résultat pour ${relative}`)
  return result.messages.map((m) => m.ruleId ?? `fatal:${m.message}`)
}

function count(ids: string[], ruleId: string): number {
  return ids.filter((id) => id === ruleId).length
}

beforeAll(() => {
  for (const relative of ALL_FIXTURES) {
    if (!existsSync(fixture(relative))) throw new Error(`fixture manquante : ${relative}`)
  }
})

describe('les fixtures sont invisibles pour `eslint .`', () => {
  test.each(ALL_FIXTURES)('%s est ignorée', async (relative) => {
    expect(await defaultLinter.isPathIgnored(fixture(relative))).toBe(true)
  })
})

describe('design system', () => {
  test('un <button> natif hors components/ui est refusé, avec le composant à utiliser', async () => {
    const [result] = await linter.lintFiles([fixture(`${RENDERER_FIXTURES}/NativeButton.vue`)])
    const messages = (result?.messages ?? []).filter(
      (m) => m.ruleId === 'vue/no-restricted-html-elements',
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.message).toContain('<Button>')
  })

  test('les couleurs Tailwind brutes sont refusées, les tokens shadcn acceptés', async () => {
    const ids = await ruleIds(`${RENDERER_FIXTURES}/RawColor.vue`)
    expect(count(ids, 'vue/no-restricted-class')).toBe(4)
  })

  test('une autre bibliothèque UI est refusée, y compris par sous-chemin', async () => {
    const ids = await ruleIds(`${RENDERER_FIXTURES}/ForeignUi.vue`)
    expect(count(ids, 'no-restricted-imports')).toBe(2)
  })

  test('le même <button> dans components/ui passe', async () => {
    const ids = await ruleIds(`${UI_FIXTURES}/NativeButton.vue`)
    expect(count(ids, 'vue/no-restricted-html-elements')).toBe(0)
    expect(count(ids, 'vue/no-restricted-class')).toBe(0)
  })
})

describe('étanchéité des processus', () => {
  test('le renderer ne peut ni importer Node ni toucher process', async () => {
    const ids = await ruleIds(`${RENDERER_FIXTURES}/NodeInRenderer.ts`)
    expect(count(ids, 'import-x/no-nodejs-modules')).toBe(1)
    expect(count(ids, 'no-restricted-globals')).toBe(1)
  })

  test('une BrowserWindow non sandboxée est refusée trois fois', async () => {
    const ids = await ruleIds('src/main/__lint_fixtures__/insecure-window.ts')
    expect(count(ids, 'no-restricted-syntax')).toBe(3)
  })

  test('shared ne peut pas importer main', async () => {
    const ids = await ruleIds('src/shared/__lint_fixtures__/imports-main.ts')
    expect(count(ids, 'import-x/no-restricted-paths')).toBe(1)
  })
})
```

Run : `rtk npx vitest run tests/lint`
Expected : FAIL, `fixture manquante : src/renderer/src/__lint_fixtures__/NativeButton.vue`.

- [ ] **Step 2 : écrire les sept fixtures**

`app/src/renderer/src/__lint_fixtures__/NativeButton.vue` :

```vue
<script setup lang="ts">
const label = 'Cliquer'
</script>

<template>
  <button type="button">{{ label }}</button>
</template>
```

`app/src/renderer/src/__lint_fixtures__/RawColor.vue` (4 classes interdites, 3 tokens permis) :

```vue
<script setup lang="ts">
const title = 'Couleurs'
</script>

<template>
  <div class="bg-red-500 hover:text-gray-700 dark:hover:border-slate-200/50 bg-black/40">
    <p class="bg-primary text-muted-foreground border-border">{{ title }}</p>
  </div>
</template>
```

`app/src/renderer/src/__lint_fixtures__/ForeignUi.vue` :

```vue
<script setup lang="ts">
import { NButton } from 'naive-ui'
import PrimeButton from 'primevue/button'

const components = [NButton, PrimeButton]
</script>

<template>
  <p>{{ components.length }}</p>
</template>
```

`app/src/renderer/src/__lint_fixtures__/NodeInRenderer.ts` :

```ts
import fs from 'node:fs'

export function cwdFiles(): string[] {
  return fs.readdirSync(process.cwd())
}
```

`app/src/renderer/src/components/ui/__lint_fixtures__/NativeButton.vue` : même contenu que la fixture `NativeButton.vue` du renderer (copie exacte).

`app/src/main/__lint_fixtures__/insecure-window.ts` :

```ts
import { BrowserWindow } from 'electron'

export function createInsecureWindow(): BrowserWindow {
  return new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  })
}
```

`app/src/shared/__lint_fixtures__/imports-main.ts` :

```ts
import '../../main/index'

export const marker = 'shared ne doit pas importer main'
```

- [ ] **Step 3 : lancer le test**

Run : `rtk npx vitest run tests/lint`
Expected : PASS, 7 tests « ignorée » + 7 tests de règles. Deux échecs possibles et leur lecture :

- `count(..., 'vue/no-restricted-class')` vaut 3 au lieu de 4 : la regex ne prend pas `bg-black/40` ; vérifier que `black|white` sont dans l'alternance et que `(?:-\d{2,3})?` est bien optionnel.
- `no-restricted-syntax` vaut 0 : le sélecteur esquery ne matche pas (c'était le « non vérifié » du rapport). Ouvrir l'AST avec `npx eslint --print-config` ne suffit pas ; utiliser https://typescript-eslint.io/play pour ajuster le sélecteur (`Property[key.name=...]` sous `ObjectExpression` dans `NewExpression`). Corriger dans `eslint.config.mjs` et dans le spec §11.4.

Run : `rtk npm run lint`
Expected : 0 erreur (les fixtures sont ignorées). Si `eslint .` linte une fixture, `LINT_FIXTURES` n'est pas dans `ignores`.

- [ ] **Step 4 : verify et commit**

Run : `rtk npm run verify` → tout vert (coller la sortie).

```bash
rtk git add app/tests/lint app/src/renderer/src/__lint_fixtures__ app/src/renderer/src/components/ui/__lint_fixtures__ app/src/main/__lint_fixtures__ app/src/shared/__lint_fixtures__
rtk git commit -m "test(app): preuve que les garde-fous ESLint cassent (7 fixtures)"
```

### Task 5 : Tailwind v4, tokens shadcn, composants générés, thème sombre

**Files:**
- Create: `app/components.json`
- Create: `app/src/renderer/src/assets/main.css`
- Create: `app/src/renderer/src/lib/utils.ts`
- Create (par la CLI): `app/src/renderer/src/components/ui/**`
- Modify: `app/src/renderer/src/main.ts`, `app/src/renderer/src/App.vue`

- [ ] **Step 1 : `app/components.json`**

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "new-york",
  "typescript": true,
  "tailwind": {
    "config": "",
    "css": "src/renderer/src/assets/main.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "composables": "@/composables",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib"
  }
}
```

- [ ] **Step 2 : `app/src/renderer/src/assets/main.css`** (thème neutral de shadcn, Tailwind v4)

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
  /* Statuts du wiki (sémantiques, pas de palette brute dans les templates) */
  --status-valide: oklch(0.6 0.15 150);
  --status-valide-foreground: oklch(0.98 0 0);
  --status-hypothese: oklch(0.75 0.16 75);
  --status-hypothese-foreground: oklch(0.2 0 0);
  --status-obsolete: oklch(0.6 0 0);
  --status-obsolete-foreground: oklch(0.98 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
  --status-valide: oklch(0.7 0.15 150);
  --status-valide-foreground: oklch(0.15 0 0);
  --status-hypothese: oklch(0.8 0.15 75);
  --status-hypothese-foreground: oklch(0.2 0 0);
  --status-obsolete: oklch(0.5 0 0);
  --status-obsolete-foreground: oklch(0.98 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-status-valide: var(--status-valide);
  --color-status-valide-foreground: var(--status-valide-foreground);
  --color-status-hypothese: var(--status-hypothese);
  --color-status-hypothese-foreground: var(--status-hypothese-foreground);
  --color-status-obsolete: var(--status-obsolete);
  --color-status-obsolete-foreground: var(--status-obsolete-foreground);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Contenu markdown des fiches (rendu par markdown-it, hors composants) */
.fiche-prose h3 {
  @apply mt-6 mb-2 text-lg font-semibold;
}
.fiche-prose h4 {
  @apply mt-4 mb-1 font-semibold;
}
.fiche-prose p {
  @apply my-2 leading-relaxed;
}
.fiche-prose ul {
  @apply my-2 list-disc pl-6;
}
.fiche-prose ol {
  @apply my-2 list-decimal pl-6;
}
.fiche-prose li {
  @apply my-1;
}
.fiche-prose a {
  @apply text-primary underline underline-offset-4;
}
.fiche-prose table {
  @apply my-3 w-full border-collapse text-sm;
}
.fiche-prose th,
.fiche-prose td {
  @apply border-border border px-2 py-1 text-left align-top;
}
.fiche-prose th {
  @apply bg-muted font-semibold;
}
.fiche-prose code {
  @apply bg-muted rounded px-1 py-0.5 text-sm;
}
.fiche-prose blockquote {
  @apply border-border text-muted-foreground my-2 border-l-2 pl-4 italic;
}
```

Les trois couleurs de statut (`status-valide`, `status-hypothese`, `status-obsolete`) sont des tokens sémantiques ajoutés au thème : `bg-status-valide` passe la règle `vue/no-restricted-class` (ce n'est pas un nom de palette Tailwind).

- [ ] **Step 3 : `app/src/renderer/src/lib/utils.ts`**

```ts
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4 : générer les composants shadcn-vue**

Run (depuis `app/`) :

```bash
rtk npx shadcn-vue@latest add -y --overwrite button input label badge accordion alert-dialog select radio-group tooltip scroll-area separator sonner card
```

Expected : dossiers créés sous `src/renderer/src/components/ui/` (`button/`, `input/`, `label/`, `badge/`, `accordion/`, `alert-dialog/`, `select/`, `radio-group/`, `tooltip/`, `scroll-area/`, `separator/`, `sonner/`, `card/`), chacun avec un `index.ts`. La CLI peut ajouter des dépendances à `package.json` (`reka-ui`, `vue-sonner`, `lucide-vue-next`, `@vueuse/core`) : les laisser, vérifier qu'elles restent en `devDependencies` (les déplacer sinon, elles sont bundlées par Vite).

Si la CLI échoue à résoudre l'alias `@/` : elle lit `tsconfig.json` à la racine de `app/` ; vérifier que `compilerOptions.paths` y est bien (tâche 1). Si elle demande une confirmation interactive malgré `-y`, relancer avec `--yes`.

Vérifier que la CLI n'a **pas** modifié `main.css` (elle ne le fait qu'à `init`, qu'on n'utilise pas). Si elle l'a fait, restaurer avec `git checkout -- src/renderer/src/assets/main.css` et rejouer l'étape 2.

- [ ] **Step 5 : brancher le CSS et vérifier que le lint accepte les composants générés**

`app/src/renderer/src/main.ts` :

```ts
import { createApp } from 'vue'

import App from './App.vue'
import './assets/main.css'

createApp(App).mount('#app')
```

`app/src/renderer/src/App.vue` (temporaire, remplacé en tâche 13) :

```vue
<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ping = window.anka.ping()
</script>

<template>
  <main class="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4">
    <h1 class="text-2xl font-semibold">Anka</h1>
    <Badge variant="secondary">preload : {{ ping }}</Badge>
    <Button>shadcn-vue fonctionne</Button>
  </main>
</template>
```

Run : `rtk npx eslint src/renderer/src/components/ui` puis `rtk npm run verify`
Expected : le premier lint sort 0 erreur sur les composants générés. S'il en sort (règles unicorn ou a11y qui cassent le code amont), **ne pas modifier les composants générés** : ajouter la règle au bloc d'exemption `UI_GENERATED` de `eslint.config.mjs` avec un commentaire, et reporter dans le spec §11.4. `verify` vert ensuite.

Run (visuel) : `rtk npm run dev` → fond sombre, bouton shadcn, badge. Fermer.

- [ ] **Step 6 : commit**

```bash
rtk git add app/components.json app/src/renderer/src/assets/main.css app/src/renderer/src/lib/utils.ts app/src/renderer/src/components/ui app/src/renderer/src/main.ts app/src/renderer/src/App.vue app/package.json app/package-lock.json app/eslint.config.mjs docs/superpowers/specs/2026-09-05-sp2-socle-app-design.md
rtk git commit -m "feat(app): Tailwind v4, tokens shadcn (thème sombre), 13 composants shadcn-vue"
```

---

## Phase B — Modules partagés purs (aucune dépendance Electron ni Vue)

### Task 6 : schémas zod, contrat IPC

**Files:**
- Create: `app/src/shared/schemas/profile.ts`
- Create: `app/src/shared/schemas/window-state.ts`
- Create: `app/src/shared/schemas/transfer.ts`
- Create: `app/src/shared/schemas/transfer.test.ts`
- Create: `app/src/shared/ipc.ts`
- Delete: `app/src/shared/smoke.test.ts`

- [ ] **Step 1 : test du bundle d'export (échoue : module absent)**

`app/src/shared/schemas/transfer.test.ts` :

```ts
import { describe, expect, test } from 'vitest'

import { defaultProfile } from './profile'
import { buildExportBundle, EXPORT_VERSION, validateImport } from './transfer'

const now = new Date('2026-09-05T10:00:00.000Z')

describe('buildExportBundle', () => {
  test('emballe le profil avec version, date et version de l’app', () => {
    const bundle = buildExportBundle({ profile: defaultProfile(), appVersion: '0.1.0', now })
    expect(bundle).toEqual({
      exportVersion: EXPORT_VERSION,
      exportedAt: '2026-09-05T10:00:00.000Z',
      appVersion: '0.1.0',
      data: { profile: { schemaVersion: 1, serveur: '', pseudo: '' } },
    })
  })
})

describe('validateImport', () => {
  const valid = buildExportBundle({
    profile: { schemaVersion: 1, serveur: 'Draconiros', pseudo: 'Anka' },
    appVersion: '0.1.0',
    now,
  })

  test('accepte un bundle produit par buildExportBundle', () => {
    expect(validateImport(valid)).toEqual({ ok: true, bundle: valid })
  })

  test('refuse un exportVersion inconnu', () => {
    const result = validateImport({ ...valid, exportVersion: 99 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('exportVersion')
  })

  test('refuse un domaine de données inconnu', () => {
    const result = validateImport({ ...valid, data: { ...valid.data, elevage: {} } })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('elevage')
  })

  test('refuse un profil invalide et nomme le champ', () => {
    const result = validateImport({
      ...valid,
      data: { profile: { schemaVersion: 1, serveur: 'x'.repeat(61), pseudo: '' } },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('serveur')
  })

  test('refuse ce qui n’est pas un objet', () => {
    expect(validateImport('pas un bundle').ok).toBe(false)
    expect(validateImport(null).ok).toBe(false)
  })
})
```

Run : `rtk npx vitest run src/shared/schemas`
Expected : FAIL, `Cannot find module './transfer'`.

- [ ] **Step 2 : `app/src/shared/schemas/profile.ts`**

```ts
import { z } from 'zod'

export const PROFILE_SCHEMA_VERSION = 1

export const ProfileSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  serveur: z.string().trim().max(60).default(''),
  pseudo: z.string().trim().max(40).default(''),
})

export type Profile = z.infer<typeof ProfileSchema>

export function defaultProfile(): Profile {
  return { schemaVersion: PROFILE_SCHEMA_VERSION, serveur: '', pseudo: '' }
}
```

- [ ] **Step 3 : `app/src/shared/schemas/window-state.ts`**

```ts
import { z } from 'zod'

export const WINDOW_STATE_SCHEMA_VERSION = 1
export const WINDOW_MIN_WIDTH = 900
export const WINDOW_MIN_HEIGHT = 600

export const WindowStateSchema = z.object({
  schemaVersion: z.literal(WINDOW_STATE_SCHEMA_VERSION),
  width: z.number().int().min(WINDOW_MIN_WIDTH),
  height: z.number().int().min(WINDOW_MIN_HEIGHT),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  maximized: z.boolean().default(false),
})

export type WindowState = z.infer<typeof WindowStateSchema>

export function defaultWindowState(): WindowState {
  return { schemaVersion: WINDOW_STATE_SCHEMA_VERSION, width: 1200, height: 800, maximized: false }
}
```

- [ ] **Step 4 : `app/src/shared/schemas/transfer.ts`**

```ts
import { z } from 'zod'

import { ProfileSchema } from './profile'

import type { Profile } from './profile'

export const EXPORT_VERSION = 1

export const ExportBundleSchema = z.strictObject({
  exportVersion: z.literal(EXPORT_VERSION),
  exportedAt: z.iso.datetime(),
  appVersion: z.string().min(1),
  data: z.strictObject({
    profile: ProfileSchema,
  }),
})

export type ExportBundle = z.infer<typeof ExportBundleSchema>

export function buildExportBundle(input: {
  profile: Profile
  appVersion: string
  now: Date
}): ExportBundle {
  return {
    exportVersion: EXPORT_VERSION,
    exportedAt: input.now.toISOString(),
    appVersion: input.appVersion,
    data: { profile: input.profile },
  }
}

export type ImportValidation = { ok: true; bundle: ExportBundle } | { ok: false; reason: string }

export function validateImport(raw: unknown): ImportValidation {
  const parsed = ExportBundleSchema.safeParse(raw)
  if (parsed.success) return { ok: true, bundle: parsed.data }
  return { ok: false, reason: z.prettifyError(parsed.error) }
}
```

`z.strictObject` refuse toute clé inconnue : c'est ce qui rejette le domaine `elevage` du test (le message de `prettifyError` cite la clé).

- [ ] **Step 5 : `app/src/shared/ipc.ts`**

```ts
import type { Profile } from './schemas/profile'

export const IPC = {
  storeRead: 'store:read',
  storeWrite: 'store:write',
  transferExport: 'transfer:export',
  transferImport: 'transfer:import',
  updaterCheck: 'updater:check',
  updaterGetState: 'updater:get-state',
  updaterQuitAndInstall: 'updater:quit-and-install',
  updaterState: 'updater:state',
  appVersion: 'app:version',
  appOpenExternal: 'app:open-external',
} as const

export interface StoreData {
  profile: Profile
}
export type StoreKey = keyof StoreData
export const STORE_KEYS: readonly StoreKey[] = ['profile']

export function isStoreKey(value: unknown): value is StoreKey {
  return typeof value === 'string' && (STORE_KEYS as readonly string[]).includes(value)
}

export type UpdaterState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; percent: number }
  | { status: 'ready'; version: string }
  | { status: 'up-to-date' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }

export type ExportResult = { ok: true; path: string } | { ok: false; reason: 'cancelled' }

export type ImportResult =
  | { ok: true; path: string }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'invalid'; details: string }

export interface AnkaApi {
  store: {
    read<K extends StoreKey>(key: K): Promise<StoreData[K]>
    write<K extends StoreKey>(key: K, data: StoreData[K]): Promise<void>
  }
  transfer: {
    exportAll(): Promise<ExportResult>
    importAll(): Promise<ImportResult>
  }
  updater: {
    check(): Promise<void>
    getState(): Promise<UpdaterState>
    quitAndInstall(): Promise<void>
    onState(callback: (state: UpdaterState) => void): () => void
  }
  app: {
    version(): Promise<string>
    openExternal(url: string): Promise<void>
  }
}
```

- [ ] **Step 6 : tests verts, supprimer le test de fumée, verify, commit**

Run : `rtk npx vitest run src/shared/schemas` → PASS (6 tests).

```bash
rtk git rm -q app/src/shared/smoke.test.ts
```

Run : `rtk npm run verify` → vert (coller la sortie).

```bash
rtk git add app/src/shared/schemas app/src/shared/ipc.ts
rtk git commit -m "feat(shared): schémas zod (profil, fenêtre, bundle d'export) et contrat IPC"
```

### Task 7 : parseur de fiche (frontmatter + sections)

**Files:**
- Create: `app/src/shared/wiki/parse-fiche.ts`
- Create: `app/src/shared/wiki/parse-fiche.test.ts`

Contrat : `wiki/CONVENTIONS.md` (8 clés de frontmatter, 5 sections `## ` dans l'ordre exact, `slug` = nom de fichier). Constat sur les 12 fiches réelles (2026-09-05) : aucune n'a de titre `# `, toutes ont exactement les 5 sections, `derniere_verif` est toujours `AAAA-MM-JJ`, les `date` de sources sont hétérogènes (`2026-02`, `"2026"`, `"non précisée"`, `2014-08 (système pré-3.5)`) : la date d'une source est donc une **chaîne libre**, pas une date typée. Le texte avant la première section est ignoré. Les fins de ligne CRLF sont normalisées.

- [ ] **Step 1 : le test (échoue : module absent)**

`app/src/shared/wiki/parse-fiche.test.ts` :

```ts
import { describe, expect, test } from 'vitest'

import { FicheFormatError, parseFiche, SECTION_TITLES } from './parse-fiche'

const FRONTMATTER = `---
titre: Les jauges d'une dragodinde
slug: jauges
statut: valide
confiance: haute
version_dofus: "3.5"
derniere_verif: 2026-09-05
sources:
  - url: https://www.dofuspourlesnoobs.com/guide-de-l-eleveur.html
    titre: "Guide de l'éleveur (édition 2026)"
    date: 2026-02
  - url: https://www.next-stage.fr/2026/04/tuto.html
    titre: Tuto élevage
    date: "s.d. (annonce de la refonte 3.5)"
tags: [dragodinde, jauges]
---`

const BODY = `
## En bref

Six jauges, deux actives au plus.

## Détails

### Énergie

Détail des jauges. Voir [reproduction](reproduction.md).

## Pièges fréquents

- Oublier la fatigue.

## Chiffres

| Valeur | Source |
|---|---|
| 10 000 | Guide |

## À challenger
`

const RAW = `${FRONTMATTER}\n${BODY}`
const PATH = 'C:/repo/wiki/dragodindes/jauges.md'

describe('parseFiche : fiche conforme', () => {
  const fiche = parseFiche(PATH, RAW)

  test('lit le frontmatter en camelCase', () => {
    expect(fiche).toMatchObject({
      slug: 'jauges',
      dossier: 'dragodindes',
      titre: "Les jauges d'une dragodinde",
      statut: 'valide',
      confiance: 'haute',
      versionDofus: '3.5',
      derniereVerif: '2026-09-05',
      tags: ['dragodinde', 'jauges'],
    })
    expect(fiche.sources).toHaveLength(2)
    expect(fiche.sources[0]).toEqual({
      url: 'https://www.dofuspourlesnoobs.com/guide-de-l-eleveur.html',
      titre: "Guide de l'éleveur (édition 2026)",
      date: '2026-02',
    })
    expect(fiche.sources[1]?.date).toBe('s.d. (annonce de la refonte 3.5)')
  })

  test('découpe les cinq sections dans l’ordre, sous-titres inclus dans le contenu', () => {
    expect(Object.keys(fiche.sections)).toEqual([...SECTION_TITLES])
    expect(fiche.sections['En bref']).toBe('Six jauges, deux actives au plus.')
    expect(fiche.sections['Détails']).toContain('### Énergie')
    expect(fiche.sections['Chiffres']).toContain('| 10 000 | Guide |')
    expect(fiche.sections['À challenger']).toBe('')
  })

  test('accepte les fins de ligne CRLF et les chemins Windows', () => {
    const crlf = RAW.replaceAll('\n', '\r\n')
    expect(parseFiche('C:\\repo\\wiki\\dragodindes\\jauges.md', crlf).slug).toBe('jauges')
  })
})

describe('parseFiche : refus, avec le champ nommé', () => {
  const cases: [string, string, RegExp][] = [
    ['clé manquante', RAW.replace('confiance: haute\n', ''), /confiance/],
    ['statut inconnu', RAW.replace('statut: valide', 'statut: sur'), /statut/],
    [
      'section absente',
      RAW.replace('## Pièges fréquents\n\n- Oublier la fatigue.\n', ''),
      /Pièges fréquents/,
    ],
    [
      'sections en désordre',
      RAW.replace('## En bref\n\nSix jauges, deux actives au plus.\n\n## Détails', '## Détails').replace(
        '## Pièges fréquents',
        '## En bref\n\nSix jauges.\n\n## Pièges fréquents',
      ),
      /ordre/,
    ],
    [
      'section inattendue',
      RAW.replace('## À challenger\n', '## À challenger\n\n## Bonus\n\ntexte\n'),
      /Bonus/,
    ],
    ['slug différent du nom de fichier', RAW.replace('slug: jauges', 'slug: jauge'), /jauge/],
    ['frontmatter absent', BODY, /frontmatter/],
  ]

  test.each(cases)('%s', (_label, raw, expected) => {
    expect(() => parseFiche(PATH, raw)).toThrow(FicheFormatError)
    expect(() => parseFiche(PATH, raw)).toThrow(expected)
  })

  test('le message commence par le chemin', () => {
    expect(() => parseFiche(PATH, BODY)).toThrow(/^C:\/repo\/wiki\/dragodindes\/jauges\.md : /)
  })
})
```

Run : `rtk npx vitest run src/shared/wiki`
Expected : FAIL, `Cannot find module './parse-fiche'`.

- [ ] **Step 2 : `app/src/shared/wiki/parse-fiche.ts`**

```ts
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

export const SECTION_TITLES = [
  'En bref',
  'Détails',
  'Pièges fréquents',
  'Chiffres',
  'À challenger',
] as const
export type SectionTitle = (typeof SECTION_TITLES)[number]

export type FicheStatut = 'hypothese' | 'valide' | 'obsolete'
export type FicheConfiance = 'haute' | 'moyenne' | 'basse'

export interface FicheSource {
  url: string
  titre: string
  date: string
}

export interface Fiche {
  slug: string
  dossier: string
  titre: string
  statut: FicheStatut
  confiance: FicheConfiance
  versionDofus: string
  derniereVerif: string
  sources: FicheSource[]
  tags: string[]
  sections: Record<SectionTitle, string>
}

export class FicheFormatError extends Error {
  constructor(
    public readonly path: string,
    detail: string,
  ) {
    super(`${path} : ${detail}`)
    this.name = 'FicheFormatError'
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SECTION_HEADING = /^## (.+?)\s*$/

// Le schéma YAML « core » du paquet yaml laisse les dates en chaîne ; on accepte aussi Date et
// number par prudence (2026 non quoté devient un nombre).
const textLike = z.union([z.string(), z.date(), z.number()]).transform((value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
})

const FrontmatterSchema = z.object({
  titre: z.string().min(1),
  slug: z.string().regex(SLUG_PATTERN, 'kebab-case attendu'),
  statut: z.enum(['hypothese', 'valide', 'obsolete']),
  confiance: z.enum(['haute', 'moyenne', 'basse']),
  version_dofus: textLike,
  derniere_verif: textLike,
  sources: z.array(z.object({ url: z.url(), titre: z.string().min(1), date: textLike })),
  tags: z.array(z.string()),
})

function splitPath(path: string): { dossier: string; fileSlug: string } {
  const parts = path.replaceAll('\\', '/').split('/')
  const file = parts.at(-1)
  const dossier = parts.at(-2)
  if (file === undefined || dossier === undefined || !file.endsWith('.md')) {
    throw new FicheFormatError(path, 'chemin attendu : <dossier>/<slug>.md')
  }
  return { dossier, fileSlug: file.slice(0, -3) }
}

function splitFrontmatter(path: string, raw: string): { frontmatter: string; body: string } {
  if (!raw.startsWith('---\n')) {
    throw new FicheFormatError(path, 'frontmatter absent (le fichier doit commencer par ---)')
  }
  const end = raw.indexOf('\n---\n', 4)
  if (end === -1) throw new FicheFormatError(path, 'frontmatter non fermé')
  return { frontmatter: raw.slice(4, end), body: raw.slice(end + 5) }
}

function parseFrontmatter(path: string, frontmatter: string): z.infer<typeof FrontmatterSchema> {
  let data: unknown
  try {
    data = parseYaml(frontmatter)
  } catch (error) {
    throw new FicheFormatError(path, `frontmatter YAML invalide : ${String(error)}`)
  }
  const parsed = FrontmatterSchema.safeParse(data)
  if (!parsed.success) {
    throw new FicheFormatError(path, `frontmatter : ${z.prettifyError(parsed.error)}`)
  }
  return parsed.data
}

function isSectionTitle(title: string): title is SectionTitle {
  return (SECTION_TITLES as readonly string[]).includes(title)
}

function splitSections(path: string, body: string): Record<SectionTitle, string> {
  const found: { title: string; lines: string[] }[] = []
  for (const line of body.split('\n')) {
    const title = line.match(SECTION_HEADING)?.[1]
    if (title !== undefined) {
      found.push({ title, lines: [] })
    } else {
      found.at(-1)?.lines.push(line)
    }
  }
  const titles = found.map((section) => section.title)
  const unexpected = titles.find((title) => !isSectionTitle(title))
  if (unexpected !== undefined) throw new FicheFormatError(path, `section inattendue « ${unexpected} »`)
  const missing = SECTION_TITLES.find((expected) => !titles.includes(expected))
  if (missing !== undefined) throw new FicheFormatError(path, `section « ${missing} » absente`)
  if (titles.join('|') !== SECTION_TITLES.join('|')) {
    throw new FicheFormatError(path, `sections dans le mauvais ordre : ${titles.join(', ')}`)
  }
  const entries = found.map((section) => [section.title, section.lines.join('\n').trim()] as const)
  return Object.fromEntries(entries) as Record<SectionTitle, string>
}

export function parseFiche(path: string, raw: string): Fiche {
  const normalized = raw.replaceAll('\r\n', '\n')
  const { dossier, fileSlug } = splitPath(path)
  const { frontmatter, body } = splitFrontmatter(path, normalized)
  const meta = parseFrontmatter(path, frontmatter)
  if (meta.slug !== fileSlug) {
    throw new FicheFormatError(
      path,
      `slug « ${meta.slug} » différent du nom de fichier « ${fileSlug} »`,
    )
  }
  return {
    slug: meta.slug,
    dossier,
    titre: meta.titre,
    statut: meta.statut,
    confiance: meta.confiance,
    versionDofus: meta.version_dofus,
    derniereVerif: meta.derniere_verif,
    sources: meta.sources,
    tags: meta.tags,
    sections: splitSections(path, body),
  }
}
```

- [ ] **Step 3 : vert, verify, commit**

Run : `rtk npx vitest run src/shared/wiki` → PASS (3 + 7 + 1 tests). Si « sections en désordre » échoue avec un message « absente » au lieu de « ordre », vérifier l'ordre des contrôles : inattendue → absente → ordre.

Run : `rtk npm run verify` → vert.

```bash
rtk git add app/src/shared/wiki/parse-fiche.ts app/src/shared/wiki/parse-fiche.test.ts
rtk git commit -m "feat(shared): parseur de fiche wiki (frontmatter zod, cinq sections ordonnées)"
```

### Task 8 : rendu markdown avec réécriture des liens

**Files:**
- Create: `app/src/shared/wiki/render-markdown.ts`
- Create: `app/src/shared/wiki/render-markdown.test.ts`

Règles : `html: false` (le HTML brut est échappé) ; lien `xxx.md` ou `./xxx.md` vers un slug connu → `href="#/wiki/xxx"` ; slug inconnu → `<span title="fiche absente">…</span>` ; lien `https://` → `target="_blank"`, `rel="noopener noreferrer"`, attribut `data-external` que le lecteur intercepte pour ouvrir le navigateur du système.

- [ ] **Step 1 : le test (échoue)**

`app/src/shared/wiki/render-markdown.test.ts` :

```ts
import { describe, expect, test } from 'vitest'

import { createMarkdownRenderer } from './render-markdown'

const render = createMarkdownRenderer({ knownSlugs: new Set(['jauges', 'reproduction']) })

describe('createMarkdownRenderer', () => {
  test('lien interne connu → route hash', () => {
    expect(render('Voir [les jauges](jauges.md).')).toContain(
      '<a href="#/wiki/jauges" data-internal="jauges">les jauges</a>',
    )
    expect(render('Voir [repro](./reproduction.md#detail).')).toContain('href="#/wiki/reproduction"')
  })

  test('lien interne inconnu → span inerte', () => {
    const html = render('Voir [la fiche](inconnue.md).')
    expect(html).toContain('<span title="fiche absente">la fiche</span>')
    expect(html).not.toContain('<a')
  })

  test('lien https → nouvel onglet, marqué externe', () => {
    const html = render('[Guide](https://exemple.fr/guide)')
    expect(html).toContain('href="https://exemple.fr/guide"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('data-external="https://exemple.fr/guide"')
  })

  test('le HTML brut est échappé', () => {
    expect(render('<script>alert(1)</script> et <b>gras</b>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt; et &lt;b&gt;gras&lt;/b&gt;</p>\n',
    )
  })

  test('tableaux et sous-titres sont rendus', () => {
    const html = render('### Titre\n\n| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<h3>Titre</h3>')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>2</td>')
  })
})
```

Run : `rtk npx vitest run src/shared/wiki/render-markdown` → FAIL, module absent.

- [ ] **Step 2 : `app/src/shared/wiki/render-markdown.ts`**

```ts
import MarkdownIt from 'markdown-it'

import type Token from 'markdown-it/lib/token.mjs'

export interface MarkdownRendererOptions {
  knownSlugs: ReadonlySet<string>
}

const INTERNAL_LINK = /^(?:\.\/)?([a-z0-9]+(?:-[a-z0-9]+)*)\.md(?:#.*)?$/
const EXTERNAL_LINK = /^https:\/\//

function findLinkClose(tokens: Token[], openIndex: number): Token | undefined {
  let depth = 0
  for (const token of tokens.slice(openIndex)) {
    if (token.type === 'link_open') depth += 1
    if (token.type === 'link_close') {
      depth -= 1
      if (depth === 0) return token
    }
  }
  return undefined
}

function rewriteLink(token: Token, inline: Token[], index: number, knownSlugs: ReadonlySet<string>): void {
  const href = token.attrGet('href') ?? ''
  const slug = href.match(INTERNAL_LINK)?.[1]
  if (slug !== undefined) {
    if (knownSlugs.has(slug)) {
      token.attrSet('href', `#/wiki/${slug}`)
      token.attrSet('data-internal', slug)
      return
    }
    const close = findLinkClose(inline, index)
    token.tag = 'span'
    token.attrs = [['title', 'fiche absente']]
    if (close) close.tag = 'span'
    return
  }
  if (EXTERNAL_LINK.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
    token.attrSet('data-external', href)
  }
}

export function createMarkdownRenderer(
  options: MarkdownRendererOptions,
): (markdown: string) => string {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false })

  md.core.ruler.push('anka_links', (state) => {
    for (const block of state.tokens) {
      const inline = block.children
      if (block.type !== 'inline' || inline === null) continue
      for (const [index, token] of inline.entries()) {
        if (token.type === 'link_open') rewriteLink(token, inline, index, options.knownSlugs)
      }
    }
  })

  return (markdown: string) => md.render(markdown)
}
```

Si l'import de type `Token` échoue au typecheck, chercher le bon chemin : `ls node_modules/markdown-it/lib` (fichier `token.mjs` ou `token.js`) et `ls node_modules/@types/markdown-it/lib`. Alternative sûre : `type Token = ReturnType<MarkdownIt['parse']>[number]`.

- [ ] **Step 3 : vert, verify, commit**

Run : `rtk npx vitest run src/shared/wiki` → PASS.
Run : `rtk npm run verify` → vert.

```bash
rtk git add app/src/shared/wiki/render-markdown.ts app/src/shared/wiki/render-markdown.test.ts
rtk git commit -m "feat(shared): rendu markdown des fiches, liens internes vers les routes, externes marqués"
```

### Task 9 : gate de format du wiki réel

**Files:**
- Create: `app/tests/wiki/all-fiches.test.ts`

Ce test remplace la boucle grep de SP1 : il lit **toutes** les fiches du dépôt depuis Node et vérifie que `INDEX.md` est synchrone (slugs et statuts).

- [ ] **Step 1 : le test**

`app/tests/wiki/all-fiches.test.ts` :

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { parseFiche } from '@shared/wiki/parse-fiche'

import type { Fiche } from '@shared/wiki/parse-fiche'

const WIKI_ROOT = resolve(__dirname, '../../../wiki')
const INDEX_ROW = /^\| [^|]+ \| ([a-z0-9-]+) \| (hypothese|valide|obsolete) \|/gm

function listFicheFiles(): string[] {
  const files: string[] = []
  for (const entry of readdirSync(WIKI_ROOT)) {
    const dir = join(WIKI_ROOT, entry)
    if (!statSync(dir).isDirectory()) continue
    for (const file of readdirSync(dir)) {
      if (file.endsWith('.md')) files.push(join(dir, file))
    }
  }
  return files.sort()
}

const files = listFicheFiles()

function parseAll(): Fiche[] {
  return files.map((file) => parseFiche(file, readFileSync(file, 'utf8')))
}

test('le wiki contient au moins une fiche', () => {
  expect(files.length).toBeGreaterThan(0)
})

describe('chaque fiche respecte wiki/CONVENTIONS.md', () => {
  test.each(files)('%s', (file) => {
    expect(() => parseFiche(file, readFileSync(file, 'utf8'))).not.toThrow()
  })
})

test('INDEX.md liste exactement les fiches présentes, avec leur statut', () => {
  const index = readFileSync(join(WIKI_ROOT, 'INDEX.md'), 'utf8')
  const indexed = [...index.matchAll(INDEX_ROW)].map((row) => `${row[1] ?? ''}:${row[2] ?? ''}`).sort()
  const onDisk = parseAll()
    .map((fiche) => `${fiche.slug}:${fiche.statut}`)
    .sort()
  expect(indexed).toEqual(onDisk)
})

test('les slugs sont uniques dans tout le wiki', () => {
  const slugs = parseAll().map((fiche) => fiche.slug)
  expect(new Set(slugs).size).toBe(slugs.length)
})
```

- [ ] **Step 2 : lancer sur le wiki réel**

Run : `rtk npx vitest run tests/wiki`
Expected : PASS, 12 fiches + 3 tests. **Si une fiche réelle échoue**, c'est une vraie divergence entre une fiche SP1 et `CONVENTIONS.md` : ne pas assouplir le parseur sans lire la fiche. Deux cas prévus :

- une clé de frontmatter absente ou une URL non `http(s)` : corriger la **fiche** (c'est une donnée), consigner dans `wiki/JOURNAL.md` ;
- `INDEX.md` désynchronisé : corriger `INDEX.md`.

Toute correction du wiki va dans un commit séparé `wiki(dragodindes): …` avant le commit du test.

- [ ] **Step 3 : verify, commit**

Run : `rtk npm run verify` → vert.

```bash
rtk git add app/tests/wiki/all-fiches.test.ts
rtk git commit -m "test(wiki): toutes les fiches du dépôt parsent et INDEX.md est synchrone"
```

---

## Phase C — Processus main et preload

### Task 10 : store JSON atomique avec migrations

**Files:**
- Create: `app/src/main/store/json-store.ts`
- Create: `app/src/main/store/json-store.test.ts`
- Create: `app/src/main/store/index.ts`

- [ ] **Step 1 : le test (échoue : module absent)**

`app/src/main/store/json-store.test.ts` :

```ts
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { JsonStore, StoreCorruptError } from './json-store'

import type { StoreDefinition } from './json-store'

const SchemaV2 = z.object({
  schemaVersion: z.literal(2),
  name: z.string().min(1),
  count: z.number().int(),
})
type DataV2 = z.infer<typeof SchemaV2>

const definition: StoreDefinition<DataV2> = {
  file: 'demo.json',
  currentVersion: 2,
  schema: SchemaV2,
  defaults: () => ({ schemaVersion: 2, name: 'défaut', count: 0 }),
  migrations: {
    // v1 n'avait pas de count
    1: (raw) => ({ ...raw, schemaVersion: 2, count: 0 }),
  },
}

let dir: string
let store: JsonStore<DataV2>

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'anka-store-'))
  store = new JsonStore(dir, definition)
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('JsonStore.read', () => {
  test('fichier absent → valeur par défaut, sans créer le fichier', async () => {
    expect(await store.read()).toEqual(definition.defaults())
    expect(await readdir(dir)).toEqual([])
  })

  test('JSON illisible → StoreCorruptError, fichier intact', async () => {
    await writeFile(join(dir, 'demo.json'), '{ pas du json', 'utf8')
    await expect(store.read()).rejects.toBeInstanceOf(StoreCorruptError)
    expect(await readFile(join(dir, 'demo.json'), 'utf8')).toBe('{ pas du json')
  })

  test('schéma violé → StoreCorruptError qui nomme le champ', async () => {
    await writeFile(join(dir, 'demo.json'), JSON.stringify({ schemaVersion: 2, name: '', count: 1 }))
    await expect(store.read()).rejects.toThrow(/name/)
  })

  test('version antérieure → migration appliquée', async () => {
    await writeFile(join(dir, 'demo.json'), JSON.stringify({ schemaVersion: 1, name: 'ancien' }))
    expect(await store.read()).toEqual({ schemaVersion: 2, name: 'ancien', count: 0 })
  })

  test('version sans migration → StoreCorruptError', async () => {
    await writeFile(join(dir, 'demo.json'), JSON.stringify({ schemaVersion: 0, name: 'x' }))
    await expect(store.read()).rejects.toThrow(/migration/)
  })
})

describe('JsonStore.write', () => {
  test('écrit, relit, et ne laisse pas de fichier temporaire', async () => {
    await store.write({ schemaVersion: 2, name: 'anka', count: 3 })
    expect(await store.read()).toEqual({ schemaVersion: 2, name: 'anka', count: 3 })
    expect(await readdir(dir)).toEqual(['demo.json'])
  })

  test('crée le dossier si besoin', async () => {
    const nested = new JsonStore(join(dir, 'a', 'b'), definition)
    await nested.write(definition.defaults())
    expect(await readdir(join(dir, 'a', 'b'))).toEqual(['demo.json'])
  })

  test('refuse une donnée invalide sans toucher au fichier', async () => {
    await store.write({ schemaVersion: 2, name: 'anka', count: 3 })
    await expect(store.write({ schemaVersion: 2, name: '', count: 3 })).rejects.toBeInstanceOf(
      StoreCorruptError,
    )
    expect(await store.read()).toEqual({ schemaVersion: 2, name: 'anka', count: 3 })
  })
})
```

Run : `rtk npx vitest run src/main/store` → FAIL, module absent.

- [ ] **Step 2 : `app/src/main/store/json-store.ts`**

```ts
/* eslint-disable security/detect-non-literal-fs-filename -- les chemins sont construits depuis
   userData par le processus main, jamais reçus du renderer */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { z } from 'zod'

export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

export interface StoreDefinition<T extends { schemaVersion: number }> {
  /** nom du fichier dans le dossier de données, par ex. `profile.json` */
  file: string
  currentVersion: number
  schema: z.ZodType<T>
  defaults: () => T
  /** clé = version de départ ; la fonction doit produire la version suivante */
  migrations: Record<number, Migration>
}

export class StoreCorruptError extends Error {
  constructor(
    public readonly file: string,
    detail: string,
  ) {
    super(`${file} : ${detail}`)
    this.name = 'StoreCorruptError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNotFound(error: unknown): boolean {
  return isRecord(error) && error['code'] === 'ENOENT'
}

function versionOf(raw: Record<string, unknown>): number {
  const version = raw['schemaVersion']
  return typeof version === 'number' ? version : 0
}

export class JsonStore<T extends { schemaVersion: number }> {
  private readonly path: string

  constructor(
    private readonly dir: string,
    private readonly definition: StoreDefinition<T>,
  ) {
    this.path = join(dir, definition.file)
  }

  async read(): Promise<T> {
    let text: string
    try {
      text = await readFile(this.path, 'utf8')
    } catch (error) {
      if (isNotFound(error)) return this.definition.defaults()
      throw error
    }
    let raw: unknown
    try {
      raw = JSON.parse(text)
    } catch {
      throw new StoreCorruptError(this.definition.file, 'JSON illisible')
    }
    const parsed = this.definition.schema.safeParse(this.migrate(raw))
    if (!parsed.success) {
      throw new StoreCorruptError(this.definition.file, z.prettifyError(parsed.error))
    }
    return parsed.data
  }

  async write(data: T): Promise<void> {
    const parsed = this.definition.schema.safeParse(data)
    if (!parsed.success) {
      throw new StoreCorruptError(
        this.definition.file,
        `écriture refusée : ${z.prettifyError(parsed.error)}`,
      )
    }
    await mkdir(this.dir, { recursive: true })
    const temporary = `${this.path}.tmp`
    await writeFile(temporary, JSON.stringify(parsed.data, null, 2), 'utf8')
    await rename(temporary, this.path)
  }

  private migrate(raw: unknown): unknown {
    if (!isRecord(raw)) return raw
    let current = raw
    let version = versionOf(current)
    while (version < this.definition.currentVersion) {
      const migration = this.definition.migrations[version]
      if (migration === undefined) {
        throw new StoreCorruptError(
          this.definition.file,
          `aucune migration depuis la version ${String(version)}`,
        )
      }
      current = migration(current)
      const next = versionOf(current)
      if (next <= version) {
        throw new StoreCorruptError(
          this.definition.file,
          `la migration depuis ${String(version)} n'a pas incrémenté schemaVersion`,
        )
      }
      version = next
    }
    return current
  }
}
```

Si `schema: z.ZodType<T>` refuse `ProfileSchema` à la tâche suivante (types d'entrée avec `.default()`), remplacer par `schema: { safeParse: (raw: unknown) => z.ZodSafeParseResult<T> }`.

- [ ] **Step 3 : `app/src/main/store/index.ts`**

```ts
import { defaultProfile, PROFILE_SCHEMA_VERSION, ProfileSchema } from '@shared/schemas/profile'
import {
  defaultWindowState,
  WINDOW_STATE_SCHEMA_VERSION,
  WindowStateSchema,
} from '@shared/schemas/window-state'

import { JsonStore } from './json-store'

import type { Profile } from '@shared/schemas/profile'
import type { WindowState } from '@shared/schemas/window-state'

export interface Stores {
  profile: JsonStore<Profile>
  windowState: JsonStore<WindowState>
}

export function createStores(dir: string): Stores {
  return {
    profile: new JsonStore<Profile>(dir, {
      file: 'profile.json',
      currentVersion: PROFILE_SCHEMA_VERSION,
      schema: ProfileSchema,
      defaults: defaultProfile,
      migrations: {},
    }),
    windowState: new JsonStore<WindowState>(dir, {
      file: 'window-state.json',
      currentVersion: WINDOW_STATE_SCHEMA_VERSION,
      schema: WindowStateSchema,
      defaults: defaultWindowState,
      migrations: {},
    }),
  }
}
```

- [ ] **Step 4 : vert, verify, commit**

Run : `rtk npx vitest run src/main/store` → PASS (8 tests). Sur Windows, si « ne laisse pas de fichier temporaire » échoue par `EPERM` au `rename`, c'est un antivirus qui tient le fichier : relancer une fois ; si ça persiste, remplacer `rename` par `copyFile` + `unlink` et le noter dans le spec §7.

Run : `rtk npm run verify` → vert.

```bash
rtk git add app/src/main/store
rtk git commit -m "feat(main): store JSON atomique avec schemaVersion et migrations"
```

### Task 11 : mise à jour automatique (réducteur pur + câblage electron-updater)

**Files:**
- Create: `app/src/main/updater-state.ts`
- Create: `app/src/main/updater-state.test.ts`
- Create: `app/src/main/updater.ts`

- [ ] **Step 1 : le test du réducteur (échoue)**

`app/src/main/updater-state.test.ts` :

```ts
import { expect, test } from 'vitest'

import { reduceUpdaterEvent } from './updater-state'

import type { UpdaterState } from '@shared/ipc'

const idle: UpdaterState = { status: 'idle' }

test.each<[Parameters<typeof reduceUpdaterEvent>[1], UpdaterState]>([
  [{ type: 'checking' }, { status: 'checking' }],
  [{ type: 'available', version: '0.1.1' }, { status: 'available', version: '0.1.1' }],
  [{ type: 'not-available' }, { status: 'up-to-date' }],
  [{ type: 'progress', percent: 42.7 }, { status: 'downloading', percent: 43 }],
  [{ type: 'downloaded', version: '0.1.1' }, { status: 'ready', version: '0.1.1' }],
  [{ type: 'error', message: 'réseau' }, { status: 'error', message: 'réseau' }],
  [{ type: 'unavailable', message: 'dev' }, { status: 'unavailable', message: 'dev' }],
])('%j → %j', (event, expected) => {
  expect(reduceUpdaterEvent(idle, event)).toEqual(expected)
})

test('le pourcentage est borné entre 0 et 100', () => {
  expect(reduceUpdaterEvent(idle, { type: 'progress', percent: -5 })).toEqual({
    status: 'downloading',
    percent: 0,
  })
  expect(reduceUpdaterEvent(idle, { type: 'progress', percent: 120 })).toEqual({
    status: 'downloading',
    percent: 100,
  })
})
```

Run : `rtk npx vitest run src/main/updater-state` → FAIL, module absent.

- [ ] **Step 2 : `app/src/main/updater-state.ts`**

```ts
import type { UpdaterState } from '@shared/ipc'

export type UpdaterEvent =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available' }
  | { type: 'progress'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'unavailable'; message: string }
  | { type: 'error'; message: string }

export function reduceUpdaterEvent(_previous: UpdaterState, event: UpdaterEvent): UpdaterState {
  switch (event.type) {
    case 'checking': {
      return { status: 'checking' }
    }
    case 'available': {
      return { status: 'available', version: event.version }
    }
    case 'not-available': {
      return { status: 'up-to-date' }
    }
    case 'progress': {
      return { status: 'downloading', percent: Math.min(100, Math.max(0, Math.round(event.percent))) }
    }
    case 'downloaded': {
      return { status: 'ready', version: event.version }
    }
    case 'unavailable': {
      return { status: 'unavailable', message: event.message }
    }
    case 'error': {
      return { status: 'error', message: event.message }
    }
  }
}
```

Le paramètre `_previous` est gardé pour que la signature puisse évoluer (par ex. ignorer un `progress` reçu après `downloaded`) sans changer les appelants ; `@typescript-eslint/no-unused-vars` ignore les noms préfixés `_` par défaut dans la config `strict` ; sinon ajouter `argsIgnorePattern: '^_'`.

- [ ] **Step 3 : `app/src/main/updater.ts`**

Faits de la doc electron-builder (spec §8) : `electron-updater` est CJS (import par défaut puis destructuration), ne jamais appeler `setFeedURL`, l'installation à la fermeture est le comportement par défaut (`autoInstallOnAppQuit`).

```ts
import { app } from 'electron'
import electronUpdater from 'electron-updater'

import { IPC } from '@shared/ipc'

import { reduceUpdaterEvent } from './updater-state'

import type { UpdaterEvent } from './updater-state'
import type { UpdaterState } from '@shared/ipc'
import type { BrowserWindow } from 'electron'

// Contournement ESM/CJS documenté par electron-builder
const { autoUpdater } = electronUpdater

const STARTUP_DELAY_MS = 5000
const DEV_MESSAGE = 'Mise à jour indisponible hors installation (mode développement).'

export interface Updater {
  check(): Promise<void>
  getState(): UpdaterState
  quitAndInstall(): void
  scheduleStartupCheck(): void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function createUpdater(getWindow: () => BrowserWindow | undefined): Updater {
  let state: UpdaterState = { status: 'idle' }

  const emit = (event: UpdaterEvent): void => {
    state = reduceUpdaterEvent(state, event)
    getWindow()?.webContents.send(IPC.updaterState, state)
  }

  if (app.isPackaged) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('checking-for-update', () => {
      emit({ type: 'checking' })
    })
    autoUpdater.on('update-available', (info) => {
      emit({ type: 'available', version: info.version })
    })
    autoUpdater.on('update-not-available', () => {
      emit({ type: 'not-available' })
    })
    autoUpdater.on('download-progress', (progress) => {
      emit({ type: 'progress', percent: progress.percent })
    })
    autoUpdater.on('update-downloaded', (info) => {
      emit({ type: 'downloaded', version: info.version })
    })
    autoUpdater.on('error', (error) => {
      emit({ type: 'error', message: errorMessage(error) })
    })
  }

  const check = async (): Promise<void> => {
    if (!app.isPackaged) {
      emit({ type: 'unavailable', message: DEV_MESSAGE })
      return
    }
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      emit({ type: 'error', message: errorMessage(error) })
    }
  }

  return {
    check,
    getState: () => state,
    quitAndInstall: () => {
      autoUpdater.quitAndInstall()
    },
    scheduleStartupCheck: () => {
      if (!app.isPackaged) return
      setTimeout(() => {
        void check()
      }, STARTUP_DELAY_MS)
    },
  }
}
```

- [ ] **Step 4 : vert, typecheck, commit**

Run : `rtk npx vitest run src/main/updater-state` → PASS (8 tests).
Run : `rtk npm run verify` → vert. Si `tsc` se plaint de `electronUpdater` (« has no default export »), vérifier `esModuleInterop: true` dans `tsconfig.node.json` ; si l'erreur persiste, écrire `import * as electronUpdater from 'electron-updater'`.

```bash
rtk git add app/src/main/updater-state.ts app/src/main/updater-state.test.ts app/src/main/updater.ts
rtk git commit -m "feat(main): electron-updater câblé sur un réducteur d'état pur"
```

### Task 12 : fenêtre, handlers IPC, preload typé, câblage du main

**Files:**
- Create: `app/src/main/window.ts`
- Create: `app/src/main/ipc.ts`
- Modify: `app/src/main/index.ts` (remplacé)
- Modify: `app/src/preload/index.ts`, `app/src/preload/index.d.ts` (remplacés)

- [ ] **Step 1 : `app/src/main/window.ts`**

```ts
import { join } from 'node:path'

import { app, BrowserWindow, shell } from 'electron'

import {
  defaultWindowState,
  WINDOW_MIN_HEIGHT,
  WINDOW_MIN_WIDTH,
  WINDOW_STATE_SCHEMA_VERSION,
} from '@shared/schemas/window-state'

import type { Stores } from './store'
import type { WindowState } from '@shared/schemas/window-state'

const HTTPS = /^https:\/\//
const DEV_URL = process.env['ELECTRON_RENDERER_URL']

function isAllowedNavigation(url: string): boolean {
  if (url.startsWith('file://')) return true
  return DEV_URL !== undefined && url.startsWith(DEV_URL)
}

async function readWindowState(stores: Stores): Promise<WindowState> {
  try {
    return await stores.windowState.read()
  } catch (error) {
    // Un état de fenêtre corrompu n'empêche pas de démarrer : on repart des valeurs par défaut.
    console.warn('window-state.json ignoré :', error)
    return defaultWindowState()
  }
}

async function persistWindowState(win: BrowserWindow, stores: Stores): Promise<void> {
  const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds()
  await stores.windowState.write({
    schemaVersion: WINDOW_STATE_SCHEMA_VERSION,
    width: Math.max(bounds.width, WINDOW_MIN_WIDTH),
    height: Math.max(bounds.height, WINDOW_MIN_HEIGHT),
    x: bounds.x,
    y: bounds.y,
    maximized: win.isMaximized(),
  })
}

export async function createMainWindow(stores: Stores): Promise<BrowserWindow> {
  const state = await readWindowState(stores)
  const position = state.x !== undefined && state.y !== undefined ? { x: state.x, y: state.y } : {}

  const win = new BrowserWindow({
    ...position,
    width: state.width,
    height: state.height,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    title: 'Anka',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (state.maximized) win.maximize()

  win.on('ready-to-show', () => {
    win.show()
  })

  // On retarde la fermeture le temps d'écrire l'état de la fenêtre, puis on ferme pour de bon.
  let stateSaved = false
  win.on('close', (event) => {
    if (stateSaved) return
    event.preventDefault()
    void persistWindowState(win, stores)
      .catch((error: unknown) => {
        console.warn('état de fenêtre non sauvegardé :', error)
      })
      .finally(() => {
        stateSaved = true
        win.close()
      })
  })

  // Aucune navigation hors de l'app ; les liens externes s'ouvrent dans le navigateur du système.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (HTTPS.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault()
  })

  if (!app.isPackaged && DEV_URL !== undefined) {
    await win.loadURL(DEV_URL)
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return win
}
```

- [ ] **Step 2 : `app/src/main/ipc.ts`**

```ts
/* eslint-disable security/detect-non-literal-fs-filename -- les chemins viennent des dialogues
   système choisis par le joueur, jamais du renderer */
import { readFile, writeFile } from 'node:fs/promises'

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'

import { IPC, isStoreKey } from '@shared/ipc'
import { buildExportBundle, validateImport } from '@shared/schemas/transfer'

import type { Stores } from './store'
import type { Updater } from './updater'
import type { ExportResult, ImportResult, StoreData, StoreKey } from '@shared/ipc'
import type { WebContents } from 'electron'

const HTTPS_URL = /^https:\/\/\S+$/
const JSON_FILTER = [{ name: 'JSON', extensions: ['json'] }]

function assertStoreKey(key: unknown): asserts key is StoreKey {
  if (!isStoreKey(key)) throw new Error(`clé de store inconnue : ${String(key)}`)
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function exportAll(sender: WebContents, stores: Stores): Promise<ExportResult> {
  const win = BrowserWindow.fromWebContents(sender)
  const now = new Date()
  const options = {
    title: 'Exporter les données Anka',
    defaultPath: `anka-export-${isoDate(now)}.json`,
    filters: JSON_FILTER,
  }
  const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
  if (result.canceled || result.filePath === '') return { ok: false, reason: 'cancelled' }
  const bundle = buildExportBundle({
    profile: await stores.profile.read(),
    appVersion: app.getVersion(),
    now,
  })
  await writeFile(result.filePath, JSON.stringify(bundle, null, 2), 'utf8')
  return { ok: true, path: result.filePath }
}

async function importAll(sender: WebContents, stores: Stores): Promise<ImportResult> {
  const win = BrowserWindow.fromWebContents(sender)
  const options = {
    title: 'Importer des données Anka',
    filters: JSON_FILTER,
    properties: ['openFile' as const],
  }
  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
  const path = result.filePaths[0]
  if (result.canceled || path === undefined) return { ok: false, reason: 'cancelled' }
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return { ok: false, reason: 'invalid', details: 'Le fichier n’est pas un JSON lisible.' }
  }
  const validation = validateImport(raw)
  if (!validation.ok) return { ok: false, reason: 'invalid', details: validation.reason }
  await stores.profile.write(validation.bundle.data.profile)
  return { ok: true, path }
}

async function openExternal(url: unknown): Promise<void> {
  if (typeof url !== 'string' || !HTTPS_URL.test(url)) {
    throw new Error('Seules les URL https:// peuvent être ouvertes.')
  }
  await shell.openExternal(url)
}

export function registerIpc(stores: Stores, updater: Updater): void {
  ipcMain.handle(IPC.storeRead, (_event, key: unknown) => {
    assertStoreKey(key)
    return stores[key].read()
  })
  ipcMain.handle(IPC.storeWrite, (_event, key: unknown, data: unknown) => {
    assertStoreKey(key)
    // La forme est vérifiée par le schéma zod du store avant toute écriture.
    return stores[key].write(data as StoreData[typeof key])
  })
  ipcMain.handle(IPC.transferExport, (event) => exportAll(event.sender, stores))
  ipcMain.handle(IPC.transferImport, (event) => importAll(event.sender, stores))
  ipcMain.handle(IPC.updaterCheck, () => updater.check())
  ipcMain.handle(IPC.updaterGetState, () => updater.getState())
  ipcMain.handle(IPC.updaterQuitAndInstall, () => {
    updater.quitAndInstall()
  })
  ipcMain.handle(IPC.appVersion, () => app.getVersion())
  ipcMain.handle(IPC.appOpenExternal, (_event, url: unknown) => openExternal(url))
}
```

- [ ] **Step 3 : remplacer `app/src/main/index.ts`**

```ts
import { join } from 'node:path'

import { app, BrowserWindow } from 'electron'

import { registerIpc } from './ipc'
import { createStores } from './store'
import { createUpdater } from './updater'
import { createMainWindow } from './window'

async function start(): Promise<void> {
  const stores = createStores(join(app.getPath('userData'), 'data'))
  const updater = createUpdater(() => BrowserWindow.getAllWindows()[0])
  registerIpc(stores, updater)
  await createMainWindow(stores)
  updater.scheduleStartupCheck()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createMainWindow(stores)
  })
}

void app
  .whenReady()
  .then(start)
  .catch((error: unknown) => {
    console.error('Démarrage impossible :', error)
    app.quit()
  })

app.on('window-all-closed', () => {
  app.quit()
})
```

- [ ] **Step 4 : remplacer le preload et sa déclaration**

`app/src/preload/index.ts` :

```ts
import { contextBridge, ipcRenderer } from 'electron'

import { IPC } from '@shared/ipc'

import type { AnkaApi, UpdaterState } from '@shared/ipc'
import type { IpcRendererEvent } from 'electron'

const api: AnkaApi = {
  store: {
    read: (key) => ipcRenderer.invoke(IPC.storeRead, key),
    write: (key, data) => ipcRenderer.invoke(IPC.storeWrite, key, data),
  },
  transfer: {
    exportAll: () => ipcRenderer.invoke(IPC.transferExport),
    importAll: () => ipcRenderer.invoke(IPC.transferImport),
  },
  updater: {
    check: () => ipcRenderer.invoke(IPC.updaterCheck),
    getState: () => ipcRenderer.invoke(IPC.updaterGetState),
    quitAndInstall: () => ipcRenderer.invoke(IPC.updaterQuitAndInstall),
    onState: (callback) => {
      const listener = (_event: IpcRendererEvent, state: UpdaterState): void => {
        callback(state)
      }
      ipcRenderer.on(IPC.updaterState, listener)
      return () => {
        ipcRenderer.off(IPC.updaterState, listener)
      }
    },
  },
  app: {
    version: () => ipcRenderer.invoke(IPC.appVersion),
    openExternal: (url) => ipcRenderer.invoke(IPC.appOpenExternal, url),
  },
}

contextBridge.exposeInMainWorld('anka', api)
```

`ipcRenderer.invoke` renvoie `Promise<any>` : `@typescript-eslint/no-unsafe-return` peut se plaindre. Si c'est le cas, typer chaque appel : `ipcRenderer.invoke(IPC.storeRead, key) as Promise<StoreData[typeof key]>` est refusé par `no-unnecessary-type-assertion` ; préférer une petite fonction `invoke<T>(channel: string, ...args: unknown[]): Promise<T> { return ipcRenderer.invoke(channel, ...args) as Promise<T> }` avec un `eslint-disable-next-line @typescript-eslint/no-unsafe-return -- frontière IPC non typée par Electron` sur sa ligne de retour, et l'utiliser partout.

`app/src/preload/index.d.ts` :

```ts
import type { AnkaApi } from '../shared/ipc'

declare global {
  interface Window {
    anka: AnkaApi
  }
}

export {}
```

- [ ] **Step 5 : adapter `App.vue` au nouveau contrat, builder, vérifier à la main**

Dans `app/src/renderer/src/App.vue`, remplacer `const ping = window.anka.ping()` par :

```ts
import { onMounted, ref } from 'vue'

const version = ref('…')
onMounted(async () => {
  version.value = await window.anka.app.version()
})
```

et `preload : {{ ping }}` par `version {{ version }}`. (L'écran définitif arrive en tâche 13.)

Run : `rtk npm run verify` → vert.
Run : `rtk npm run dev` → la fenêtre affiche « version 0.1.0 ». Redimensionner, fermer, relancer : la taille est conservée (fichier `%APPDATA%/anka/data/window-state.json` créé). Fermer.

- [ ] **Step 6 : commit**

```bash
rtk git add app/src/main/index.ts app/src/main/window.ts app/src/main/ipc.ts app/src/preload/index.ts app/src/preload/index.d.ts app/src/renderer/src/App.vue
rtk git commit -m "feat(main): fenêtre persistante, handlers IPC (store, export/import, updater), preload typé"
```

---

## Phase D — Renderer

### Task 13 : coquille (rail, routes, thème, index du wiki, store profil)

**Files:**
- Modify: `app/vitest.config.ts` (alias `@wiki`)
- Create: `app/src/renderer/src/lib/wiki-index.ts`, `app/src/renderer/src/lib/wiki-index.test.ts`
- Create: `app/src/renderer/src/lib/error-message.ts`
- Create: `app/src/renderer/src/composables/use-theme.ts`
- Create: `app/src/renderer/src/stores/profile.ts`
- Create: `app/src/renderer/src/router.ts`
- Create: `app/src/renderer/src/components/RailLink.vue`, `app/src/renderer/src/components/AppRail.vue`
- Create: `app/src/renderer/src/pages/WikiPage.vue`, `ElevagePage.vue`, `ProfilPage.vue`, `ParametresPage.vue` (squelettes, remplacés en 14 à 16)
- Modify: `app/src/renderer/src/main.ts`, `app/src/renderer/src/App.vue`

- [ ] **Step 1 : alias `@wiki` dans vitest**

Dans `app/vitest.config.ts`, ajouter dans `resolve.alias` :

```ts
      '@wiki': resolve(__dirname, '../wiki'),
```

- [ ] **Step 2 : test de l'index du wiki (échoue)**

`app/src/renderer/src/lib/wiki-index.test.ts` :

```ts
import { expect, test } from 'vitest'

import { DEFAULT_SLUG, dossiers, fiches, fichesDuDossier, findFiche, renderMarkdown } from './wiki-index'

test('embarque toutes les fiches du dépôt (12 en SP1) et aucun fichier racine', () => {
  expect(fiches.length).toBeGreaterThanOrEqual(12)
  expect(fiches.map((f) => f.slug)).not.toContain('INDEX')
  expect(dossiers).toContain('dragodindes')
})

test('la fiche par défaut existe', () => {
  expect(findFiche(DEFAULT_SLUG)?.slug).toBe(DEFAULT_SLUG)
  expect(findFiche('nexiste-pas')).toBeUndefined()
})

test('le digest est épinglé en tête de son dossier, le reste trié par titre', () => {
  const [first, ...rest] = fichesDuDossier('dragodindes')
  expect(first?.slug).toBe('digest-debutant')
  const titres = rest.map((f) => f.titre)
  expect(titres).toEqual([...titres].sort((a, b) => a.localeCompare(b, 'fr')))
})

test('le rendu connaît les slugs du wiki', () => {
  expect(renderMarkdown('[x](jauges.md)')).toContain('href="#/wiki/jauges"')
})
```

Run : `rtk npx vitest run src/renderer/src/lib` → FAIL, module absent.

- [ ] **Step 3 : `app/src/renderer/src/lib/wiki-index.ts`**

Le glob `@wiki/*/*.md` ne descend que d'un niveau : il exclut `INDEX.md`, `CONVENTIONS.md`, `JOURNAL.md` à la racine sans filtre sur les noms. Une fiche qui ne parse pas fait échouer le chargement du renderer : c'est voulu, et le test de la tâche 9 l'attrape avant.

```ts
import { parseFiche } from '@shared/wiki/parse-fiche'
import { createMarkdownRenderer } from '@shared/wiki/render-markdown'

import type { Fiche } from '@shared/wiki/parse-fiche'

const rawFiles = import.meta.glob('@wiki/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const DEFAULT_SLUG = 'digest-debutant'
const PINNED_PREFIX = 'digest-'

function compareFiches(a: Fiche, b: Fiche): number {
  const aPinned = a.slug.startsWith(PINNED_PREFIX)
  const bPinned = b.slug.startsWith(PINNED_PREFIX)
  if (aPinned !== bPinned) return aPinned ? -1 : 1
  return a.titre.localeCompare(b.titre, 'fr')
}

export const fiches: readonly Fiche[] = Object.entries(rawFiles)
  .map(([path, raw]) => parseFiche(path, raw))
  .sort(compareFiches)

export const dossiers: readonly string[] = [...new Set(fiches.map((fiche) => fiche.dossier))].sort(
  (a, b) => a.localeCompare(b, 'fr'),
)

export function fichesDuDossier(dossier: string): Fiche[] {
  return fiches.filter((fiche) => fiche.dossier === dossier)
}

export function findFiche(slug: string): Fiche | undefined {
  return fiches.find((fiche) => fiche.slug === slug)
}

export const renderMarkdown = createMarkdownRenderer({
  knownSlugs: new Set(fiches.map((fiche) => fiche.slug)),
})
```

Run : `rtk npx vitest run src/renderer/src/lib` → PASS (4 tests). Si le glob ne renvoie rien, l'alias `@wiki` manque dans `vitest.config.ts` (étape 1) ; en dev Vite, il manque dans `electron.vite.config.ts` (tâche 1).

- [ ] **Step 4 : utilitaires et composables**

`app/src/renderer/src/lib/error-message.ts` :

```ts
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
```

`app/src/renderer/src/composables/use-theme.ts` :

```ts
import { createSharedComposable, useColorMode } from '@vueuse/core'

export type ThemeMode = 'dark' | 'light' | 'auto'

// Préférence d'appareil (localStorage), pas une donnée du joueur : hors export. Spec §7.
export const useTheme = createSharedComposable(() =>
  useColorMode<ThemeMode>({ initialValue: 'dark', emitAuto: true, storageKey: 'anka-theme' }),
)
```

`app/src/renderer/src/stores/profile.ts` :

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { errorMessage } from '@/lib/error-message'
import { defaultProfile } from '@shared/schemas/profile'

import type { Profile } from '@shared/schemas/profile'

export type ProfilePatch = Partial<Omit<Profile, 'schemaVersion'>>

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>(defaultProfile())
  const loaded = ref(false)
  const loadError = ref<string | null>(null)

  async function load(): Promise<void> {
    try {
      profile.value = await window.anka.store.read('profile')
      loadError.value = null
    } catch (error) {
      loadError.value = errorMessage(error)
    } finally {
      loaded.value = true
    }
  }

  async function save(patch: ProfilePatch): Promise<void> {
    const next: Profile = { ...profile.value, ...patch }
    await window.anka.store.write('profile', next)
    profile.value = next
  }

  return { profile, loaded, loadError, load, save }
})
```

- [ ] **Step 5 : routes**

`app/src/renderer/src/router.ts` :

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/wiki' },
    { path: '/wiki/:slug?', name: 'wiki', component: () => import('@/pages/WikiPage.vue'), props: true },
    { path: '/elevage', name: 'elevage', component: () => import('@/pages/ElevagePage.vue') },
    { path: '/profil', name: 'profil', component: () => import('@/pages/ProfilPage.vue') },
    {
      path: '/parametres',
      name: 'parametres',
      component: () => import('@/pages/ParametresPage.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/wiki' },
  ],
})
```

- [ ] **Step 6 : rail de navigation (variante B)**

`app/src/renderer/src/components/RailLink.vue` :

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { Component } from 'vue'

const props = defineProps<{ to: string; label: string; icon: Component }>()

const route = useRoute()
const active = computed(() => route.path === props.to || route.path.startsWith(`${props.to}/`))
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Button
        as-child
        :variant="active ? 'secondary' : 'ghost'"
        size="icon"
        :aria-label="label"
        :aria-current="active ? 'page' : undefined"
      >
        <RouterLink :to="to">
          <component :is="icon" class="size-5" aria-hidden="true" />
        </RouterLink>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right">{{ label }}</TooltipContent>
  </Tooltip>
</template>
```

`app/src/renderer/src/components/AppRail.vue` :

```vue
<script setup lang="ts">
import { BookOpen, Egg, Settings, User } from 'lucide-vue-next'

import RailLink from '@/components/RailLink.vue'
import { TooltipProvider } from '@/components/ui/tooltip'

const modules = [
  { to: '/wiki', label: 'Wiki', icon: BookOpen },
  { to: '/elevage', label: 'Élevage', icon: Egg },
] as const

const bottom = [
  { to: '/profil', label: 'Profil', icon: User },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
] as const
</script>

<template>
  <nav
    class="bg-sidebar border-sidebar-border flex w-14 shrink-0 flex-col items-center gap-2 border-r py-3"
    aria-label="Modules"
  >
    <TooltipProvider :delay-duration="300">
      <RailLink v-for="item in modules" :key="item.to" v-bind="item" />
      <div class="flex-1" />
      <RailLink v-for="item in bottom" :key="item.to" v-bind="item" />
    </TooltipProvider>
  </nav>
</template>
```

- [ ] **Step 7 : squelettes des quatre pages**

Même contenu pour `WikiPage.vue`, `ElevagePage.vue`, `ProfilPage.vue`, `ParametresPage.vue` dans `app/src/renderer/src/pages/`, en changeant le titre :

```vue
<script setup lang="ts">
const title = 'Wiki'
</script>

<template>
  <section class="flex-1 p-8">
    <h1 class="text-2xl font-semibold">{{ title }}</h1>
  </section>
</template>
```

- [ ] **Step 8 : `main.ts` et `App.vue` définitifs**

`app/src/renderer/src/main.ts` :

```ts
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import './assets/main.css'
import { router } from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
```

`app/src/renderer/src/App.vue` :

```vue
<script setup lang="ts">
import AppRail from '@/components/AppRail.vue'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/composables/use-theme'

// Pose la classe dark/light sur <html> dès le montage et la maintient.
useTheme()
</script>

<template>
  <div class="bg-background text-foreground flex h-screen overflow-hidden">
    <AppRail />
    <div class="flex min-w-0 flex-1">
      <RouterView />
    </div>
    <Toaster position="bottom-right" rich-colors />
  </div>
</template>
```

- [ ] **Step 9 : verify, visuel, commit**

Run : `rtk npm run verify` → vert. Erreurs probables et remèdes : `vue/no-undef-components` sur `RouterView`/`RouterLink` → l'`ignorePatterns` de la tâche 2 manque ; `vuejs-accessibility/*` sur `RailLink` → ne pas désactiver, corriger le markup (le `aria-label` est déjà là).

Run : `rtk npm run dev` → rail à gauche avec quatre icônes et infobulles, page « Wiki » à droite, fond sombre. Cliquer chaque icône change la page. Fermer.

```bash
rtk git add app/vitest.config.ts app/src/renderer/src
rtk git commit -m "feat(renderer): coquille trois volets (rail, routes hash, thème, index du wiki, store profil)"
```

### Task 14 : lecteur wiki (liste par dossier, fiche « En bref » + accordéons)

**Files:**
- Create: `app/src/renderer/src/components/StatutBadge.vue`
- Create: `app/src/renderer/src/components/FicheList.vue`
- Create: `app/src/renderer/src/components/FicheReader.vue`, `FicheReader.dom.test.ts`
- Modify: `app/src/renderer/src/pages/WikiPage.vue`

- [ ] **Step 1 : le test DOM du lecteur (échoue)**

`app/src/renderer/src/components/FicheReader.dom.test.ts` :

```ts
// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'

import FicheReader from './FicheReader.vue'

import type { Fiche } from '@shared/wiki/parse-fiche'

const fiche: Fiche = {
  slug: 'jauges',
  dossier: 'dragodindes',
  titre: 'Les jauges',
  statut: 'valide',
  confiance: 'haute',
  versionDofus: '3.5',
  derniereVerif: '2026-09-05',
  sources: [{ url: 'https://exemple.fr/guide', titre: 'Guide', date: '2026-02' }],
  tags: [],
  sections: {
    'En bref': 'Résumé **court**.',
    Détails: '### Sous-titre caché\n\nTexte.',
    'Pièges fréquents': '- un piège',
    Chiffres: '| a |\n|---|\n| 1 |',
    'À challenger': '',
  },
}

test('en-tête : titre, statut, confiance, date, sources', () => {
  const wrapper = mount(FicheReader, { props: { fiche } })
  const text = wrapper.text()
  expect(text).toContain('Les jauges')
  expect(text).toContain('validé')
  expect(text).toContain('confiance haute')
  expect(text).toContain('vérifiée le 05/09/2026')
  expect(text).toContain('Guide')
})

test('« En bref » est rendu ouvert, les quatre autres sections sont des accordéons fermés', () => {
  const wrapper = mount(FicheReader, { props: { fiche } })
  expect(wrapper.find('.fiche-prose').html()).toContain('<strong>court</strong>')
  expect(wrapper.findAll('button[aria-expanded="false"]')).toHaveLength(4)
  expect(wrapper.text()).not.toContain('Sous-titre caché')
  expect(wrapper.text()).toContain('(vide)')
})
```

Run : `rtk npx vitest run src/renderer/src/components` → FAIL, module absent. Si happy-dom manque `ResizeObserver` ou `matchMedia` au montage de reka-ui, ajouter en tête du test :

```ts
globalThis.ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
```

- [ ] **Step 2 : `StatutBadge.vue`**

```vue
<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

import type { FicheStatut } from '@shared/wiki/parse-fiche'

defineProps<{ statut: FicheStatut }>()

const LABELS: Record<FicheStatut, string> = {
  valide: 'validé',
  hypothese: 'hypothèse',
  obsolete: 'obsolète',
}

// Tokens sémantiques du thème (main.css), pas de palette brute.
const CLASSES: Record<FicheStatut, string> = {
  valide: 'bg-status-valide text-status-valide-foreground border-transparent',
  hypothese: 'bg-status-hypothese text-status-hypothese-foreground border-transparent',
  obsolete: 'bg-status-obsolete text-status-obsolete-foreground border-transparent',
}
</script>

<template>
  <Badge variant="outline" :class="CLASSES[statut]">{{ LABELS[statut] }}</Badge>
</template>
```

- [ ] **Step 3 : `FicheList.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'

import StatutBadge from '@/components/StatutBadge.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { dossiers, fichesDuDossier } from '@/lib/wiki-index'

defineProps<{ activeSlug: string }>()

const groups = computed(() =>
  dossiers.map((dossier) => ({ dossier, fiches: fichesDuDossier(dossier) })),
)
</script>

<template>
  <aside class="bg-sidebar border-sidebar-border w-72 shrink-0 border-r" aria-label="Fiches du wiki">
    <ScrollArea class="h-full">
      <nav class="flex flex-col gap-5 p-3">
        <section v-for="group in groups" :key="group.dossier">
          <h2 class="text-muted-foreground mb-1 px-2 text-xs font-semibold tracking-wide uppercase">
            {{ group.dossier }}
          </h2>
          <ul class="flex flex-col gap-0.5">
            <li v-for="fiche in group.fiches" :key="fiche.slug">
              <RouterLink
                :to="`/wiki/${fiche.slug}`"
                :class="
                  cn(
                    'hover:bg-sidebar-accent flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm',
                    fiche.slug === activeSlug && 'bg-sidebar-accent font-medium',
                  )
                "
                :aria-current="fiche.slug === activeSlug ? 'page' : undefined"
              >
                <span class="truncate">{{ fiche.titre }}</span>
                <StatutBadge :statut="fiche.statut" class="shrink-0" />
              </RouterLink>
            </li>
          </ul>
        </section>
      </nav>
    </ScrollArea>
  </aside>
</template>
```

- [ ] **Step 4 : `FicheReader.vue` (variante A)**

Les liens `https://` du markdown portent `target="_blank"` : Electron les route vers `setWindowOpenHandler` (tâche 12), qui les ouvre dans le navigateur du système et refuse la fenêtre. Aucun JavaScript côté renderer n'est nécessaire pour ça. Les sources de l'en-tête passent par `window.anka.app.openExternal`.

```vue
<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import { computed } from 'vue'

import StatutBadge from '@/components/StatutBadge.vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { renderMarkdown } from '@/lib/wiki-index'
import { SECTION_TITLES } from '@shared/wiki/parse-fiche'

import type { Fiche, SectionTitle } from '@shared/wiki/parse-fiche'

const props = defineProps<{ fiche: Fiche }>()

const DETAIL_SECTIONS: readonly SectionTitle[] = SECTION_TITLES.filter(
  (title) => title !== 'En bref',
)

const enBref = computed(() => renderMarkdown(props.fiche.sections['En bref']))

const details = computed(() =>
  DETAIL_SECTIONS.map((title) => {
    const source = props.fiche.sections[title]
    return { title, html: renderMarkdown(source), empty: source.trim() === '' }
  }),
)

const verifiedLabel = computed(() => {
  const [year, month, day] = props.fiche.derniereVerif.split('-')
  return year !== undefined && month !== undefined && day !== undefined
    ? `${day}/${month}/${year}`
    : props.fiche.derniereVerif
})

function openSource(url: string): void {
  void window.anka.app.openExternal(url)
}
</script>

<template>
  <ScrollArea class="h-full min-w-0 flex-1">
    <article class="mx-auto max-w-3xl px-8 py-6">
      <header class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight">{{ fiche.titre }}</h1>
        <div class="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
          <StatutBadge :statut="fiche.statut" />
          <Badge variant="outline">confiance {{ fiche.confiance }}</Badge>
          <Badge variant="outline">Dofus {{ fiche.versionDofus }}</Badge>
          <span>vérifiée le {{ verifiedLabel }}</span>
        </div>
        <ul v-if="fiche.sources.length > 0" class="mt-3 flex flex-col gap-1 text-sm">
          <li v-for="source in fiche.sources" :key="source.url" class="flex items-baseline gap-1">
            <Button variant="link" class="h-auto p-0 text-left" @click="openSource(source.url)">
              <ExternalLink class="mr-1 size-3.5" aria-hidden="true" />
              {{ source.titre }}
            </Button>
            <span class="text-muted-foreground">· {{ source.date }}</span>
          </li>
        </ul>
      </header>

      <Card class="border-primary/30">
        <CardHeader>
          <CardTitle>En bref</CardTitle>
        </CardHeader>
        <!-- eslint-disable-next-line vue/no-v-html -- HTML produit par markdown-it avec html:false : le brut est échappé -->
        <CardContent class="fiche-prose" v-html="enBref" />
      </Card>

      <Separator class="my-6" />

      <Accordion type="multiple" class="w-full">
        <AccordionItem v-for="section in details" :key="section.title" :value="section.title">
          <AccordionTrigger>
            <span>
              {{ section.title }}
              <span v-if="section.empty" class="text-muted-foreground ml-2 text-xs">(vide)</span>
            </span>
          </AccordionTrigger>
          <!-- eslint-disable-next-line vue/no-v-html -- même raison que ci-dessus -->
          <AccordionContent class="fiche-prose" v-html="section.html" />
        </AccordionItem>
      </Accordion>
    </article>
  </ScrollArea>
</template>
```

- [ ] **Step 5 : `WikiPage.vue` définitive**

```vue
<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import FicheList from '@/components/FicheList.vue'
import FicheReader from '@/components/FicheReader.vue'
import { DEFAULT_SLUG, findFiche } from '@/lib/wiki-index'

const props = defineProps<{ slug?: string }>()

const router = useRouter()
const fiche = computed(() => findFiche(props.slug ?? DEFAULT_SLUG))

// Slug inconnu ou absent : on retombe sur le digest.
watchEffect(() => {
  if (fiche.value === undefined) void router.replace(`/wiki/${DEFAULT_SLUG}`)
})
</script>

<template>
  <div class="flex min-w-0 flex-1">
    <FicheList :active-slug="fiche?.slug ?? DEFAULT_SLUG" />
    <FicheReader v-if="fiche" :key="fiche.slug" :fiche="fiche" />
  </div>
</template>
```

- [ ] **Step 6 : tests, verify, visuel, commit**

Run : `rtk npx vitest run src/renderer` → PASS (index + 2 tests DOM).
Run : `rtk npm run verify` → vert.
Run : `rtk npm run dev` → liste des 12 fiches groupées sous « dragodindes », digest en tête et ouvert par défaut ; clic sur une fiche : en-tête, encadré En bref, quatre accordéons ; un lien interne dans le texte navigue vers la fiche ; un lien `https` ouvre le navigateur du système et **pas** une fenêtre Electron. Fermer.

```bash
rtk git add app/src/renderer/src/components/StatutBadge.vue app/src/renderer/src/components/FicheList.vue app/src/renderer/src/components/FicheReader.vue app/src/renderer/src/components/FicheReader.dom.test.ts app/src/renderer/src/pages/WikiPage.vue
rtk git commit -m "feat(renderer): lecteur wiki, liste par dossier, En bref ouvert et accordéons"
```

### Task 15 : pages Profil et Élevage

**Files:**
- Modify: `app/src/renderer/src/pages/ProfilPage.vue`, `app/src/renderer/src/pages/ElevagePage.vue`

- [ ] **Step 1 : `ProfilPage.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/error-message'
import { useProfileStore } from '@/stores/profile'

const store = useProfileStore()
const serveur = ref('')
const pseudo = ref('')
const saving = ref(false)

function resetForm(): void {
  serveur.value = store.profile.serveur
  pseudo.value = store.profile.pseudo
}

onMounted(async () => {
  if (!store.loaded) await store.load()
  if (store.loadError !== null) {
    toast.error('Profil illisible', { description: store.loadError })
  }
  resetForm()
})

watch(() => store.profile, resetForm)

const dirty = computed(
  () => serveur.value.trim() !== store.profile.serveur || pseudo.value.trim() !== store.profile.pseudo,
)

async function save(): Promise<void> {
  saving.value = true
  try {
    await store.save({ serveur: serveur.value.trim(), pseudo: pseudo.value.trim() })
    toast.success('Profil enregistré')
  } catch (error) {
    toast.error('Enregistrement impossible', { description: errorMessage(error) })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="flex-1 overflow-auto p-8">
    <Card class="max-w-xl">
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>
          Le serveur sert à taguer les prix que tu saisiras dans les prochains modules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="save">
          <div class="grid gap-2">
            <Label for="serveur">Serveur de jeu</Label>
            <Input id="serveur" v-model="serveur" maxlength="60" placeholder="ex. Draconiros" />
          </div>
          <div class="grid gap-2">
            <Label for="pseudo">Pseudo (facultatif)</Label>
            <Input id="pseudo" v-model="pseudo" maxlength="40" />
          </div>
          <div class="flex gap-2">
            <Button type="submit" :disabled="!dirty || saving">Enregistrer</Button>
            <Button type="button" variant="ghost" :disabled="!dirty" @click="resetForm">Annuler</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </section>
</template>
```

- [ ] **Step 2 : `ElevagePage.vue`**

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
</script>

<template>
  <section class="flex-1 overflow-auto p-8">
    <Card class="max-w-xl">
      <CardHeader>
        <CardTitle>Suivi d'élevage</CardTitle>
        <CardDescription>
          L'écran de suivi (dragodindes, jauges, parcours cochable) arrive avec le sous-projet SP3.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button as-child variant="secondary">
          <RouterLink to="/wiki/parcours-debutant">Lire le parcours débutant en attendant</RouterLink>
        </Button>
      </CardContent>
    </Card>
  </section>
</template>
```

- [ ] **Step 3 : verify, visuel, commit**

Run : `rtk npm run verify` → vert.
Run : `rtk npm run dev` → Profil : saisir un serveur, Enregistrer (toast), fermer et relancer l'app : la valeur est là (fichier `%APPDATA%/anka/data/profile.json`). Élevage : la carte et le lien vers le parcours. Fermer.

```bash
rtk git add app/src/renderer/src/pages/ProfilPage.vue app/src/renderer/src/pages/ElevagePage.vue
rtk git commit -m "feat(renderer): page Profil (serveur, pseudo) et placeholder Élevage"
```

### Task 16 : page Paramètres (thème, export/import, mise à jour)

**Files:**
- Create: `app/src/renderer/src/stores/updater.ts`
- Modify: `app/src/renderer/src/pages/ParametresPage.vue`
- Modify: `app/src/renderer/src/App.vue` (démarrage du store updater + toast « prête »)

- [ ] **Step 1 : `stores/updater.ts`**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { UpdaterState } from '@shared/ipc'

export const useUpdaterStore = defineStore('updater', () => {
  const state = ref<UpdaterState>({ status: 'idle' })
  let unsubscribe: (() => void) | undefined

  async function start(): Promise<void> {
    if (unsubscribe !== undefined) return
    unsubscribe = window.anka.updater.onState((next) => {
      state.value = next
    })
    state.value = await window.anka.updater.getState()
  }

  function check(): Promise<void> {
    return window.anka.updater.check()
  }

  function quitAndInstall(): Promise<void> {
    return window.anka.updater.quitAndInstall()
  }

  return { state, start, check, quitAndInstall }
})
```

- [ ] **Step 2 : `App.vue` : démarrer le store et prévenir quand une mise à jour est prête**

Remplacer le bloc `<script setup>` de `app/src/renderer/src/App.vue` par :

```ts
import { onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'

import AppRail from '@/components/AppRail.vue'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/composables/use-theme'
import { useUpdaterStore } from '@/stores/updater'

// Pose la classe dark/light sur <html> dès le montage et la maintient.
useTheme()

const updater = useUpdaterStore()
onMounted(() => {
  void updater.start()
})

watch(
  () => updater.state,
  (state) => {
    if (state.status === 'ready') {
      toast.info(`Version ${state.version} prête`, {
        description: 'Elle s’installera à la fermeture, ou tout de suite si tu redémarres.',
        action: { label: 'Redémarrer', onClick: () => void updater.quitAndInstall() },
        duration: 15_000,
      })
    }
  },
)
```

- [ ] **Step 3 : `ParametresPage.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTheme } from '@/composables/use-theme'
import { errorMessage } from '@/lib/error-message'
import { useProfileStore } from '@/stores/profile'
import { useUpdaterStore } from '@/stores/updater'

import type { ThemeMode } from '@/composables/use-theme'

const REPO_URL = 'https://github.com/BahuaudDimitri/Anka'
const DOFUSDUDE_URL = 'https://docs.dofusdu.de/'

const theme = useTheme()
const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'auto', label: 'Comme Windows' },
]

const profile = useProfileStore()
const updater = useUpdaterStore()
const version = ref('…')
const busy = ref(false)

onMounted(async () => {
  version.value = await window.anka.app.version()
})

const updateLabel = computed(() => {
  const state = updater.state
  switch (state.status) {
    case 'idle': {
      return 'Aucune vérification effectuée.'
    }
    case 'checking': {
      return 'Vérification en cours…'
    }
    case 'available': {
      return `Version ${state.version} disponible, téléchargement en cours…`
    }
    case 'downloading': {
      return `Téléchargement : ${String(state.percent)} %`
    }
    case 'ready': {
      return `Version ${state.version} téléchargée, prête à installer.`
    }
    case 'up-to-date': {
      return 'Anka est à jour.'
    }
    case 'unavailable': {
      return state.message
    }
    case 'error': {
      return `Erreur : ${state.message}`
    }
  }
})

async function exportAll(): Promise<void> {
  busy.value = true
  try {
    const result = await window.anka.transfer.exportAll()
    if (result.ok) toast.success('Export enregistré', { description: result.path })
  } catch (error) {
    toast.error('Export impossible', { description: errorMessage(error) })
  } finally {
    busy.value = false
  }
}

async function importAll(): Promise<void> {
  busy.value = true
  try {
    const result = await window.anka.transfer.importAll()
    if (result.ok) {
      await profile.load()
      toast.success('Import terminé', { description: result.path })
    } else if (result.reason === 'invalid') {
      toast.error('Import refusé, rien n’a été modifié', { description: result.details })
    }
  } catch (error) {
    toast.error('Import impossible', { description: errorMessage(error) })
  } finally {
    busy.value = false
  }
}

function openExternal(url: string): void {
  void window.anka.app.openExternal(url)
}
</script>

<template>
  <section class="flex-1 overflow-auto p-8">
    <div class="flex max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup v-model="theme" class="flex gap-6">
            <div v-for="option in themeOptions" :key="option.value" class="flex items-center gap-2">
              <RadioGroupItem :id="`theme-${option.value}`" :value="option.value" />
              <Label :for="`theme-${option.value}`">{{ option.label }}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données</CardTitle>
          <CardDescription>
            Tes données restent sur cet ordinateur. L'export produit un fichier JSON que l'import
            relit intégralement.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex gap-2">
          <Button :disabled="busy" @click="exportAll">Exporter…</Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="outline" :disabled="busy">Importer…</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remplacer les données actuelles ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le fichier choisi remplacera le profil enregistré. Un fichier invalide est refusé
                  et ne modifie rien.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction @click="importAll">Choisir un fichier</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mise à jour</CardTitle>
          <CardDescription>Anka {{ version }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <p class="text-sm" role="status">{{ updateLabel }}</p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              :disabled="updater.state.status === 'checking' || updater.state.status === 'downloading'"
              @click="updater.check"
            >
              Vérifier
            </Button>
            <Button v-if="updater.state.status === 'ready'" @click="updater.quitAndInstall">
              Redémarrer pour installer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col items-start gap-1 text-sm">
          <Button variant="link" class="h-auto p-0" @click="openExternal(REPO_URL)">
            Code source et versions (GitHub)
          </Button>
          <Button variant="link" class="h-auto p-0" @click="openExternal(DOFUSDUDE_URL)">
            Données statiques du jeu : DofusDude
          </Button>
          <p class="text-muted-foreground">Dofus est une marque d'Ankama. Anka n'est pas affilié à Ankama.</p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
```

`useColorMode` renvoie une ref acceptée par `v-model` ; si `vue-tsc` refuse le type (`WritableComputedRef` contre `string`), passer par `:model-value="theme" @update:model-value="(v) => (theme = v as ThemeMode)"`.

- [ ] **Step 4 : verify, visuel, commit**

Run : `rtk npm run verify` → vert.
Run : `rtk npm run dev` → Paramètres : le thème bascule instantanément (sombre, clair, comme Windows) et survit à un redémarrage ; Exporter écrit un fichier ; Importer demande confirmation puis relit le fichier (le profil réapparaît si on l'avait vidé) ; un fichier JSON quelconque est refusé avec la raison ; « Vérifier » affiche le message d'indisponibilité en développement ; les deux liens ouvrent le navigateur. Fermer.

```bash
rtk git add app/src/renderer/src/stores/updater.ts app/src/renderer/src/pages/ParametresPage.vue app/src/renderer/src/App.vue
rtk git commit -m "feat(renderer): Paramètres (thème, export/import confirmé, état de mise à jour, à propos)"
```

---

## Phase E — Packaging, CI, livraison, preuve de mise à jour

### Task 17 : electron-builder, icône placeholder, installateur local

**Files:**
- Create: `app/scripts/make-placeholder-icon.mjs`
- Create: `app/resources/icon.png` (généré)
- Create: `app/electron-builder.yml`
- Modify: `README.md`

- [ ] **Step 1 : script d'icône (PNG 256×256 sans dépendance)**

electron-builder convertit lui-même un PNG d'au moins 256 px en `.ico` pour Windows. Le script produit un carré sombre avec un carré clair centré : c'est un placeholder assumé, l'icône définitive est une tâche joueur (spec §14).

`app/scripts/make-placeholder-icon.mjs` :

```js
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const SIZE = 256
const INNER_FROM = 48
const INNER_TO = SIZE - INNER_FROM
const OUTER_RGB = [30, 27, 75]
const INNER_RGB = [129, 140, 248]

function crc32(buffer) {
  let crc = 0xff_ff_ff_ff
  for (const byte of buffer) {
    let c = (crc ^ byte) & 0xff
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const stride = SIZE * 4 + 1
const raw = Buffer.alloc(stride * SIZE)
for (let y = 0; y < SIZE; y += 1) {
  raw[y * stride] = 0 // filtre PNG « none » pour la ligne
  for (let x = 0; x < SIZE; x += 1) {
    const inner = x >= INNER_FROM && x < INNER_TO && y >= INNER_FROM && y < INNER_TO
    const [r, g, b] = inner ? INNER_RGB : OUTER_RGB
    const offset = y * stride + 1 + x * 4
    raw[offset] = r
    raw[offset + 1] = g
    raw[offset + 2] = b
    raw[offset + 3] = 255
  }
}

const header = Buffer.alloc(13)
header.writeUInt32BE(SIZE, 0)
header.writeUInt32BE(SIZE, 4)
header[8] = 8 // bits par canal
header[9] = 6 // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync('resources', { recursive: true })
writeFileSync('resources/icon.png', png)
console.log('resources/icon.png écrit (256x256)')
```

Run (depuis `app/`) : `rtk npm run icon`
Expected : `resources/icon.png écrit (256x256)`. Ouvrir le fichier avec l'outil Read pour vérifier qu'il s'affiche (carré indigo sur fond sombre).

- [ ] **Step 2 : `app/electron-builder.yml`**

Faits de la doc electron-builder (spec §8) : `releaseType: release` (le défaut `draft` est invisible pour l'updater), `owner`/`repo` explicites, publication seulement sur `--publish` explicite.

```yaml
appId: fr.anka.app
productName: Anka
copyright: MIT, Dimitri Bahuaud
directories:
  output: dist
  buildResources: resources
files:
  - out/**
  - package.json
asar: true
npmRebuild: false
win:
  target:
    - nsis
  icon: resources/icon.png
  artifactName: ${productName}-Setup-${version}.${ext}
nsis:
  oneClick: true
  perMachine: false
  allowToChangeInstallationDirectory: false
  deleteAppDataOnUninstall: false
  shortcutName: Anka
publish:
  provider: github
  owner: BahuaudDimitri
  repo: Anka
  releaseType: release
```

- [ ] **Step 3 : installateur local**

Run : `rtk npm run dist` (3 à 6 minutes la première fois : téléchargement d'Electron et des outils NSIS dans le cache electron-builder).
Expected : `dist/Anka-Setup-0.1.0.exe`, `dist/Anka-Setup-0.1.0.exe.blockmap`, `dist/latest.yml`. Vérifier avec `ls dist`. Ouvrir `dist/latest.yml` : il contient `version: 0.1.0`, `path: Anka-Setup-0.1.0.exe`, un `sha512`.

Échecs connus : « cannot find icon » → le PNG fait moins de 256 px ou le chemin est faux ; « Application entry file "out/main/index.js" does not exist » → `npm run build` n'a pas tourné (le script `dist` l'enchaîne, vérifier qu'il n'a pas échoué avant).

Installer localement (facultatif mais conseillé avant la CI) : lancer `dist/Anka-Setup-0.1.0.exe`, accepter l'avertissement SmartScreen (« Informations complémentaires » puis « Exécuter quand même »), vérifier que l'app s'ouvre, que le wiki s'affiche, que Paramètres montre `0.1.0` et que « Vérifier » remonte une erreur réseau ou « à jour » (aucune release n'existe encore : l'erreur 404 est attendue et s'affiche comme `Erreur : …`, pas comme un plantage).

- [ ] **Step 4 : README**

Dans `README.md` à la racine, remplacer le paragraphe d'introduction (« Outil compagnon personnel … à venir, une application Windows … ») par :

```markdown
Outil compagnon personnel pour Dofus 3 : une base de connaissance en markdown (le « wiki ») et une
application Windows qui la rend et proposera des écrans de suivi (élevage de dragodindes, prix
observés, progression).

## L'application

Installateur Windows dans les [releases GitHub](https://github.com/BahuaudDimitri/Anka/releases) :
télécharger `Anka-Setup-<version>.exe`, l'exécuter. Windows affiche un avertissement SmartScreen
(« éditeur inconnu ») parce que l'installateur n'est pas signé : « Informations complémentaires »
puis « Exécuter quand même ». L'application vérifie les mises à jour au démarrage et les installe à
la fermeture.

Développement : `cd app && npm install && npm run dev`. Gate unique : `npm run verify` (lint,
format, typecheck, tests). Installateur local : `npm run dist`. Le code est dans `app/`, la stack et
les règles dans `docs/superpowers/specs/2026-09-05-sp2-socle-app-design.md`.
```

- [ ] **Step 5 : commit**

```bash
rtk git add app/scripts/make-placeholder-icon.mjs app/resources/icon.png app/electron-builder.yml README.md
rtk git commit -m "build(app): electron-builder NSIS, publication GitHub (release, pas draft), icône placeholder"
```

### Task 18 : GitHub Actions (CI et release) et Dependabot

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`
- Create: `.github/dependabot.yml`

- [ ] **Step 1 : `.github/workflows/ci.yml`**

Le nom du job, `verify`, est le contexte de check que la protection de branche exigera (tâche 19).

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: verify
    runs-on: windows-latest
    timeout-minutes: 30
    defaults:
      run:
        working-directory: app
        shell: bash
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: app/package-lock.json
      - run: npm ci
      - run: npm run verify
      - run: npm run dist
      - uses: actions/upload-artifact@v4
        with:
          name: anka-setup
          path: app/dist/*.exe
          retention-days: 7
```

- [ ] **Step 2 : `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    name: release
    runs-on: windows-latest
    timeout-minutes: 40
    defaults:
      run:
        working-directory: app
        shell: bash
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: app/package-lock.json
      - name: Le tag doit égaler la version du package.json
        run: |
          VERSION="$(node -p "require('./package.json').version")"
          if [ "v$VERSION" != "$GITHUB_REF_NAME" ]; then
            echo "tag $GITHUB_REF_NAME ≠ v$VERSION (package.json)"; exit 1
          fi
      - run: npm ci
      - run: npm run verify
      - run: npm run build
      - name: Build et publication GitHub Releases
        run: npx electron-builder --win --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 3 : `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /app
    schedule:
      interval: weekly
      day: monday
    groups:
      electron:
        patterns: ['electron', 'electron-builder', 'electron-updater', 'electron-vite']
      dev:
        dependency-type: development
        patterns: ['*']
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
```

- [ ] **Step 4 : contrôle de syntaxe et commit**

Run (depuis la racine du worktree) : `rtk npx --prefix app prettier --check .github` → OK (les YAML sont formatés).

```bash
rtk git add .github
rtk git commit -m "ci: verify + build sur PR, release NSIS sur tag v*, Dependabot hebdo groupé"
```

### Task 19 : push, PR, CI verte, protection de branche

Cette tâche est faite par le pilote (opérations externes), pas par un subagent.

- [ ] **Step 1 : push et PR**

```bash
export GH_TOKEN="$(gh auth token --user BahuaudDimitri)"
rtk git push -u origin feature/sp2-socle-app
```

Écrire le corps de PR dans le scratchpad (outil Write) : résumé du livrable (spec §1), la table claim | preuve | commande (spec §13) remplie avec les sorties réelles des tâches 1 à 18, et la liste des règles ESLint désactivées avec leur raison. Puis :

```bash
gh pr create -R BahuaudDimitri/Anka --base main --head feature/sp2-socle-app \
  --title "SP2 : socle app Electron (wiki embarqué, profil, export/import, mise à jour auto)" \
  --body-file <scratchpad>/pr-body.md
```

- [ ] **Step 2 : attendre la CI, lire le résultat brut**

```bash
gh pr checks -R BahuaudDimitri/Anka --watch
```

Expected : `verify` en `pass`. Un check `cancelled`, `skipped` ou `neutral` **n'est pas** un pass. En cas d'échec, `gh run view <id> --log-failed`, corriger en lot, commit, push, relancer ; cap 2 passes, au-delà remonter au joueur.

Différences Windows CI probables : chemin `__dirname` dans `electron.vite.config.ts` (utiliser `resolve`) ; `husky` qui échoue dans `npm ci` (le script `prepare` tourne : s'il casse en CI, le rendre tolérant avec `"prepare": "cd .. && husky app/.husky || true"` et noter la raison dans le spec §11).

- [ ] **Step 3 : protection de `main`**

Écrire `<scratchpad>/protection.json` :

```json
{
  "required_status_checks": { "strict": true, "contexts": ["verify"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

```bash
gh api -X PUT repos/BahuaudDimitri/Anka/branches/main/protection --input <scratchpad>/protection.json
gh api repos/BahuaudDimitri/Anka/branches/main/protection --jq '.required_status_checks.contexts'
```

Expected : `["verify"]`. Coller la sortie dans la table de preuves.

### Task 20 : merge, release v0.1.0, installation, v0.1.1, preuve de la mise à jour

Tâche pilote, avec deux gates joueur (installation, puis constat de la mise à jour). Les tags se posent depuis le worktree sans checkout de `main`.

- [ ] **Step 1 : merge**

```bash
export GH_TOKEN="$(gh auth token --user BahuaudDimitri)"
gh pr merge -R BahuaudDimitri/Anka --merge
rtk git fetch origin main
```

- [ ] **Step 2 : tag v0.1.0 et release**

```bash
rtk git tag v0.1.0 origin/main
rtk git push origin v0.1.0
gh run list -R BahuaudDimitri/Anka --workflow release.yml --limit 1
gh run watch -R BahuaudDimitri/Anka <run-id> --exit-status
gh release view v0.1.0 -R BahuaudDimitri/Anka --json isDraft,isPrerelease,assets --jq '{isDraft, isPrerelease, assets: [.assets[].name]}'
```

Expected : `isDraft: false`, assets `Anka-Setup-0.1.0.exe`, `Anka-Setup-0.1.0.exe.blockmap`, `latest.yml`. Si `isDraft: true`, `releaseType` n'a pas été pris en compte : publier la release à la main (`gh release edit v0.1.0 --draft=false`) **et** corriger la config avant v0.1.1.

- [ ] **Step 3 : gate joueur, installation**

Télécharger : `gh release download v0.1.0 -R BahuaudDimitri/Anka -p '*.exe' -D <scratchpad>/release`. Demander au joueur (AskUserQuestion) d'installer l'exe, d'ouvrir l'app, et de confirmer : le wiki s'affiche, Paramètres montre `0.1.0`, « Vérifier » dit « à jour ». Consigner sa réponse.

- [ ] **Step 4 : v0.1.1**

```bash
rtk git worktree add C:/Users/DimitriBahuaud/Documents/Anka/.wt/chore-v0.1.1 -b chore/v0.1.1 origin/main
cd C:/Users/DimitriBahuaud/Documents/Anka/.wt/chore-v0.1.1/app
rtk npm version patch --no-git-tag-version      # 0.1.0 → 0.1.1 dans package.json et package-lock.json
rtk git add package.json package-lock.json
rtk git commit -m "chore(app): version 0.1.1 (preuve de mise à jour automatique)"
rtk git push -u origin chore/v0.1.1
gh pr create -R BahuaudDimitri/Anka --base main --head chore/v0.1.1 --title "chore: v0.1.1" --body "Bump de version pour prouver la mise à jour automatique depuis 0.1.0."
gh pr checks -R BahuaudDimitri/Anka --watch
gh pr merge -R BahuaudDimitri/Anka --merge
rtk git fetch origin main
rtk git tag v0.1.1 origin/main
rtk git push origin v0.1.1
gh run watch -R BahuaudDimitri/Anka <run-id> --exit-status
gh release view v0.1.1 -R BahuaudDimitri/Anka --json isDraft,assets --jq '{isDraft, assets: [.assets[].name]}'
```

- [ ] **Step 5 : gate joueur, mise à jour constatée**

Demander au joueur (AskUserQuestion) : relancer Anka 0.1.0 (ou cliquer « Vérifier » dans Paramètres), attendre le toast « Version 0.1.1 prête », cliquer « Redémarrer », puis lire la version dans Paramètres. Attendu : `0.1.1`. Si l'app ne voit pas la mise à jour : `gh release view v0.1.1 --json isDraft` (brouillon ?), et le journal de l'updater dans `%APPDATA%/anka/logs/` ou la console (`%LOCALAPPDATA%/anka-updater/`) ; lire l'erreur avant de toucher au code.

- [ ] **Step 6 : clôture**

- Mettre à jour la passation : nouveau doc `docs/superpowers/plans/2026-09-XX-sp2-passation.md` via le skill `passation` (pièges payés : versions incompatibles, release draft, hook `exec`, tout ce qui a résisté en CI), état git déclaré, table claim | preuve | commande finale avec `UNVERIFIED` explicites.
- Supprimer les worktrees `chore-v0.1.1` et `feature-sp2-socle-app` une fois mergés (`git worktree remove`), garder les branches distantes.
- Arrêter le serveur du companion visuel (`scripts/stop-server.sh` du skill brainstorming) s'il tourne encore.

---

## Auto-revue du plan (faite à l'écriture)

**Couverture du spec** : §1 périmètre → tâches 13 à 16 (écrans), 17 (exe), 20 (preuve) ; §2 cadrage → en-tête ; §3 versions → tâche 1 ; §4 structure → carte des fichiers ; §5 IPC → 6, 12 ; §6 wiki → 7, 8, 9, 13, 14 ; §7 données et thème → 6, 10, 12, 13, 15, 16 ; §8 updater et release → 11, 17, 18, 20 ; §9 écrans → 13 à 16 ; §10 tests → chaque tâche B à D, 4 pour le lint ; §11 qualité → 2, 3, 4 ; §12 CI et protection → 18, 19 ; §13 preuves → 19 et 20 (table remplie dans la PR et la passation) ; §14 risques → 17 (icône, SmartScreen), 19 (runner Windows).

**Écarts assumés par rapport au spec**, à reporter dans le spec au moment de la tâche concernée :
- §6 : les liens `https` du markdown ne sont plus interceptés côté renderer ; `target="_blank"` + `setWindowOpenHandler` dans main font le travail (tâche 12 et 14).
- §11.4 : cinq ajustements de règles (tâche 2, étape 4).
- §4 : `eslint.config.mjs` et `prettier.config.mjs` (pas `.js`) parce que `package.json` n'a pas `"type": "module"` (preload CJS pour `sandbox: true`).

**Cohérence des noms entre tâches** : `parseFiche`, `Fiche`, `SECTION_TITLES`, `SectionTitle`, `FicheStatut` (7 → 13, 14) ; `createMarkdownRenderer` (8 → 13) ; `IPC`, `AnkaApi`, `UpdaterState`, `StoreKey`, `isStoreKey` (6 → 11, 12, 16) ; `JsonStore`, `StoreDefinition`, `Stores`, `createStores` (10 → 12) ; `Updater`, `createUpdater`, `reduceUpdaterEvent`, `UpdaterEvent` (11 → 12) ; `useTheme`, `ThemeMode` (13 → 16) ; `useProfileStore` (13 → 15, 16) ; `useUpdaterStore` (16) ; `renderMarkdown`, `findFiche`, `DEFAULT_SLUG`, `dossiers`, `fichesDuDossier` (13 → 14).
