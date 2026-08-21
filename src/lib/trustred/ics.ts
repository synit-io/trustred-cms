import type { Event as PayloadEvent } from '@/payload-types'

function formatIcsDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function createEventIcs(event: PayloadEvent) {
  const startsAt = new Date(event.startsAt)
  const endsAt = event.endsAt ? new Date(event.endsAt) : new Date(startsAt.getTime() + 2 * 60 * 60 * 1000)
  const stamp = new Date()

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trustred CMS//Events//DE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@trustred-cms`,
    `DTSTAMP:${formatIcsDate(stamp)}`,
    `DTSTART:${formatIcsDate(startsAt)}`,
    `DTEND:${formatIcsDate(endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.summary)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
