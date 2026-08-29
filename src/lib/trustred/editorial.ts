import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import type { Payload } from 'payload'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { getPayloadClient } from '@/lib/trustred/cms'
import {
  defaultHomePage,
  defaultManagedPages,
  defaultSiteSettings,
  fallbackFeedData,
} from '@/lib/trustred/defaults'
import { sanitizeHtmlFragment } from '@/lib/trustred/html'
import {
  pageBlockLabels,
  type PageBlockType,
  type PageLayoutBlock,
} from '@/lib/trustred/page-builder'
import { ensureDefaultPublicForms } from '@/lib/trustred/public-forms'
import { getBuiltInWarningPresets } from '@/lib/trustred/warning-presets'
import { toPublicSlug } from '@/lib/trustred/slugify'
import { formatSiteDateTimeInput, parseSiteDateTime } from '@/lib/trustred/time'
import { parseYouTubeVideoId } from '@/lib/trustred/youtube'
import type { Media, Page, SiteSetting, User, WarningPreset } from '@/payload-types'

export const editorialCollections = {
  crew: {
    fields: [
      { label: 'Name', name: 'name', type: 'text' },
      { label: 'Rolle', name: 'role', type: 'text' },
      { label: 'Qualifikation', name: 'qualification', type: 'text' },
      { label: 'Schwerpunkt', name: 'focus', type: 'text' },
      { label: 'Bild-Platzhalter anzeigen', name: 'showImagePlaceholder', type: 'checkbox' },
      { label: 'Skills (eine Zeile pro Skill)', name: 'skills', type: 'lines' },
    ],
    label: 'Crew',
    titleField: 'name',
  },
  equipment: {
    fields: [
      { label: 'Name', name: 'name', type: 'text' },
      { label: 'Slug', name: 'slug', type: 'text' },
      { label: 'Funkrufname', name: 'callSign', type: 'text' },
      { label: 'Zusammenfassung', name: 'summary', type: 'textarea' },
      { label: 'Fakten (JSON)', name: 'facts', type: 'json' },
    ],
    label: 'Technik',
    titleField: 'name',
  },
  events: {
    fields: [
      { label: 'Titel', name: 'title', type: 'text' },
      { label: 'Slug', name: 'slug', type: 'text' },
      {
        label: 'Typ',
        name: 'eventType',
        options: [
          ['ausbildung', 'Ausbildung'],
          ['uebung', 'Übung'],
          ['jugend', 'Jugend'],
          ['organisation', 'Organisation'],
          ['oeffentlich', 'Öffentlich'],
        ],
        type: 'select',
      },
      {
        label: 'Sichtbarkeit',
        name: 'visibility',
        options: [
          ['public', 'Öffentlich'],
          ['internal', 'Intern'],
        ],
        type: 'select',
      },
      { label: 'Beginn', name: 'startsAt', type: 'datetime-local' },
      { label: 'Ende', name: 'endsAt', type: 'datetime-local' },
      { label: 'Ort', name: 'location', type: 'text' },
      { label: 'Zusammenfassung', name: 'summary', type: 'textarea' },
      { label: 'Bild-Platzhalter anzeigen', name: 'showImagePlaceholder', type: 'checkbox' },
      { label: 'Anmeldung aktiv', name: 'registrationEnabled', type: 'checkbox' },
    ],
    label: 'Termine',
    titleField: 'title',
  },
  faqs: {
    fields: [
      { label: 'Frage', name: 'question', type: 'text' },
      { label: 'Antwort', name: 'answer', type: 'textarea' },
      { label: 'Kategorie', name: 'category', type: 'text' },
    ],
    label: 'FAQ',
    titleField: 'question',
  },
  operations: {
    fields: [
      { label: 'Einsatznummer', name: 'operationNumber', type: 'text' },
      { label: 'Alarmcode', name: 'alarmCode', type: 'text' },
      {
        label: 'Kategorie',
        name: 'category',
        options: [
          ['brand', 'Brand'],
          ['hilfe', 'Technische Hilfe'],
          ['wetter', 'Wetter'],
          ['sonstiges', 'Sonstiges'],
        ],
        type: 'select',
      },
      { label: 'Beginn', name: 'startedAt', type: 'datetime-local' },
      { label: 'Ort', name: 'location', type: 'text' },
      { label: 'Zusammenfassung', name: 'summary', type: 'textarea' },
      { label: 'Details', name: 'details', type: 'textarea' },
      { label: 'Bild-Platzhalter anzeigen', name: 'showImagePlaceholder', type: 'checkbox' },
      { label: 'Öffentlich sichtbar', name: 'isPublic', type: 'checkbox' },
    ],
    label: 'Einsätze',
    titleField: 'operationNumber',
  },
  pages: {
    fields: [
      { label: 'Titel', name: 'title', type: 'text' },
      { label: 'Slug', name: 'slug', type: 'text' },
      { label: 'Kurzbeschreibung', name: 'summary', type: 'textarea' },
      { label: 'Navigationslabel', name: 'navigationLabel', type: 'text' },
      { label: 'In Navigation anzeigen', name: 'showInNavigation', type: 'checkbox' },
      { label: 'Navigationsreihenfolge', name: 'navigationOrder', type: 'number' },
      {
        label: 'Status',
        name: '_status',
        options: [
          ['draft', 'Entwurf'],
          ['published', 'Veröffentlicht'],
        ],
        type: 'select',
      },
      { label: 'Layout-Blöcke (JSON)', name: 'layout', type: 'json' },
    ],
    label: 'Seiten',
    titleField: 'title',
  },
  posts: {
    fields: [
      { label: 'Titel', name: 'title', type: 'text' },
      { label: 'Slug', name: 'slug', type: 'text' },
      {
        label: 'Kategorie',
        name: 'category',
        options: [
          ['oeffentlichkeitsarbeit', 'Öffentlichkeitsarbeit'],
          ['einsatz', 'Einsatz'],
          ['ausbildung', 'Ausbildung'],
          ['jugend', 'Jugend'],
        ],
        type: 'select',
      },
      { label: 'Kurztext', name: 'excerpt', type: 'textarea' },
      { label: 'Inhalt', name: 'content', type: 'textarea' },
      { label: 'Veröffentlichung', name: 'publishedAt', type: 'datetime-local' },
      { label: 'Bild-Platzhalter anzeigen', name: 'showImagePlaceholder', type: 'checkbox' },
      {
        label: 'Status',
        name: '_status',
        options: [
          ['draft', 'Entwurf'],
          ['published', 'Veröffentlicht'],
        ],
        type: 'select',
      },
    ],
    label: 'Aktuelles',
    titleField: 'title',
  },
} as const

