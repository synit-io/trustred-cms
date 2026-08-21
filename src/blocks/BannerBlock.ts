import type { Block } from 'payload'

export const BannerBlock: Block = {
  slug: 'banner',
  fields: [
    {
      name: 'label',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'primaryLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'primaryHref',
      type: 'text',
      required: true,
    },
    {
      name: 'secondaryLabel',
      type: 'text',
    },
    {
      name: 'secondaryHref',
      type: 'text',
    },
  ],
}
