import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@wiki': resolve(__dirname, '../wiki'),
    },
  },
  // Les tests `happy-dom` chargent les modules via le graphe « client » de Vite (contrairement
  // à l'environnement `node`, servi en SSR sans cette restriction) : sans cette entrée, le glob
  // `@wiki/*/*.md` de `wiki-index.ts` est refusé car `wiki/` est hors de la racine `app/`.
  server: {
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    // les tests DOM déclarent `// @vitest-environment happy-dom` en tête de fichier
    testTimeout: 20_000,
  },
})
