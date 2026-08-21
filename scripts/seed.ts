import 'dotenv/config'

import { access, copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import {
  defaultHomePage,
  defaultManagedPages,
  defaultSiteSettings,
  fallbackFeedData,
} from '../src/lib/trustred/defaults'
import { getBuiltInWarningPresets } from '../src/lib/trustred/warning-presets'
import { ensureDefaultPublicForms } from '../src/lib/trustred/public-forms'

const args = new Set(process.argv.slice(2))
const emptyMode = args.has('--empty')
const dirname = path.dirname(fileURLToPath(import.meta.url))
const demoImageDir = path.resolve(dirname, '..', 'public', 'demo-seed-images')
const localMediaDir = path.resolve(dirname, '..', 'media')

if (!emptyMode) {
  process.env.TRUSTRED_ALLOW_DEMO_CONTENT = 'true'
}

const starterLookupField = {
  crew: 'name',
  equipment: 'slug',
  events: 'title',
  faqs: 'question',
  operations: 'operationNumber',
  posts: 'title',
} as const

const demoMediaDefinitions = {
  equipment: {
    alt: 'Geöffnetes Gerätefach des TSF-W der Freiwilligen Feuerwehr Musterstadt',
    category: 'equipment',
    fileName: 'equipment-compartment.jpg',
  },
  hero: {
    alt: 'Feuerwehrfahrzeug vor dem Feuerwehrhaus Musterstadt',
    category: 'general',
    fileName: 'fire-station-hero.jpg',
  },
  openDay: {
    alt: 'Tag der offenen Tür am Feuerwehrhaus Musterstadt',
    category: 'events',
    fileName: 'open-day.jpg',
  },
  storm: {
    alt: 'Unwettereinsatz der Freiwilligen Feuerwehr Musterstadt',
    category: 'operations',
    fileName: 'storm-operation.jpg',
  },
  training: {
    alt: 'Übungsabend der Freiwilligen Feuerwehr Musterstadt',
    category: 'events',
    fileName: 'training-evening.jpg',
  },
} as const

type DemoMediaKey = keyof typeof demoMediaDefinitions
type DemoMediaMap = Record<DemoMediaKey, number | string>
type BasePage = typeof defaultHomePage | (typeof defaultManagedPages)[number]

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

const cleanHomePage = {
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
      blockType: 'stats',
      items: [
        { label: 'Aktive Inhalte', value: '0' },
        { label: 'Termine', value: '0' },
        { label: 'Einsaetze', value: '0' },
        { label: 'Profile', value: '0' },
      ],
    },
    {
      blockType: 'feed',
      eyebrow: 'Aktuelles',
      headline: 'Neuigkeiten',
      intro: 'Dieser Bereich zeigt veroeffentlichte Beitraege, sobald Inhalte angelegt sind.',
      limit: 3,
      source: 'posts',
    },
    {
      blockType: 'feed',
      eyebrow: 'Termine',
      headline: 'Kommende Termine',
      intro: 'Dieser Bereich zeigt oeffentliche Termine, sobald sie angelegt sind.',
      limit: 4,
      source: 'events',
    },
    {
      blockType: 'warnings',
      eyebrow: 'Warnungen',
      headline: 'Wetter und Warnungen',
      intro: 'Warnmodule koennen ueber Presets an die gewuenschte Region angebunden werden.',
      ninaPresetKey: '',
      presetKey: 'dwd-rheinland-pfalz',
      provider: 'dwd' as const,
      showWeatherMap: false,
      showWildfireMap: false,
    },
    {
      blockType: 'banner',
      label: 'Kontakt',
      primaryHref: '/kontakt',
      primaryLabel: 'Kontakt aufnehmen',
      secondaryHref: '/manage',
      secondaryLabel: 'Inhalte verwalten',
      text: 'Passe Inhalte, Navigation und Formulare im Redaktionsbereich an.',
      title: 'Bereit fuer eigene Inhalte',
    },
  ],
  navigationLabel: 'Start',
  navigationOrder: 1,
  showInNavigation: true,
  slug: 'home',
  summary: 'Startseite mit Basisstruktur.',
  title: 'Start',
} satisfies BasePage

