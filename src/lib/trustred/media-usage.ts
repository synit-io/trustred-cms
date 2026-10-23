import type { Payload, PayloadRequest } from 'payload'

import type { Crew, Equipment, Event, Operation, Page, Post } from '@/payload-types'

export type MediaUsage = { href: string; label: string; source: string }

function referencesMedia(value: unknown, mediaId: number) {
  if (typeof value === 'number') return value === mediaId
  return Boolean(value && typeof value === 'object' && 'id' in value && Number(value.id) === mediaId)
}

async function findAll<T>(
  payload: Payload,
  collection: 'pages' | 'posts' | 'events' | 'operations' | 'crew' | 'equipment',
  req?: PayloadRequest,
  draft = false,
) {
  const docs: T[] = []
  let page = 1
  while (true) {
    const result = await payload.find({
      collection,
      depth: 0,
      draft,
      limit: 100,
      overrideAccess: true,
      page,
      req,
    })
    docs.push(...(result.docs as T[]))
    if (!result.hasNextPage) return docs
    page += 1
  }
}

export async function getMediaUsage(payload: Payload, mediaId: number, req?: PayloadRequest) {
  const [settings, publishedPages, draftPages, publishedPosts, draftPosts, events, operations, crew, equipment] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true, req }),
    findAll<Page>(payload, 'pages', req),
    findAll<Page>(payload, 'pages', req, true),
    findAll<Post>(payload, 'posts', req),
    findAll<Post>(payload, 'posts', req, true),
    findAll<Event>(payload, 'events', req),
    findAll<Operation>(payload, 'operations', req),
    findAll<Crew>(payload, 'crew', req),
    findAll<Equipment>(payload, 'equipment', req),
  ])
  const usage: MediaUsage[] = []
  if (referencesMedia(settings.theme?.logo, mediaId) || referencesMedia(settings.meta?.image, mediaId)) {
    usage.push({ href: '/manage/settings', label: settings.siteName, source: 'Einstellungen' })
  }
  for (const page of [...publishedPages, ...draftPages]) {
    if (
      referencesMedia(page.meta?.image, mediaId) ||
      (page.layout ?? []).some((block) => block.blockType === 'hero' && referencesMedia(block.heroImage, mediaId))
    ) {
      usage.push({ href: `/manage/content/pages/${page.id}`, label: page.title, source: 'Seite' })
    }
  }
  for (const post of [...publishedPosts, ...draftPosts]) {
    if (referencesMedia(post.featuredImage, mediaId) || referencesMedia(post.meta?.image, mediaId)) {
      usage.push({ href: `/manage/content/posts/${post.id}`, label: post.title, source: 'Aktuelles' })
    }
  }
  for (const event of events) {
    if (referencesMedia(event.featuredImage, mediaId) || referencesMedia(event.meta?.image, mediaId)) {
      usage.push({ href: `/manage/content/events/${event.id}`, label: event.title, source: 'Termin' })
    }
  }
  for (const operation of operations) {
    if (referencesMedia(operation.featuredImage, mediaId)) {
      usage.push({ href: `/manage/content/operations/${operation.id}`, label: operation.operationNumber, source: 'Einsatz' })
    }
  }
  for (const member of crew) {
    if (referencesMedia(member.portrait, mediaId)) {
      usage.push({ href: `/manage/content/crew/${member.id}`, label: member.name, source: 'Crew' })
    }
  }
  for (const item of equipment) {
    if (
      referencesMedia(item.heroImage, mediaId) ||
      referencesMedia(item.meta?.image, mediaId) ||
      (item.compartments ?? []).some((compartment) => referencesMedia(compartment.image, mediaId))
    ) {
      usage.push({ href: `/manage/content/equipment/${item.id}`, label: item.name, source: 'Technik' })
    }
  }
  return usage.filter((item, index) => usage.findIndex((other) => other.href === item.href) === index)
}
