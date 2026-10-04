import type { Metadata } from 'next'

import type { Media } from '@/payload-types'

/** Use Payload's editable SEO fields for public pages and content details. */
export function createPublicMetadata(
  doc: {
    title?: string
    name?: string
    summary?: string | null
    excerpt?: string | null
    meta?: {
      title?: string | null
      description?: string | null
      image?: number | Media | null
    } | null
  } | null,
  siteName: string,
): Metadata {
  const title = doc?.meta?.title || doc?.title || doc?.name || siteName
  const description = doc?.meta?.description || doc?.summary || doc?.excerpt || undefined
  const image = doc?.meta?.image
  const images =
    image && typeof image === 'object' && image.url?.startsWith('https://')
      ? [image.url]
      : undefined
  return {
    title: title === siteName ? siteName : `${title} | ${siteName}`,
    ...(description ? { description } : {}),
    openGraph: { title, description, images },
  }
}
