import { contextBridge } from 'electron'

const api = {
  ping: (): string => 'pong',
}

export type AnkaApiBootstrap = typeof api

contextBridge.exposeInMainWorld('anka', api)
