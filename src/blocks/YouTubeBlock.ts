import type { Block } from 'payload'

export const YouTubeBlock: Block = {
  slug: 'youtube',
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
      name: 'videoId',
      type: 'text',
      required: true,
    },
  ],
}
