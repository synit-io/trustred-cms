import type { Access } from 'payload'

import { requestHasRole, trustredRoles } from '@/access/hasRole'

export const publishedPageReadAccess: Access = ({ req }) => {
  if (requestHasRole(req, trustredRoles.anyEditorial)) {
    return true
  }

  return {
    or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
  }
}

export const publishedPostReadAccess: Access = ({ req }) => {
  if (requestHasRole(req, trustredRoles.anyEditorial)) {
    return true
  }

  return {
    or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
  }
}

export const publicEventReadAccess: Access = ({ req }) => {
  if (requestHasRole(req, trustredRoles.anyEditorial)) {
    return true
  }

  return {
    visibility: { equals: 'public' },
  }
}

export const publicOperationReadAccess: Access = ({ req }) => {
  if (requestHasRole(req, trustredRoles.anyEditorial)) {
    return true
  }

  return {
    or: [{ isPublic: { equals: true } }, { isPublic: { exists: false } }],
  }
}
