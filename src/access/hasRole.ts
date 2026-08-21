import type { Access, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

export const trustredRoles = {
  anyEditorial: ['super-admin', 'organization-admin', 'editor', 'operations', 'support'],
  content: ['super-admin', 'organization-admin', 'editor', 'support'],
  media: ['super-admin', 'organization-admin', 'editor', 'operations', 'support'],
  operations: ['super-admin', 'organization-admin', 'operations', 'support'],
  settings: ['super-admin', 'organization-admin', 'support'],
  superAdmin: ['super-admin'],
  warnings: ['super-admin', 'organization-admin', 'support'],
} as const

export type TrustredRole = NonNullable<User['roles']>[number]

export function userHasRole(user: User | null | undefined, roles: readonly TrustredRole[]) {
  return Boolean(user?.roles?.some((role) => roles.includes(role)))
}

export function requestHasRole(req: PayloadRequest, roles: readonly TrustredRole[]) {
  return userHasRole(req.user as User | null | undefined, roles)
}

export function hasRole(roles: readonly TrustredRole[]): Access {
  return ({ req }) => requestHasRole(req, roles)
}
