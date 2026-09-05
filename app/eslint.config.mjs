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
const TAILWIND_RAW_COLOR = String.raw`/^(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|outline|decoration|divide|from|via|to|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?(?:\/\d{1,3})?$/`
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
const NODE_GLOBALS_FORBIDDEN_IN_RENDERER = [
  'require',
  'process',
  'module',
  '__dirname',
  '__filename',
]

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
      // Le style par défaut impose l'import par défaut de `node:path` ; le plan et tout le
      // code de ce dépôt importent des membres nommés (`{ join, resolve }`), style idiomatique
      // et sans ambiguïté. Voir spec §11.4.
      'unicorn/import-style': 'off',
      // Le bootstrap Electron (`void app.whenReady().then(() => { ... })`) est un then()
      // terminal qui ne chaîne rien : voir spec §11.4.
      'promise/always-return': ['error', { ignoreLastCallback: true }],
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
      // main est bundlé en CommonJS par electron-vite : pas de top-level await possible,
      // et __dirname/__filename restent les globals CJS légitimes (pas d'équivalent
      // import.meta.url pertinent une fois bundlé). Voir spec §11.4.
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-module': 'off',
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
      // preload est bundlé en CommonJS par electron-vite : mêmes raisons que main. Spec §11.4.
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-module': 'off',
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

  // ---- eslint.config.mjs lui-même ----------------------------------------------------
  // Ce fichier assemble les `.configs` de plugins tiers (unicorn, regexp, tseslint…) dont les
  // types sont partiellement `any`/non résolus : le typage strict y produit du bruit
  // (no-unsafe-*) à chaque plugin ajouté, pas un vrai défaut. `tseslint.config()` reste l'API
  // documentée de typescript-eslint malgré l'annotation @deprecated (alternative
  // `defineConfig()` d'ESLint core encore récente). `import-x/no-named-as-default-member`
  // (import par défaut d'un module qui exporte aussi `configs`/`parser` nommément) est le style
  // documenté par chaque plugin lint listé ici. `import-x/default` : les types DefinitelyTyped
  // d'`eslint-plugin-security` ne déclarent que des exports nommés (`configs`, `rules`…), sans
  // `export default`, alors que l'import par défaut fonctionne à l'exécution (interop CJS) et
  // reste l'usage documenté du plugin. Spec §11.4.
  {
    files: ['eslint.config.mjs'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/default': 'off',
    },
  },

  eslintConfigPrettier, // toujours en dernier
)
