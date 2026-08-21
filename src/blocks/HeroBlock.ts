import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
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
    {
      name: 'primaryActionLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'primaryActionHref',
      type: 'text',
      required: true,
    },
    {
      name: 'secondaryActionLabel',
      type: 'text',
    },
    {
      name: 'secondaryActionHref',
      type: 'text',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
