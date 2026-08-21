import type { Block } from 'payload'

export const FeedBlock: Block = {
  slug: 'feed',
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
      name: 'source',
      type: 'select',
      defaultValue: 'posts',
      options: [
        {
          label: 'News',
          value: 'posts',
        },
        {
          label: 'Events',
          value: 'events',
        },
        {
          label: 'Operations',
          value: 'operations',
        },
        {
          label: 'Crew',
          value: 'crew',
        },
        {
          label: 'Equipment',
          value: 'equipment',
        },
        {
          label: 'FAQ',
          value: 'faqs',
        },
      ],
      required: true,
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      required: true,
    },
    {
      name: 'intro',
      type: 'textarea',
    },
  ],
}
