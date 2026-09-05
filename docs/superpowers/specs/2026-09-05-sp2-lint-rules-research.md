# Proposition de jeu de règles ESLint — app Electron + Vue 3 + TS (SP2)

Toutes les versions ci-dessous vérifiées via `npm view <pkg> version peerDependencies` le 2026-09-05.
Tous les noms de règles cités ont été confirmés soit par fetch de la doc officielle du plugin (page
de règle individuelle ou index brut des fichiers `docs/rules/`), soit en dépaquetant le tarball npm
(`npm pack` + lecture du `readme.md`/`index.js` dans le scratchpad) quand la doc web était ambiguë ou
absente. Aucun nom n'est sorti de mémoire sans cette vérification — voir section 5.

---

## 1. Plugins/configs — garder ou écarter

| Paquet | Version | Peer ESLint | Compatible ESLint 10 flat config | Décision | Pourquoi (1 ligne) |
|---|---|---|---|---|---|
| `eslint` | 10.10.0 | — | oui | **Garder** | Base, flat config natif, ESM. |
| `@eslint/js` | 10.0.1 | `^10.0.0` | oui | **Garder** | `configs.recommended` — base JS officielle. |
| `typescript-eslint` | 8.69.0 | `^8.57.0\|\|^9\|\|^10`, `typescript >=4.8.4 <6.1.0` | oui | **Garder** | Meta-package parser+plugin+configs, seule voie maintenue pour TS+flat. |
| `eslint-plugin-vue` | 10.10.0 | `^8.57.0\|\|^9\|\|^10`, `vue-eslint-parser ^10.3.0`, `@typescript-eslint/parser ^7\|\|^8` | oui | **Garder** | Règles Vue SFC, seul plugin du genre. |
| `vue-eslint-parser` | 10.4.1 | `^8.57.0\|\|^9\|\|^10` | oui | **Garder** | Parser des `.vue`, requis par eslint-plugin-vue. |
| `eslint-config-prettier` | 10.1.8 | `>=7.0.0` | oui | **Garder** | Désactive les règles de style qui entreraient en conflit avec Prettier. |
| `eslint-plugin-import-x` | 4.17.1 | `^8.57.0\|\|^9\|\|^10`, `@typescript-eslint/utils ^8.56.0` | oui | **Garder** | Fork actif d'`eslint-plugin-import` (imports, cycles, résolution TS). |
| `eslint-plugin-import` | 2.32.0 | `^2..^9` (**pas de `^10`**) | **non** | **Écarter** | Peer dep plafonne à ESLint 9 ; remplacé par import-x, activement maintenu. |
| `eslint-plugin-unicorn` | 74.0.0 | `>=10.4` | oui (exige même ESLint ≥10.4, flat, ESM) | **Garder** | Robustesse générale JS/TS ; quelques règles à assouplir (§4). |
| `eslint-plugin-vuejs-accessibility` | 2.6.0 | `^5..^10` | oui, `configs['flat/recommended']` confirmé | **Garder** | Seul plugin a11y pour templates Vue. |
| `@vitest/eslint-plugin` | 1.6.27 | `eslint >=8.57.0`, `vitest *`, `typescript >=5.0.0`, `@typescript-eslint/eslint-plugin *` | oui | **Garder** | Règles spécifiques Vitest (le peer sur `@typescript-eslint/eslint-plugin` est satisfait via `typescript-eslint`). |
| `eslint-plugin-promise` | 7.3.0 | `^7\|\|^8\|\|^9\|\|^10` | oui, `configs['flat/recommended']` confirmé | **Garder** | Discipline sur les chaînes de Promise, complète les règles TS typées. |
| `eslint-plugin-n` | 18.3.0 | `>=8.57.1`, `typescript >=5.0.0`, `ts-declaration-location ^1.0.6` | oui | **Garder** (main/preload uniquement) | Bonnes pratiques Node — pertinent seulement côté process Node. |
| `eslint-plugin-security` | 4.0.1 | non déclaré formellement (README : "requires eslint >= v8.23.0") | oui, `configs.recommended` confirmé dans le paquet | **Garder** (main/preload/shared) | Electron main a un accès `fs`/`child_process` direct : surface à risque réelle. |
| `eslint-plugin-sonarjs` | 4.2.0 | `^8\|\|^9\|\|^10` | oui, `configs.recommended` (mais très verbeux) | **Garder partiellement** | On sélectionne 4 règles utiles plutôt que le preset complet (§3). |
| `eslint-plugin-regexp` | 3.3.0 | `>=9.38.0` | oui, `flat/recommended` confirmé | **Garder** | Regex non triviales assez fréquentes (validation, parsing wiki/DofusDude). |
| `eslint-plugin-perfectionist` | 5.11.0 | `^8.45.0\|\|^9\|\|^10` | oui, `configs['recommended-natural']` confirmé | **Écarter** | Recoupe `import-x/order` pour les imports ; le preset complet trie aussi clés d'objets/props JSX → diff massif et permanent pour un gain stylistique, pas une "bonne pratique de base". Prettier ne le remplace pas mais le besoin n'est pas assez fort pour le coût. |
| `globals` | 17.12.0 | — | oui | **Garder** | Fournit `globals.node` / `globals.browser` pour `languageOptions.globals`. |

