import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'

export const WarningPresets: CollectionConfig = {
  slug: 'warning-presets',
  admin: {
    defaultColumns: ['label', 'provider', 'regionLabel', 'isSystemPreset', 'updatedAt'],
    useAsTitle: 'label',
  },
  access: {
    create: hasRole(trustredRoles.warnings),
    delete: hasRole(trustredRoles.warnings),
    read: hasRole(trustredRoles.warnings),
    update: hasRole(trustredRoles.warnings),
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'provider',
      type: 'select',
      options: [
        {
          label: 'DWD',
          value: 'dwd',
        },
        {
          label: 'NINA',
          value: 'nina',
        },
      ],
      required: true,
    },
    {
      name: 'regionLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'isSystemPreset',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'dwdRegionIds',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'dwd',
      },
      fields: [
        {
          name: 'regionId',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'dwdStates',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'dwd',
      },
      fields: [
        {
          name: 'state',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'forecastUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'dwd',
      },
    },
    {
      name: 'warningMapUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'dwd',
      },
    },
    {
      name: 'weatherMapUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'dwd',
      },
    },
    {
      name: 'wildfireMapUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'dwd',
      },
    },
    {
      name: 'ninaArs',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.provider === 'nina',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
    },
  ],
}
