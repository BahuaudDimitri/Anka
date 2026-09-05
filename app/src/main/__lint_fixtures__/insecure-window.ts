import { BrowserWindow } from 'electron'

export function createInsecureWindow(): BrowserWindow {
  return new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  })
}
