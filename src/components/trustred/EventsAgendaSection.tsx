import Link from 'next/link'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import {
  eventTypeLabels,
  formatDateTimeRange,
  formatMonthYear,
  getEventPath,
  getEventTypeBadgeClass,
  getMediaImage,
  getStatusBadgeClass,
  shouldShowImagePlaceholder,
} from '@/lib/trustred/public-content'
import type { Event } from '@/payload-types'

type Props = {
  eyebrow?: string | null
  events: Event[]
  headline: string
  intro?: string | null
  mode: 'archive' | 'upcoming'
  currentTimestamp: number
}

export function EventsAgendaSection({
  currentTimestamp,
  eyebrow,
  events,
  headline,
  intro,
  mode,
}: Props) {
  const sortedEvents = events
    .slice()
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())

  const filteredEvents = sortedEvents
    .filter((event) => {
      const comparisonDate = event.endsAt ?? event.startsAt
      const timestamp = new Date(comparisonDate).getTime()
      return mode === 'upcoming' ? timestamp >= currentTimestamp : timestamp < currentTimestamp
    })
    .sort((left, right) =>
      mode === 'upcoming'
        ? new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
        : new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
    )

  const fallbackRecentEvents =
    mode === 'upcoming' && filteredEvents.length === 0
      ? sortedEvents
          .slice()
          .sort(
            (left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
          )
          .slice(0, 3)
      : []

  if (mode === 'archive') {
    return (
      <div className="grid gap-6">
        <div className="ff-section-head">
          {eyebrow ? <p className="ff-kicker">{eyebrow}</p> : null}
          <h2 className="text-[clamp(2rem,5vw,4rem)]">{headline}</h2>
          {intro ? <p className="text-lg leading-8 text-neutral-700">{intro}</p> : null}
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <article
                className="ff-card grid gap-4 md:grid-cols-[0.55fr_1.45fr_auto] md:items-center"
                key={event.id}
              >
                <div>
                  <p className={`${getEventTypeBadgeClass(event.eventType)} w-fit`}>
                    {eventTypeLabels[event.eventType] ?? event.eventType}
                  </p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                    {formatDateTimeRange(event.startsAt, event.endsAt)}
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl">{event.title}</h3>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                    {event.location}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-neutral-700">{event.summary}</p>
                </div>
                <div>
                  <Link className="ff-btn-accent" href={getEventPath(event.slug)}>
                    Detail ansehen
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="ff-card grid gap-4 border-dashed">
            <div>
              <p className="ff-kicker">Noch kein Archivinhalt</p>
              <h3 className="text-[clamp(1.4rem,4vw,2.2rem)]">
                Es sind noch keine vergangenen öffentlichen Termine hinterlegt.
              </h3>
            </div>
            <p className="text-sm leading-7 text-neutral-700">
              Sobald erste Übungen, Aktionen oder Veranstaltungen abgeschlossen und veröffentlicht
              wurden, erscheinen sie hier gesammelt als Rückblick.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="ff-btn-accent" href="/termine">
                Zu den kommenden Terminen
              </Link>
              <Link className="ff-btn-ghost" href="/kontakt">
                Kontakt
              </Link>
            </div>
          </article>
        )}

        <div className="flex flex-wrap gap-3">
          <Link className="ff-btn-accent" href="/termine">
            Zu den kommenden Terminen
          </Link>
          <Link className="ff-btn-ghost" href="/mitmachen">
            Mitmachen
          </Link>
        </div>
      </div>
    )
  }

  const [nextEvent, ...remainingEvents] = filteredEvents
  const leadImage = nextEvent ? getMediaImage(nextEvent.featuredImage) : null
  const groupedEvents = remainingEvents.reduce<Map<string, Event[]>>((groups, event) => {
    const key = formatMonthYear(event.startsAt)
    const existing = groups.get(key) ?? []
    existing.push(event)
    groups.set(key, existing)
    return groups
  }, new Map())

  return (
    <div className="grid gap-6">
      <div className="ff-section-head">
        {eyebrow ? <p className="ff-kicker">{eyebrow}</p> : null}
        <h2 className="text-[clamp(2rem,5vw,4rem)]">{headline}</h2>
        {intro ? <p className="text-lg leading-8 text-neutral-700">{intro}</p> : null}
      </div>

      {nextEvent ? (
        <article className="ff-card grid gap-5 xl:grid-cols-[0.55fr_1.45fr] xl:items-center">
          <div className="grid gap-4">
            {leadImage?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={leadImage.alt}
                className="h-56 w-full rounded-[1.4rem] object-cover"
                src={leadImage.src}
              />
            ) : shouldShowImagePlaceholder(nextEvent) ? (
              <MediaPlaceholder className="h-56 w-full" label="Kein Terminbild hinterlegt" />
            ) : null}
            <div className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                Nächster öffentlicher Termin
              </p>
              <p className="mt-4 font-headline text-4xl text-[var(--brand-500)]">
                {formatDateTimeRange(nextEvent.startsAt, nextEvent.endsAt)}
              </p>
              <p className="mt-4 text-sm leading-7 text-neutral-700">{nextEvent.location}</p>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={getStatusBadgeClass('brand')}>Demnächst</span>
              <span className={getEventTypeBadgeClass(nextEvent.eventType)}>
                {eventTypeLabels[nextEvent.eventType] ?? nextEvent.eventType}
              </span>
              {nextEvent.registrationEnabled ? (
                <span className={getStatusBadgeClass('published')}>Anmeldung aktiv</span>
              ) : null}
            </div>
            <h3 className="mt-4 text-[clamp(1.8rem,4vw,3rem)]">{nextEvent.title}</h3>
            <p className="mt-3 text-base leading-8 text-neutral-700">{nextEvent.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="ff-btn-accent" href={getEventPath(nextEvent.slug)}>
                Termin ansehen
              </Link>
              <Link
                className="ff-btn-ghost"
                href={`/termine/${encodeURIComponent(nextEvent.slug)}/ics`}
              >
                Zum Kalendar hinzufügen
              </Link>
              <Link className="ff-btn-ghost" href="/termine/archiv">
                Archiv
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      <div className="grid gap-6">
        {[...groupedEvents.entries()].map(([month, monthEvents]) => (
          <section className="grid gap-4" key={month}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl">{month}</h3>
              <span className={getStatusBadgeClass('neutral')}>{monthEvents.length} Termine</span>
            </div>
            <div className="grid gap-4">
              {monthEvents.map((event) => (
                <article
                  className="ff-card grid gap-4 md:grid-cols-[0.6fr_1.4fr_auto] md:items-center"
                  key={event.id}
                >
                  <div>
                    <p className={`${getEventTypeBadgeClass(event.eventType)} w-fit`}>
                      {eventTypeLabels[event.eventType] ?? event.eventType}
                    </p>
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                      {formatDateTimeRange(event.startsAt, event.endsAt)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-2xl">{event.title}</h4>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                      {event.location}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-neutral-700">{event.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.registrationEnabled ? (
                      <span className={getStatusBadgeClass('published')}>Anmeldung aktiv</span>
                    ) : null}
                    <Link
                      className="ff-btn-ghost"
                      href={`/termine/${encodeURIComponent(event.slug)}/ics`}
                    >
                      Zum Kalendar hinzufügen
                    </Link>
                    <Link className="ff-btn-accent" href={getEventPath(event.slug)}>
                      Termin ansehen
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!nextEvent ? (
        <div className="grid gap-4">
          <article className="ff-card grid gap-4 border-dashed">
            <div>
              <p className="ff-kicker">Aktuell ruhig</p>
              <h3 className="text-[clamp(1.4rem,4vw,2.2rem)]">
                Aktuell sind keine kommenden öffentlichen Termine hinterlegt.
              </h3>
            </div>
            <p className="text-sm leading-7 text-neutral-700">
              Vergangene Einträge findest du weiterhin im Archiv. Für allgemeines Interesse an
              Ausbildung, Mitmachen oder Veranstaltungen hilft die Kontaktseite direkt weiter.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="ff-btn-accent" href="/termine/archiv">
                Archiv ansehen
              </Link>
              <Link className="ff-btn-ghost" href="/kontakt">
                Kontakt
              </Link>
            </div>
          </article>

          {fallbackRecentEvents.length > 0 ? (
            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl">Zuletzt veröffentlichte Termine</h3>
                <span className={getStatusBadgeClass('neutral')}>
                  {fallbackRecentEvents.length} Einträge
                </span>
              </div>
              <div className="grid gap-4">
                {fallbackRecentEvents.map((event) => (
                  <article
                    className="ff-card grid gap-4 md:grid-cols-[0.6fr_1.4fr_auto] md:items-center"
                    key={`recent-${event.id}`}
                  >
                    <div>
                      <p className={`${getEventTypeBadgeClass(event.eventType)} w-fit`}>
                        {eventTypeLabels[event.eventType] ?? event.eventType}
                      </p>
                      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                        {formatDateTimeRange(event.startsAt, event.endsAt)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-2xl">{event.title}</h4>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                        {event.location}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-neutral-700">{event.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="ff-btn-ghost"
                        href={`/termine/${encodeURIComponent(event.slug)}/ics`}
                      >
                        Zum Kalendar hinzufügen
                      </Link>
                      <Link className="ff-btn-accent" href={getEventPath(event.slug)}>
                        Termin ansehen
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <article className="ff-card">
          <p className="ff-kicker">Hinweis</p>
          <p className="text-sm leading-7 text-neutral-700">
            Die Startübersicht zeigt nur kommende Termine. Vergangene Veranstaltungen und Rückblicke
            liegen bewusst getrennt im Archiv.
          </p>
        </article>
        <div className="flex justify-end">
          <Link className="ff-btn-ghost" href="/termine/archiv">
            Vergangene Termine ansehen
          </Link>
        </div>
      </div>
    </div>
  )
}
