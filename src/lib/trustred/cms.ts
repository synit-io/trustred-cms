import { cache } from 'react'

import { getPayload } from 'payload'

import configPromise from '@/payload.config'
import {
  defaultHomePage,
  defaultManagedPages,
  defaultSiteSettings,
  fallbackFeedData,
} from '@/lib/trustred/defaults'
import { parseOperationIdParam } from '@/lib/trustred/operations'
import { normalizePublicPath, resolvePublicSlug, toPublicSlug } from '@/lib/trustred/slugify'
import { getBuiltInWarningPresets, normalizeWarningPresets } from '@/lib/trustred/warning-presets'
import type {
  Crew,
  Equipment,
  Event as PayloadEvent,
  Faq,
  Operation,
  Page,
  Post,
  WarningPreset,
} from '@/payload-types'

type FeedSource = keyof typeof fallbackFeedData

const pageDepth = 1

function withResolvedPageSlug(page: Page) {
  return {
    ...page,
    slug: resolvePublicSlug(page.slug, page.title),
  }
}

function withResolvedPostSlug(post: Post) {
  return {
    ...post,
    slug: resolvePublicSlug(post.slug, post.title),
  }
}

function withResolvedEventSlug(event: PayloadEvent) {
  return {
    ...event,
    slug: resolvePublicSlug(event.slug, event.title),
  }
}

function withResolvedEquipmentSlug(item: Equipment) {
  return {
    ...item,
    slug: resolvePublicSlug(item.slug, item.name),
  }
}

const fallbackPosts = fallbackFeedData.posts.map((item, index) => ({
  ...item,
  content: 'content' in item ? item.content : (item.excerpt ?? item.title),
  id: index + 1,
  slug: resolvePublicSlug('slug' in item && item.slug ? String(item.slug) : '', item.title),
})) as Post[]
const fallbackEvents = fallbackFeedData.events.map((item, index) => ({
  ...item,
  id: index + 1,
  slug: resolvePublicSlug('slug' in item && item.slug ? String(item.slug) : '', item.title),
})) as PayloadEvent[]
const fallbackOperations = fallbackFeedData.operations.map((item, index) => ({
  ...item,
  id: index + 1,
})) as Operation[]
const fallbackEquipment = fallbackFeedData.equipment.map((item, index) => ({
  ...item,
  id: index + 1,
})) as Equipment[]
const fallbackCrew = fallbackFeedData.crew.map((item, index) => ({
  ...item,
  id: index + 1,
})) as Crew[]
const fallbackFaqs = fallbackFeedData.faqs.map((item, index) => ({
  ...item,
  id: index + 1,
})) as Faq[]
type NavigationFallbackPage = Pick<
  Page,
  'breadcrumbs' | 'navigationLabel' | 'navigationOrder' | 'slug' | 'title'
>

const fallbackNavigationPages: NavigationFallbackPage[] = [defaultHomePage, ...defaultManagedPages]
  .filter((page) => page.showInNavigation !== false)
  .map((page) => ({
    breadcrumbs: null,
    navigationLabel: page.navigationLabel ?? null,
    navigationOrder: page.navigationOrder ?? null,
    slug: page.slug,
    title: page.title,
  }))

function getPagePath(
  page: Pick<Page, 'slug' | 'breadcrumbs'> | Pick<typeof defaultHomePage, 'slug'>,
) {
  if ('breadcrumbs' in page) {
    const breadcrumbUrl = page.breadcrumbs?.[page.breadcrumbs.length - 1]?.url
    if (breadcrumbUrl) {
      return normalizePublicPath(breadcrumbUrl)
    }
  }

  const sourceTitle = 'title' in page ? String(page.title ?? '') : ''
  const publicSlug = resolvePublicSlug(page.slug, sourceTitle)
  return publicSlug === 'home' ? '/' : normalizePublicPath(`/${publicSlug}`)
}

function sameNormalizedSlug(left?: string | null, right?: string | null) {
  return toPublicSlug(String(left ?? '')) === toPublicSlug(String(right ?? ''))
}

async function getNavigationItems(payload: Awaited<ReturnType<typeof getPayloadClient>>) {
  try {
    const result = await payload.find({
      collection: 'pages',
      depth: pageDepth,
      limit: 200,
      sort: 'navigationOrder',
      where: {
        or: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            _status: {
              exists: false,
            },
          },
        ],
      },
    })

    if (result.docs.length > 0) {
      return (result.docs as Page[])
        .map((page) => withResolvedPageSlug(page))
        .filter((page) => page.showInNavigation !== false)
        .slice()
        .sort((left, right) => {
          const leftOrder = Number(left.navigationOrder ?? 999)
          const rightOrder = Number(right.navigationOrder ?? 999)
          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder
          }

          return String(left.title ?? '').localeCompare(String(right.title ?? ''), 'de')
        })
        .map((page) => ({
          href: getPagePath(page),
          label: String(page.navigationLabel ?? page.title ?? page.slug),
        }))
    }
  } catch {
    // Fall back to built-in starter navigation.
  }

  return fallbackNavigationPages
    .slice()
    .sort(
      (left, right) => Number(left.navigationOrder ?? 999) - Number(right.navigationOrder ?? 999),
    )
    .map((page) => ({
      href: getPagePath(page),
      label: String(page.navigationLabel ?? page.title ?? page.slug),
    }))
}

