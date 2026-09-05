import fs from 'node:fs'

export function cwdFiles(): string[] {
  return fs.readdirSync(process.cwd())
}