export type EditorialCollectionSlug = keyof typeof editorialCollections

type EditableWarningPreset = Omit<WarningPreset, 'createdAt' | 'id' | 'updatedAt'>
type MediaCategory = Media['category']
export function isEditorialCollectionSlug(value: string): value is EditorialCollectionSlug {
  return value in editorialCollections
}

export async function getEditorialContext() {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const hasAccess = userHasRole(user as User | null | undefined, trustredRoles.anyEditorial)

  return {
    hasAccess,
    payload,
    requestHeaders,
    user,
  }
}

export function getEditorialPermissions(user: User | null | undefined) {
  return {
    canAccessContent: userHasRole(user, trustredRoles.content),
    canAccessMedia: userHasRole(user, trustredRoles.media),
    canAccessOperations: userHasRole(user, trustredRoles.operations),
    canAccessSettings: userHasRole(user, trustredRoles.settings),
    canAccessWarnings: userHasRole(user, trustredRoles.warnings),
  }
}

export async function requireEditorialContext() {
  const context = await getEditorialContext()
  if (!context.user || !context.hasAccess) {
    redirect('/manage/login')
  }
  return {
    ...context,
    user: context.user as User,
  }
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === 'on'
}

function getLastFormValue(formData: FormData, name: string) {
  const values = formData.getAll(name)
  return values.length > 0 ? values[values.length - 1] : null
}

function toOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

function toDateTime(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return undefined
  return parseSiteDateTime(normalized)
}

function parseJson<T = unknown>(value: FormDataEntryValue | null, fallback: T): T {
  const normalized = String(value ?? '').trim()
  if (!normalized) return fallback
  return JSON.parse(normalized) as T
}

function parseLines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label }))
}