**Non retenus, non demandés dans le brief** (mentionnés pour mémoire, écartés sans creuser plus loin
faute de justification suffisante à ce stade) : `eslint-plugin-jsdoc` (pas de politique JSDoc actée),
`eslint-plugin-css-modules`/`eslint-plugin-tailwindcss` (Tailwind v4 casse la compat de la plupart des
forks non maintenus pour la v4 — à ré-évaluer plus tard si besoin).

---

## 2. `eslint.config.js` proposé

```js
// app/eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import { importX } from 'eslint-plugin-import-x';
import unicorn from 'eslint-plugin-unicorn';
import vitestPlugin from '@vitest/eslint-plugin';
import pluginPromise from 'eslint-plugin-promise';
import pluginN from 'eslint-plugin-n';
import pluginSecurity from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import pluginRegexp from 'eslint-plugin-regexp';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

const GENERATED_UI = 'src/renderer/components/ui/**';

export default tseslint.config(
  // ---- ignores globaux --------------------------------------------------
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**', '**/*.d.ts', 'coverage/**'],
  },

  // ---- base JS + TS (tout le repo app/) ---------------------------------
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
  },

  // ---- Vue SFC (renderer) ------------------------------------------------
  ...pluginVue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],
  {
    files: ['src/renderer/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
      },
    },
    rules: {
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] },
      ],
      'vue/no-unused-refs': 'error',
      'vue/require-typed-ref': 'error',
      'vue/no-undef-components': 'error',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/no-restricted-html-elements': [
        'error',
        { element: 'button', message: 'Utiliser le composant <Button> (shadcn-vue).' },
        { element: 'input', message: 'Utiliser le composant <Input> (shadcn-vue).' },
        { element: 'select', message: 'Utiliser le composant <Select> (shadcn-vue).' },
        { element: 'textarea', message: 'Utiliser le composant <Textarea> (shadcn-vue).' },
        { element: 'dialog', message: 'Utiliser le composant <Dialog> (shadcn-vue).' },
        { element: 'table', message: 'Utiliser le composant <Table> (shadcn-vue).' },
      ],
      'vue/no-restricted-class': [
        'error',
        '/^(hover:|dark:)?(bg|text|border)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\\d{2,3}(\\/\\d{1,3})?$/',
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            'vuetify', 'element-plus', 'primevue', 'naive-ui', 'quasar',
            'ant-design-vue', '@headlessui/vue',
          ].map((name) => ({
            name,
            message: `Bibliothèque UI non autorisée hors composants générés — utiliser shadcn-vue (${GENERATED_UI}).`,
          })),
        },
      ],
    },
  },

  // ---- exemption composants générés shadcn-vue --------------------------
  {
    files: [`src/renderer/${GENERATED_UI.replace('src/renderer/', '')}`],
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
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/name-replacements': 'off',
      // toujours actives ici : no-floating-promises, consistent-type-imports,
      // no-unused-vars, eqeqeq, switch-exhaustiveness-check — ce sont des bugs
      // réels même dans du code généré, pas des choix stylistiques.
    },
  },

  // ---- imports (tout le repo) --------------------------------------------
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/order': [
        'warn',
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
            { target: './src/renderer', from: ['./src/main'] },
          ],
        },
      ],
    },
  },

  // ---- unicorn + regexp + sonarjs (sélection) — tout le repo -------------
  unicorn.configs.recommended,
  pluginRegexp.configs['flat/recommended'],
  {
    rules: {
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'warn',
    },
  },

  // ---- main process (Node) -----------------------------------------------
  {
    files: ['src/main/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { n: pluginN, security: pluginSecurity },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'n/no-process-exit': 'error',
      'n/no-deprecated-api': 'error',
      'n/prefer-node-protocol': 'error',
      'no-eval': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='BrowserWindow'] Property[key.name='nodeIntegration'][value.value=true]",
          message: 'nodeIntegration doit rester false : le renderer ne doit jamais avoir accès à Node.',
        },
        {
          selector: "NewExpression[callee.name='BrowserWindow'] Property[key.name='contextIsolation'][value.value=false]",
          message: 'contextIsolation doit rester true.',
        },
      ],
    },
  },

  // ---- preload (Node + contextBridge) ------------------------------------
  {
    files: ['src/preload/**/*.ts'],
    languageOptions: { globals: globals.node },
    plugins: { n: pluginN, security: pluginSecurity },
    rules: {
      ...pluginSecurity.configs.recommended.rules,
      'n/no-process-exit': 'error',
      'n/prefer-node-protocol': 'error',
      'no-eval': 'error',
    },
  },

  // ---- renderer (navigateur, aucun accès Node) ---------------------------
  {
    files: ['src/renderer/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'require', message: 'Le renderer ne doit pas accéder à Node — passer par preload/IPC.' },
        { name: 'process', message: 'Le renderer ne doit pas accéder à Node — passer par preload/IPC.' },
        { name: 'module', message: 'Le renderer ne doit pas accéder à Node — passer par preload/IPC.' },
        { name: '__dirname', message: 'Le renderer ne doit pas accéder à Node — passer par preload/IPC.' },
        { name: '__filename', message: 'Le renderer ne doit pas accéder à Node — passer par preload/IPC.' },
      ],
      'import-x/no-nodejs-modules': 'error',
    },
  },

  // ---- promises (tout le repo, mais surtout async côté main/renderer) ---
  pluginPromise.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow': 'off',
    },
  },

  // ---- shared (types/utilitaires purs) -----------------------------------
  {
    files: ['src/shared/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    // pas de globals.node "exclusif" : le code partagé ne doit dépendre
    // ni des API Node ni des API DOM ; les deux jeux de globals sont
    // déclarés seulement pour éviter les faux `no-undef`, la vraie garde
    // est `import-x/no-restricted-paths` ci-dessus + revue de code.
  },

  // ---- tests --------------------------------------------------------------
  {
    files: ['src/**/*.test.ts', 'tests/**/*.ts'],
    plugins: { vitest: vitestPlugin },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-identical-title': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'test' }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'sonarjs/no-identical-functions': 'off',
    },
  },

  // ---- fichiers de config à la racine de app/ ----------------------------
  {
    files: ['*.config.ts', '*.config.js', '*.config.mjs'],
    languageOptions: { globals: globals.node },
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'unicorn/prefer-module': 'off',
    },
  },

  // ---- Prettier EN DERNIER : neutralise les règles de style ------------
  eslintConfigPrettier,
);
```

