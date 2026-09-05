import { z } from 'zod'

export const PROFILE_SCHEMA_VERSION = 1

export const ProfileSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  serveur: z.string().trim().max(60).default(''),
  pseudo: z.string().trim().max(40).default(''),
})

export type Profile = z.infer<typeof ProfileSchema>

export function defaultProfile(): Profile {
  return { schemaVersion: PROFILE_SCHEMA_VERSION, serveur: '', pseudo: '' }
}