function parseCount(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function parseNumber(value: FormDataEntryValue | null, fallback?: number) {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return fallback
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return parsed
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return parsed
}

function parseMediaRelation(uploadedId: number | undefined, value: FormDataEntryValue | null) {
  return uploadedId ?? parseNullableNumber(value)
}

function parseTextLines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseWarningPresets(formData: FormData): EditableWarningPreset[] {
  const count = parseCount(formData.get('warningPresets.count'))
  const presets: EditableWarningPreset[] = []

  for (let index = 0; index < count; index += 1) {
    if (toBoolean(formData.get(`warningPresets.${index}.remove`))) {
      continue
    }

    const key = String(formData.get(`warningPresets.${index}.key`) ?? '').trim()
    const label = String(formData.get(`warningPresets.${index}.label`) ?? '').trim()
    const provider = String(
      formData.get(`warningPresets.${index}.provider`) ?? 'dwd',
    ).trim() as WarningPreset['provider']
    const regionLabel = String(formData.get(`warningPresets.${index}.regionLabel`) ?? '').trim()
    const sourceUrl = toOptionalString(formData.get(`warningPresets.${index}.sourceUrl`))
    const forecastUrl = toOptionalString(formData.get(`warningPresets.${index}.forecastUrl`))
    const warningMapUrl = toOptionalString(formData.get(`warningPresets.${index}.warningMapUrl`))
    const weatherMapUrl = toOptionalString(formData.get(`warningPresets.${index}.weatherMapUrl`))
    const wildfireMapUrl = toOptionalString(formData.get(`warningPresets.${index}.wildfireMapUrl`))

    if (!key && !label && !regionLabel) {
      continue
    }

    const dwdRegionIds = parseTextLines(formData.get(`warningPresets.${index}.dwdRegionIds`)).map(
      (regionId) => ({ regionId }),
    )
    const dwdStates = parseTextLines(formData.get(`warningPresets.${index}.dwdStates`)).map(
      (state) => ({ state }),
    )
    const ninaArs = toOptionalString(formData.get(`warningPresets.${index}.ninaArs`))

    presets.push({
      dwdRegionIds: provider === 'dwd' ? dwdRegionIds : [],
      dwdStates: provider === 'dwd' ? dwdStates : [],
      forecastUrl: provider === 'dwd' ? forecastUrl : undefined,
      isSystemPreset: false,
      key,
      label,
      ninaArs: provider === 'nina' ? ninaArs : undefined,
      provider,
      regionLabel,
      sourceUrl,
      warningMapUrl: provider === 'dwd' ? warningMapUrl : undefined,
      weatherMapUrl: provider === 'dwd' ? weatherMapUrl : undefined,
      wildfireMapUrl: provider === 'dwd' ? wildfireMapUrl : undefined,
    })
  }

  return presets
}

function parseStatsItems(formData: FormData, prefix: string) {
  const count = parseCount(formData.get(`${prefix}.items.count`))
  const items: NonNullable<Extract<PageLayoutBlock, { blockType: 'stats' }>['items']> = []

  for (let index = 0; index < count; index += 1) {
    const value = String(formData.get(`${prefix}.items.${index}.value`) ?? '').trim()
    const label = String(formData.get(`${prefix}.items.${index}.label`) ?? '').trim()

    if (!value && !label) {
      continue
    }

    items.push({
      label,
      value,
    })
  }

  return items
}

function parseLinkGridLinks(formData: FormData, prefix: string) {
  const count = parseCount(formData.get(`${prefix}.links.count`))
  const links: NonNullable<Extract<PageLayoutBlock, { blockType: 'link-grid' }>['links']> = []

  for (let index = 0; index < count; index += 1) {
    const label = String(formData.get(`${prefix}.links.${index}.label`) ?? '').trim()
    const href = String(formData.get(`${prefix}.links.${index}.href`) ?? '').trim()
    const description = toOptionalString(formData.get(`${prefix}.links.${index}.description`))

    if (!label && !href && !description) {
      continue
    }

    links.push({
      description,
      href,
      label,
    })
  }

  return links
}

function parseEquipmentFacts(formData: FormData) {
  const count = parseCount(formData.get('facts.count'))

  if (count > 0) {
    const facts: Array<{ label: string; value: string }> = []

    for (let index = 0; index < count; index += 1) {
      const label = String(formData.get(`facts.${index}.label`) ?? '').trim()
      const value = String(formData.get(`facts.${index}.value`) ?? '').trim()

      if (!label && !value) {
        continue
      }

      facts.push({ label, value })
    }

    return facts
  }

  return parseJson(formData.get('facts'), [])
}

function parseEquipmentHighlights(formData: FormData) {
  const count = parseCount(formData.get('highlights.count'))

  return Array.from({ length: count }, (_, index) => {
    const title = String(formData.get(`highlights.${index}.title`) ?? '').trim()
    const description = String(formData.get(`highlights.${index}.description`) ?? '').trim()

    if (!title || !description) {
      return null
    }

    return { description, title }
  }).filter(Boolean)
}

async function parseEquipmentCompartments(payload: Payload, user: User, formData: FormData) {
  const count = parseCount(formData.get('compartments.count'))

  const compartments = []

  for (let index = 0; index < count; index += 1) {
    const code = String(formData.get(`compartments.${index}.code`) ?? '').trim()
    const title = String(formData.get(`compartments.${index}.title`) ?? '').trim()
    const description = toOptionalString(formData.get(`compartments.${index}.description`))
    const contents = parseLines(formData.get(`compartments.${index}.contents`))

    if (!code || !title) {
      continue
    }

    const uploadedImageId = await createUploadedMedia(payload, user, formData, {
      altField: `compartments.${index}.imageUploadAlt`,
      captionField: `compartments.${index}.imageUploadCaption`,
      category: 'equipment',
      fileField: `compartments.${index}.imageUpload`,
    })

    compartments.push({
      code,
      contents,
      description,
      image: parseMediaRelation(uploadedImageId, formData.get(`compartments.${index}.image`)),
      showImagePlaceholder: toBoolean(formData.get(`compartments.${index}.showImagePlaceholder`)),
      title,
    })
  }

  return compartments
}

async function createUploadedMedia(
  payload: Payload,
  user: User,
  formData: FormData,
  {
    altField,
    captionField,
    category,
    fileField,
  }: {
    altField: string
    captionField: string
    category: MediaCategory
    fileField: string
  },
) {
  const upload = formData.get(fileField)

  if (!(upload instanceof File) || upload.size === 0) {
    return undefined
  }

  const alt = String(formData.get(altField) ?? '').trim() || upload.name.replace(/\.[^.]+$/, '')
  const caption = toOptionalString(formData.get(captionField))

  const media = await payload.create({
    collection: 'media',
    data: {
      alt,
      caption,
      category,
    },
    file: {
      data: Buffer.from(await upload.arrayBuffer()),
      mimetype: upload.type,
      name: upload.name,
      size: upload.size,
    },
    overrideAccess: false,
    user,
  } as never)

  return media.id as number
}

async function parsePageLayout(
  payload: Payload,
  user: User,
  formData: FormData,
): Promise<Page['layout']> {
  const rawOverride = String(formData.get('layoutRawOverride') ?? '').trim()

  if (rawOverride) {
    return parseJson<Page['layout']>(rawOverride, [])
  }

  const count = parseCount(formData.get('layout.count'))
  const blocks: Array<{ block: PageLayoutBlock; position: number }> = []

  for (let index = 0; index < count; index += 1) {
    const prefix = `layout.${index}`

    if (toBoolean(formData.get(`${prefix}.remove`))) {
      continue
    }

    const blockType = String(formData.get(`${prefix}.blockType`) ?? '').trim() as PageBlockType
    const id = toOptionalString(formData.get(`${prefix}.id`))
    const blockName = toOptionalString(formData.get(`${prefix}.blockName`))
    const position = parseNumber(formData.get(`${prefix}.position`), index + 1) ?? index + 1

    if (!(blockType in pageBlockLabels)) {
      continue
    }

    if (blockType === 'hero') {
      const uploadedHeroImageId = await createUploadedMedia(payload, user, formData, {
        altField: `${prefix}.heroImageUploadAlt`,
        captionField: `${prefix}.heroImageUploadCaption`,
        category: 'general',
        fileField: `${prefix}.heroImageUpload`,
      })
      const heroImageId = parseMediaRelation(
        uploadedHeroImageId,
        formData.get(`${prefix}.heroImage`),
      )

      blocks.push({
        block: {
          blockName,
          blockType,
          copy: String(formData.get(`${prefix}.copy`) ?? '').trim(),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          heroImage: heroImageId,
          id,
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          primaryActionHref: String(formData.get(`${prefix}.primaryActionHref`) ?? '').trim(),
          primaryActionLabel: String(formData.get(`${prefix}.primaryActionLabel`) ?? '').trim(),
          secondaryActionHref: toOptionalString(formData.get(`${prefix}.secondaryActionHref`)),
          secondaryActionLabel: toOptionalString(formData.get(`${prefix}.secondaryActionLabel`)),
        },
        position,
      })
      continue
    }

    if (blockType === 'stats') {
      blocks.push({
        block: {
          blockName,
          blockType,
          id,
          items: parseStatsItems(formData, prefix),
        },
        position,
      })
      continue
    }

    if (blockType === 'rich-text') {
      blocks.push({
        block: {
          blockName,
          blockType,
          copy: String(formData.get(`${prefix}.copy`) ?? '').trim(),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
        },
        position,
      })
      continue
    }

    if (blockType === 'link-grid') {
      blocks.push({
        block: {
          blockName,
          blockType,
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          links: parseLinkGridLinks(formData, prefix),
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
        },
        position,
      })
      continue
    }

    if (blockType === 'feed') {
      blocks.push({
        block: {
          blockName,
          blockType,
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          limit: parseNumber(formData.get(`${prefix}.limit`), 3) ?? 3,
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          source: String(formData.get(`${prefix}.source`) ?? 'posts').trim() as Extract<
            PageLayoutBlock,
            { blockType: 'feed' }
          >['source'],
        },
        position,
      })
      continue
    }

    if (blockType === 'warnings') {
      blocks.push({
        block: {
          blockName,
          blockType,
          dwdRegionIds: parseTextLines(formData.get(`${prefix}.dwdRegionIds`)).map((regionId) => ({
            regionId,
          })),
          dwdStates: parseTextLines(formData.get(`${prefix}.dwdStates`)).map((state) => ({
            state,
          })),
          forecastUrl: toOptionalString(formData.get(`${prefix}.forecastUrl`)),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          ninaArs: toOptionalString(formData.get(`${prefix}.ninaArs`)),
          ninaPresetKey: String(formData.get(`${prefix}.ninaPresetKey`) ?? '').trim(),
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          presetKey: String(formData.get(`${prefix}.presetKey`) ?? '').trim(),
          provider: String(formData.get(`${prefix}.provider`) ?? 'dwd').trim() as Extract<
            PageLayoutBlock,
            { blockType: 'warnings' }
          >['provider'],
          regionLabel: toOptionalString(formData.get(`${prefix}.regionLabel`)),
          showWeatherMap: String(formData.get(`${prefix}.showWeatherMap`) ?? 'false') === 'true',
          showWildfireMap: String(formData.get(`${prefix}.showWildfireMap`) ?? 'false') === 'true',
          sourceUrl: toOptionalString(formData.get(`${prefix}.sourceUrl`)),
          warningMapUrl: toOptionalString(formData.get(`${prefix}.warningMapUrl`)),
          weatherMapUrl: toOptionalString(formData.get(`${prefix}.weatherMapUrl`)),
          wildfireMapUrl: toOptionalString(formData.get(`${prefix}.wildfireMapUrl`)),
        },
        position,
      })
      continue
    }

    if (blockType === 'banner') {
      blocks.push({
        block: {
          blockName,
          blockType,
          id,
          label: toOptionalString(formData.get(`${prefix}.label`)),
          primaryHref: String(formData.get(`${prefix}.primaryHref`) ?? '').trim(),
          primaryLabel: String(formData.get(`${prefix}.primaryLabel`) ?? '').trim(),
          secondaryHref: toOptionalString(formData.get(`${prefix}.secondaryHref`)),
          secondaryLabel: toOptionalString(formData.get(`${prefix}.secondaryLabel`)),
          text: String(formData.get(`${prefix}.text`) ?? '').trim(),
          title: String(formData.get(`${prefix}.title`) ?? '').trim(),
        },
        position,
      })
      continue
    }

    if (blockType === 'form') {
      blocks.push({
        block: {
          blockName,
          blockType,
          form: parseNumber(formData.get(`${prefix}.form`)) ?? undefined,
          formMode: String(formData.get(`${prefix}.formMode`) ?? 'preset').trim() as Extract<
            PageLayoutBlock,
            { blockType: 'form' }
          >['formMode'],
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          presetKey: String(formData.get(`${prefix}.presetKey`) ?? 'contact').trim() as Extract<
            PageLayoutBlock,
            { blockType: 'form' }
          >['presetKey'],
          successMessage: toOptionalString(formData.get(`${prefix}.successMessage`)),
        },
        position,
      })
      continue
    }

    if (blockType === 'tech-details') {
      blocks.push({
        block: {
          blockName,
          blockType,
          equipment: parseNumber(formData.get(`${prefix}.equipment`)),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          showCompartments: String(formData.get(`${prefix}.showCompartments`) ?? 'true') === 'true',
          showHighlights: String(formData.get(`${prefix}.showHighlights`) ?? 'true') === 'true',
        },
        position,
      })
      continue
    }

    if (blockType === 'tech-overview') {
      blocks.push({
        block: {
          blockName,
          blockType,
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          featuredEquipment: parseNumber(formData.get(`${prefix}.featuredEquipment`)),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          maxItems: parseNumber(formData.get(`${prefix}.maxItems`), 12) ?? 12,
          showFeaturedProfile:
            String(formData.get(`${prefix}.showFeaturedProfile`) ?? 'true') === 'true',
          showStats: String(formData.get(`${prefix}.showStats`) ?? 'true') === 'true',
        },
        position,
      })
      continue
    }

    if (blockType === 'operations-log') {
      blocks.push({
        block: {
          blockName,
          blockType,
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          maxItems: parseNumber(formData.get(`${prefix}.maxItems`), 100) ?? 100,
          showFilters: String(formData.get(`${prefix}.showFilters`) ?? 'true') === 'true',
          showStats: String(formData.get(`${prefix}.showStats`) ?? 'true') === 'true',
        },
        position,
      })
      continue
    }

    if (blockType === 'youtube') {
      const videoValue = String(formData.get(`${prefix}.videoId`) ?? '').trim()
      blocks.push({
        block: {
          blockName,
          blockType,
          eyebrow: toOptionalString(formData.get(`${prefix}.eyebrow`)),
          headline: String(formData.get(`${prefix}.headline`) ?? '').trim(),
          id,
          intro: toOptionalString(formData.get(`${prefix}.intro`)),
          videoId: parseYouTubeVideoId(videoValue) || videoValue,
        },
        position,
      })
      continue
    }

    blocks.push({
      block: {
        blockName,
        blockType,
        html: sanitizeHtmlFragment(String(formData.get(`${prefix}.html`) ?? '').trim()),
        id,
        label: String(formData.get(`${prefix}.label`) ?? '').trim(),
      },
      position,
    })
  }

  return blocks.sort((left, right) => left.position - right.position).map(({ block }) => block)
}

async function parseCollectionData(
  payload: Payload,
  user: User,
  collection: EditorialCollectionSlug,
  formData: FormData,
) {
  const normalizedSlug = (value: FormDataEntryValue | null) =>
    toPublicSlug(String(value ?? '').trim())

  switch (collection) {
    case 'pages':
      return {
        _status: String(formData.get('_status') ?? 'draft'),
        layout: await parsePageLayout(payload, user, formData),
        navigationLabel: String(formData.get('navigationLabel') ?? '').trim(),
        navigationOrder: parseNumber(formData.get('navigationOrder'), 100) ?? 100,
        showInNavigation: toBoolean(formData.get('showInNavigation')),
        slug: normalizedSlug(formData.get('slug')),
        summary: String(formData.get('summary') ?? '').trim(),
        title: String(formData.get('title') ?? '').trim(),
      }
    case 'posts': {
      const uploadedFeaturedImageId = await createUploadedMedia(payload, user, formData, {
        altField: 'featuredImageUploadAlt',
        captionField: 'featuredImageUploadCaption',
        category: 'news',
        fileField: 'featuredImageUpload',
      })
      return {
        _status: String(formData.get('_status') ?? 'draft'),
        category: String(formData.get('category') ?? '').trim(),
        content: String(formData.get('content') ?? '').trim(),
        excerpt: String(formData.get('excerpt') ?? '').trim(),
        featuredImage: parseMediaRelation(uploadedFeaturedImageId, formData.get('featuredImage')),
        publishedAt: toDateTime(formData.get('publishedAt')),
        showImagePlaceholder: toBoolean(formData.get('showImagePlaceholder')),
        slug: normalizedSlug(formData.get('slug')),
        title: String(formData.get('title') ?? '').trim(),
      }
    }
    case 'events': {
      const uploadedFeaturedImageId = await createUploadedMedia(payload, user, formData, {
        altField: 'featuredImageUploadAlt',
        captionField: 'featuredImageUploadCaption',
        category: 'events',
        fileField: 'featuredImageUpload',
      })
      return {
        eventType: String(formData.get('eventType') ?? '').trim(),
        featuredImage: parseMediaRelation(uploadedFeaturedImageId, formData.get('featuredImage')),
        location: String(formData.get('location') ?? '').trim(),
        registrationEnabled: toBoolean(formData.get('registrationEnabled')),
        endsAt: toDateTime(formData.get('endsAt')),
        showImagePlaceholder: toBoolean(formData.get('showImagePlaceholder')),
        slug: normalizedSlug(formData.get('slug')),
        startsAt: toDateTime(formData.get('startsAt')),
        summary: String(formData.get('summary') ?? '').trim(),
        title: String(formData.get('title') ?? '').trim(),
        visibility: String(formData.get('visibility') ?? 'public').trim(),
      }
    }
    case 'operations': {
      const uploadedFeaturedImageId = await createUploadedMedia(payload, user, formData, {
        altField: 'featuredImageUploadAlt',
        captionField: 'featuredImageUploadCaption',
        category: 'operations',
        fileField: 'featuredImageUpload',
      })
      return {
        alarmCode: String(formData.get('alarmCode') ?? '').trim(),
        category: String(formData.get('category') ?? '').trim(),
        details: String(formData.get('details') ?? '').trim(),
        featuredImage: parseMediaRelation(uploadedFeaturedImageId, formData.get('featuredImage')),
        isPublic: toBoolean(formData.get('isPublic')),
        location: String(formData.get('location') ?? '').trim(),
        operationNumber: String(formData.get('operationNumber') ?? '').trim(),
        showImagePlaceholder: toBoolean(formData.get('showImagePlaceholder')),
        startedAt: toDateTime(formData.get('startedAt')),
        summary: String(formData.get('summary') ?? '').trim(),
      }
    }
    case 'crew': {
      const uploadedPortraitId = await createUploadedMedia(payload, user, formData, {
        altField: 'portraitUploadAlt',
        captionField: 'portraitUploadCaption',
        category: 'team',
        fileField: 'portraitUpload',
      })
      return {
        focus: String(formData.get('focus') ?? '').trim(),
        name: String(formData.get('name') ?? '').trim(),
        portrait: parseMediaRelation(uploadedPortraitId, formData.get('portrait')),
        qualification: String(formData.get('qualification') ?? '').trim(),
        role: String(formData.get('role') ?? '').trim(),
        showImagePlaceholder: toBoolean(formData.get('showImagePlaceholder')),
        skills: parseLines(formData.get('skills')),
      }
    }
    case 'equipment': {
      const uploadedHeroImageId = await createUploadedMedia(payload, user, formData, {
        altField: 'heroImageUploadAlt',
        captionField: 'heroImageUploadCaption',
        category: 'equipment',
        fileField: 'heroImageUpload',
      })
      return {
        callSign: String(formData.get('callSign') ?? '').trim(),
        compartments: await parseEquipmentCompartments(payload, user, formData),
        facts: parseEquipmentFacts(formData),
        heroImage: parseMediaRelation(uploadedHeroImageId, formData.get('heroImage')),
        highlights: parseEquipmentHighlights(formData),
        name: String(formData.get('name') ?? '').trim(),
        slug: normalizedSlug(formData.get('slug')),
        summary: String(formData.get('summary') ?? '').trim(),
      }
    }
    case 'faqs':
      return {
        answer: String(formData.get('answer') ?? '').trim(),
        category: String(formData.get('category') ?? '').trim(),
        question: String(formData.get('question') ?? '').trim(),
      }
  }
}

export function toFormValue(fieldType: string, value: unknown) {
  if (fieldType === 'checkbox') {
    return Boolean(value)
  }

  if (fieldType === 'datetime-local') {
    if (!value) return ''
    return formatSiteDateTimeInput(String(value))
  }

  if (fieldType === 'json') {
    return JSON.stringify(value ?? [], null, 2)
  }

  if (fieldType === 'lines') {
    if (!Array.isArray(value)) return ''
    return value
      .map((item) =>
        typeof item === 'object' && item && 'label' in item ? String(item.label) : String(item),
      )
      .join('\n')
  }

  return String(value ?? '')
}

export async function loadCollectionDocs(
  payload: Payload,
  user: User,
  collection: EditorialCollectionSlug,
) {
  const result = await payload.find({
    collection,
    limit: 100,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })

  return result.docs as unknown as Array<Record<string, unknown>>
}

export async function loadCollectionDocById(
  payload: Payload,
  user: User,
  collection: EditorialCollectionSlug,
  id: number,
) {
  return (await payload.findByID({
    collection,
    id,
    overrideAccess: false,
    user,
  })) as unknown as Record<string, unknown>
}

export async function saveCollectionDoc(
  payload: Payload,
  user: User,
  collection: EditorialCollectionSlug,
  id: string | null,
  formData: FormData,
) {
  const data = await parseCollectionData(payload, user, collection, formData)

  if (id && id !== 'new') {
    return payload.update({
      collection,
      data,
      id: Number(id),
      overrideAccess: false,
      user,
    } as never)
  }

  return payload.create({
    collection,
    data,
    overrideAccess: false,
    user,
  } as never)
}

export async function deleteCollectionDoc(
  payload: Payload,
  user: User,
  collection: EditorialCollectionSlug,
  id: number,
) {
  return payload.delete({
    collection,
    id,
    overrideAccess: false,
    user,
  })
}

const demoMediaAlts = [
  'Geöffnetes Gerätefach des TSF-W der Freiwilligen Feuerwehr Musterstadt',
  'Feuerwehrfahrzeug vor dem Feuerwehrhaus Musterstadt',
  'Tag der offenen Tür am Feuerwehrhaus Musterstadt',
  'Unwettereinsatz der Freiwilligen Feuerwehr Musterstadt',
  'Übungsabend der Freiwilligen Feuerwehr Musterstadt',
]

const cleanSiteSettings = {
  ...defaultSiteSettings,
  announcement: {
    enabled: false,
    label: '',
    message: '',
  },
  contact: {
    address: '',
    email: '',
    emergencyNumber: '112',
  },
  departmentName: 'Ihre Organisation',
  legal: {
    imprintText: '',
    organizationName: '',
    responsiblePerson: '',
  },
  siteName: 'Ihre Organisation',
  taglinePrimary: 'Schnell startklar.',
  taglineSecondary: 'Inhalte, Navigation und Formulare direkt anpassen.',
}

const cleanBasePages = [
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Startseite fuer aktuelle Hinweise, Termine, Kontaktwege und redaktionell gepflegte Inhalte.',
        eyebrow: 'Willkommen',
        headline: 'Startseite einrichten',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/mitmachen',
        secondaryActionLabel: 'Mitmachen',
      },
      {
        blockType: 'feed',
        eyebrow: 'Aktuelles',
        headline: 'Neuigkeiten',
        intro: 'Dieser Bereich zeigt veroeffentlichte Beitraege, sobald Inhalte angelegt sind.',
        limit: 3,
        source: 'posts',
      },
    ],
    navigationLabel: 'Start',
    navigationOrder: 1,
    showInNavigation: true,
    slug: 'home',
    summary: 'Startseite mit Basisstruktur.',
    title: 'Start',
  },
  ...[
    ['aktuelles', 'Aktuelles', 2, 'posts'],
    ['termine', 'Termine', 3, 'events'],
    ['einsaetze', 'Einsatzhistorie', 4, 'operations'],
    ['technik', 'Technik', 5, 'equipment'],
    ['sicherheit', 'Sicherheit', 6, 'faqs'],
    ['kontakt', 'Kontakt', 7, null],
    ['mitmachen', 'Mitmachen', 8, null],
    ['faq', 'FAQ', 20, 'faqs'],
    ['team', 'Team', 21, 'crew'],
  ].map(([slug, title, navigationOrder, source]) => ({
    layout: [
      {
        blockType: 'hero',
        copy: `${title} redaktionell einrichten.`,
        eyebrow: String(title),
        headline: String(title),
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Startseite',
      },
      ...(source
        ? [
            {
              blockType: 'feed',
              eyebrow: String(title),
              headline: String(title),
              intro: 'Inhalte erscheinen hier automatisch, sobald sie angelegt sind.',
              limit: 6,
              source,
            },
          ]
        : []),
    ],
    navigationLabel: String(title),
    navigationOrder: Number(navigationOrder),
    showInNavigation: true,
    slug: String(slug),
    summary: `${title} Basisstruktur.`,
    title: String(title),
  })),
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Archivseite fuer vergangene Termine.',
        eyebrow: 'Archiv',
        headline: 'Terminarchiv',
        primaryActionHref: '/termine',
        primaryActionLabel: 'Aktuelle Termine',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Startseite',
      },
    ],
    navigationLabel: 'Terminarchiv',
    navigationOrder: 30,
    showInNavigation: false,
    slug: 'termine-archiv',
    summary: 'Archivierte Termine.',
    title: 'Terminarchiv',
  },
] as Array<Record<string, unknown> & { slug: string }>

