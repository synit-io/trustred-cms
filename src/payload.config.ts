import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { hasRole, trustredRoles } from './access/hasRole'
import { Crew } from './collections/Crew'
import { Equipment } from './collections/Equipment'
import { Events } from './collections/Events'
import { Faqs } from './collections/Faqs'
import { WarningPresets } from './collections/WarningPresets'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Operations } from './collections/Operations'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { SiteSettings } from './globals/SiteSettings'
import { SetupState } from './globals/SetupState'
import { runtimeSMTPAdapter } from './lib/trustred/runtime-email-adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function toBoolean(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
}

function getStoragePlugin() {
  const bucket = process.env.S3_BUCKET?.trim()
  const endpoint = process.env.S3_ENDPOINT?.trim()
  const region = process.env.S3_REGION?.trim()
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim()

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null
  }

  return s3Storage({
    bucket,
    collections: {
      media: true,
    },
    config: {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint: endpoint || undefined,
      forcePathStyle: toBoolean(process.env.S3_FORCE_PATH_STYLE),
      region,
    },
    disableLocalStorage: true,
    enabled: true,
  })
}

const storagePlugin = getStoragePlugin()
const configuredPayloadSecret = process.env.PAYLOAD_SECRET?.trim()

if (!configuredPayloadSecret && process.env.NODE_ENV === 'production') {
  throw new Error('PAYLOAD_SECRET is required in production.')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Posts,
    Events,
    Operations,
    Crew,
    Equipment,
    Faqs,
    WarningPresets,
  ],
  editor: lexicalEditor(),
  globals: [SiteSettings, SetupState],
  secret: configuredPayloadSecret || 'trustred-local-dev-secret',
  email: runtimeSMTPAdapter,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url:
        process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), 'data/trustred.sqlite')}`,
    },
    transactionOptions: {
      behavior: 'immediate',
    },
  }),
  sharp,
  plugins: [
    ...(storagePlugin ? [storagePlugin] : []),
    nestedDocsPlugin({
      collections: ['pages'],
      generateLabel: (_, currentDoc) =>
        String(currentDoc.title ?? currentDoc.navigationLabel ?? ''),
      generateURL: (docs, currentDoc) => {
        const pathParts = [...docs, currentDoc]
          .map((doc) => String(doc.slug ?? '').trim())
          .filter(Boolean)
          .filter((slug) => slug !== 'home')
          .filter((slug, index, array) => index === 0 || slug !== array[index - 1])

        return pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`
      },
    }),
    seoPlugin({
      collections: ['pages', 'posts', 'events', 'equipment'],
      globals: ['site-settings'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => String(doc?.title ?? doc?.siteName ?? ''),
      generateDescription: ({ doc }) =>
        String(doc?.summary ?? doc?.excerpt ?? doc?.taglinePrimary ?? doc?.title ?? ''),
    }),
    formBuilderPlugin({
      fields: {
        payment: false,
      },
      formOverrides: {
        access: {
          create: hasRole(trustredRoles.content),
          delete: hasRole(trustredRoles.content),
          read: hasRole(trustredRoles.content),
          update: hasRole(trustredRoles.content),
        },
      },
      formSubmissionOverrides: {
        access: {
          create: () => false,
          delete: hasRole(trustredRoles.settings),
          read: hasRole(trustredRoles.settings),
          update: () => false,
        },
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'requestFingerprint',
            type: 'text',
            admin: {
              hidden: true,
            },
            index: true,
          },
        ],
      },
    }),
  ],
})
