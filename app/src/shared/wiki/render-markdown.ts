import MarkdownItConstructor, { type Token } from 'markdown-it'

export interface MarkdownRendererOptions {
  knownSlugs: ReadonlySet<string>
}

const INTERNAL_LINK =
  /^(?:\.\.?\/)?(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)?([a-z0-9]+(?:-[a-z0-9]+)*)\.md(?:#.*)?$/

function findLinkClose(tokens: Token[], openIndex: number): Token | undefined {
  let depth = 0
  for (const token of tokens.slice(openIndex)) {
    if (token.type === 'link_open') {
      depth += 1
    } else if (token.type === 'link_close') {
      depth -= 1
      if (depth === 0) return token
    }
  }
  return undefined
}

function rewriteLink(
  token: Token,
  inline: Token[],
  index: number,
  knownSlugs: ReadonlySet<string>,
): void {
  const href = String(token.attrGet('href') ?? '')
  const slug = href.match(INTERNAL_LINK)?.[1]
  if (slug !== undefined) {
    if (knownSlugs.has(slug)) {
      token.attrSet('href', `#/wiki/${slug}`)
      token.attrSet('data-internal', slug)
      return
    }
    const close = findLinkClose(inline, index)
    token.tag = 'span'
    token.attrs = [['title', 'fiche absente']]
    if (close) close.tag = 'span'
    return
  }
  if (href.startsWith('https://')) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
    token.attrSet('data-external', href)
  }
}

export function createMarkdownRenderer(
  options: MarkdownRendererOptions,
): (markdown: string) => string {
  const md = new MarkdownItConstructor({ html: false, linkify: false, typographer: false })

  md.core.ruler.push('anka_links', (state) => {
    for (const block of state.tokens) {
      const inline = block.children
      if (inline === null || block.type !== 'inline') continue
      for (const [index, token] of inline.entries()) {
        if (token.type === 'link_open') rewriteLink(token, inline, index, options.knownSlugs)
      }
    }
  })

  return (markdown: string) => md.render(markdown)
}
