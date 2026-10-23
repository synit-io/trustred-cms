import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Where } from 'payload'

import { getEditorialPermissions, requireEditorialContext } from '@/lib/trustred/editorial'
import { getMediaUsage } from '@/lib/trustred/media-usage'
import type { Media } from '@/payload-types'

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatBytes(value?: number | null) {
  if (!value || value <= 0) {
    return 'Unbekannt'
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 102.4) / 10} KB`
  }

  return `${Math.round(value / (1024 * 102.4)) / 10} MB`
}

export default async function ManageMediaPage({ searchParams }: Props) {
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)

  if (!permissions.canAccessMedia) {
    redirect('/manage')
  }

  const params = (await searchParams) ?? {}
  const query = readSearchValue(params.q)?.trim() ?? ''
  const category = readSearchValue(params.category)?.trim() ?? ''
  const selectedId = Number.parseInt(readSearchValue(params.selected) ?? '', 10)
  const pageNumber = Math.max(1, Number.parseInt(readSearchValue(params.page) ?? '1', 10) || 1)
  const status = readSearchValue(params.status)?.trim() ?? ''
  const message = readSearchValue(params.message)?.trim() ?? ''

  const filters: Where[] = []
  if (category) filters.push({ category: { equals: category } })
  if (query) filters.push({ or: [
    { filename: { contains: query } },
    { alt: { contains: query } },
    { caption: { contains: query } },
    { category: { contains: query } },
  ] })
  const media = await payload.find({
    collection: 'media',
    limit: 24,
    overrideAccess: false,
    page: pageNumber,
    sort: '-updatedAt',
    user,
    where: filters.length > 0 ? { and: filters } : undefined,
  })

  const filteredMedia = media.docs

  const selectedResult = Number.isFinite(selectedId) && !filteredMedia.some((item) => item.id === selectedId)
    ? await payload.find({
        collection: 'media',
        limit: 1,
        overrideAccess: false,
        user,
        where: { id: { equals: selectedId } },
      })
    : null
  const selectedMedia = filteredMedia.find((item) => item.id === selectedId) ?? selectedResult?.docs[0] ?? filteredMedia[0] ?? null
  const usage = selectedMedia ? await getMediaUsage(payload, selectedMedia.id) : []

  async function uploadAction(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      redirect('/manage/media?status=error&message=Bitte+eine+Datei+auswaehlen')
    }

    const created = await payload.create({
      collection: 'media',
      data: {
        alt: String(formData.get('alt') ?? '').trim(),
        caption: String(formData.get('caption') ?? '').trim(),
        category: String(formData.get('category') ?? 'general').trim() as NonNullable<Media['category']>,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: false,
      user,
    } as never)

    redirect(`/manage/media?status=success&message=${encodeURIComponent('Datei hochgeladen')}&selected=${created.id}`)
  }

  async function updateAction(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    const id = Number.parseInt(String(formData.get('id') ?? ''), 10)

    if (!Number.isFinite(id)) {
      redirect('/manage/media?status=error&message=Medium+nicht+gefunden')
    }

    await payload.update({
      collection: 'media',
      id,
      data: {
        alt: String(formData.get('alt') ?? '').trim(),
        caption: String(formData.get('caption') ?? '').trim(),
        category: String(formData.get('category') ?? 'general').trim() as NonNullable<Media['category']>,
      },
      overrideAccess: false,
      user,
    })

    redirect(`/manage/media?status=success&message=${encodeURIComponent('Mediadaten aktualisiert')}&selected=${id}`)
  }

  async function deleteAction(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    const id = Number.parseInt(String(formData.get('id') ?? ''), 10)

    if (!Number.isFinite(id)) {
      redirect('/manage/media?status=error&message=Medium+nicht+gefunden')
    }

    const currentUsage = await getMediaUsage(payload, id)
    if (currentUsage.length > 0) {
      redirect(`/manage/media?status=error&message=${encodeURIComponent('Medium wird noch verwendet und kann nicht geloescht werden')}&selected=${id}`)
    }

    if (String(formData.get('confirmDelete') ?? '').trim().toUpperCase() !== 'LOESCHEN') {
      redirect(`/manage/media?status=error&message=${encodeURIComponent('Bitte LOESCHEN zur Bestaetigung eingeben')}&selected=${id}`)
    }

    await payload.delete({
      collection: 'media',
      id,
      overrideAccess: false,
      user,
    })

    redirect('/manage/media?status=success&message=Medium+geloescht')
  }

  return (
    <div className="grid gap-6">
      <section className="ff-card">
        <p className="ff-kicker">Medien</p>
        <h2 className="text-3xl">Mediathek im Frontend</h2>
        <p className="mt-4 text-neutral-700">
          Die Mediathek ist jetzt als echte Galerie nutzbar: filtern, durchsuchen, Vorschau prüfen, Kategorien anpassen, Verwendungen sehen und Dateien sicher löschen.
        </p>
      </section>

      {status && message ? (
        <section className={`ff-card ${status === 'error' ? 'border-status-danger-border bg-status-danger-bg' : 'border-status-success-border bg-status-success-bg'}`}>
          <p className="ff-kicker">Status</p>
          <p className="text-sm font-semibold text-neutral-900">{message}</p>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem] xl:items-start">
        <div className="grid content-start gap-6">
          <form className="ff-card grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end" method="get">
            <label>
              Suche
              <input className="ff-input" defaultValue={query} name="q" placeholder="Dateiname, Alt-Text, Kategorie" />
            </label>
            <label>
              Kategorie
              <select className="ff-input" defaultValue={category} name="category">
                <option value="">Alle</option>
                <option value="general">General</option>
                <option value="news">News</option>
                <option value="events">Events</option>
                <option value="operations">Operations</option>
                <option value="team">Team</option>
                <option value="equipment">Equipment</option>
              </select>
            </label>
            <button className="ff-btn-ghost" type="submit">
              Filtern
            </button>
          </form>

          <section className="ff-card grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="ff-kicker">Galerie</p>
                <h3 className="text-2xl">Vorschau und Wiederverwendung</h3>
              </div>
              <p className="text-sm text-neutral-600">{media.totalDocs} Medien gefunden</p>
            </div>

            {filteredMedia.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
                Keine Medien für diese Filter gefunden.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredMedia.map((item) => (
                  <Link
                    className={`rounded-2xl border p-3 shadow-card transition hover:-translate-y-0.5 ${
                      selectedMedia?.id === item.id ? 'border-[var(--brand-500)] bg-brand-50' : 'border-neutral-200 bg-white'
                    }`}
                    href={`/manage/media?selected=${item.id}&page=${pageNumber}${category ? `&category=${encodeURIComponent(category)}` : ''}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                    key={item.id}
                  >
                    {item.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.alt} className="h-48 w-full rounded-xl object-cover" loading="lazy" src={item.thumbnailURL ?? item.url} />
                    ) : (
                      <div className="ff-media-placeholder h-48 w-full">Keine Vorschau</div>
                    )}
                    <div className="mt-4 grid gap-1">
                      <p className="ff-label">{item.category ?? 'general'}</p>
                      <h4 className="text-base font-semibold text-neutral-900">{item.filename}</h4>
                      <p className="line-clamp-2 text-sm text-neutral-600">{item.alt}</p>
                      <p className="text-xs text-neutral-500">
                        {item.width && item.height ? `${item.width} × ${item.height}px` : 'Format unbekannt'} · {formatBytes(item.filesize)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {media.totalPages > 1 ? (
              <nav aria-label="Mediathek-Seiten" className="flex items-center justify-between gap-3">
                {media.hasPrevPage ? <Link className="ff-btn-ghost" href={`/manage/media?page=${pageNumber - 1}&category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}`}>Zurück</Link> : <span />}
                <span>Seite {media.page} von {media.totalPages}</span>
                {media.hasNextPage ? <Link className="ff-btn-ghost" href={`/manage/media?page=${pageNumber + 1}&category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}`}>Weiter</Link> : <span />}
              </nav>
            ) : null}
          </section>
        </div>

        <div className="grid gap-6">
          <form action={uploadAction} className="ff-card">
            <p className="ff-kicker">Upload</p>
            <h3 className="text-2xl">Neues Medium anlegen</h3>
            <div className="ff-form-grid mt-4">
              <label>
                Datei
                <input accept="image/*" className="ff-input" name="file" required type="file" />
              </label>
              <label>
                Alt-Text
                <input className="ff-input" name="alt" required />
              </label>
              <label>
                Caption
                <textarea className="ff-input" name="caption" rows={3} />
              </label>
              <label>
                Kategorie
                <select className="ff-input" defaultValue="general" name="category">
                  <option value="general">General</option>
                  <option value="news">News</option>
                  <option value="events">Events</option>
                  <option value="operations">Operations</option>
                  <option value="team">Team</option>
                  <option value="equipment">Equipment</option>
                </select>
              </label>
            </div>
            <button className="ff-btn-accent mt-6" type="submit">
              Datei hochladen
            </button>
          </form>

          <section className="ff-card grid gap-4">
            <div>
              <p className="ff-kicker">Details</p>
              <h3 className="text-2xl">Auswahl prüfen und verwalten</h3>
            </div>

            {selectedMedia ? (
              <>
                {selectedMedia.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={selectedMedia.alt} className="h-64 w-full rounded-xl object-cover" src={selectedMedia.url} />
                ) : null}

                <form action={updateAction} className="ff-form-grid">
                  <input name="id" type="hidden" value={selectedMedia.id} />
                  <label>
                    Dateiname
                    <input className="ff-input" disabled value={selectedMedia.filename ?? ''} />
                  </label>
                  <label>
                    Alt-Text
                    <input className="ff-input" defaultValue={selectedMedia.alt} name="alt" required />
                  </label>
                  <label>
                    Caption
                    <textarea className="ff-input" defaultValue={selectedMedia.caption ?? ''} name="caption" rows={3} />
                  </label>
                  <label>
                    Kategorie / Ablage
                    <select className="ff-input" defaultValue={selectedMedia.category ?? 'general'} name="category">
                      <option value="general">General</option>
                      <option value="news">News</option>
                      <option value="events">Events</option>
                      <option value="operations">Operations</option>
                      <option value="team">Team</option>
                      <option value="equipment">Equipment</option>
                    </select>
                  </label>
                  <button className="ff-btn-accent" type="submit">
                    Metadaten speichern
                  </button>
                </form>

                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="ff-label">Dateiinfo</p>
                  <div className="mt-3 grid gap-3 text-sm text-neutral-700">
                    <p>
                      <span className="font-semibold text-neutral-900">Auflösung:</span>{' '}
                      {selectedMedia.width && selectedMedia.height ? `${selectedMedia.width} × ${selectedMedia.height}px` : 'Unbekannt'}
                    </p>
                    <p>
                      <span className="font-semibold text-neutral-900">Dateigröße:</span> {formatBytes(selectedMedia.filesize)}
                    </p>
                    <p className="break-all">
                      <span className="font-semibold text-neutral-900">Datei-URL:</span> {selectedMedia.url ?? 'Nicht verfügbar'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="ff-label">Verwendung</p>
                  {usage.length > 0 ? (
                    <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
                      {usage.map((entry) => (
                        <li className="rounded-lg border border-neutral-200 bg-white px-3 py-2" key={`${entry.source}-${entry.href}`}>
                          <span className="mr-2 font-semibold text-neutral-900">{entry.source}:</span>
                          <Link className="underline" href={entry.href}>
                            {entry.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-600">Aktuell in keinem gepflegten Inhalt referenziert.</p>
                  )}
                </div>

                <form action={deleteAction} className="rounded-xl border border-status-danger-border bg-status-danger-bg p-4">
                  <input name="id" type="hidden" value={selectedMedia.id} />
                  <p className="text-sm font-semibold text-neutral-900">Sicher löschen</p>
                  <p className="mt-2 text-sm text-neutral-700">
                    Löschen ist nur möglich, wenn das Medium aktuell nirgendwo verwendet wird. Tippe zur Bestätigung <code>LOESCHEN</code>.
                  </p>
                  <label className="mt-4 block">
                    <input className="ff-input" name="confirmDelete" placeholder="LOESCHEN" />
                  </label>
                  <button className="ff-btn-danger mt-4" type="submit">
                    Medium löschen
                  </button>
                </form>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
                Kein Medium ausgewählt.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