async function deleteDocsByValues({
  collection,
  field,
  payload,
  values,
}: {
  collection: string
  field: string
  payload: Payload
  values: Array<number | string>
}) {
  if (values.length === 0) {
    return 0
  }

  const result = await payload.find({
    collection: collection as never,
    limit: 500,
    overrideAccess: true,
    where: {
      [field]: {
        in: values,
      },
    },
  })

  for (const doc of result.docs as Array<{ id: number | string }>) {
    await payload.delete({
      collection: collection as never,
      id: doc.id,
      overrideAccess: true,
    })
  }

  return result.docs.length
}

async function restoreBuiltInWarningPresets(payload: Payload) {
  for (const preset of getBuiltInWarningPresets()) {
    const existing = await payload.find({
      collection: 'warning-presets',
      limit: 1,
      overrideAccess: true,
      where: {
        key: {
          equals: preset.key,
        },
      },
    })

    if (existing.docs.length > 0) {
      continue
    }

    await payload.create({
      collection: 'warning-presets',
      data: {
        ...preset,
        isSystemPreset: true,
      },
      overrideAccess: true,
    })
  }
}

async function ensureCleanBasePages(payload: Payload) {
  for (const page of cleanBasePages) {
    const existing = await payload.find({
      collection: 'pages',
      limit: 1,
      overrideAccess: true,
      where: {
        slug: {
          equals: page.slug,
        },
      },
    })

    if (existing.docs.length > 0) {
      continue
    }

    await payload.create({
      collection: 'pages',
      data: {
        ...page,
        _status: 'published',
      } as never,
      overrideAccess: true,
    })
  }
}

