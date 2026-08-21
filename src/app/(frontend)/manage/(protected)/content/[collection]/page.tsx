import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { editorialCollections, getEditorialPermissions, isEditorialCollectionSlug, loadCollectionDocs, requireEditorialContext } from '@/lib/trustred/editorial'
import { normalizePublicPath, resolvePublicSlug } from '@/lib/trustred/slugify'
import { getEquipmentPath, getEventPath, getFaqPath, getPostPath } from '@/lib/trustred/public-content'

type Props = {
  params: Promise<{
    collection: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatUpdatedAt(value: unknown) {
  if (!value) return 'Unbekannt'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getDocLabel(doc: Record<string, unknown>, titleField: string) {
  return String(doc[titleField] ?? doc.slug ?? doc.id ?? '')
}

function getDocPublicHref(collection: string, doc: Record<string, unknown>) {
  if (collection === 'posts' && doc.slug) {
    return getPostPath(resolvePublicSlug(String(doc.slug), String(doc.title ?? '')))
  }

  if (collection === 'events' && doc.slug && doc.visibility === 'public') {
    return getEventPath(resolvePublicSlug(String(doc.slug), String(doc.title ?? '')))
  }

  if (collection === 'operations' && doc.id && doc.isPublic !== false) {
    return `/einsaetze/${encodeURIComponent(String(doc.id))}`
  }

  if (collection === 'equipment' && doc.slug) {
    return getEquipmentPath(resolvePublicSlug(String(doc.slug), String(doc.name ?? '')))
  }

  if (collection === 'crew' && doc.id) {
    return `/team/${encodeURIComponent(String(doc.id))}`
  }

  if (collection === 'faqs' && doc.id) {
    return getFaqPath(String(doc.id))
  }

  if (collection === 'pages' && doc.slug) {
    const slug = resolvePublicSlug(String(doc.slug), String(doc.title ?? ''))
    return slug === 'home' ? '/' : normalizePublicPath(`/${slug}`)
  }

  return null
}

export default async function ManageCollectionPage({ params, searchParams }: Props) {
  const { collection } = await params

  if (!isEditorialCollectionSlug(collection)) {
    notFound()
  }

  const collectionSlug = collection
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)
  const operationsCollections = new Set(['events', 'operations'])

  if (
    (operationsCollections.has(collectionSlug) && !permissions.canAccessOperations) ||
    (!operationsCollections.has(collectionSlug) && !permissions.canAccessContent)
  ) {
    redirect('/manage')
  }

  const docs = await loadCollectionDocs(payload, user, collectionSlug)
  const config = editorialCollections[collectionSlug]
  const resolvedSearchParams = (await searchParams) ?? {}
  const query = readSearchValue(resolvedSearchParams.q)?.trim() ?? ''
  const stateFilter = readSearchValue(resolvedSearchParams.state)?.trim() ?? ''

  const filteredDocs = docs.filter((doc) => {
    if (query) {
      const haystack = [getDocLabel(doc, config.titleField), doc.slug, doc.id, doc.category, doc.location]
        .map((entry) => String(entry ?? ''))
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query.toLowerCase())) {
        return false
      }
    }

    if (stateFilter === 'published' && doc._status !== 'published') {
      return false
    }

    if (stateFilter === 'draft' && doc._status !== 'draft') {
      return false
    }

    if (stateFilter === 'public' && doc.isPublic === false) {
      return false
    }

    if (stateFilter === 'internal' && doc.visibility !== 'internal') {
      return false
    }

    return true
  })

  return (
    <div className="grid gap-6">
      <section className="ff-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ff-kicker">Collection</p>
          <h2 className="text-3xl">{config.label}</h2>
        </div>
        <Link className="ff-btn-accent" href={`/manage/content/${collection}/new`}>
          Neuen Eintrag anlegen
        </Link>
      </section>
      <form className="ff-card grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end" method="get">
        <label>
          Suche
          <input className="ff-input" defaultValue={query} name="q" placeholder="Titel, Slug, ID, Kategorie, Ort" />
        </label>
        <label>
          Filter
          <select className="ff-input" defaultValue={stateFilter} name="state">
            <option value="">Alles</option>
            <option value="published">Veröffentlicht</option>
            <option value="draft">Entwurf</option>
            <option value="public">Öffentlich</option>
            <option value="internal">Intern</option>
          </select>
        </label>
        <button className="ff-btn-ghost" type="submit">
          Anwenden
        </button>
      </form>
      <section className="ff-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Titel</th>
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">ID</th>
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Aktualisiert</th>
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Status</th>
                <th className="py-3 font-headline text-xs uppercase tracking-[0.08em]">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const publicHref = getDocPublicHref(collectionSlug, doc)
                const statusLabel =
                  doc._status ? String(doc._status) : doc.visibility ? String(doc.visibility) : doc.isPublic === false ? 'intern' : 'aktiv'

                return (
                <tr className="border-b border-neutral-100" key={String(doc.id)}>
                  <td className="py-3 pr-4">
                    <div className="grid gap-1">
                      <span>{getDocLabel(doc, config.titleField)}</span>
                      {publicHref ? (
                        <Link className="text-xs text-neutral-500 underline" href={publicHref} target="_blank">
                          Öffentliche Ansicht
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-neutral-500">{String(doc.id)}</td>
                  <td className="py-3 pr-4 text-neutral-500">{formatUpdatedAt(doc.updatedAt)}</td>
                  <td className="py-3 pr-4 text-neutral-500">{statusLabel}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="ff-btn-ghost" href={`/manage/content/${collectionSlug}/${doc.id}`}>
                        Bearbeiten
                      </Link>
                      {publicHref ? (
                        <Link className="ff-btn-ghost" href={publicHref} target="_blank">
                          Ansehen
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
                )
              })}
              {filteredDocs.length === 0 ? (
                <tr>
                  <td className="py-6 text-neutral-600" colSpan={5}>
                    Keine Einträge für die aktuelle Suche oder Filterung gefunden.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
