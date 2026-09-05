import { describe, expect, test } from 'vitest'

import { defaultProfile } from './profile'
import { buildExportBundle, EXPORT_VERSION, validateImport } from './transfer'

const now = new Date('2026-09-05T10:00:00.000Z')

describe('buildExportBundle', () => {
  test('emballe le profil avec version, date et version de l’app', () => {
    const bundle = buildExportBundle({ profile: defaultProfile(), appVersion: '0.1.0', now })
    expect(bundle).toEqual({
      exportVersion: EXPORT_VERSION,
      exportedAt: '2026-09-05T10:00:00.000Z',
      appVersion: '0.1.0',
      data: { profile: { schemaVersion: 1, serveur: '', pseudo: '' } },
    })
  })
})

describe('validateImport', () => {
  const valid = buildExportBundle({
    profile: { schemaVersion: 1, serveur: 'Draconiros', pseudo: 'Anka' },
    appVersion: '0.1.0',
    now,
  })

  test('accepte un bundle produit par buildExportBundle', () => {
    expect(validateImport(valid)).toEqual({ ok: true, bundle: valid })
  })

  test('refuse un exportVersion inconnu', () => {
    const result = validateImport({ ...valid, exportVersion: 99 })
    expect(result.ok).toBe(false)
    expect((result as { ok: false; reason: string }).reason).toContain('exportVersion')
  })

  test('refuse un domaine de données inconnu', () => {
    const result = validateImport({ ...valid, data: { ...valid.data, elevage: {} } })
    expect(result.ok).toBe(false)
    expect((result as { ok: false; reason: string }).reason).toContain('elevage')
  })

  test('refuse un profil invalide et nomme le champ', () => {
    const result = validateImport({
      ...valid,
      data: { profile: { schemaVersion: 1, serveur: 'x'.repeat(61), pseudo: '' } },
    })
    expect(result.ok).toBe(false)
    expect((result as { ok: false; reason: string }).reason).toContain('serveur')
  })

  test('refuse ce qui n’est pas un objet', () => {
    expect(validateImport('pas un bundle').ok).toBe(false)
    expect(validateImport(null).ok).toBe(false)
  })
})
