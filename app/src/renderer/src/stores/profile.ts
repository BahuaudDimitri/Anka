import { defineStore } from 'pinia'
import { ref } from 'vue'

import { errorMessage } from '@/lib/error-message'
import { defaultProfile } from '@shared/schemas/profile'

import type { Profile } from '@shared/schemas/profile'

export type ProfilePatch = Partial<Omit<Profile, 'schemaVersion'>>

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>(defaultProfile())
  const loaded = ref(false)
  const loadError = ref<string | null>(null)

  async function load(): Promise<void> {
    try {
      profile.value = await window.anka.store.read('profile')
      loadError.value = null
    } catch (error) {
      loadError.value = errorMessage(error)
    } finally {
      loaded.value = true
    }
  }

  async function save(patch: ProfilePatch): Promise<void> {
    const next: Profile = { ...profile.value, ...patch }
    await window.anka.store.write('profile', next)
    profile.value = next
  }

  return { profile, loaded, loadError, load, save }
})