export async function clearDemoData(payload: Payload, user: User) {
  if (!userHasRole(user, trustredRoles.settings)) {
    throw new Error('Keine Berechtigung zum Löschen von Demo-Daten.')
  }

  const deleted: Record<string, number> = {
    crew: await deleteDocsByValues({
      collection: 'crew',
      field: 'name',
      payload,
      values: fallbackFeedData.crew.map((item) => item.name),
    }),
    equipment: await deleteDocsByValues({
      collection: 'equipment',
      field: 'slug',
      payload,
      values: fallbackFeedData.equipment.map((item) => item.slug),
    }),
    events: await deleteDocsByValues({
      collection: 'events',
      field: 'title',
      payload,
      values: fallbackFeedData.events.map((item) => item.title),
    }),
    faqs: await deleteDocsByValues({
      collection: 'faqs',
      field: 'question',
      payload,
      values: fallbackFeedData.faqs.map((item) => item.question),
    }),
    operations: await deleteDocsByValues({
      collection: 'operations',
      field: 'operationNumber',
      payload,
      values: fallbackFeedData.operations.map((item) => item.operationNumber),
    }),
    posts: await deleteDocsByValues({
      collection: 'posts',
      field: 'title',
      payload,
      values: fallbackFeedData.posts.map((item) => item.title),
    }),
  }

  deleted.pages = await deleteDocsByValues({
    collection: 'pages',
    field: 'slug',
    payload,
    values: [defaultHomePage.slug, ...defaultManagedPages.map((page) => page.slug)],
  })
  deleted.media = await deleteDocsByValues({
    collection: 'media',
    field: 'alt',
    payload,
    values: demoMediaAlts,
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    data: cleanSiteSettings,
    overrideAccess: true,
  })
  await restoreBuiltInWarningPresets(payload)
  await ensureDefaultPublicForms(payload)
  await ensureCleanBasePages(payload)

  return deleted
}

