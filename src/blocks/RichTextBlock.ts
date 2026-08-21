import type { Block } from 'payload'

export const RichTextBlock: Block = {
  slug: 'rich-text',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
    },
    {
      name: 'copy',
      type: 'textarea',
      required: true,
    },
  ],
}
