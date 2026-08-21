import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getEditorialPermissions, requireEditorialContext } from '@/lib/trustred/editorial'
import type { Media, Page, Post, Event, Operation, Crew, Equipment } from '@/payload-types'

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type MediaUsage = {
  href: string
  label: string
  source: string
}

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function matchesText(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase())
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

function mediaInPageLayout(page: Page, mediaId: number) {
  return (page.layout ?? []).some((block) => {
    if (block.blockType !== 'hero') {
      return false
    }

    const heroImage = block.heroImage

    if (typeof heroImage === 'number') {
      return heroImage === mediaId
    }

    if (heroImage && typeof heroImage === 'object' && 'id' in heroImage) {
      return Number(heroImage.id) === mediaId
    }

    return false
  })
}

function relationMatchesMediaId(value: unknown, mediaId: number) {
  if (typeof value === 'number') {
    return value === mediaId
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return Number(value.id) === mediaId
  }

  return false
}

async function getMediaUsage(payload: Awaited<ReturnType<typeof requireEditorialContext>>['payload'], user: Awaited<ReturnType<typeof requireEditorialContext>>['user'], mediaId: number) {
  const [pages, posts, events, operations, crew, equipment] = await Promise.all([
    payload.find({ collection: 'pages', limit: 200, overrideAccess: false, user }) as Promise<{ docs: Page[] }>,
    payload.find({ collection: 'posts', limit: 200, overrideAccess: false, user }) as Promise<{ docs: Post[] }>,
    payload.find({ collection: 'events', limit: 200, overrideAccess: false, user }) as Promise<{ docs: Event[] }>,
    payload.find({ collection: 'operations', limit: 200, overrideAccess: false, user }) as Promise<{ docs: Operation[] }>,
    payload.find({ collection: 'crew', limit: 200, overrideAccess: false, user }) as Promise<{ docs: Crew[] }>,
    payload.find({ collection: 'equipment', limit: 200, overrideAccess: false, user }) as Promise<{ docs: Equipment[] }>,
  ])

  const usage: MediaUsage[] = []

  for (const page of pages.docs) {
    if (mediaInPageLayout(page, mediaId)) {
      usage.push({
        href: `/manage/content/pages/${page.id}`,
        label: page.title,
        source: 'Seite',
      })
    }
  }

  for (const post of posts.docs) {
    if (relationMatchesMediaId(post.featuredImage, mediaId)) {
      usage.push({
        href: `/manage/content/posts/${post.id}`,
        label: post.title,
        source: 'Aktuelles',
      })
    }
  }

  for (const event of events.docs) {
    if (relationMatchesMediaId(event.featuredImage, mediaId)) {
      usage.push({
        href: `/manage/content/events/${event.id}`,
        label: event.title,
        source: 'Termin',
      })
    }
  }

  for (const operation of operations.docs) {
    if (relationMatchesMediaId(operation.featuredImage, mediaId)) {
      usage.push({
        href: `/manage/content/operations/${operation.id}`,
        label: operation.operationNumber,
        source: 'Einsatz',
      })
    }
  }

  for (const member of crew.docs) {
    if (relationMatchesMediaId(member.portrait, mediaId)) {
      usage.push({
        href: `/manage/content/crew/${member.id}`,
        label: member.name,
        source: 'Crew',
      })
    }
  }

  for (const item of equipment.docs) {
    const compartmentMatch = (item.compartments ?? []).some((compartment) =>
      relationMatchesMediaId(compartment.image, mediaId),
    )

    if (relationMatchesMediaId(item.heroImage, mediaId) || compartmentMatch) {
      usage.push({
        href: `/manage/content/equipment/${item.id}`,
        label: item.name,
        source: 'Technik',
      })
    }
  }

  return usage
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
  const status = readSearchValue(params.status)?.trim() ?? ''
  const message = readSearchValue(params.message)?.trim() ?? ''

  const media = await payload.find({
    collection: 'media',
    limit: 200,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })

  const filteredMedia = media.docs.filter((item) => {
    if (category && item.category !== category) {
      return false
    }

    if (query) {
      const haystack = [item.filename, item.alt, item.caption ?? '', item.category ?? ''].join(' ')
      return matchesText(haystack, query)
    }

    return true
  })

  const selectedMedia = filteredMedia.find((item) => item.id === selectedId) ?? filteredMedia[0] ?? null
  const usage = selectedMedia ? await getMediaUsage(payload, user, selectedMedia.id) : []

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

    const currentUsage = await getMediaUsage(payload, user, id)
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
        <section className={`ff-card ${status === 'error' ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="ff-kicker">Status</p>
          <p className="text-sm font-semibold text-neutral-900">{message}</p>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <div className="grid gap-6">
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
              <p className="text-sm text-neutral-600">{filteredMedia.length} Medien sichtbar</p>
            </div>

            {filteredMedia.length === 0 ? (
              <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
                Keine Medien für diese Filter gefunden.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredMedia.map((item) => (
                  <Link
                    className={`rounded-[1.4rem] border p-3 shadow-[0_10px_24px_rgba(0,45,103,0.06)] transition hover:-translate-y-0.5 ${
                      selectedMedia?.id === item.id ? 'border-[var(--brand-500)] bg-rose-50/60' : 'border-neutral-200 bg-white'
                    }`}
                    href={`/manage/media?selected=${item.id}${category ? `&category=${encodeURIComponent(category)}` : ''}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                    key={item.id}
                  >
                    {item.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.alt} className="h-48 w-full rounded-[1rem] object-cover" src={item.thumbnailURL ?? item.url} />
                    ) : (
                      <div className="ff-media-placeholder h-48 w-full">Keine Vorschau</div>
                    )}
                    <div className="mt-4 grid gap-1">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{item.category ?? 'general'}</p>
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
                  <img alt={selectedMedia.alt} className="h-64 w-full rounded-[1.2rem] object-cover" src={selectedMedia.url} />
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

                <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Dateiinfo</p>
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

                <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Verwendung</p>
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

                <form action={deleteAction} className="rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4">
                  <input name="id" type="hidden" value={selectedMedia.id} />
                  <p className="text-sm font-semibold text-neutral-900">Sicher löschen</p>
                  <p className="mt-2 text-sm text-neutral-700">
                    Löschen ist nur möglich, wenn das Medium aktuell nirgendwo verwendet wird. Tippe zur Bestätigung <code>LOESCHEN</code>.
                  </p>
                  <label className="mt-4 block">
                    <input className="ff-input" name="confirmDelete" placeholder="LOESCHEN" />
                  </label>
                  <button className="ff-btn-ghost mt-4" type="submit">
                    Medium löschen
                  </button>
                </form>
              </>
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
                Kein Medium ausgewählt.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