const cleanManagedPages = [
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Uebersicht fuer redaktionelle Beitraege und aktuelle Hinweise.',
        eyebrow: 'Aktuelles',
        headline: 'Aktuelles',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Startseite',
      },
      {
        blockType: 'feed',
        eyebrow: 'Beitraege',
        headline: 'Neueste Meldungen',
        intro: 'Sobald Beitraege veroeffentlicht sind, erscheinen sie hier automatisch.',
        limit: 6,
        source: 'posts',
      },
    ],
    navigationLabel: 'Aktuelles',
    navigationOrder: 2,
    showInNavigation: true,
    slug: 'aktuelles',
    summary: 'Aktuelles und redaktionelle Hinweise.',
    title: 'Aktuelles',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Uebersicht fuer kommende oeffentliche Termine.',
        eyebrow: 'Termine',
        headline: 'Termine',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Startseite',
      },
      {
        blockType: 'feed',
        eyebrow: 'Kalender',
        headline: 'Kommende Termine',
        intro: 'Sobald Termine angelegt sind, erscheinen sie hier automatisch.',
        limit: 6,
        source: 'events',
      },
    ],
    navigationLabel: 'Termine',
    navigationOrder: 3,
    showInNavigation: true,
    slug: 'termine',
    summary: 'Kommende oeffentliche Termine.',
    title: 'Termine',
  },
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
      {
        blockType: 'feed',
        eyebrow: 'Archiv',
        headline: 'Termine im Rueckblick',
        intro: 'Vergangene Termine koennen hier redaktionell ergaenzt werden.',
        limit: 6,
        source: 'events',
      },
    ],
    navigationLabel: 'Terminarchiv',
    navigationOrder: 30,
    showInNavigation: false,
    slug: 'termine-archiv',
    summary: 'Archivierte Termine.',
    title: 'Terminarchiv',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Oeffentliche, datenschutzkonforme Uebersicht freigegebener Einsaetze.',
        eyebrow: 'Einsaetze',
        headline: 'Einsatzhistorie',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Startseite',
      },
      {
        blockType: 'operations-log',
        eyebrow: 'Einsatzlog',
        headline: 'Freigegebene Einsaetze',
        intro: 'Sobald Einsaetze freigegeben sind, erscheinen sie hier automatisch.',
        maxItems: 100,
        showFilters: true,
        showStats: true,
      },
    ],
    navigationLabel: 'Einsatzhistorie',
    navigationOrder: 4,
    showInNavigation: true,
    slug: 'einsaetze',
    summary: 'Oeffentliche Einsatzhistorie.',
    title: 'Einsatzhistorie',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Uebersicht fuer Fahrzeuge, Ausstattung und Technikprofile.',
        eyebrow: 'Technik',
        headline: 'Technik',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Startseite',
      },
      {
        blockType: 'tech-overview',
        eyebrow: 'Technikuebersicht',
        headline: 'Fahrzeuge und Technikprofile',
        intro: 'Sobald Technikprofile angelegt sind, erscheinen sie hier automatisch.',
        maxItems: 12,
        showFeaturedProfile: true,
        showStats: true,
      },
      {
        blockType: 'tech-details',
        eyebrow: 'Detailbereich',
        headline: 'Technikdetail',
        intro: 'Optionaler Detailblock fuer ein ausgewaehltes Technikprofil.',
        showCompartments: true,
        showHighlights: true,
      },
    ],
    navigationLabel: 'Technik',
    navigationOrder: 5,
    showInNavigation: true,
    slug: 'technik',
    summary: 'Technikprofile und Ausstattung.',
    title: 'Technik',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Hinweise fuer Alltag, Veranstaltungen und Notfaelle.',
        eyebrow: 'Sicherheit',
        headline: 'Sicherheit',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/faq',
        secondaryActionLabel: 'FAQ',
      },
      {
        blockType: 'warnings',
        eyebrow: 'Warnungen',
        headline: 'Warnungen und Lage',
        intro: 'Warnmodule lassen sich ueber Presets an die gewuenschte Region anbinden.',
        ninaPresetKey: '',
        presetKey: 'dwd-rheinland-pfalz',
        provider: 'dwd' as const,
        showWeatherMap: false,
        showWildfireMap: false,
      },
      {
        blockType: 'feed',
        eyebrow: 'FAQ',
        headline: 'Passende Antworten',
        intro: 'FAQ-Inhalte erscheinen hier automatisch, sobald sie angelegt sind.',
        limit: 4,
        source: 'faqs',
      },
    ],
    navigationLabel: 'Sicherheit',
    navigationOrder: 6,
    showInNavigation: true,
    slug: 'sicherheit',
    summary: 'Sicherheits- und Vorsorgehinweise.',
    title: 'Sicherheit',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Kontaktseite mit Formularanbindung.',
        eyebrow: 'Kontakt',
        headline: 'Kontakt',
        primaryActionHref: '/faq',
        primaryActionLabel: 'FAQ',
        secondaryActionHref: '/mitmachen',
        secondaryActionLabel: 'Mitmachen',
      },
      {
        blockType: 'form',
        eyebrow: 'Kontaktformular',
        formMode: 'preset',
        headline: 'Allgemeine Anfrage',
        intro: 'Nutze dieses Formular fuer allgemeine Rueckfragen.',
        presetKey: 'contact',
      },
    ],
    navigationLabel: 'Kontakt',
    navigationOrder: 7,
    showInNavigation: true,
    slug: 'kontakt',
    summary: 'Kontaktseite mit Formular.',
    title: 'Kontakt',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Einstiegsseite fuer Interessierte und Unterstuetzende.',
        eyebrow: 'Mitmachen',
        headline: 'Mitmachen',
        primaryActionHref: '/termine',
        primaryActionLabel: 'Termine ansehen',
        secondaryActionHref: '/kontakt',
        secondaryActionLabel: 'Kontakt',
      },
      {
        blockType: 'form',
        eyebrow: 'Mitmachen Formular',
        formMode: 'preset',
        headline: 'Interesse senden',
        intro: 'Direkter Einstieg fuer unverbindliche Anfragen.',
        presetKey: 'join',
      },
    ],
    navigationLabel: 'Mitmachen',
    navigationOrder: 8,
    showInNavigation: true,
    slug: 'mitmachen',
    summary: 'Mitmachen- und Kontaktseite.',
    title: 'Mitmachen',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Antworten auf haeufige Fragen.',
        eyebrow: 'FAQ',
        headline: 'FAQ',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/mitmachen',
        secondaryActionLabel: 'Mitmachen',
      },
      {
        blockType: 'feed',
        eyebrow: 'Fragen',
        headline: 'Antworten',
        intro: 'FAQ-Inhalte erscheinen hier automatisch, sobald sie angelegt sind.',
        limit: 8,
        source: 'faqs',
      },
    ],
    navigationLabel: 'FAQ',
    navigationOrder: 20,
    showInNavigation: true,
    slug: 'faq',
    summary: 'Haeufige Fragen und Antworten.',
    title: 'FAQ',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Uebersicht fuer Team- und Rollenprofile.',
        eyebrow: 'Team',
        headline: 'Team',
        primaryActionHref: '/mitmachen',
        primaryActionLabel: 'Mitmachen',
        secondaryActionHref: '/kontakt',
        secondaryActionLabel: 'Kontakt',
      },
      {
        blockType: 'feed',
        eyebrow: 'Profile',
        headline: 'Teamprofile',
        intro: 'Teamprofile erscheinen hier automatisch, sobald sie angelegt sind.',
        limit: 6,
        source: 'crew',
      },
    ],
    navigationLabel: 'Team',
    navigationOrder: 21,
    showInNavigation: true,
    slug: 'team',
    summary: 'Team- und Rollenprofile.',
    title: 'Team',
  },
] satisfies BasePage[]