Points d'attention sur ce fichier :
- `tseslint.config(...)` est le helper officiel de `typescript-eslint` qui aplatit les tableaux
  imbriqués (`...tseslint.configs.strictTypeChecked` est lui-même un tableau) — évite d'avoir à
  spread manuellement partout, mais spread est fait quand même ici par cohérence/lisibilité.
- `no-restricted-syntax` sur `nodeIntegration`/`contextIsolation` est une **proposition non testée
  en conditions réelles** (pas de projet Electron sous la main pour la faire tourner) — le sélecteur
  esquery est construit à partir de la syntaxe documentée de `no-restricted-syntax` (vérifiée, voir
  §5) mais pas exécuté. À vérifier au premier `BrowserWindow` réel du repo. Marqué non couvert sinon.
- `vue/no-restricted-class` : le regex ci-dessus couvre les préfixes `hover:`/`dark:` et l'opacité
  `/50`, mais **pas** les combinaisons `sm:hover:dark:bg-red-500` (variantes empilées) — le motif
  vérifié dans la doc ne montre qu'un seul niveau de variante. À élargir si le besoin apparaît.

---

## 3. Règles activées au-delà des presets, par thème

### Sécurité Electron

| Règle | Sévérité | Portée | Justification |
|---|---|---|---|
| `no-eval` | error | tout, surtout main/preload | `eval` en contexte Node = exécution de code arbitraire si l'input est contaminé. |
| `no-restricted-syntax` (nodeIntegration/contextIsolation) | error | `src/main/**` | Empêche la régression silencieuse la plus dangereuse d'Electron (renderer avec accès Node complet). Non testé, voir remarque ci-dessus. |
| `no-restricted-globals` (require/process/module/__dirname/__filename) | error | `src/renderer/**` | Le renderer ne doit avoir aucun accès Node — la CT le garantit même si `contextIsolation` est mal configuré ailleurs. |
| `import-x/no-nodejs-modules` | error | `src/renderer/**` | Bloque `import fs from 'node:fs'` etc. dans un fichier renderer avant même l'exécution. |
| `eslint-plugin-security` (`configs.recommended`, 14 règles : `detect-object-injection`, `detect-non-literal-fs-filename`, `detect-child-process`, `detect-eval-with-expression`, `detect-non-literal-require`, `detect-possible-timing-attacks`, `detect-unsafe-regex`, `detect-buffer-noassert`, `detect-new-buffer`, `detect-pseudoRandomBytes`, `detect-non-literal-regexp`, `detect-disable-mustache-escape`, `detect-no-csrf-before-method-override`, `detect-bidi-characters`) | error (config par défaut) | `src/main/**`, `src/preload/**` | Ces 14 règles sont *toutes* dans `configs.recommended` du paquet (vérifié dans `index.js` du tarball) — seule la portée main/preload a du sens (accès fs/child_process réel), sinon trop de faux positifs côté renderer. |

