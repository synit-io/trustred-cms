import type { Block } from 'payload'

export const OperationsLogBlock: Block = {
  slug: 'operations-log',
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
      name: 'showStats',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'maxItems',
      type: 'number',
      defaultValue: 100,
      min: 1,
      max: 500,
    },
  ],
}
