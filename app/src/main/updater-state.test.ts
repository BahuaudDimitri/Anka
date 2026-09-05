import { expect, test } from 'vitest'

import { reduceUpdaterEvent } from './updater-state'

import type { UpdaterState } from '@shared/ipc'

const idle: UpdaterState = { status: 'idle' }

test.each<[Parameters<typeof reduceUpdaterEvent>[1], UpdaterState]>([
  [{ type: 'checking' }, { status: 'checking' }],
  [
    { type: 'available', version: '0.1.1' },
    { status: 'available', version: '0.1.1' },
  ],
  [{ type: 'not-available' }, { status: 'up-to-date' }],
  [
    { type: 'progress', percent: 42.7 },
    { status: 'downloading', percent: 43 },
  ],
  [
    { type: 'downloaded', version: '0.1.1' },
    { status: 'ready', version: '0.1.1' },
  ],
  [
    { type: 'error', message: 'réseau' },
    { status: 'error', message: 'réseau' },
  ],
  [
    { type: 'unavailable', message: 'dev' },
    { status: 'unavailable', message: 'dev' },
  ],
])('%j → %j', (event, expected) => {
  expect(reduceUpdaterEvent(idle, event)).toEqual(expected)
})

test('le pourcentage est borné entre 0 et 100', () => {
  expect(reduceUpdaterEvent(idle, { type: 'progress', percent: -5 })).toEqual({
    status: 'downloading',
    percent: 0,
  })
  expect(reduceUpdaterEvent(idle, { type: 'progress', percent: 120 })).toEqual({
    status: 'downloading',
    percent: 100,
  })
})
