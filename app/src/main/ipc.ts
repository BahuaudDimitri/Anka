/* eslint-disable security/detect-non-literal-fs-filename -- les chemins viennent des dialogues
   système choisis par le joueur, jamais du renderer */
import { readFile, writeFile } from 'node:fs/promises'

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'

import { IPC, isStoreKey } from '@shared/ipc'
import { buildExportBundle, validateImport } from '@shared/schemas/transfer'

import type { Stores } from './store'
import type { Updater } from './updater'
import type { ExportResult, ImportResult, StoreData, StoreKey } from '@shared/ipc'
import type { WebContents } from 'electron'

const HTTPS_URL = /^https:\/\/\S+$/
const JSON_FILTER = [{ name: 'JSON', extensions: ['json'] }]

function assertStoreKey(key: unknown): asserts key is StoreKey {
  if (!isStoreKey(key)) throw new Error(`clé de store inconnue : ${String(key)}`)
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function exportAll(sender: WebContents, stores: Stores): Promise<ExportResult> {
  const win = BrowserWindow.fromWebContents(sender)
  const now = new Date()
  const options = {
    title: 'Exporter les données Anka',
    defaultPath: `anka-export-${isoDate(now)}.json`,
    filters: JSON_FILTER,
  }
  const result = win
    ? await dialog.showSaveDialog(win, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || result.filePath === '') return { ok: false, reason: 'cancelled' }
  const bundle = buildExportBundle({
    profile: await stores.profile.read(),
    appVersion: app.getVersion(),
    now,
  })
  await writeFile(result.filePath, JSON.stringify(bundle, null, 2), 'utf8')
  return { ok: true, path: result.filePath }
}

async function importAll(sender: WebContents, stores: Stores): Promise<ImportResult> {
  const win = BrowserWindow.fromWebContents(sender)
  const options = {
    title: 'Importer des données Anka',
    filters: JSON_FILTER,
    properties: ['openFile' as const],
  }
  const result = win
    ? await dialog.showOpenDialog(win, options)
    : await dialog.showOpenDialog(options)
  const path = result.filePaths[0]
  if (path === undefined || result.canceled) return { ok: false, reason: 'cancelled' }
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return { ok: false, reason: 'invalid', details: 'Le fichier n’est pas un JSON lisible.' }
  }
  const validation = validateImport(raw)
  if (!validation.ok) return { ok: false, reason: 'invalid', details: validation.reason }
  await stores.profile.write(validation.bundle.data.profile)
  return { ok: true, path }
}

async function openExternal(url: unknown): Promise<void> {
  if (typeof url !== 'string' || !HTTPS_URL.test(url)) {
    throw new Error('Seules les URL https:// peuvent être ouvertes.')
  }
  await shell.openExternal(url)
}

export function registerIpc(stores: Stores, updater: Updater): void {
  ipcMain.handle(IPC.storeRead, (_event, key: unknown) => {
    assertStoreKey(key)
    return stores[key].read()
  })
  ipcMain.handle(IPC.storeWrite, (_event, key: unknown, data: unknown) => {
    assertStoreKey(key)
    // La forme est vérifiée par le schéma zod du store avant toute écriture.
    return stores[key].write(data as StoreData[typeof key])
  })
  ipcMain.handle(IPC.transferExport, (event) => exportAll(event.sender, stores))
  ipcMain.handle(IPC.transferImport, (event) => importAll(event.sender, stores))
  ipcMain.handle(IPC.updaterCheck, () => updater.check())
  ipcMain.handle(IPC.updaterGetState, () => updater.getState())
  ipcMain.handle(IPC.updaterQuitAndInstall, () => {
    updater.quitAndInstall()
  })
  ipcMain.handle(IPC.appVersion, () => app.getVersion())
  ipcMain.handle(IPC.appOpenExternal, (_event, url: unknown) => openExternal(url))
}
