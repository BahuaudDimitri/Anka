import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { parseFiche } from '@shared/wiki/parse-fiche'

import type { Fiche } from '@shared/wiki/parse-fiche'

const WIKI_ROOT = resolve(import.meta.dirname, '../../../wiki')
const INDEX_ROW = /^\| [^|]+ \| ([a-z0-9-]+) \| (hypothese|valide|obsolete) \|/gm

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b)
}

function listFicheFiles(): string[] {
  const files: string[] = []
  for (const entry of readdirSync(WIKI_ROOT)) {
    const dir = join(WIKI_ROOT, entry)
    if (!statSync(dir).isDirectory()) continue
    for (const file of readdirSync(dir)) {
      if (file.endsWith('.md')) files.push(join(dir, file))
    }
  }
  return files.toSorted(compareStrings)
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
  const indexed = Array.from(
    index.matchAll(INDEX_ROW),
    (row) => `${row[1] ?? ''}:${row[2] ?? ''}`,
  ).toSorted(compareStrings)
  const onDisk = parseAll()
    .map((fiche) => `${fiche.slug}:${fiche.statut}`)
    .toSorted(compareStrings)
  expect(indexed).toEqual(onDisk)
})

test('les slugs sont uniques dans tout le wiki', () => {
  const slugs = parseAll().map((fiche) => fiche.slug)
  expect(new Set(slugs).size).toBe(slugs.length)
})
