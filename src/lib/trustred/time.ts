export function getCurrentTimestamp() {
  return Date.now()
}

const defaultSiteTimeZone = 'Europe/Berlin'

export function getSiteTimeZone() {
  const timeZone = process.env.SITE_TIMEZONE?.trim() || defaultSiteTimeZone

  try {
    new Intl.DateTimeFormat('en', { timeZone }).format()
    return timeZone
  } catch {
    throw new Error(`SITE_TIMEZONE is not a valid IANA timezone: ${timeZone}`)
  }
}

function getDateTimeParts(value: Date, timeZone = getSiteTimeZone()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(value)

  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
}

export function parseSiteDateTime(value: string) {
  const normalized = value.trim()
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) {
    throw new Error('Ungültiges Datum oder ungültige Uhrzeit.')
  }

  const [, year, month, day, hour, minute, second = '00'] = match
  const expectedEpoch = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
  let candidateEpoch = expectedEpoch
  const timeZone = getSiteTimeZone()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getDateTimeParts(new Date(candidateEpoch), timeZone)
    const observedEpoch = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    candidateEpoch += expectedEpoch - observedEpoch
  }

  const resolved = new Date(candidateEpoch)
  const resolvedParts = getDateTimeParts(resolved, timeZone)
  if (
    resolvedParts.year !== year ||
    resolvedParts.month !== month ||
    resolvedParts.day !== day ||
    resolvedParts.hour !== hour ||
    resolvedParts.minute !== minute ||
    resolvedParts.second !== second
  ) {
    throw new Error('Datum oder Uhrzeit existiert in der konfigurierten Zeitzone nicht.')
  }

  return resolved.toISOString()
}

export function formatSiteDateTimeInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = getDateTimeParts(date)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function isSameSiteDate(left: Date, right: Date) {
  const leftParts = getDateTimeParts(left)
  const rightParts = getDateTimeParts(right)
  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  )
}
