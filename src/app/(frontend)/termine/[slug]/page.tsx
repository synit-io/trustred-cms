import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { ShareActions } from '@/components/trustred/ShareActions'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicEventBySlug, getPublicEvents, getSiteSettings } from '@/lib/trustred/cms'
import { eventTypeLabels, formatDateTimeRange, getDateBadgeClass, getEventPath, getEventTypeBadgeClass, getMediaImage, getStatusBadgeClass } from '@/lib/trustred/public-content'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const [event, events, settings] = await Promise.all([getPublicEventBySlug(slug), getPublicEvents(), getSiteSettings()])

  if (!event) {
    notFound()
  }

  const eventImage = getMediaImage(event.featuredImage)
  const relatedEvents = events.filter((entry) => entry.slug !== event.slug).slice(0, 3)

  return (
    <SiteShell pathname="/termine" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <article className="ff-card grid gap-8 overflow-hidden p-6 md:p-8 xl:grid-cols-[minmax(0,1.2fr)_22rem] xl:items-start">
            <div className="order-2 grid gap-6 xl:order-1">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <Link className="transition hover:text-[var(--brand-500)]" href="/">
                    Start
                  </Link>
                  <span>/</span>
                  <Link className="transition hover:text-[var(--brand-500)]" href="/termine">
                    Termine
                  </Link>
                  <span>/</span>
                  <span className="text-neutral-700">Termin</span>
                </div>
                <p className="ff-kicker">Termin</p>
                <h1 className="text-[clamp(2rem,5vw,4rem)]">{event.title}</h1>
                <p className="max-w-3xl text-lg leading-8 text-neutral-700">{event.summary}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={getEventTypeBadgeClass(event.eventType)}>{eventTypeLabels[event.eventType] ?? event.eventType}</span>
                <span className={getDateBadgeClass()}>{formatDateTimeRange(event.startsAt, event.endsAt)}</span>
                <span className={getStatusBadgeClass('info')}>{event.location}</span>
              </div>

            {eventImage?.src ? (
              <div className="overflow-hidden rounded-[1.4rem] border border-neutral-200">
                <Image
                  alt={eventImage.alt}
                  className="h-[18rem] w-full object-cover md:h-[24rem]"
                  height={eventImage.height}
                  src={eventImage.src}
                  width={eventImage.width}
                />
              </div>
            ) : null}

              <div className="grid gap-4">
                <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Hinweise zum Termin</p>
                  <p className="mt-4 text-base leading-8 text-neutral-800">
                    {event.summary || 'Für diesen Termin sind aktuell keine zusätzlichen öffentlichen Hinweise hinterlegt.'}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Organisation</p>
                  <p className="mt-3 text-sm leading-7 text-neutral-700">
                    Nutze den Kalendereintrag für deine persönliche Planung. Bei Rückfragen oder organisatorischem Bedarf erreichst du die Wehr über den Kontaktbereich.
                  </p>
                </div>
                </div>
              </div>
            <aside className="order-1 grid gap-4 xl:order-2 xl:sticky xl:top-6">
              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Zeitpunkt</p>
                <p className="mt-3 text-base font-semibold text-neutral-900">{formatDateTimeRange(event.startsAt, event.endsAt)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Ort</p>
                <p className="mt-3 text-base font-semibold text-neutral-900">{event.location}</p>
              </div>
              <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Teilnahme</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                  {event.registrationEnabled
                    ? 'Für diesen Termin ist eine Anmeldung vorgesehen. Die organisatorische Abstimmung erfolgt intern oder über den veröffentlichten Hinweis.'
                    : 'Dieser öffentliche Termin kommt ohne gesonderte Anmeldung aus, sofern vor Ort nichts anderes kommuniziert wird.'}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Nächster Schritt</p>
                <div className="mt-4 grid gap-3">
                  <Link className="ff-btn-ghost" href={`/termine/${encodeURIComponent(event.slug)}/ics`}>
                    Zum Kalendar hinzufügen
                  </Link>
                  <Link className="ff-btn-accent" href={event.registrationEnabled ? '/mitmachen' : '/kontakt'}>
                    {event.registrationEnabled ? 'Interesse melden' : 'Kontakt'}
                  </Link>
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Teilen</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                  Termin direkt weitergeben oder in den privaten Planungsfluss übernehmen.
                </p>
                <div className="mt-4">
                  <ShareActions title={event.title} url={getEventPath(event.slug)} />
                </div>
              </div>
            </aside>
          </article>

          {relatedEvents.length > 0 ? (
            <section className="grid gap-4">
              <div className="ff-section-head mb-0">
                <p className="ff-kicker">Weitere Termine</p>
                <h2 className="text-[clamp(1.6rem,4vw,2.6rem)]">Was außerdem ansteht</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {relatedEvents.map((relatedEvent) => (
                  <article className="ff-card grid gap-4" key={relatedEvent.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getEventTypeBadgeClass(relatedEvent.eventType)}>
                        {eventTypeLabels[relatedEvent.eventType] ?? relatedEvent.eventType}
                      </span>
                      <span className={getDateBadgeClass()}>{formatDateTimeRange(relatedEvent.startsAt, relatedEvent.endsAt)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl">{relatedEvent.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-neutral-700">{relatedEvent.summary}</p>
                    </div>
                    <div className="mt-auto">
                      <Link className="ff-btn-accent w-full" href={getEventPath(relatedEvent.slug)}>
                        Termin ansehen
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/termine">
              Zur Übersicht
            </Link>
            <Link className="ff-btn-ghost" href="/termine/archiv">
              Archiv
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