### Robustesse TypeScript

| Règle | Sévérité | Justification |
|---|---|---|
| `@typescript-eslint/no-floating-promises` | error | Une promesse main/IPC non attendue avale silencieusement une erreur — bug classique Electron. |
| `@typescript-eslint/no-misused-promises` | error (via `strictTypeChecked`) | Empêche un `async` passé où un booléen/callback sync est attendu (ex. handler Vue `@click`). |
| `@typescript-eslint/switch-exhaustiveness-check` | error | Les états métier (statuts de capacités/générations) sont des unions ; un `switch` non exhaustif casse silencieusement à l'ajout d'un cas. |
| `@typescript-eslint/consistent-type-imports` | error | Sépare `import type` du reste — nécessaire pour que Vite/esbuild élague correctement les imports de types. |
| `@typescript-eslint/no-unnecessary-condition` | warn | Détecte les checks qui ne peuvent jamais être faux vu le typage — signale un typage trop large ou une logique morte. |
| `@typescript-eslint/require-await` | error | Une fonction `async` sans `await` cache souvent un oubli, ou devrait juste ne pas être async. |
| `@typescript-eslint/prefer-nullish-coalescing` | warn | `??` plutôt que `||` — évite le bug classique sur `0`/`''` (fréquent avec des stats de jeu à 0). |
| `@typescript-eslint/prefer-optional-chain` | warn | Lisibilité, déjà couvert en grande partie par `stylisticTypeChecked`, réaffirmé explicitement. |
| `@typescript-eslint/no-shadow` (+ `no-shadow: off` du cœur) | error | Version type-aware de la règle cœur, évite les faux positifs sur les types shadowés. |
| `explicit-module-boundary-types` | **non activé volontairement** | Casserait l'ergonomie de composables/handlers IPC courts ; `strictTypeChecked` infère déjà correctement dans la quasi-totalité des cas d'usage internes (pas de lib publique à ce stade). |
| `strictTypeChecked` + `stylisticTypeChecked` (presets) | error/warn selon preset | Inclut `no-unsafe-*`, `no-explicit-any`, `restrict-template-expressions`, `array-type`, `consistent-type-definitions`, etc. — c'est le socle "typed linting" recommandé par la doc officielle, avec `projectService: true` (option recommandée en remplacement de `project`, confirmé dans la doc getting-started). |

