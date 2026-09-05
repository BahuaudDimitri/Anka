/* eslint-disable security/detect-non-literal-fs-filename -- les chemins sont construits depuis
   userData par le processus main, jamais reçus du renderer */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { z } from 'zod'

export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

export interface StoreDefinition<T extends { schemaVersion: number }> {
  /**
   * nom du fichier dans le dossier de données, par ex. `profile.json`
   */
  file: string
  currentVersion: number
  schema: { safeParse: (raw: unknown) => z.ZodSafeParseResult<T> }
  defaults: () => T
  /**
   * clé = version de départ ; la fonction doit produire la version suivante
   */
  migrations: Record<number, Migration>
}

export class StoreCorruptError extends Error {
  constructor(
    public readonly file: string,
    detail: string,
  ) {
    super(`${file} : ${detail}`)
    this.name = 'StoreCorruptError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNotFound(error: unknown): boolean {
  return isRecord(error) && error.code === 'ENOENT'
}

function versionOf(raw: Record<string, unknown>): number {
  const version = raw.schemaVersion
  return typeof version === 'number' ? version : 0
}

export class JsonStore<T extends { schemaVersion: number }> {
  private readonly path: string

  constructor(
    private readonly dir: string,
    private readonly definition: StoreDefinition<T>,
  ) {
    this.path = join(dir, definition.file)
  }

  private migrate(raw: unknown): unknown {
    if (!isRecord(raw)) return raw
    let current = raw
    let version = versionOf(current)
    while (version < this.definition.currentVersion) {
      const migration = this.definition.migrations[version]
      if (migration === undefined) {
        throw new StoreCorruptError(
          this.definition.file,
          `aucune migration depuis la version ${String(version)}`,
        )
      }
      current = migration(current)
      const next = versionOf(current)
      if (next <= version) {
        throw new StoreCorruptError(
          this.definition.file,
          `la migration depuis ${String(version)} n'a pas incrémenté schemaVersion`,
        )
      }
      version = next
    }
    return current
  }

  async read(): Promise<T> {
    let text: string
    try {
      text = await readFile(this.path, 'utf8')
    } catch (error) {
      if (isNotFound(error)) return this.definition.defaults()
      throw error
    }
    let raw: unknown
    try {
      raw = JSON.parse(text)
    } catch {
      throw new StoreCorruptError(this.definition.file, 'JSON illisible')
    }
    const parsed = this.definition.schema.safeParse(this.migrate(raw))
    if (!parsed.success) {
      throw new StoreCorruptError(this.definition.file, z.prettifyError(parsed.error))
    }
    return parsed.data
  }

  async write(data: T): Promise<void> {
    const parsed = this.definition.schema.safeParse(data)
    if (!parsed.success) {
      throw new StoreCorruptError(
        this.definition.file,
        `écriture refusée : ${z.prettifyError(parsed.error)}`,
      )
    }
    await mkdir(this.dir, { recursive: true })
    const temporary = `${this.path}.tmp`
    await writeFile(temporary, JSON.stringify(parsed.data, null, 2), 'utf8')
    await rename(temporary, this.path)
  }
}
