import type { Media } from '@/payload-types'
import { toPublicSlug } from '@/lib/trustred/slugify'

export const postCategoryLabels: Record<string, string> = {
  ausbildung: 'Ausbildung',
  einsatz: 'Einsatz',
  jugend: 'Jugend',
  oeffentlichkeitsarbeit: 'Öffentlichkeitsarbeit',
}

export const eventTypeLabels: Record<string, string> = {
  ausbildung: 'Ausbildung',
  jugend: 'Jugend',
  oeffentlich: 'Öffentlich',
  organisation: 'Organisation',
  uebung: 'Übung',
}

export function getPostCategoryBadgeClass(category?: string | null) {
  const normalized = String(category ?? '').trim().toLowerCase()

  if (normalized.includes('einsatz')) return 'ff-pill ff-pill--warning'
  if (normalized.includes('jugend')) return 'ff-pill ff-pill--info'
  if (normalized.includes('oeffentlich')) return 'ff-pill ff-pill--brand'
  return 'ff-pill ff-pill--team'
}

export function getEventTypeBadgeClass(type?: string | null) {
  const normalized = String(type ?? '').trim().toLowerCase()

  if (normalized.includes('oeffentlich')) return 'ff-pill ff-pill--brand'
  if (normalized.includes('jugend')) return 'ff-pill ff-pill--info'
  if (normalized.includes('uebung')) return 'ff-pill ff-pill--warning'
  return 'ff-pill ff-pill--team'
}

export function getDateBadgeClass() {
  return 'ff-pill ff-pill--published'
}

export function getStatusBadgeClass(tone: 'brand' | 'info' | 'neutral' | 'published' | 'team' | 'warning') {
  return `ff-pill ff-pill--${tone}`
}

const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const monthYearFormat = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
})

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Kein Datum'
  }

  return dateFormat.format(new Date(value))
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Kein Zeitpunkt'
  }

  return dateTimeFormat.format(new Date(value))
}

export function formatDateTimeRange(start?: string | null, end?: string | null) {
  if (!start) {
    return 'Kein Zeitraum'
  }

  if (!end) {
    return formatDateTime(start)
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return formatDateTime(start)
  }

  const sameDay = startDate.toDateString() === endDate.toDateString()

  if (sameDay) {
    return `${dateFormat.format(startDate)} · ${startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`
}

export function formatMonthYear(value?: string | null) {
  if (!value) {
    return 'Ohne Zeitraum'
  }

  return monthYearFormat.format(new Date(value))
}

export function getPostPath(slug: string) {
  return `/aktuelles/${encodeURIComponent(toPublicSlug(slug))}`
}

export function getEventPath(slug: string) {
  return `/termine/${encodeURIComponent(toPublicSlug(slug))}`
}

export function getCrewPath(id: number | string) {
  return `/team/${encodeURIComponent(String(id))}`
}

export function getEquipmentPath(slug: string) {
  return `/technik/${encodeURIComponent(toPublicSlug(slug))}`
}

export function getFaqPath(id: number | string) {
  const normalized = encodeURIComponent(String(id))
  return `/faq?open=${normalized}#faq-${normalized}`
}

export function getMediaImage(media?: number | Media | null) {
  if (!media || typeof media === 'number') {
    return null
  }

  return {
    alt: media.alt || '',
    height: typeof media.height === 'number' ? media.height : 960,
    src: media.url ?? media.thumbnailURL ?? null,
    width: typeof media.width === 'number' ? media.width : 1440,
  }
}

export function shouldShowImagePlaceholder(item?: unknown | null) {
  if (!item || typeof item !== 'object') {
    return false
  }

  return Boolean(
    'showImagePlaceholder' in item ? (item as { showImagePlaceholder?: boolean | null }).showImagePlaceholder : false,
  )
}
