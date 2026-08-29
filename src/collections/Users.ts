import { APIError, type Access, type CollectionConfig } from 'payload'

import { hasRole, trustredRoles, userHasRole } from '@/access/hasRole'
import type { User } from '@/payload-types'

const canUpdateUser: Access = ({ req }) => {
  const actor = req.user as User | null | undefined
  if (userHasRole(actor, trustredRoles.superAdmin)) {
    return true
  }

  if (!userHasRole(actor, trustredRoles.settings)) {
    return false
  }

  return {
    roles: {
      not_in: ['super-admin'],
    },
  }
}

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
    update: canUpdateUser,
  },
  auth: true,
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        const actor = req.user as User | null | undefined
        if (!actor || userHasRole(actor, trustredRoles.superAdmin)) {
          return data
        }

        const requestedRoles = Array.isArray(data.roles) ? data.roles : originalDoc?.roles
        const changesSuperAdmin =
          requestedRoles?.includes('super-admin') || originalDoc?.roles?.includes('super-admin')

        if (changesSuperAdmin) {
          throw new APIError(
            'Only super admins may grant, remove, or modify super-admin accounts.',
            403,
          )
        }

        return data
      },
    ],
  },
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
