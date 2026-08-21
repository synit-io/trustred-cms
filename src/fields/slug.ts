import type { FieldHook, TextField } from 'payload'
import { toPublicSlug } from '@/lib/trustred/slugify'

const formatSlug: FieldHook = ({ data, operation, originalDoc, value }) => {
  if (typeof value === 'string' && value.length > 0) {
    return toPublicSlug(value)
  }

  const fallback =
    operation === 'create'
      ? String(data?.title ?? data?.name ?? data?.label ?? '')
      : String(data?.title ?? data?.name ?? data?.label ?? originalDoc?.title ?? originalDoc?.name ?? '')

  return toPublicSlug(fallback)
}

export const slugField = (fieldName = 'slug'): TextField => ({
  name: fieldName,
  type: 'text',
  admin: {
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [formatSlug],
  },
  index: true,
  required: true,
  unique: true,
})
