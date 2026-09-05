import type { Profile } from './schemas/profile'

export const IPC = {
  storeRead: 'store:read',
  storeWrite: 'store:write',
  transferExport: 'transfer:export',
  transferImport: 'transfer:import',
  updaterCheck: 'updater:check',
  updaterGetState: 'updater:get-state',
  updaterQuitAndInstall: 'updater:quit-and-install',
  updaterState: 'updater:state',
  appVersion: 'app:version',
  appOpenExternal: 'app:open-external',
} as const

export interface StoreData {
  profile: Profile
}
export type StoreKey = keyof StoreData
export const STORE_KEYS: readonly StoreKey[] = ['profile']

export function isStoreKey(value: unknown): value is StoreKey {
  return typeof value === 'string' && (STORE_KEYS as readonly string[]).includes(value)
}

export type UpdaterState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; percent: number }
  | { status: 'ready'; version: string }
  | { status: 'up-to-date' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }

export type ExportResult = { ok: true; path: string } | { ok: false; reason: 'cancelled' }

export type ImportResult =
  | { ok: true; path: string }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'invalid'; details: string }

export interface AnkaApi {
  store: {
    read<K extends StoreKey>(key: K): Promise<StoreData[K]>
    write<K extends StoreKey>(key: K, data: StoreData[K]): Promise<void>
  }
  transfer: {
    exportAll(): Promise<ExportResult>
    importAll(): Promise<ImportResult>
  }
  updater: {
    check(): Promise<void>
    getState(): Promise<UpdaterState>
    quitAndInstall(): Promise<void>
    onState(callback: (state: UpdaterState) => void): () => void
  }
  app: {
    version(): Promise<string>
    openExternal(url: string): Promise<void>
  }
}
