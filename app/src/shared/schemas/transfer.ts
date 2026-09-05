import { z } from 'zod'

import { ProfileSchema } from './profile'

import type { Profile } from './profile'

export const EXPORT_VERSION = 1

export const ExportBundleSchema = z.strictObject({
  exportVersion: z.literal(EXPORT_VERSION),
  exportedAt: z.iso.datetime(),
  appVersion: z.string().min(1),
  data: z.strictObject({
    profile: ProfileSchema,
  }),
})

export type ExportBundle = z.infer<typeof ExportBundleSchema>

export function buildExportBundle(input: {
  profile: Profile
  appVersion: string
  now: Date
}): ExportBundle {
  return {
    exportVersion: EXPORT_VERSION,
    exportedAt: input.now.toISOString(),
    appVersion: input.appVersion,
    data: { profile: input.profile },
  }
}

export type ImportValidation = { ok: true; bundle: ExportBundle } | { ok: false; reason: string }

export function validateImport(raw: unknown): ImportValidation {
  const parsed = ExportBundleSchema.safeParse(raw)
  if (parsed.success) return { ok: true, bundle: parsed.data }
  return { ok: false, reason: z.prettifyError(parsed.error) }
}
