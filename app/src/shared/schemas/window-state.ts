import { z } from 'zod'

export const WINDOW_STATE_SCHEMA_VERSION = 1
export const WINDOW_MIN_WIDTH = 900
export const WINDOW_MIN_HEIGHT = 600

export const WindowStateSchema = z.object({
  schemaVersion: z.literal(WINDOW_STATE_SCHEMA_VERSION),
  width: z.number().int().min(WINDOW_MIN_WIDTH),
  height: z.number().int().min(WINDOW_MIN_HEIGHT),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  maximized: z.boolean().default(false),
})

export type WindowState = z.infer<typeof WindowStateSchema>

export function defaultWindowState(): WindowState {
  return { schemaVersion: WINDOW_STATE_SCHEMA_VERSION, width: 1200, height: 800, maximized: false }
}
