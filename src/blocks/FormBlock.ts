import type { Block } from 'payload'

export const FormBlock: Block = {
  slug: 'form',
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
      name: 'formMode',
      type: 'select',
      defaultValue: 'preset',
      options: [
        {
          label: 'Preset',
          value: 'preset',
        },
        {
          label: 'Custom Form',
          value: 'custom',
        },
      ],
      required: true,
    },
    {
      name: 'presetKey',
      type: 'select',
      admin: {
        condition: (_, siblingData) => siblingData?.formMode !== 'custom',
      },
      defaultValue: 'contact',
      options: [
        {
          label: 'Kontaktformular',
          value: 'contact',
        },
        {
          label: 'Mitmachen Formular',
          value: 'join',
        },
      ],
      required: true,
    },
    {
      name: 'form',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.formMode === 'custom',
      },
      relationTo: 'forms',
    },
    {
      name: 'successMessage',
      type: 'textarea',
    },
  ],
}
