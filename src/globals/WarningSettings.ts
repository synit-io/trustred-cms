import type { GlobalConfig } from 'payload'

import { isAuthenticated } from '@/access/isAuthenticated'

export const WarningSettings: GlobalConfig = {
  slug: 'warning-settings',
  access: {
    read: () => true,
    update: isAuthenticated,
  },
  fields: [
    {
      name: 'customPresets',
      type: 'array',
      admin: {
        description:
          'Nur eigene Presets. Die systemseitigen Trustred-Standardpresets bleiben im Frontend schreibgeschützt und werden automatisch ergänzt.',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
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
      defaultValue: [],
    },
  ],
}
