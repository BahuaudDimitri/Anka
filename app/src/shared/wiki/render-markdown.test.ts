import { describe, expect, test } from 'vitest'

import { createMarkdownRenderer } from './render-markdown'

const render = createMarkdownRenderer({
  knownSlugs: new Set(['jauges', 'reproduction', 'prix']),
})

describe('createMarkdownRenderer', () => {
  test('lien interne connu → route hash', () => {
    expect(render('Voir [les jauges](jauges.md).')).toContain(
      '<a href="#/wiki/jauges" data-internal="jauges">les jauges</a>',
    )
    expect(render('Voir [repro](./reproduction.md#detail).')).toContain(
      'href="#/wiki/reproduction"',
    )
  })

  test('lien interne connu inter-dossier → route hash sur le slug seul', () => {
    expect(render('Voir [le prix](kamas/prix.md).')).toContain('href="#/wiki/prix"')
    expect(render('Voir [le prix](../kamas/prix.md).')).toContain('href="#/wiki/prix"')
  })

  test('lien interne inconnu → span inerte', () => {
    const html = render('Voir [la fiche](inconnue.md).')
    expect(html).toContain('<span title="fiche absente">la fiche</span>')
    expect(html).not.toContain('<a')
  })

  test('lien https → nouvel onglet, marqué externe', () => {
    const html = render('[Guide](https://exemple.fr/guide)')
    expect(html).toContain('href="https://exemple.fr/guide"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('data-external="https://exemple.fr/guide"')
  })

  test('le HTML brut est échappé', () => {
    expect(render('<script>alert(1)</script> et <b>gras</b>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt; et &lt;b&gt;gras&lt;/b&gt;</p>\n',
    )
  })

  test('tableaux et sous-titres sont rendus', () => {
    const html = render('### Titre\n\n| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<h3>Titre</h3>')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>2</td>')
  })
})