export const getPayloadClient = cache(async () => {
  const config = await configPromise
  return getPayload({ config })
})

export const getSiteSettings = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const [settings, navigation] = await Promise.all([
      payload.findGlobal({
        slug: 'site-settings',
      }),
      getNavigationItems(payload),
    ])

    return {
      ...defaultSiteSettings,
      ...settings,
      navigation,
      announcement: {
        ...defaultSiteSettings.announcement,
        ...settings.announcement,
      },
      contact: {
        ...defaultSiteSettings.contact,
        ...settings.contact,
      },
      joinButton: {
        ...defaultSiteSettings.joinButton,
        ...settings.joinButton,
      },
      legal: {
        ...defaultSiteSettings.legal,
        ...settings.legal,
      },
      smtp: {
        ...defaultSiteSettings.smtp,
        ...settings.smtp,
      },
      theme: {
        ...defaultSiteSettings.theme,
        ...settings.theme,
      },
    }
  } catch {
    return {
      ...defaultSiteSettings,
      navigation: fallbackNavigationPages
        .slice()
        .sort(
          (left, right) =>
            Number(left.navigationOrder ?? 999) - Number(right.navigationOrder ?? 999),
        )
        .map((page) => ({
          href: getPagePath(page),
          label: String(page.navigationLabel ?? page.title ?? page.slug),
        })),
    }
  }
})

export const getWarningSettings = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const presets = await payload.find({
      collection: 'warning-presets',
      limit: 200,
      sort: 'label',
    })

    return normalizeWarningPresets(presets.docs as WarningPreset[])
  } catch {
    return getBuiltInWarningPresets()
  }
})

export const getPageBySlug = cache(async (slug: string) => {
  const normalizedSlug = toPublicSlug(slug)
  const slugPath = normalizedSlug === 'home' ? '/' : `/${normalizedSlug}`

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'pages',
      depth: pageDepth,
      limit: 1,
      where: {
        and: [
          {
            or: [{ slug: { equals: normalizedSlug } }, { 'breadcrumbs.url': { equals: slugPath } }],
          },
          {
            or: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                _status: {
                  exists: false,
                },
              },
            ],
          },
        ],
      },
    })

    if (result.docs[0]) {
      return withResolvedPageSlug(result.docs[0] as Page)
    }

    const fallbackResult = await payload.find({
      collection: 'pages',
      depth: pageDepth,
      limit: 200,
      where: {
        or: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            _status: {
              exists: false,
            },
          },
        ],
      },
    })

    return (
      (fallbackResult.docs as Page[])
        .map((page) => withResolvedPageSlug(page))
        .find((page) => {
          const breadcrumbUrl = page.breadcrumbs?.[page.breadcrumbs.length - 1]?.url
          return (
            sameNormalizedSlug(page.slug, normalizedSlug) ||
            sameNormalizedSlug(breadcrumbUrl, slugPath)
          )
        }) ?? (normalizedSlug === 'home' ? withResolvedPageSlug(defaultHomePage as Page) : null)
    )
  } catch {
    return normalizedSlug === 'home' ? withResolvedPageSlug(defaultHomePage as Page) : null
  }
})

export async function getFeedItems(source: FeedSource, limit: number) {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: source,
      limit,
      sort: source === 'operations' ? '-startedAt' : '-updatedAt',
      where:
        source === 'operations'
          ? {
              or: [{ isPublic: { equals: true } }, { isPublic: { exists: false } }],
            }
          : source === 'events'
            ? {
                visibility: { equals: 'public' },
              }
            : source === 'posts'
              ? {
                  or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
                }
              : undefined,
    })

    if (result.docs.length > 0) {
      return result.docs
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackFeedData[source].slice(0, limit)
}

export const getPublicOperations = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'operations',
      limit: 100,
      sort: '-startedAt',
      where: {
        or: [{ isPublic: { equals: true } }, { isPublic: { exists: false } }],
      },
    })

    if (result.docs.length > 0) {
      return result.docs as Operation[]
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackOperations
})

export const getPublicOperationById = cache(async (id: string) => {
  const resolvedId = parseOperationIdParam(id)
  const numericId = Number.parseInt(String(resolvedId ?? ''), 10)

  if (!Number.isFinite(numericId)) {
    return null
  }

  try {
    const payload = await getPayloadClient()
    const operation = (await payload.findByID({
      collection: 'operations',
      id: numericId,
    })) as Operation

    return operation.isPublic === false ? null : operation
  } catch {
    const fallback = fallbackOperations.find((item) => item.id === numericId)
    return fallback?.isPublic === false ? null : (fallback ?? null)
  }
})

