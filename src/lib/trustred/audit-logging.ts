import type { Plugin } from 'payload'

/** Emit mutation metadata only. Never log document bodies, passwords, or submission contents. */
export const auditLogging: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((collection) => ({
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [
        ...(collection.hooks?.afterChange ?? []),
        ({ doc, operation, req }) => {
          req.payload.logger.info(
            {
              event: 'audit',
              collection: collection.slug,
              operation,
              documentId: doc.id,
              actorId: req.user?.id ?? null,
            },
            'CMS document changed',
          )
          return doc
        },
      ],
      afterDelete: [
        ...(collection.hooks?.afterDelete ?? []),
        ({ doc, req }) => {
          req.payload.logger.info(
            {
              event: 'audit',
              collection: collection.slug,
              operation: 'delete',
              documentId: doc.id,
              actorId: req.user?.id ?? null,
            },
            'CMS document deleted',
          )
          return doc
        },
      ],
    },
  })),
  globals: config.globals?.map((global) => ({
    ...global,
    hooks: {
      ...global.hooks,
      afterChange: [
        ...(global.hooks?.afterChange ?? []),
        ({ doc, req }) => {
          req.payload.logger.info(
            {
              event: 'audit',
              global: global.slug,
              operation: 'update',
              actorId: req.user?.id ?? null,
            },
            'CMS settings changed',
          )
          return doc
        },
      ],
    },
  })),
})
