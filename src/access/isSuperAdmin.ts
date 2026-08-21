import type { Access } from 'payload'

export const isSuperAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('super-admin'))
