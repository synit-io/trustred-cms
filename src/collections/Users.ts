import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles, userHasRole } from '@/access/hasRole'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: ({ req }) => userHasRole(req.user, trustredRoles.settings),
    create: hasRole(trustredRoles.settings),
    delete: hasRole(trustredRoles.superAdmin),
    read: hasRole(trustredRoles.settings),
    update: hasRole(trustredRoles.settings),
  },
  auth: true,
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['editor'],
      options: [
        {
          label: 'Super Admin',
          value: 'super-admin',
        },
        {
          label: 'Organization Admin',
          value: 'organization-admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Operations',
          value: 'operations',
        },
        {
          label: 'Support',
          value: 'support',
        },
      ],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req }) => userHasRole(req.user, trustredRoles.settings),
      },
    },
    {
      name: 'department',
      type: 'text',
    },
  ],
}
