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
    expect(fiche.sections.Chiffres).toContain('| 10 000 | Guide |')
    expect(fiche.sections['À challenger']).toBe('')
  })

  test('accepte les fins de ligne CRLF et les chemins Windows', () => {
    const crlf = RAW.replaceAll('\n', '\r\n')
    expect(parseFiche(String.raw`C:\repo\wiki\dragodindes\jauges.md`, crlf).slug).toBe('jauges')
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
      RAW.replace(
        '## En bref\n\nSix jauges, deux actives au plus.\n\n## Détails',
        '## Détails',
      ).replace('## Pièges fréquents', '## En bref\n\nSix jauges.\n\n## Pièges fréquents'),
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
