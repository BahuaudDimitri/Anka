// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'

import FicheReader from './FicheReader.vue'

import type { Fiche } from '@shared/wiki/parse-fiche'

const fiche: Fiche = {
  slug: 'jauges',
  dossier: 'dragodindes',
  titre: 'Les jauges',
  statut: 'valide',
  confiance: 'haute',
  versionDofus: '3.5',
  derniereVerif: '2026-09-05',
  sources: [{ url: 'https://exemple.fr/guide', titre: 'Guide', date: '2026-02' }],
  tags: [],
  sections: {
    'En bref': 'Résumé **court**.',
    Détails: '### Sous-titre caché\n\nTexte.',
    'Pièges fréquents': '- un piège',
    Chiffres: '| a |\n|---|\n| 1 |',
    'À challenger': '',
  },
}

test('en-tête : titre, statut, confiance, date, sources', () => {
  const wrapper = mount(FicheReader, { props: { fiche } })
  const text = wrapper.text()
  expect(text).toContain('Les jauges')
  expect(text).toContain('validé')
  expect(text).toContain('confiance haute')
  expect(text).toContain('vérifiée le 05/09/2026')
  expect(text).toContain('Guide')
})

test('« En bref » est rendu ouvert, les quatre autres sections sont des accordéons fermés', () => {
  const wrapper = mount(FicheReader, { props: { fiche } })
  expect(wrapper.find('.fiche-prose').html()).toContain('<strong>court</strong>')
  expect(wrapper.findAll('button[aria-expanded="false"]')).toHaveLength(4)
  expect(wrapper.text()).not.toContain('Sous-titre caché')
  expect(wrapper.text()).toContain('(vide)')
})
