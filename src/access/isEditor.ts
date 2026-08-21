import type { Access } from 'payload'

import { trustredRoles } from '@/access/hasRole'

export const isEditor: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.some((role) => trustredRoles.anyEditorial.includes(role)))
