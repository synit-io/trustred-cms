import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'
import { publicEventReadAccess } from '@/access/publicReadAccess'
import { slugField } from '@/fields/slug'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    defaultColumns: ['title', 'eventType', 'startsAt', 'visibility'],
    useAsTitle: 'title',
  },
  access: {
    create: hasRole(trustredRoles.operations),
    delete: hasRole(trustredRoles.operations),
    read: publicEventReadAccess,
    update: hasRole(trustredRoles.operations),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'Ausbildung', value: 'ausbildung' },
        { label: 'Übung', value: 'uebung' },
        { label: 'Jugend', value: 'jugend' },
        { label: 'Organisation', value: 'organisation' },
        { label: 'Öffentlich', value: 'oeffentlich' },
      ],
      required: true,
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Öffentlich', value: 'public' },
        { label: 'Intern', value: 'internal' },
      ],
      required: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
    },
    {
      name: 'endsAt',
      type: 'date',
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
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
      name: 'registrationEnabled',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
