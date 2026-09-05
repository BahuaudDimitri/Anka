import type { UpdaterState } from '@shared/ipc'

export type UpdaterEvent =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available' }
  | { type: 'progress'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'unavailable'; message: string }
  | { type: 'error'; message: string }

export function reduceUpdaterEvent(_previous: UpdaterState, event: UpdaterEvent): UpdaterState {
  switch (event.type) {
    case 'checking': {
      return { status: 'checking' }
    }
    case 'available': {
      return { status: 'available', version: event.version }
    }
    case 'not-available': {
      return { status: 'up-to-date' }
    }
    case 'progress': {
      return {
        status: 'downloading',
        percent: Math.min(100, Math.max(0, Math.round(event.percent))),
      }
    }
    case 'downloaded': {
      return { status: 'ready', version: event.version }
    }
    case 'unavailable': {
      return { status: 'unavailable', message: event.message }
    }
    case 'error': {
      return { status: 'error', message: event.message }
    }
  }
}
