import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { ESLint } from 'eslint'
import { beforeAll, describe, expect, test } from 'vitest'

const APP_ROOT = resolve(import.meta.dirname, '../..')
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
