import type { GlobalConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'

export const SetupState: GlobalConfig = {
  slug: 'setup-state',
  access: {
    read: () => true,
    update: hasRole(trustredRoles.settings),
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'not_started',
      options: [
        {
          label: 'Not started',
          value: 'not_started',
        },
        {
          label: 'In progress',
          value: 'in_progress',
        },
        {
          label: 'Skipped',
          value: 'skipped',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
      ],
      required: true,
    },
    {
      name: 'currentStep',
      type: 'text',
      defaultValue: 'admin',
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'skippedAt',
      type: 'date',
    },
    {
      name: 'completedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      required: true,
    },
  ],
}