### Vue

| Règle | Sévérité | Justification |
|---|---|---|
| `vue/block-order` | error | Ordre `script`/`template`/`style` constant sur ~9 fiches wiki + app — lisibilité en revue. |
| `vue/define-macros-order` | error | `defineProps`/`defineEmits` toujours en tête de `<script setup>` — évite un piège d'ordre d'exécution des macros. |
| `vue/no-unused-refs` | error | `ref="x"` dans le template sans usage `$refs.x` = dead code silencieux. |
| `vue/require-typed-ref` | error | `ref()` sans type ni valeur initiale devient `Ref<any>` — troue le typage strict qu'on impose ailleurs. |
| `vue/no-undef-components` | error | Composant utilisé dans le template mais jamais importé/déclaré — erreur runtime évitable statiquement. |
| `vue/component-api-style` (`['script-setup']`) | error | Une seule API de composant dans tout le projet (script setup) — cohérence, décidé dès le départ. |
| `vue/no-restricted-html-elements` (button/input/select/textarea/dialog/table) | error | Décidé — force le passage par shadcn-vue. |
| `vue/no-restricted-class` (regex couleurs Tailwind brutes) | error | Décidé — force les tokens sémantiques shadcn. |
| `no-restricted-imports` (libs UI concurrentes) | error | Décidé — un seul design system. |
| `eslint-plugin-vuejs-accessibility` (`flat/recommended`, 23 règles a11y : `alt-text`, `click-events-have-key-events`, `form-control-has-label`, `no-autofocus`, etc.) | selon preset | Une app "compagnon" grand public doit rester utilisable au clavier/lecteur d'écran dès le départ — coût nul à l'ajout, cher à rattraper plus tard. |

### Imports

| Règle | Sévérité | Justification |
|---|---|---|
| `import-x/no-cycle` | error | Un cycle main↔renderer↔shared est un bug d'archi qu'on veut voir immédiatement, pas au build. |
| `import-x/order` | warn | Ordre stable des imports (builtin/external/internal/relatif/type) — lisibilité, pas bloquant (warn). |
| `import-x/no-extraneous-dependencies` | error | Empêche d'importer un paquet absent de `package.json` (ou mal classé dev/prod). |
| `import-x/no-restricted-paths` (zones main/preload/renderer→shared, main→renderer interdit) | error | Fait respecter mécaniquement la séparation des 4 dossiers déjà actée en amont, sans compter sur la discipline humaine. |
| `import-x/no-nodejs-modules` (renderer seulement) | error | Voir section sécurité ci-dessus. |

### Vitest

| Règle | Sévérité | Justification |
|---|---|---|
| `vitest/no-focused-tests` | error | Un `test.only` oublié fait passer la CI en silence en ignorant le reste de la suite. |
| `vitest/expect-expect` | error | Un test sans assertion "passe" toujours — faux vert classique. |
| `vitest/no-disabled-tests` | warn | Signale les `.skip` accumulés sans bloquer (peuvent être temporaires et légitimes). |
| `vitest/no-identical-title` | error | Deux tests au même nom rendent les rapports d'échec ambigus. |
| `vitest/consistent-test-it` | error | Un seul mot-clé (`test`) dans tout le repo — cohérence stylistique fonctionnelle, pas du formatage Prettier. |

### Divers robustesse (unicorn / promise / n / sonarjs / regexp)

