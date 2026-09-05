import { expect, test } from 'vitest'

import {
  DEFAULT_SLUG,
  dossiers,
  fiches,
  fichesDuDossier,
  findFiche,
  renderMarkdown,
} from './wiki-index'

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
  expect(titres).toEqual(titres.toSorted((a, b) => a.localeCompare(b, 'fr')))
})

test('le rendu connaît les slugs du wiki', () => {
  expect(renderMarkdown('[x](jauges.md)')).toContain('href="#/wiki/jauges"')
})
