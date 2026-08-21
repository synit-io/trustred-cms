import type { Block } from 'payload'

export const HtmlBlock: Block = {
  slug: 'html',
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'html',
      type: 'textarea',
      required: true,
    },
  ],
}