function hasS3Storage() {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_REGION?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim(),
  )
}

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

type LocalMediaFiles = {
  filename?: string | null
  sizes?: Record<string, { filename?: string | null } | null | undefined> | null
}

function getLocalMediaFilenames(media: LocalMediaFiles) {
  const filenames = [media.filename]

  if (media.sizes) {
    for (const size of Object.values(media.sizes)) {
      filenames.push(size?.filename)
    }
  }

  return filenames.filter((filename): filename is string => Boolean(filename))
}

async function localMediaFilesExist(media: LocalMediaFiles) {
  if (hasS3Storage()) {
    return true
  }

  const filenames = getLocalMediaFilenames(media)
  if (filenames.length === 0) {
    return false
  }

  const checks = await Promise.all(
    filenames.map((filename) => fileExists(path.join(localMediaDir, filename))),
  )

  return checks.every(Boolean)
}

async function ensureLocalDemoMediaFiles(media: LocalMediaFiles, sourcePath: string) {
  if (hasS3Storage()) {
    return
  }

  const filenames = getLocalMediaFilenames(media)
  if (filenames.length === 0) {
    return
  }

  await mkdir(localMediaDir, { recursive: true })

  for (const filename of filenames) {
    const targetPath = path.join(localMediaDir, filename)
    if (await fileExists(targetPath)) {
      continue
    }

    await copyFile(sourcePath, targetPath)
  }
}

