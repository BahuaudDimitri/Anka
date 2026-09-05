import { app } from 'electron'
import * as electronUpdater from 'electron-updater'

import { IPC } from '@shared/ipc'

import { reduceUpdaterEvent } from './updater-state'

import type { UpdaterEvent } from './updater-state'
import type { UpdaterState } from '@shared/ipc'
import type { BrowserWindow } from 'electron'

// Contournement ESM/CJS documenté par electron-builder
const { autoUpdater } = electronUpdater

const STARTUP_DELAY_MS = 5000
const DEV_MESSAGE = 'Mise à jour indisponible hors installation (mode développement).'

export interface Updater {
  check(): Promise<void>
  getState(): UpdaterState
  quitAndInstall(): void
  scheduleStartupCheck(): void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function createUpdater(getWindow: () => BrowserWindow | undefined): Updater {
  let state: UpdaterState = { status: 'idle' }

  const emit = (event: UpdaterEvent): void => {
    state = reduceUpdaterEvent(state, event)
    getWindow()?.webContents.send(IPC.updaterState, state)
  }

  if (app.isPackaged) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('checking-for-update', () => {
      emit({ type: 'checking' })
    })
    autoUpdater.on('update-available', (info) => {
      emit({ type: 'available', version: info.version })
    })
    autoUpdater.on('update-not-available', () => {
      emit({ type: 'not-available' })
    })
    autoUpdater.on('download-progress', (progress) => {
      emit({ type: 'progress', percent: progress.percent })
    })
    autoUpdater.on('update-downloaded', (info) => {
      emit({ type: 'downloaded', version: info.version })
    })
    autoUpdater.on('error', (error) => {
      emit({ type: 'error', message: errorMessage(error) })
    })
  }

  const check = async (): Promise<void> => {
    if (!app.isPackaged) {
      emit({ type: 'unavailable', message: DEV_MESSAGE })
      return
    }
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      emit({ type: 'error', message: errorMessage(error) })
    }
  }

  return {
    check,
    getState: () => state,
    quitAndInstall: () => {
      autoUpdater.quitAndInstall()
    },
    scheduleStartupCheck: () => {
      if (!app.isPackaged) return
      setTimeout(() => {
        void check()
      }, STARTUP_DELAY_MS)
    },
  }
}
