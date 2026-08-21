import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'
import { publishedPostReadAccess } from '@/access/publicReadAccess'
import { slugField } from '@/fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    defaultColumns: ['title', 'category', '_status', 'publishedAt'],
    useAsTitle: 'title',
  },
  access: {
    create: hasRole(trustredRoles.content),
    delete: hasRole(trustredRoles.content),
    read: publishedPostReadAccess,
    update: hasRole(trustredRoles.content),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'category',
      type: 'select',
      defaultValue: 'oeffentlichkeitsarbeit',
      options: [
        { label: 'Öffentlichkeitsarbeit', value: 'oeffentlichkeitsarbeit' },
        { label: 'Einsatz', value: 'einsatz' },
        { label: 'Ausbildung', value: 'ausbildung' },
        { label: 'Jugend', value: 'jugend' },
      ],
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'showImagePlaceholder',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
  ],
  versions: {
    drafts: true,
  },
}
