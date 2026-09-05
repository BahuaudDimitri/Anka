import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

export const SECTION_TITLES = [
  'En bref',
  'Détails',
  'Pièges fréquents',
  'Chiffres',
  'À challenger',
] as const
export type SectionTitle = (typeof SECTION_TITLES)[number]

export type FicheStatut = 'hypothese' | 'valide' | 'obsolete'
export type FicheConfiance = 'haute' | 'moyenne' | 'basse'

export interface FicheSource {
  url: string
  titre: string
  date: string
}

export interface Fiche {
  slug: string
  dossier: string
  titre: string
  statut: FicheStatut
  confiance: FicheConfiance
  versionDofus: string
  derniereVerif: string
  sources: FicheSource[]
  tags: string[]
  sections: Record<SectionTitle, string>
}

export class FicheFormatError extends Error {
  constructor(
    public readonly path: string,
    detail: string,
  ) {
    super(`${path} : ${detail}`)
    this.name = 'FicheFormatError'
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Pas de `\s*$` final derrière un `.+?` : les deux quantificateurs peuvent s'échanger des
// caractères et provoquer un retour arrière polynomial (regexp/no-super-linear-backtracking).
// Le titre capturé est trim() par l'appelant.
const SECTION_HEADING = /^## (.*)$/

// Le schéma YAML « core » du paquet yaml laisse les dates en chaîne ; on accepte aussi Date et
// number par prudence (2026 non quoté devient un nombre).
const textLike = z.union([z.string(), z.date(), z.number()]).transform((value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
})

const titreSchema = z.string().min(1)

const FicheSourceSchema = z.object({ url: z.url(), titre: titreSchema, date: textLike })

const FrontmatterSchema = z.object({
  titre: titreSchema,
  slug: z.string().regex(SLUG_PATTERN, 'kebab-case attendu'),
  statut: z.enum(['hypothese', 'valide', 'obsolete']),
  confiance: z.enum(['haute', 'moyenne', 'basse']),
  version_dofus: textLike,
  derniere_verif: textLike,
  sources: z.array(FicheSourceSchema),
  tags: z.array(z.string()),
})

function splitPath(path: string): { dossier: string; fileSlug: string } {
  const parts = path.replaceAll('\\', '/').split('/')
  const file = parts.at(-1)
  const dossier = parts.at(-2)
  if (file === undefined || dossier === undefined || !file.endsWith('.md')) {
    throw new FicheFormatError(path, 'chemin attendu : <dossier>/<slug>.md')
  }
  return { dossier, fileSlug: file.slice(0, -3) }
}

function splitFrontmatter(path: string, raw: string): { frontmatter: string; body: string } {
  if (!raw.startsWith('---\n')) {
    throw new FicheFormatError(path, 'frontmatter absent (le fichier doit commencer par ---)')
  }
  const end = raw.indexOf('\n---\n', 4)
  if (end === -1) throw new FicheFormatError(path, 'frontmatter non fermé')
  return { frontmatter: raw.slice(4, end), body: raw.slice(end + 5) }
}

function parseFrontmatter(path: string, frontmatter: string): z.infer<typeof FrontmatterSchema> {
  let data: unknown
  try {
    data = parseYaml(frontmatter)
  } catch (error) {
    throw new FicheFormatError(path, `frontmatter YAML invalide : ${String(error)}`)
  }
  const parsed = FrontmatterSchema.safeParse(data)
  if (!parsed.success) {
    throw new FicheFormatError(path, `frontmatter : ${z.prettifyError(parsed.error)}`)
  }
  return parsed.data
}

function isSectionTitle(title: string): title is SectionTitle {
  return (SECTION_TITLES as readonly string[]).includes(title)
}

function splitSections(path: string, body: string): Record<SectionTitle, string> {
  const found: { title: string; lines: string[] }[] = []
  for (const line of body.split('\n')) {
    const title = line.match(SECTION_HEADING)?.[1]
    if (title === undefined) {
      found.at(-1)?.lines.push(line)
    } else {
      found.push({ title: title.trim(), lines: [] })
    }
  }
  const titles = found.map((section) => section.title)
  const unexpected = titles.find((title) => !isSectionTitle(title))
  if (unexpected !== undefined)
    throw new FicheFormatError(path, `section inattendue « ${unexpected} »`)
  const missing = SECTION_TITLES.find((expected) => !titles.includes(expected))
  if (missing !== undefined) throw new FicheFormatError(path, `section « ${missing} » absente`)
  if (titles.join('|') !== SECTION_TITLES.join('|')) {
    throw new FicheFormatError(path, `sections dans le mauvais ordre : ${titles.join(', ')}`)
  }
  const entries = found.map((section) => [section.title, section.lines.join('\n').trim()] as const)
  return Object.fromEntries(entries) as Record<SectionTitle, string>
}

export function parseFiche(path: string, raw: string): Fiche {
  const normalized = raw.replaceAll('\r\n', '\n')
  const { dossier, fileSlug } = splitPath(path)
  const { frontmatter, body } = splitFrontmatter(path, normalized)
  const meta = parseFrontmatter(path, frontmatter)
  if (meta.slug !== fileSlug) {
    throw new FicheFormatError(
      path,
      `slug « ${meta.slug} » différent du nom de fichier « ${fileSlug} »`,
    )
  }
  return {
    slug: meta.slug,
    dossier,
    titre: meta.titre,
    statut: meta.statut,
    confiance: meta.confiance,
    versionDofus: meta.version_dofus,
    derniereVerif: meta.derniere_verif,
    sources: meta.sources,
    tags: meta.tags,
    sections: splitSections(path, body),
  }
}