async function ensureGlobal(
  payload: Awaited<ReturnType<typeof getPayload>>,
  settings = defaultSiteSettings,
) {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: settings,
  })
}

async function ensureDemoMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<DemoMediaMap> {
  const result = {} as DemoMediaMap

  for (const [key, definition] of Object.entries(demoMediaDefinitions) as Array<
    [DemoMediaKey, (typeof demoMediaDefinitions)[DemoMediaKey]]
  >) {
    const existing = await payload.find({
      collection: 'media',
      limit: 1,
      where: {
        alt: {
          equals: definition.alt,
        },
      },
    })

    const filePath = path.join(demoImageDir, definition.fileName)
    const data = await readFile(filePath)

    if (existing.docs[0]?.id) {
      const existingMedia = existing.docs[0]
      result[key] = existingMedia.id

      if (await localMediaFilesExist(existingMedia)) {
        continue
      }

      if (existingMedia.filename) {
        await ensureLocalDemoMediaFiles(existingMedia, filePath)
        continue
      }

      const updatedMedia = await payload.update({
        collection: 'media',
        id: existingMedia.id,
        data: {
          alt: definition.alt,
          category: definition.category,
        },
        file: {
          data,
          mimetype: 'image/jpeg',
          name: definition.fileName,
          size: data.byteLength,
        },
      } as never)

      await ensureLocalDemoMediaFiles(updatedMedia, filePath)

      continue
    }

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: definition.alt,
        category: definition.category,
      },
      file: {
        data,
        mimetype: 'image/jpeg',
        name: definition.fileName,
        size: data.byteLength,
      },
    } as never)

    result[key] = media.id
    await ensureLocalDemoMediaFiles(media, filePath)
  }

  return result
}

async function ensureWarningPresets(payload: Awaited<ReturnType<typeof getPayload>>) {
  for (const preset of getBuiltInWarningPresets()) {
    const existing = await payload.find({
      collection: 'warning-presets',
      limit: 1,
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
    })
  }
}

function withHomeHeroImage(page: typeof defaultHomePage, mediaIds: DemoMediaMap) {
  return {
    ...page,
    layout: page.layout.map((block, index) => {
      if (index === 0 && block.blockType === 'hero') {
        return {
          ...block,
          heroImage: mediaIds.hero,
        }
      }

      return block
    }),
  }
}

