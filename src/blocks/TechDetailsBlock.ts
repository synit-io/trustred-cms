import type { Block } from 'payload'

export const TechDetailsBlock: Block = {
  slug: 'tech-details',
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
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'equipment',
      type: 'relationship',
      relationTo: 'equipment',
    },
    {
      name: 'showCompartments',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showHighlights',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
