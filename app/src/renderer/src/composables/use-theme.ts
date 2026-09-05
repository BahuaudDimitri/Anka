import { createSharedComposable, useColorMode } from '@vueuse/core'

export type ThemeMode = 'dark' | 'light' | 'auto'

// Préférence d'appareil (localStorage), pas une donnée du joueur : hors export. Spec §7.
export const useTheme = createSharedComposable(() =>
  useColorMode<ThemeMode>({ initialValue: 'dark', emitAuto: true, storageKey: 'anka-theme' }),
)