export const getPublicPosts = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      limit: 100,
      sort: '-publishedAt',
      where: {
        or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
      },
    })

    if (result.docs.length > 0) {
      return (result.docs as Post[]).map((item) => withResolvedPostSlug(item))
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackPosts
})

export const getPublicEvents = cache(async (): Promise<PayloadEvent[]> => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'events',
      limit: 100,
      sort: 'startsAt',
      where: {
        visibility: { equals: 'public' },
      },
    })

    if (result.docs.length > 0) {
      return (result.docs as PayloadEvent[]).map((item) => withResolvedEventSlug(item))
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackEvents
})

export const getPublicPostBySlug = cache(async (slug: string) => {
  const normalizedSlug = toPublicSlug(slug)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      limit: 1,
      where: {
        and: [
          { slug: { equals: normalizedSlug } },
          {
            or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
          },
        ],
      },
    })

    if (result.docs[0]) {
      return withResolvedPostSlug(result.docs[0] as Post)
    }

    const fallbackResult = await payload.find({
      collection: 'posts',
      limit: 200,
      where: {
        or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
      },
    })

    return (
      (fallbackResult.docs as Post[])
        .map((item) => withResolvedPostSlug(item))
        .find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ??
      fallbackPosts.find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ??
      null
    )
  } catch {
    return fallbackPosts.find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ?? null
  }
})

export const getPublicEventBySlug = cache(async (slug: string): Promise<PayloadEvent | null> => {
  const normalizedSlug = toPublicSlug(slug)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'events',
      limit: 1,
      where: {
        and: [{ slug: { equals: normalizedSlug } }, { visibility: { equals: 'public' } }],
      },
    })

    if (result.docs[0]) {
      return withResolvedEventSlug(result.docs[0] as PayloadEvent)
    }

    const fallbackResult = await payload.find({
      collection: 'events',
      limit: 200,
      where: {
        visibility: { equals: 'public' },
      },
    })

    return (
      (fallbackResult.docs as PayloadEvent[])
        .map((item) => withResolvedEventSlug(item))
        .find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ??
      fallbackEvents.find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ??
      null
    )
  } catch {
    return fallbackEvents.find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ?? null
  }
})

export const getPublicEquipment = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'equipment',
      limit: 100,
      sort: 'name',
    })

    if (result.docs.length > 0) {
      return (result.docs as Equipment[]).map((item) => withResolvedEquipmentSlug(item))
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackEquipment
})

export const getPublicEquipmentBySlug = cache(async (slug: string) => {
  const normalizedSlug = toPublicSlug(slug)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'equipment',
      limit: 1,
      where: {
        slug: { equals: normalizedSlug },
      },
    })

    if (result.docs[0]) {
      return withResolvedEquipmentSlug(result.docs[0] as Equipment)
    }

    const fallbackResult = await payload.find({
      collection: 'equipment',
      limit: 200,
      sort: 'name',
    })

    return (
      (fallbackResult.docs as Equipment[])
        .map((item) => withResolvedEquipmentSlug(item))
        .find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ??
      fallbackEquipment.find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ??
      null
    )
  } catch {
    return fallbackEquipment.find((item) => sameNormalizedSlug(item.slug, normalizedSlug)) ?? null
  }
})

export const getPublicEquipmentById = cache(async (id: number | string) => {
  const numericId = typeof id === 'number' ? id : Number.parseInt(String(id), 10)

  if (!Number.isFinite(numericId)) {
    return null
  }

  try {
    const payload = await getPayloadClient()
    return (await payload.findByID({
      collection: 'equipment',
      id: numericId,
    })) as Equipment
  } catch {
    return fallbackEquipment.find((item) => item.id === numericId) ?? null
  }
})

export const getPublicCrew = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'crew',
      limit: 100,
      sort: 'name',
    })

    if (result.docs.length > 0) {
      return result.docs as Crew[]
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackCrew
})

export const getPublicCrewById = cache(async (id: string) => {
  const numericId = Number.parseInt(id, 10)

  if (!Number.isFinite(numericId)) {
    return null
  }

  try {
    const payload = await getPayloadClient()
    return (await payload.findByID({
      collection: 'crew',
      id: numericId,
    })) as Crew
  } catch {
    return fallbackCrew.find((item) => item.id === numericId) ?? null
  }
})

export const getPublicFaqs = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'faqs',
      limit: 200,
      sort: 'question',
    })

    if (result.docs.length > 0) {
      return result.docs as Faq[]
    }
  } catch {
    // Fall through to fallback content.
  }

  return fallbackFaqs
})

export const getPublicFaqById = cache(async (id: string) => {
  const numericId = Number.parseInt(id, 10)

  if (!Number.isFinite(numericId)) {
    return null
  }

  try {
    const payload = await getPayloadClient()
    const faq = (await payload.findByID({
      collection: 'faqs',
      id: numericId,
    })) as Faq

    return faq ?? fallbackFaqs.find((item) => item.id === numericId) ?? null
  } catch {
    return fallbackFaqs.find((item) => item.id === numericId) ?? null
  }
})
