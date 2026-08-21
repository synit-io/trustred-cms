import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { permanentRedirect } from 'next/navigation'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { OperationTypeBadge } from '@/components/trustred/OperationTypeBadge'
import { ShareActions } from '@/components/trustred/ShareActions'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicOperationById, getPublicOperations, getSiteSettings } from '@/lib/trustred/cms'
import { getOperationMeta } from '@/lib/trustred/operations'
import { getOperationDetailPath } from '@/lib/trustred/operations'
import { formatDate, getMediaImage, shouldShowImagePlaceholder } from '@/lib/trustred/public-content'

const timeFormat = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function OperationDetailPage({ params }: Props) {
  const { id } = await params
  const [operation, operations, settings] = await Promise.all([getPublicOperationById(id), getPublicOperations(), getSiteSettings()])

  if (!operation) {
    notFound()
  }

  const operationMeta = getOperationMeta(operation.category)
  const detailPath = getOperationDetailPath(operation)
  const canonicalSegment = detailPath.split('/').pop()

  if (canonicalSegment && id !== canonicalSegment) {
    permanentRedirect(detailPath)
  }
  const operationDateLabel = formatDate(operation.startedAt)
  const operationTimeLabel = timeFormat.format(new Date(operation.startedAt))
  const operationImage = getMediaImage(operation.featuredImage)
  const unitsInvolved = (operation.unitsInvolved ?? [])
    .map((entry) => entry?.unit?.trim())
    .filter((entry): entry is string => Boolean(entry))
  const legacyUnitsFallback =
    unitsInvolved.length === 0 && operation.details
      ? operation.details
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : []
  const resolvedUnitsInvolved = unitsInvolved.length > 0 ? unitsInvolved : legacyUnitsFallback
  const relatedOperations = operations.filter((entry) => entry.id !== operation.id).slice(0, 3)

  return (
    <SiteShell pathname="/einsaetze" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <article className="mx-auto grid max-w-5xl gap-6 rounded-[1.6rem] border border-neutral-200 bg-white p-4 shadow-[0_12px_30px_rgba(0,45,103,0.08)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <Link className="transition hover:text-[var(--brand-500)]" href="/">
                    Start
                  </Link>
                  <span>/</span>
                  <Link className="transition hover:text-[var(--brand-500)]" href="/einsaetze">
                    Einsätze
                  </Link>
                  <span>/</span>
                  <span className="text-neutral-700">{operation.operationNumber}</span>
                </div>
                <p className="ff-kicker">Einsatzdetail</p>
                <h1 className="text-[clamp(2rem,5vw,4rem)]">{operation.operationNumber}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ff-pill ff-pill--neutral">{operation.alarmCode}</span>
                  <OperationTypeBadge type={operation.category} />
                </div>
              </div>
              <Link className="ff-btn-ghost" href="/einsaetze">
                Zurück zur Liste
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-4">
                <section className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
                  <p className="ff-kicker mb-0">Einsatzbericht</p>
                  <p className="mt-3 text-base leading-8 text-neutral-800">{operation.summary}</p>
                </section>

                <section className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
                  <h2 className="text-lg">Weitere Informationen</h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-700">
                    {operation.details?.trim()
                      ? operation.details
                      : 'Für diesen Einsatz wurde keine ausführlichere öffentliche Detailbeschreibung hinterlegt.'}
                  </p>
                </section>

                <section className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
                  <h2 className="text-lg">Medien</h2>
                  {operationImage?.src ? (
                    <div className="mt-3 overflow-hidden rounded-[1rem] border border-neutral-200 bg-white">
                      <Image
                        alt={operationImage.alt}
                        className="h-64 w-full object-cover"
                        height={operationImage.height}
                        src={operationImage.src}
                        width={operationImage.width}
                      />
                    </div>
                  ) : shouldShowImagePlaceholder(operation) ? (
                    <div className="mt-3">
                      <MediaPlaceholder className="h-64 w-full" label="Einsatzbild folgt" />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500">Keine Bilder hinterlegt.</p>
                  )}
                </section>
              </div>

              <aside className={`rounded-[1.2rem] border border-neutral-200 p-4 ${operationMeta.rowClass}`}>
                <h2 className="text-xl">Einsatzdaten</h2>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Kategorie</p>
                    <div className="mt-2">
                      <OperationTypeBadge type={operation.category} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Datum</p>
                    <p className="mt-1 text-sm text-neutral-800">{operationDateLabel}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Uhrzeit</p>
                    <p className="mt-1 text-sm text-neutral-800">{operationTimeLabel}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Stichwort</p>
                    <p className="mt-1 text-sm text-neutral-800">{operation.alarmCode}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Einsatzort</p>
                    <p className="mt-1 text-sm text-neutral-800">{operation.location}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Eingesetzte Einheiten</p>
                    {resolvedUnitsInvolved.length > 0 ? (
                      <ul className="mt-1 grid gap-1 text-sm text-neutral-700">
                        {resolvedUnitsInvolved.map((unit) => (
                          <li key={unit}>{unit}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-neutral-500">Keine Einheiten hinterlegt.</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Nächster Schritt</p>
                    <p className="mt-2 text-sm leading-7 text-neutral-700">
                      Weitere Einsatzberichte findest du in der Übersicht. Bei allgemeinen Fragen stehen Kontakt und Sicherheitshinweise direkt bereit.
                    </p>
                    <div className="mt-3 grid gap-2">
                      <Link className="ff-btn-accent w-full" href="/einsaetze">
                        Einsatzhistorie
                      </Link>
                      <Link className="ff-btn-ghost w-full" href="/kontakt">
                        Kontakt
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <section className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
              <h2 className="text-lg">Teilen</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Direktlink kopieren oder den Einsatzbericht weitergeben.
              </p>
              <div className="mt-4">
                <ShareActions title={`Einsatz ${operation.operationNumber}`} url={detailPath} />
              </div>
            </section>
          </article>

          {relatedOperations.length > 0 ? (
            <section className="mx-auto mt-6 grid max-w-5xl gap-4">
              <div className="ff-section-head mb-0">
                <p className="ff-kicker">Weitere Einsätze</p>
                <h2 className="text-[clamp(1.6rem,4vw,2.6rem)]">Weitere freigegebene Einsatzberichte</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {relatedOperations.map((relatedOperation) => (
                  <article className="ff-card grid gap-4" key={relatedOperation.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ff-pill ff-pill--neutral">{relatedOperation.alarmCode}</span>
                      <OperationTypeBadge type={relatedOperation.category} />
                    </div>
                    <div>
                      <h2 className="text-2xl">{relatedOperation.operationNumber}</h2>
                      <p className="mt-3 text-sm leading-7 text-neutral-700">{relatedOperation.summary}</p>
                    </div>
                    <div className="mt-auto">
                      <Link className="ff-btn-accent w-full" href={getOperationDetailPath(relatedOperation)}>
                        Einsatz ansehen
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </SiteShell>
  )
}
