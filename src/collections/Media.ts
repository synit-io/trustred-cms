import { APIError, type CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'
import { getMediaUsage } from '@/lib/trustred/media-usage'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    defaultColumns: ['filename', 'alt', 'category', 'updatedAt'],
  },
  access: {
    create: hasRole(trustredRoles.media),
    delete: hasRole(trustredRoles.media),
    read: () => true,
    update: hasRole(trustredRoles.media),
  },
  hooks: {
    beforeDelete: [async ({ id, req }) => {
      const usage = await getMediaUsage(req.payload, Number(id), req)
      if (usage.length > 0) {
        throw new APIError('Media is still referenced and cannot be deleted.', 409)
      }
    }],
    beforeOperation: [
      ({ args, operation, req }) => {
        if (
          (operation === 'create' || operation === 'update') &&
          req.file &&
          Math.max(req.file.size, req.file.data?.length ?? 0) > 10 * 1024 * 1024
        ) {
          throw new APIError('Media uploads must not exceed 10 MiB.', 413)
        }
        return args
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'general',
      options: [
        {
          label: 'General',
          value: 'general',
        },
        {
          label: 'News',
          value: 'news',
        },
        {
          label: 'Events',
          value: 'events',
        },
        {
          label: 'Operations',
          value: 'operations',
        },
        {
          label: 'Team',
          value: 'team',
        },
        {
          label: 'Equipment',
          value: 'equipment',
        },
      ],
      required: true,
    },
  ],
  upload: {
    adminThumbnail: 'card',
    focalPoint: true,
    imageSizes: [
      {
        name: 'card',
        width: 640,
        height: 420,
        fit: 'cover',
      },
      {
        name: 'feature',
        width: 1440,
        height: 960,
        fit: 'cover',
      },
      {
        name: 'square',
        width: 640,
        height: 640,
        fit: 'cover',
      },
    ],
  },
}
