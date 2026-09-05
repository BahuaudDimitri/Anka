import type { AnkaApiBootstrap } from './index'

declare global {
  interface Window {
    anka: AnkaApiBootstrap
  }
}

export {}