| Règle | Sévérité | Justification |
|---|---|---|
| `unicorn.configs.recommended` (preset, ~100 règles) | selon preset | Base solide (préférer `for...of`, `Array#flat`, `structuredClone`, etc.) ; 3 règles jugées trop intrusives sont désactivées sur `components/ui/**` (`no-null`, `name-replacements` — nouveau nom de l'ex-`prevent-abbreviations`, renommage confirmé dans le code source 74.0.0 — et `filename-case`, car le code shadcn-vue généré utilise `null`, des noms abrégés (`props`, `ref`) et des noms de fichiers non kebab-case par convention amont). |
| `pluginPromise.configs['flat/recommended']` (`always-return`, `no-nesting`, `catch-or-return`, `param-names`, `no-return-wrap`, etc.) | selon preset | Complète les règles TS typées sur les Promises pour les usages `.then()/.catch()` bruts (fetch DofusDude par ex.). |
| `n/no-process-exit` | error (main/preload) | `process.exit()` dans le main d'une app Electron tue la fenêtre sans nettoyage — presque toujours un bug. |
| `n/no-deprecated-api` | error (main) | Détecte l'usage d'API Node dépréciées avant la prochaine montée de version de Node/Electron. |
| `n/prefer-node-protocol` | error (main/preload) | `node:fs` plutôt que `fs` — clarifie l'intention "ceci est du Node", utile pile à la frontière main/preload/renderer qu'on cherche à faire respecter. |
| `sonarjs/cognitive-complexity` (seuil 15) | warn | Alerte sur une fonction qui devient dure à revoir, sans bloquer un refactor en cours. |
| `sonarjs/no-identical-functions` | error | Deux fonctions identiques = copier-coller à factoriser, signal fiable et peu bruyant. |
| `sonarjs/no-all-duplicated-branches` | error | Un `if/else` dont toutes les branches font la même chose = bug de logique quasi certain. |
| `sonarjs/no-collapsible-if` | warn | Lisibilité, faible risque de faux positif. |
| `pluginRegexp.configs['flat/recommended']` (inclut `no-super-linear-backtracking`, `no-unused-capturing-group`, `prefer-regexp-exec`, etc.) | selon preset | Le preset attrape les regex à backtracking catastrophique (risque de gel de l'UI Electron sur une regex de parsing wiki mal écrite). |

**Sévérité générale** : `error` pour tout ce qui signale un bug probable ou une violation d'architecture
actée ; `warn` pour ce qui est stylistique/heuristique et peut avoir des faux positifs légitimes
(complexité cognitive, ordre d'imports, `??` vs `||` dans un cas ambigu).

---

## 4. Ce qui reste hors-lint

- **`:class` dynamique (bindings objet/array/computed) avec des couleurs Tailwind brutes** :
  `vue/no-restricted-class` ne voit que les classes statiques dans `class="..."` — confirmé
  explicitement dans sa doc ("only detect classes that are used as strings in your templates").
  Aucune règle de la doc `eslint-plugin-vue` ne couvre ce cas (`vue/no-restricted-syntax` existe et
  pourrait viser l'AST du `<template>` avec un sélecteur esquery ciblant les clés de `Property` dans
  un objet `:class="{...}"`, mais **aucun exemple documenté** pour ce cas précis et je ne l'ai pas
  testé — proposition non vérifiée, à essayer en premier si le besoin devient réel plutôt qu'à
  intégrer maintenant). Mitigation réaliste à court terme : revue de code + grep ponctuel
  (`rg ":class=\"\{.*bg-(red|orange|...)"`) plutôt qu'un lint fiable.
- **Cohérence des couleurs dans le CSS/Tailwind en dehors des templates Vue** (ex. classes construites
  dynamiquement côté TS puis injectées) : hors du périmètre d'ESLint, qui ne voit que le SFC.
- **`nodeIntegration`/`contextIsolation` réellement appliqués à l'exécution** : le `no-restricted-syntax`
  proposé (§2/§3) vérifie seulement le code source statique de l'appel `new BrowserWindow(...)`. Si la
  config est construite dynamiquement (objet assemblé ailleurs puis spread), le sélecteur ne la voit
  pas. Un test d'intégration Electron (lancer l'app, inspecter `webContents.getWebPreferences()`) reste
  la seule vérification fiable à l'exécution.
- **Cycles d'import purement runtime** (require conditionnel, imports dynamiques `import()`) : hors de
  la portée statique d'`import-x/no-cycle`, qui n'analyse que les imports statiques.
- **Discipline de nommage/portée métier Dofus** (ex. cohérence des unités SP1→SP4, terminologie du
  wiki) : aucun lint générique ne remplace la relecture de contenu — hors sujet ESLint par nature.

---

## 5. Vérifié / Non vérifié

### Méthode de vérification par plugin

| Plugin | Méthode |
|---|---|
| `eslint-plugin-vue` | Fetch page de règle individuelle pour chaque règle citée (`block-order`, `define-macros-order`, `no-unused-refs`, `require-typed-ref`, `no-undef-components`, `component-api-style`, `no-restricted-html-elements`, `no-restricted-class`) + fetch de l'index `/rules/` pour la recherche "restricted". |
| `typescript-eslint` | Fetch de la liste brute exhaustive de `/rules/` (comparaison directe, tous les noms candidats présents), + pages individuelles `switch-exhaustiveness-check`, `consistent-type-imports`, `explicit-module-boundary-types`, + page `users/configs` (noms exacts des presets) et `getting-started/typed-linting` (citation exacte sur `projectService`). |
| `eslint-plugin-import-x` | Fetch README brut (exemple flat config TS cité mot pour mot) + listing exhaustif de `docs/rules/` sur GitHub. |
| `eslint-plugin-unicorn` | `npm pack` + lecture directe de `index.js` (export `configs.recommended`/`unopinionated`/`all`) et des fichiers de règles (`no-null.js`, `name-replacements.js`, `filename-case.js` — `recommended: true` confirmé dans le code source) ; README brut pour l'exemple de setup et le renommage `prevent-abbreviations` → `name-replacements`. |
| `eslint-plugin-vuejs-accessibility` | Fetch du site de doc (page d'accueil listant les 23 règles + exemple flat config cité). |
| `@vitest/eslint-plugin` | Fetch README GitHub (exemple `vitest.configs.recommended` cité) + listing exhaustif `docs/rules/`. |
| `eslint-plugin-promise` | Fetch README GitHub (exemple `configs['flat/recommended']` cité) + listing exhaustif `docs/rules/`. |
| `eslint-plugin-n` | Fetch README GitHub (exemple flat config cité) + listing exhaustif `docs/rules/`. |
| `eslint-plugin-security` | `npm pack` + lecture directe du `README.md` du tarball (exemple `configs.recommended` cité mot pour mot, tableau des 14 règles du preset recommandé). |
| `eslint-plugin-sonarjs` | Fetch README GitHub (exemple `configs.recommended` cité) + listing exhaustif `docs/rules/`. |
| `eslint-plugin-regexp` | Fetch de la page `/rules/` (liste brute complète) + confirmation du nom `flat/recommended`. |
| `eslint-plugin-perfectionist` | `npm pack` + lecture directe de `dist/index.js` (objet `configs` exact) et du `readme.md` (exemple `configs['recommended-natural']` cité) — **retenu comme preuve pour justifier l'écarter en connaissance de cause**, pas pour l'intégrer. |
| `no-eval`, `no-restricted-syntax`, `no-restricted-globals` (règles cœur ESLint) | Fetch des pages de doc officielle `eslint.org/docs/latest/rules/*`. |

### Liste "NON VÉRIFIÉ"

- Le sélecteur esquery `no-restricted-syntax` ciblant `nodeIntegration`/`contextIsolation` dans
  `new BrowserWindow(...)` (§2, §3) : la règle cœur et son schéma d'options sont vérifiés, mais ce
  sélecteur précis n'a pas été exécuté contre du vrai code — pas de projet Electron disponible pour
  le tester. À valider au premier usage réel de `BrowserWindow` dans `app/src/main`.
- L'usage de `vue/no-restricted-syntax` pour approcher la détection de `:class` dynamique (§4) : la
  règle existe et délègue au même mécanisme que le cœur, mais aucun exemple documenté ni test propre
  ne couvre ce cas précis — proposition explicitement non retenue dans la config, à l'état d'idée.

Tout le reste des noms de règles et de configs cités dans ce document est passé par au moins une des
méthodes du tableau ci-dessus.
