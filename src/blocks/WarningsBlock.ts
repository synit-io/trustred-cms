import type { Block } from 'payload'

export const WarningsBlock: Block = {
  slug: 'warnings',
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
      name: 'provider',
      type: 'select',
      defaultValue: 'dwd',
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
      name: 'presetKey',
      type: 'text',
    },
    {
      name: 'ninaPresetKey',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'regionLabel',
      type: 'text',
    },
    {
      name: 'dwdRegionIds',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
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
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
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
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
    },
    {
      name: 'warningMapUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
    },
    {
      name: 'weatherMapUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
    },
    {
      name: 'wildfireMapUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
    },
    {
      name: 'showWeatherMap',
      type: 'checkbox',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
      defaultValue: false,
    },
    {
      name: 'showWildfireMap',
      type: 'checkbox',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'dwd',
      },
      defaultValue: false,
    },
    {
      name: 'ninaArs',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === 'nina',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
    },
  ],
}
