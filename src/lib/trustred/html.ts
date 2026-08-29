import sanitizeHtml from 'sanitize-html'

const allowedTags = [
  'a',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]

export function sanitizeHtmlFragment(value: string) {
  return sanitizeHtml(value, {
    allowProtocolRelative: false,
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'rel', 'target', 'title'],
      img: ['alt', 'height', 'loading', 'src', 'title', 'width'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan', 'scope'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    allowedTags,
    transformTags: {
      a: (_tagName, attributes) => ({
        attribs:
          attributes.target === '_blank'
            ? { ...attributes, rel: 'noopener noreferrer' }
            : attributes,
        tagName: 'a',
      }),
    },
  })
}
