import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'
import { slugField } from '@/fields/slug'

export const Equipment: CollectionConfig = {
  slug: 'equipment',
  admin: {
    defaultColumns: ['name', 'callSign', 'updatedAt'],
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
    slugField(),
    {
      name: 'callSign',
      type: 'text',
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'facts',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'compartments',
      type: 'array',
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'showImagePlaceholder',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'contents',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
