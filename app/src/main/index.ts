import { join } from 'node:path'

import { app, BrowserWindow } from 'electron'

import { registerIpc } from './ipc'
import { createStores } from './store'
import { createUpdater } from './updater'
import { createMainWindow } from './window'

async function start(): Promise<void> {
  const stores = createStores(join(app.getPath('userData'), 'data'))
  const updater = createUpdater(() => BrowserWindow.getAllWindows()[0])
  registerIpc(stores, updater)
  await createMainWindow(stores)
  updater.scheduleStartupCheck()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createMainWindow(stores)
  })
}

void app
  .whenReady()
  .then(start)
  .catch((error: unknown) => {
    console.error('Démarrage impossible :', error)
    app.quit()
  })

app.on('window-all-closed', () => {
  app.quit()
})
