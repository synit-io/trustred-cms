import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'

export const Crew: CollectionConfig = {
  slug: 'crew',
  admin: {
    defaultColumns: ['name', 'role', 'focus'],
    useAsTitle: 'name',
  },
  access: {
    create: hasRole(trustredRoles.content),
    delete: hasRole(trustredRoles.content),
    read: () => true,
    update: hasRole(trustredRoles.content),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      required: true,
    },
    {
      name: 'qualification',
      type: 'text',
    },
    {
      name: 'skills',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'focus',
      type: 'text',
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'showImagePlaceholder',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