async function ensureHomePage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  mediaIds: DemoMediaMap,
) {
  const existing = await payload.find({
    collection: 'pages',
    limit: 1,
    where: {
      slug: {
        equals: 'home',
      },
    },
  })

  if (existing.docs.length > 0) {
    const current = existing.docs[0]
    const currentLayout =
      Array.isArray(current.layout) && current.layout.length > 0
        ? current.layout
        : defaultHomePage.layout
    const nextHomePage = withHomeHeroImage(
      {
        ...defaultHomePage,
        layout: currentLayout as typeof defaultHomePage.layout,
      },
      mediaIds,
    )

    await payload.update({
      collection: 'pages',
      id: current.id,
      data: {
        layout: nextHomePage.layout,
      },
    })

    return
  }

  await payload.create({
    collection: 'pages',
    data: {
      ...withHomeHeroImage(defaultHomePage, mediaIds),
      _status: 'published',
    },
  })
}

function withStarterPageRelationships(
  page: (typeof defaultManagedPages)[number],
  featuredEquipmentId?: number | string | null,
) {
  if (!featuredEquipmentId) {
    return page
  }

  return {
    ...page,
    layout: page.layout.map((block) => {
      if (block.blockType === 'tech-overview') {
        return {
          ...block,
          featuredEquipment: block.featuredEquipment ?? featuredEquipmentId,
        }
      }

      if (block.blockType === 'tech-details') {
        return {
          ...block,
          equipment: block.equipment ?? featuredEquipmentId,
        }
      }

      return block
    }),
  }
}

async function ensureManagedPages(payload: Awaited<ReturnType<typeof getPayload>>) {
  const starterEquipment = await payload.find({
    collection: 'equipment',
    limit: 1,
    sort: 'name',
  })
  const featuredEquipmentId = starterEquipment.docs[0]?.id ?? null

  for (const page of defaultManagedPages) {
    const pageData = withStarterPageRelationships(page, featuredEquipmentId)
    const existing = await payload.find({
      collection: 'pages',
      limit: 1,
      where: {
        slug: {
          equals: pageData.slug,
        },
      },
    })

    if (existing.docs.length > 0) {
      continue
    }

    await payload.create({
      collection: 'pages',
      data: {
        ...pageData,
        _status: 'published',
      },
    })
  }
}

async function ensurePage(payload: Awaited<ReturnType<typeof getPayload>>, page: BasePage) {
  const existing = await payload.find({
    collection: 'pages',
    limit: 1,
    where: {
      slug: {
        equals: page.slug,
      },
    },
  })

  if (existing.docs.length > 0) {
    return
  }

  await payload.create({
    collection: 'pages',
    data: {
      ...page,
      _status: 'published',
    },
  })
}

async function ensureCleanBasePages(payload: Awaited<ReturnType<typeof getPayload>>) {
  await ensurePage(payload, cleanHomePage)

  for (const page of cleanManagedPages) {
    await ensurePage(payload, page)
  }
}

function getStarterSeedData(
  collection: keyof typeof fallbackFeedData,
  item: (typeof fallbackFeedData)[keyof typeof fallbackFeedData][number],
) {
  if (collection === 'posts') {
    return {
      ...item,
      _status: 'published',
      content: 'content' in item ? item.content : (item.excerpt ?? item.title),
    }
  }

  return item
}

