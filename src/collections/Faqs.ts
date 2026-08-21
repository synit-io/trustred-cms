import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    defaultColumns: ['question', 'updatedAt'],
    useAsTitle: 'question',
  },
  access: {
    create: hasRole(trustredRoles.content),
    delete: hasRole(trustredRoles.content),
    read: () => true,
    update: hasRole(trustredRoles.content),
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
    },
  ],
}
