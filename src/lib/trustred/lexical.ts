import type { Form } from '@/payload-types'

type LexicalContent = NonNullable<Form['confirmationMessage']>
type LexicalLike = Form['confirmationMessage'] | { root?: { children?: unknown[] } | null } | null | undefined

function collectNodeText(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return ''
  }

  if ('text' in node && typeof node.text === 'string') {
    return node.text
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => collectNodeText(child)).join('')
  }

  return ''
}

export function createLexicalTextContent(text: string): LexicalContent {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const children = (paragraphs.length > 0 ? paragraphs : ['']).map((paragraph) => ({
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal' as const,
        style: '',
        text: paragraph,
        type: 'text' as const,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '',
    indent: 0,
    type: 'paragraph' as const,
    version: 1,
  }))

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

export function readLexicalText(value: LexicalLike): string {
  const root = value && typeof value === 'object' && 'root' in value ? value.root : null

  if (!root || !Array.isArray(root.children)) {
    return ''
  }

  return root.children
    .map((child: unknown) => collectNodeText(child).trim())
    .filter(Boolean)
    .join('\n\n')
    .trim()
}