export async function saveSiteSettings(payload: Payload, user: User, formData: FormData) {
  const currentSettings = (await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: false,
    user,
  })) as SiteSetting

  const smtpPassword =
    String(getLastFormValue(formData, 'smtp.password') ?? '').trim() ||
    String(currentSettings.smtp?.password ?? '').trim()
  const smtpPortValue = Number.parseInt(
    String(getLastFormValue(formData, 'smtp.port') ?? '').trim(),
    10,
  )

  return payload.updateGlobal({
    slug: 'site-settings',
    data: {
      announcement: {
        enabled: toBoolean(getLastFormValue(formData, 'announcement.enabled')),
        label: String(getLastFormValue(formData, 'announcement.label') ?? '').trim(),
        message: String(getLastFormValue(formData, 'announcement.message') ?? '').trim(),
      },
      contact: {
        address: String(getLastFormValue(formData, 'contact.address') ?? '').trim(),
        email: String(getLastFormValue(formData, 'contact.email') ?? '').trim(),
        emergencyNumber: String(getLastFormValue(formData, 'contact.emergencyNumber') ?? '').trim(),
      },
      departmentName: String(getLastFormValue(formData, 'departmentName') ?? '').trim(),
      joinButton: {
        href: String(getLastFormValue(formData, 'joinButton.href') ?? '').trim(),
        label: String(getLastFormValue(formData, 'joinButton.label') ?? '').trim(),
      },
      legal: {
        imprintText: String(getLastFormValue(formData, 'legal.imprintText') ?? '').trim(),
        organizationName: String(getLastFormValue(formData, 'legal.organizationName') ?? '').trim(),
        responsiblePerson: String(
          getLastFormValue(formData, 'legal.responsiblePerson') ?? '',
        ).trim(),
      },
      siteName: String(getLastFormValue(formData, 'siteName') ?? '').trim(),
      smtp: {
        enabled: toBoolean(getLastFormValue(formData, 'smtp.enabled')),
        fromEmail: String(getLastFormValue(formData, 'smtp.fromEmail') ?? '').trim(),
        fromName: String(getLastFormValue(formData, 'smtp.fromName') ?? '').trim(),
        host: String(getLastFormValue(formData, 'smtp.host') ?? '').trim(),
        ignoreTLS: toBoolean(getLastFormValue(formData, 'smtp.ignoreTLS')),
        password: smtpPassword,
        port: Number.isFinite(smtpPortValue) ? smtpPortValue : 587,
        requireTLS: toBoolean(getLastFormValue(formData, 'smtp.requireTLS')),
        secure: toBoolean(getLastFormValue(formData, 'smtp.secure')),
        skipVerify: toBoolean(getLastFormValue(formData, 'smtp.skipVerify')),
        username: String(getLastFormValue(formData, 'smtp.username') ?? '').trim(),
      },
      taglinePrimary: String(getLastFormValue(formData, 'taglinePrimary') ?? '').trim(),
      taglineSecondary: String(getLastFormValue(formData, 'taglineSecondary') ?? '').trim(),
      theme: {
        brandColor: String(getLastFormValue(formData, 'theme.brandColor') ?? '').trim(),
        brandColorStrong: String(getLastFormValue(formData, 'theme.brandColorStrong') ?? '').trim(),
        surfaceColor: String(getLastFormValue(formData, 'theme.surfaceColor') ?? '').trim(),
      },
    },
    overrideAccess: false,
    user,
  })
}

