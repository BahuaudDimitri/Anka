import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { UpdaterState } from '@shared/ipc'

// Pas de dépendance de fermeture : sorties du store pour unicorn/consistent-function-scoping.
function check(): Promise<void> {
  return window.anka.updater.check()
}

function quitAndInstall(): Promise<void> {
  return window.anka.updater.quitAndInstall()
}

export const useUpdaterStore = defineStore('updater', () => {
  const state = ref<UpdaterState>({ status: 'idle' })
  let unsubscribe: (() => void) | undefined

  async function start(): Promise<void> {
    if (unsubscribe !== undefined) return
    unsubscribe = window.anka.updater.onState((next) => {
      state.value = next
    })
    state.value = await window.anka.updater.getState()
  }

  return { state, start, check, quitAndInstall }
})
