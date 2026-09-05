import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
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

// Regroupées dans un objet (plutôt que deux `let` top-level) pour satisfaire
// unicorn/no-top-level-assignment-in-function : on mute des propriétés, pas la
// variable elle-même.
const ctx = {} as { dir: string; store: JsonStore<DataV2> }

beforeEach(async () => {
  ctx.dir = await mkdtemp(join(tmpdir(), 'anka-store-'))
  ctx.store = new JsonStore(ctx.dir, definition)
})

afterEach(async () => {
  await rm(ctx.dir, { recursive: true, force: true })
})

describe('JsonStore.read', () => {
  test('fichier absent → valeur par défaut, sans créer le fichier', async () => {
    expect(await ctx.store.read()).toEqual(definition.defaults())
    expect(await readdir(ctx.dir)).toEqual([])
  })

  test('JSON illisible → StoreCorruptError, fichier intact', async () => {
    await writeFile(join(ctx.dir, 'demo.json'), '{ pas du json', 'utf8')
    await expect(ctx.store.read()).rejects.toBeInstanceOf(StoreCorruptError)
    expect(await readFile(join(ctx.dir, 'demo.json'), 'utf8')).toBe('{ pas du json')
  })

  test('schéma violé → StoreCorruptError qui nomme le champ', async () => {
    await writeFile(
      join(ctx.dir, 'demo.json'),
      JSON.stringify({ schemaVersion: 2, name: '', count: 1 }),
    )
    await expect(ctx.store.read()).rejects.toThrow(/name/)
  })

  test('version antérieure → migration appliquée', async () => {
    await writeFile(
      join(ctx.dir, 'demo.json'),
      JSON.stringify({ schemaVersion: 1, name: 'ancien' }),
    )
    expect(await ctx.store.read()).toEqual({ schemaVersion: 2, name: 'ancien', count: 0 })
  })

  test('version sans migration → StoreCorruptError', async () => {
    await writeFile(join(ctx.dir, 'demo.json'), JSON.stringify({ schemaVersion: 0, name: 'x' }))
    await expect(ctx.store.read()).rejects.toThrow(/migration/)
  })
})

describe('JsonStore.write', () => {
  test('écrit, relit, et ne laisse pas de fichier temporaire', async () => {
    await ctx.store.write({ schemaVersion: 2, name: 'anka', count: 3 })
    expect(await ctx.store.read()).toEqual({ schemaVersion: 2, name: 'anka', count: 3 })
    expect(await readdir(ctx.dir)).toEqual(['demo.json'])
  })

  test('crée le dossier si besoin', async () => {
    const nested = new JsonStore(join(ctx.dir, 'a', 'b'), definition)
    await nested.write(definition.defaults())
    expect(await readdir(join(ctx.dir, 'a', 'b'))).toEqual(['demo.json'])
  })

  test('refuse une donnée invalide sans toucher au fichier', async () => {
    await ctx.store.write({ schemaVersion: 2, name: 'anka', count: 3 })
    await expect(ctx.store.write({ schemaVersion: 2, name: '', count: 3 })).rejects.toBeInstanceOf(
      StoreCorruptError,
    )
    expect(await ctx.store.read()).toEqual({ schemaVersion: 2, name: 'anka', count: 3 })
  })

  test('écriture atomique : passe par un fichier .tmp avant le rename final', async () => {
    // La cible est un dossier (et non un fichier) : le `rename` d'un fichier vers un
    // dossier échoue toujours, ce qui prouve que l'écriture ne modifie jamais la cible
    // en place — elle passe forcément par un fichier temporaire distinct puis un rename.
    const target = join(ctx.dir, 'demo.json')
    await mkdir(target)

    await expect(ctx.store.write({ schemaVersion: 2, name: 'anka', count: 3 })).rejects.toThrow()

    expect(await readdir(ctx.dir)).toContain('demo.json.tmp')
    const targetStats = await stat(target)
    expect(targetStats.isDirectory()).toBe(true)
  })
})
