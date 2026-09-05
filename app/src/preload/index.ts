import { contextBridge, ipcRenderer } from 'electron'

import { IPC } from '@shared/ipc'

import type { AnkaApi, UpdaterState } from '@shared/ipc'
import type { IpcRendererEvent } from 'electron'

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>
}

const api: AnkaApi = {
  store: {
    read: (key) => invoke(IPC.storeRead, key),
    write: (key, data) => invoke(IPC.storeWrite, key, data),
  },
  transfer: {
    exportAll: () => invoke(IPC.transferExport),
    importAll: () => invoke(IPC.transferImport),
  },
  updater: {
    check: () => invoke(IPC.updaterCheck),
    getState: () => invoke(IPC.updaterGetState),
    quitAndInstall: () => invoke(IPC.updaterQuitAndInstall),
    onState: (callback) => {
      const listener = (_event: IpcRendererEvent, state: UpdaterState): void => {
        callback(state)
      }
      ipcRenderer.on(IPC.updaterState, listener)
      return () => {
        ipcRenderer.off(IPC.updaterState, listener)
      }
    },
  },
  app: {
    version: () => invoke(IPC.appVersion),
    openExternal: (url) => invoke(IPC.appOpenExternal, url),
  },
}

contextBridge.exposeInMainWorld('anka', api)
