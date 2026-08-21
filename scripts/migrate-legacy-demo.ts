import 'dotenv/config'

import { pathToFileURL } from 'node:url'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { defaultSiteSettings } from '../src/lib/trustred/defaults'

type MigratableCollection = 'pages' | 'posts' | 'events' | 'operations' | 'crew' | 'equipment' | 'faqs'

async function resetCollection(payload: Awaited<ReturnType<typeof getPayload>>, collection: string) {
  const docs = await payload.find({
    collection: collection as MigratableCollection,
    limit: 200,
  })

  for (const doc of docs.docs) {
    await payload.delete({
      collection: collection as MigratableCollection,
      id: doc.id,
    })
  }
}

async function main() {
  const payload = await getPayload({ config })
  const reset = process.argv.includes('--reset')
  const contentModuleUrl = pathToFileURL(
    path.resolve(process.cwd(), '_examples_/trustred-cms-old/src/data/content.ts'),
  ).href

  const content = await import(contentModuleUrl)

  if (reset) {
    for (const collection of ['pages', 'posts', 'events', 'operations', 'crew', 'equipment', 'faqs'] as const) {
      await resetCollection(payload, collection)
    }
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      ...defaultSiteSettings,
      announcement: {
        enabled: Boolean(content.announcement?.isActive),
        label: String(content.announcement?.label ?? defaultSiteSettings.announcement.label),
        message: String(content.announcement?.message ?? defaultSiteSettings.announcement.message),
      },
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      layout: [
        {
          blockType: 'hero',
          copy:
            'Importierte Startseite aus dem Legacy-Demo-Datensatz. Diese Struktur ist der Einstiegspunkt für die weitere Migration in das neue blockbasierte Modell.',
          eyebrow: 'Migration',
          headline: 'Trustred Migration Demo',
          primaryActionHref: '/mitmachen',
          primaryActionLabel: 'Mitmachen',
          secondaryActionHref: '/kontakt',
          secondaryActionLabel: 'Kontakt',
        },
      ],
      slug: 'home',
      summary: 'Migrierte Demo-Startseite',
      title: 'Start',
    },
  }).catch(() => null)

  for (const item of content.news ?? []) {
    await payload.create({
      collection: 'posts',
      data: {
        _status: item.status === 'published' ? 'published' : 'draft',
        category: 'oeffentlichkeitsarbeit',
        content: item.content,
        excerpt: item.content.split('\n')[0] ?? item.title,
        publishedAt: item.publishDate,
        slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        title: item.title,
      },
    })
  }

  for (const item of content.events ?? []) {
    await payload.create({
      collection: 'events',
      data: {
        eventType:
          item.type === 'Öffentlich'
            ? 'oeffentlich'
            : item.type === 'Jugend'
              ? 'jugend'
              : item.type === 'Organisation'
                ? 'organisation'
                : item.type === 'Übung'
                  ? 'uebung'
                  : 'ausbildung',
        location: item.location,
        registrationEnabled: Boolean(item.participantQueryEnabled),
        slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        startsAt: new Date(item.date).toISOString(),
        summary: item.details,
        title: item.title,
        visibility: item.status === 'published' ? 'public' : 'internal',
      },
    })
  }

  for (const item of content.operations ?? []) {
    await payload.create({
      collection: 'operations',
      data: {
        alarmCode: item.alarm,
        category:
          item.type === 'Brand'
            ? 'brand'
            : item.type === 'Technische Hilfe'
              ? 'hilfe'
            : item.type === 'Wetter'
                ? 'wetter'
                : 'sonstiges',
        details: item.summary,
        isPublic: true,
        location: item.location,
        operationNumber: item.id,
        startedAt: new Date(item.date).toISOString(),
        summary: item.summary,
        unitsInvolved: item.unitsInvolved.map((unit: string) => ({ unit })),
      },
    })
  }

  for (const item of content.crew ?? []) {
    await payload.create({
      collection: 'crew',
      data: {
        focus: item.focus,
        name: item.name,
        qualification: item.qualification,
        role: item.role,
        skills: item.skills.map((label: string) => ({ label })),
      },
    })
  }

  for (const item of content.vehicles ?? []) {
    await payload.create({
      collection: 'equipment',
      data: {
        callSign: item.callSign,
        facts: item.facts.map((fact: { label: string; value: string }) => ({
          label: fact.label,
          value: fact.value,
        })),
        name: item.name,
        slug: item.slug,
        summary: item.summary,
      },
    })
  }

  for (const item of content.faqs ?? []) {
    await payload.create({
      collection: 'faqs',
      data: {
        answer: item.answer,
        question: item.question,
      },
    })
  }

  console.log('Legacy demo migration completed.')
}

void main()
