import type { AnkaApi } from '../shared/ipc'

declare global {
  interface Window {
    anka: AnkaApi
  }
}

export {}
