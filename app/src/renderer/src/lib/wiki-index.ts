import { parseFiche } from '@shared/wiki/parse-fiche'
import { createMarkdownRenderer } from '@shared/wiki/render-markdown'

import type { Fiche } from '@shared/wiki/parse-fiche'

// Générique explicite (overload 3 de `ImportGlobFunction`) : sans lui, `As` (l'option `as`
// dépréciée, absente ici puisqu'on utilise `query`) reste `string` non littéral et le type
// inféré retombe sur `unknown` — une assertion `as Record<string, string>` aurait été
// signalée à tort par `no-unnecessary-type-assertion` (le typage contextuel de l'assertion
// influence la résolution de surcharge du site d'appel lui-même).
const rawFiles = import.meta.glob<string>('@wiki/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const DEFAULT_SLUG = 'digest-debutant'
const PINNED_PREFIX = 'digest-'

function compareFiches(a: Fiche, b: Fiche): number {
  const isAPinned = a.slug.startsWith(PINNED_PREFIX)
  const isBPinned = b.slug.startsWith(PINNED_PREFIX)
  if (isAPinned !== isBPinned) return isAPinned ? -1 : 1
  return a.titre.localeCompare(b.titre, 'fr')
}

export const fiches: readonly Fiche[] = Object.entries(rawFiles)
  .map(([path, raw]) => parseFiche(path, raw))
  .toSorted(compareFiches)

export const dossiers: readonly string[] = [
  ...new Set(fiches.map((fiche) => fiche.dossier)),
].toSorted((a, b) => a.localeCompare(b, 'fr'))

export function fichesDuDossier(dossier: string): Fiche[] {
  return fiches.filter((fiche) => fiche.dossier === dossier)
}

export function findFiche(slug: string): Fiche | undefined {
  return fiches.find((fiche) => fiche.slug === slug)
}

export const renderMarkdown = createMarkdownRenderer({
  knownSlugs: new Set(fiches.map((fiche) => fiche.slug)),
})
