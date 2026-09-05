import { defaultProfile, PROFILE_SCHEMA_VERSION, ProfileSchema } from '@shared/schemas/profile'
import {
  defaultWindowState,
  WINDOW_STATE_SCHEMA_VERSION,
  WindowStateSchema,
} from '@shared/schemas/window-state'

import { JsonStore } from './json-store'

import type { Profile } from '@shared/schemas/profile'
import type { WindowState } from '@shared/schemas/window-state'

export interface Stores {
  profile: JsonStore<Profile>
  windowState: JsonStore<WindowState>
}

export function createStores(dir: string): Stores {
  return {
    profile: new JsonStore<Profile>(dir, {
      file: 'profile.json',
      currentVersion: PROFILE_SCHEMA_VERSION,
      schema: ProfileSchema,
      defaults: defaultProfile,
      migrations: {},
    }),
    windowState: new JsonStore<WindowState>(dir, {
      file: 'window-state.json',
      currentVersion: WINDOW_STATE_SCHEMA_VERSION,
      schema: WindowStateSchema,
      defaults: defaultWindowState,
      migrations: {},
    }),
  }
}
