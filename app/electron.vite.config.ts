import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'electron-vite'

const appRoot = __dirname
const repoRoot = resolve(appRoot, '..')
const shared = resolve(appRoot, 'src/shared')

export default defineConfig({
  // `build.externalizeDeps` vaut `true` par défaut : externalizeDepsPlugin() est déprécié
  // et redondant (electron-vite, @typescript-eslint/no-deprecated).
  main: {
    resolve: { alias: { '@shared': shared } },
  },
  preload: {
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