export async function sendSmtpTestEmail(
  payload: Payload,
  user: User,
  recipient: string,
): Promise<{ message: string; skipped?: boolean }> {
  const normalizedRecipient = recipient.trim() || user.email

  if (!normalizedRecipient) {
    throw new Error('Bitte eine Test-E-Mail-Adresse angeben.')
  }

  const result = await payload.sendEmail({
    html: `<p>Dies ist eine Testnachricht aus Trustred CMS.</p><p>Ausgeloest von ${String(user.displayName || user.email)}.</p>`,
    subject: 'Trustred SMTP Test',
    to: normalizedRecipient,
  })

  if (result && typeof result === 'object' && 'skipped' in result && result.skipped === true) {
    return {
      message:
        'SMTP ist noch nicht vollständig konfiguriert oder deaktiviert. Es wurde keine Testmail versendet.',
      skipped: true,
    }
  }

  return {
    message: `Test-E-Mail wurde an ${normalizedRecipient} übergeben.`,
  }
}

export async function saveWarningSettings(payload: Payload, user: User, formData: FormData) {
  const presets = parseWarningPresets(formData)
  const existing = await payload.find({
    collection: 'warning-presets',
    limit: 200,
    overrideAccess: false,
    user,
  })

  const customExisting = existing.docs.filter((doc) => doc.isSystemPreset !== true)

  for (const preset of customExisting) {
    await payload.delete({
      collection: 'warning-presets',
      id: preset.id,
      overrideAccess: false,
      user,
    })
  }

  for (const preset of presets) {
    await payload.create({
      collection: 'warning-presets',
      data: {
        ...preset,
        isSystemPreset: false,
      },
      overrideAccess: false,
      user,
    })
  }
}