function withDemoMedia(
  collection: keyof typeof fallbackFeedData,
  item: (typeof fallbackFeedData)[keyof typeof fallbackFeedData][number],
  mediaIds: DemoMediaMap,
) {
  const lookupValue = String(
    (item as Record<string, unknown>)[starterLookupField[collection]] ?? '',
  )

  if (collection === 'posts') {
    const postImages: Record<string, number | string> = {
      'Erfolgreicher Übungsabend zur Technischen Hilfeleistung': mediaIds.training,
      'Jugendfeuerwehr zeigt Teamarbeit beim Aktionstag': mediaIds.openDay,
      'Neue Gerätefächer machen das TSF-W noch schneller einsatzbereit': mediaIds.equipment,
      'Unwetterlage sicher abgearbeitet': mediaIds.storm,
    }

    return {
      ...item,
      featuredImage: postImages[lookupValue] ?? mediaIds.hero,
    }
  }

  if (collection === 'events') {
    const eventImages: Record<string, number | string> = {
      'Aktionstag für Kinder und Jugendliche': mediaIds.openDay,
      'Erste Hilfe für Bürger': mediaIds.openDay,
      'Offener Übungsabend mit Technikvorführung': mediaIds.training,
      'Jahresabschlussübung am Gerätehaus': mediaIds.training,
    }

    return {
      ...item,
      featuredImage: eventImages[lookupValue] ?? mediaIds.training,
    }
  }

  if (collection === 'operations') {
    return {
      ...item,
      featuredImage: lookupValue === 'E-2026-013' ? mediaIds.hero : mediaIds.storm,
    }
  }

  if (collection === 'equipment') {
    const equipmentImages: Record<string, number | string> = {
      'lf-10': mediaIds.hero,
      mtw: mediaIds.openDay,
      'tsf-w': mediaIds.equipment,
    }

    return {
      ...item,
      compartments: Array.isArray(item.compartments)
        ? item.compartments.map((compartment) => ({
            ...compartment,
            image: mediaIds.equipment,
            showImagePlaceholder: false,
          }))
        : item.compartments,
      heroImage: equipmentImages[lookupValue] ?? mediaIds.equipment,
    }
  }

  if (collection === 'crew') {
    return {
      ...item,
      portrait: mediaIds.openDay,
    }
  }

  return item
}

async function seedCollectionIfEmpty(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: keyof typeof fallbackFeedData,
  mediaIds: DemoMediaMap,
) {
  const existing = await payload.find({
    collection,
    limit: 200,
  })

  const lookupField = starterLookupField[collection]

  if (existing.docs.length === 0) {
    for (const item of fallbackFeedData[collection]) {
      await payload.create({
        collection,
        data: getStarterSeedData(collection, withDemoMedia(collection, item, mediaIds)),
      })
    }

    return
  }

  for (const item of fallbackFeedData[collection]) {
    const lookupValue = String((item as Record<string, unknown>)[lookupField] ?? '')
    const match = existing.docs.find(
      (doc) => String((doc as Record<string, unknown>)[lookupField] ?? '') === lookupValue,
    )

    if (!match) {
      await payload.create({
        collection,
        data: getStarterSeedData(collection, withDemoMedia(collection, item, mediaIds)),
      })

      continue
    }

    await payload.update({
      collection,
      id: match.id,
      data: getStarterSeedData(collection, withDemoMedia(collection, item, mediaIds)),
    })
  }
}

async function main() {
  const payload = await getPayload({ config })

  await ensureGlobal(payload, emptyMode ? cleanSiteSettings : defaultSiteSettings)
  await ensureWarningPresets(payload)
  await ensureDefaultPublicForms(payload)

  if (emptyMode) {
    await ensureCleanBasePages(payload)
    console.log('Seed completed in empty mode.')
    return
  }

  const mediaIds = await ensureDemoMedia(payload)

  await seedCollectionIfEmpty(payload, 'posts', mediaIds)
  await seedCollectionIfEmpty(payload, 'events', mediaIds)
  await seedCollectionIfEmpty(payload, 'operations', mediaIds)
  await seedCollectionIfEmpty(payload, 'crew', mediaIds)
  await seedCollectionIfEmpty(payload, 'equipment', mediaIds)
  await seedCollectionIfEmpty(payload, 'faqs', mediaIds)
  await ensureHomePage(payload, mediaIds)
  await ensureManagedPages(payload)

  console.log('Seed completed with starter content.')
}

void main()
