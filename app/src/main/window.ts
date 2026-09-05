import { join } from 'node:path'

import { app, BrowserWindow, shell } from 'electron'

import {
  defaultWindowState,
  WINDOW_MIN_HEIGHT,
  WINDOW_MIN_WIDTH,
  WINDOW_STATE_SCHEMA_VERSION,
} from '@shared/schemas/window-state'

import type { Stores } from './store'
import type { WindowState } from '@shared/schemas/window-state'

const DEV_URL = process.env.ELECTRON_RENDERER_URL

function isAllowedNavigation(url: string): boolean {
  if (url.startsWith('file://')) return true
  return DEV_URL !== undefined && url.startsWith(DEV_URL)
}

async function readWindowState(stores: Stores): Promise<WindowState> {
  try {
    return await stores.windowState.read()
  } catch (error) {
    // Un état de fenêtre corrompu n'empêche pas de démarrer : on repart des valeurs par défaut.
    console.warn('window-state.json ignoré :', error)
    return defaultWindowState()
  }
}

async function persistWindowState(win: BrowserWindow, stores: Stores): Promise<void> {
  const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds()
  await stores.windowState.write({
    schemaVersion: WINDOW_STATE_SCHEMA_VERSION,
    width: Math.max(bounds.width, WINDOW_MIN_WIDTH),
    height: Math.max(bounds.height, WINDOW_MIN_HEIGHT),
    x: bounds.x,
    y: bounds.y,
    maximized: win.isMaximized(),
  })
}

export async function createMainWindow(stores: Stores): Promise<BrowserWindow> {
  const state = await readWindowState(stores)
  const position = state.x !== undefined && state.y !== undefined ? { x: state.x, y: state.y } : {}

  const win = new BrowserWindow({
    ...position,
    width: state.width,
    height: state.height,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    title: 'Anka',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (state.maximized) win.maximize()

  win.on('ready-to-show', () => {
    win.show()
  })

  // On retarde la fermeture le temps d'écrire l'état de la fenêtre, puis on ferme pour de bon.
  let hasSavedState = false
  win.on('close', (event) => {
    if (hasSavedState) return
    event.preventDefault()
    void persistWindowState(win, stores)
      .catch((error: unknown) => {
        console.warn('état de fenêtre non sauvegardé :', error)
      })
      .finally(() => {
        hasSavedState = true
        win.close()
      })
  })

  // Aucune navigation hors de l'app ; les liens externes s'ouvrent dans le navigateur du système.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault()
  })

  if (DEV_URL !== undefined && !app.isPackaged) {
    await win.loadURL(DEV_URL)
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return win
}
