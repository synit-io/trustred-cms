import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'
import { publicOperationReadAccess } from '@/access/publicReadAccess'

export const Operations: CollectionConfig = {
  slug: 'operations',
  admin: {
    defaultColumns: ['operationNumber', 'category', 'startedAt'],
    useAsTitle: 'operationNumber',
  },
  access: {
    create: hasRole(trustredRoles.operations),
    delete: hasRole(trustredRoles.operations),
    read: publicOperationReadAccess,
    update: hasRole(trustredRoles.operations),
  },
  fields: [
    {
      name: 'operationNumber',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'alarmCode',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Brand', value: 'brand' },
        { label: 'Technische Hilfe', value: 'hilfe' },
        { label: 'Wetter', value: 'wetter' },
        { label: 'Sonstiges', value: 'sonstiges' },
      ],
      required: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'details',
      type: 'textarea',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'showImagePlaceholder',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'unitsInvolved',
      type: 'array',
      labels: {
        plural: 'Eingesetzte Einheiten',
        singular: 'Einheit',
      },
      fields: [
        {
          name: 'unit',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
