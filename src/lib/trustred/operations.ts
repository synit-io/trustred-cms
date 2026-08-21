import type { Operation } from '@/payload-types'
import { toPublicSlug } from '@/lib/trustred/slugify'

export type OperationCategory = Operation['category']

export type OperationMeta = {
  key: OperationCategory
  label: string
  rowClass: string
  chipClass: string
}

type OperationPathInput = Pick<Operation, 'id'> &
  Partial<Pick<Operation, 'category' | 'location' | 'startedAt'>>

function getOperationDateSlug(startedAt?: string | null) {
  if (!startedAt) return 'undatiert'

  const directDate = startedAt.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (directDate) return directDate

  const parsedDate = new Date(startedAt)
  if (Number.isNaN(parsedDate.getTime())) return 'undatiert'

  return parsedDate.toISOString().slice(0, 10)
}

function getOperationLocationSlug(location?: string | null) {
  const normalized = toPublicSlug(String(location ?? ''))
  return normalized || 'einsatzort'
}

export function getOperationSeoSegment(operation: OperationPathInput) {
  const operationId = String(operation.id)
  const dateSlug = getOperationDateSlug(operation.startedAt)
  const locationSlug = getOperationLocationSlug(operation.location)

  return `einsatzbericht-${dateSlug}-${locationSlug}-${operationId}`
}

export function parseOperationIdParam(value: string) {
  const normalized = decodeURIComponent(String(value ?? '')).trim()

  if (/^\d+$/.test(normalized)) {
    return normalized
  }

  const slugMatch = normalized.match(/-(\d+)$/)
  return slugMatch?.[1] ?? null
}

export function getOperationDetailPath(operation: OperationPathInput) {
  return `/einsaetze/${encodeURIComponent(getOperationSeoSegment(operation))}`
}

export function getOperationMeta(category: string): OperationMeta {
  const normalized = category.trim().toLowerCase()

  if (normalized.includes('brand') || normalized.includes('feuer')) {
    return {
      chipClass: 'ff-op-chip ff-op-chip--brand',
      key: 'brand',
      label: 'Brand',
      rowClass: 'bg-rose-50/35',
    }
  }

  if (normalized.includes('hilfe') || normalized.includes('thl') || normalized.includes('unfall')) {
    return {
      chipClass: 'ff-op-chip ff-op-chip--hilfe',
      key: 'hilfe',
      label: 'Technische Hilfe',
      rowClass: 'bg-blue-50/35',
    }
  }

  if (normalized.includes('wetter') || normalized.includes('sturm') || normalized.includes('unwetter')) {
    return {
      chipClass: 'ff-op-chip ff-op-chip--wetter',
      key: 'wetter',
      label: 'Wetterlage',
      rowClass: 'bg-amber-50/40',
    }
  }

  return {
    chipClass: 'ff-op-chip ff-op-chip--sonstiges',
    key: 'sonstiges',
    label: 'Sonstiges',
    rowClass: 'bg-zinc-50/35',
  }
}
