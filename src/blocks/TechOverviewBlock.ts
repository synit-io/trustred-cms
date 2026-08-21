import type { Block } from 'payload'

export const TechOverviewBlock: Block = {
  slug: 'tech-overview',
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
      name: 'featuredEquipment',
      type: 'relationship',
      relationTo: 'equipment',
    },
    {
      name: 'showStats',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showFeaturedProfile',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'maxItems',
      type: 'number',
      defaultValue: 12,
      min: 1,
      max: 48,
    },
  ],
}
