import { revalidateTag, unstable_cache } from 'next/cache'

import type { WarningProvider } from '@/lib/trustred/warning-presets'

type WarningSeverity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown'

export type WarningConfig = {
  dwdRegionIds?: Array<{ regionId?: string | null }> | null
  dwdStates?: Array<{ state?: string | null }> | null
  forecastUrl?: string | null
  ninaArs?: string | null
  provider: WarningProvider
  regionLabel?: string | null
  showWeatherMap?: boolean | null
  showWildfireMap?: boolean | null
  sourceUrl?: string | null
  warningMapUrl?: string | null
  weatherMapUrl?: string | null
  wildfireMapUrl?: string | null
}

export type WarningEntry = {
  description: string
  detailUrl?: string
  endsAt?: string
  headline: string
  instruction?: string
  provider: 'dwd' | 'nina'
  severity: WarningSeverity
  source: string
  startsAt?: string
  tag?: string
}

export type DwdWeatherSnapshot = {
  forecastUrl?: string
  summary: string
  tonightTomorrow: string
  updatedLabel: string
  warningHeadline: string
  warningMapUrl?: string | null
  weatherMapUrl?: string | null
  wildfireMapUrl?: string | null
}

export type WarningSnapshot = {
  dwdWeather?: DwdWeatherSnapshot | null
  entries: WarningEntry[]
  fetchedAt: string
  note?: string
  provider: 'dwd' | 'nina'
  regionLabel: string
  sourceUrl: string
  sourceState?: 'degraded' | 'empty' | 'ok'
  staleAfterSeconds: number
  status?: 'error' | 'fallback' | 'live'
  updatedAt: string
}

const DWD_USER_AGENT = 'Trustred-CMS/1.0'
const DWD_FORECAST_TIMEOUT_MS = 8000
const REMOTE_ASSET_TIMEOUT_MS = 4000
const WARNING_FEED_REVALIDATE_SECONDS = 900
const FORECAST_REVALIDATE_SECONDS = 3600
const allowedWarningHosts = ['dwd.de', 'warnung.bund.de'] as const

function normalizeAllowedWarningUrl(value: string | null | undefined, provider: WarningProvider) {
  const normalized = normalizeOptionalUrl(value)
  if (!normalized) {
    return undefined
  }

  try {
    const url = new URL(normalized)
    const allowedHost = provider === 'dwd' ? allowedWarningHosts[0] : allowedWarningHosts[1]
    const hostname = url.hostname.toLowerCase()
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (hostname !== allowedHost && !hostname.endsWith(`.${allowedHost}`))
    ) {
      return undefined
    }

    return url.toString()
  } catch {
    return undefined
  }
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit & {
    attempts?: number
    timeoutMs?: number
  } = {},
) {
  const { attempts = 2, timeoutMs, ...requestInit } = init
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(input, {
        ...requestInit,
        redirect: 'error',
        signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : requestInit.signal,
      })
    } catch (error) {
      lastError = error
      if (attempt === attempts) {
        throw error
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Warnungsanfrage fehlgeschlagen')
}

function severityFromNumber(level?: number): WarningSeverity {
  if (level === undefined || level === null) return 'unknown'
  if (level >= 4) return 'extreme'
  if (level === 3) return 'severe'
  if (level === 2) return 'moderate'
  return 'minor'
}

function severityFromText(value?: string): WarningSeverity {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized.includes('extreme')) return 'extreme'
  if (normalized.includes('severe')) return 'severe'
  if (normalized.includes('moderate')) return 'moderate'
  if (normalized.includes('minor')) return 'minor'
  return 'unknown'
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ouml;/g, 'oe')
    .replace(/&Ouml;/g, 'Oe')
    .replace(/&uuml;/g, 'ue')
    .replace(/&Uuml;/g, 'Ue')
    .replace(/&auml;/g, 'ae')
    .replace(/&Auml;/g, 'Ae')
    .replace(/&szlig;/g, 'ss')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactParagraph(text: string, maxLength = 280) {
  const normalized = decodeEntities(text)

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`
}

function stripHtml(value?: string) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeOptionalUrl(value?: string | null) {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

function fallbackDwdWeatherSnapshot(config: WarningConfig): DwdWeatherSnapshot {
  const forecastUrl = normalizeAllowedWarningUrl(config.forecastUrl ?? config.sourceUrl, 'dwd')

  return {
    forecastUrl,
    summary:
      'DWD-Live-Daten konnten aktuell nicht geladen werden. Bitte die Detailansicht direkt beim DWD prüfen.',
    tonightTomorrow:
      'Die Seite zeigt ansonsten weiterhin die letzten verfügbaren Warninformationen aus dem DWD-Feed.',
    updatedLabel: 'Nicht verfügbar',
    warningHeadline: `Warnlage ${String(config.regionLabel ?? 'DWD Region')} über den DWD prüfen.`,
    warningMapUrl: normalizeAllowedWarningUrl(config.warningMapUrl, 'dwd') ?? null,
    weatherMapUrl: config.showWeatherMap
      ? (normalizeAllowedWarningUrl(config.weatherMapUrl, 'dwd') ?? null)
      : null,
    wildfireMapUrl: config.showWildfireMap
      ? (normalizeAllowedWarningUrl(config.wildfireMapUrl, 'dwd') ?? null)
      : null,
  }
}

function parseDwdSnapshotFromHtml(html: string, config: WarningConfig): DwdWeatherSnapshot {
  const updatedAtMatch = html.match(/Letzte Aktualisierung:\s*([^<]+)/i)
  const strongHeadlineMatch = html.match(/<p><strong>([\s\S]*?)<\/strong>/i)

  const preBlocks = Array.from(html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi))
    .map((entry) => decodeEntities(entry[1]))
    .filter(Boolean)

  return {
    forecastUrl: normalizeAllowedWarningUrl(config.forecastUrl ?? config.sourceUrl, 'dwd'),
    summary: compactParagraph(preBlocks[0] ?? 'Derzeit liegen keine Detaildaten vor.', 260),
    tonightTomorrow: compactParagraph(
      preBlocks[1] ?? 'Bitte prüfen Sie die aktuelle Lage direkt beim DWD.',
      260,
    ),
    updatedLabel: updatedAtMatch ? decodeEntities(updatedAtMatch[1]) : 'Unbekannt',
    warningHeadline: compactParagraph(
      strongHeadlineMatch?.[1] ??
        `Aktuelle regionale Wetterentwicklung für ${String(config.regionLabel ?? 'DWD Region')}.`,
      220,
    ),
    warningMapUrl: normalizeAllowedWarningUrl(config.warningMapUrl, 'dwd') ?? null,
    weatherMapUrl: config.showWeatherMap
      ? (normalizeAllowedWarningUrl(config.weatherMapUrl, 'dwd') ?? null)
      : null,
    wildfireMapUrl: config.showWildfireMap
      ? (normalizeAllowedWarningUrl(config.wildfireMapUrl, 'dwd') ?? null)
      : null,
  }
}

const getCachedRemoteAssetAvailability = unstable_cache(
  async (url: string) => {
    const safeUrl = normalizeAllowedWarningUrl(url, 'dwd')
    if (!safeUrl) {
      return false
    }

    try {
      const headResponse = await fetchWithRetry(safeUrl, {
        attempts: 2,
        headers: {
          'user-agent': DWD_USER_AGENT,
        },
        method: 'HEAD',
        timeoutMs: REMOTE_ASSET_TIMEOUT_MS,
      })

      if (headResponse.status === 404) {
        return false
      }

      if (headResponse.ok) {
        return true
      }

      const fallbackResponse = await fetchWithRetry(safeUrl, {
        attempts: 2,
        headers: {
          'user-agent': DWD_USER_AGENT,
          range: 'bytes=0-0',
        },
        timeoutMs: REMOTE_ASSET_TIMEOUT_MS,
      })

      return fallbackResponse.status !== 404 && fallbackResponse.ok
    } catch {
      return false
    }
  },
  ['trustred-warning-asset-availability'],
  {
    revalidate: FORECAST_REVALIDATE_SECONDS,
    tags: ['trustred-warnings', 'trustred-warnings-assets'],
  },
)

const getCachedDwdWarnings = unstable_cache(
  async () => {
    const response = await fetchWithRetry(
      'https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json',
      {
        attempts: 2,
        next: { revalidate: WARNING_FEED_REVALIDATE_SECONDS },
        timeoutMs: DWD_FORECAST_TIMEOUT_MS,
      },
    )

    if (!response.ok) {
      throw new Error(`DWD warning request failed: ${response.status}`)
    }

    const text = await response.text()
    const match = text.match(/^warnWetter\.loadWarnings\((.*)\);?$/s)
    if (!match) {
      throw new Error('Unexpected DWD warnings payload format')
    }

    return JSON.parse(match[1]) as {
      time?: number
      warnings?: Record<
        string,
        Array<{
          description?: string
          end?: number
          event?: string
          headline?: string
          instruction?: string
          level?: number
          regionName?: string
          start?: number
          state?: string
        }>
      >
    }
  },
  ['trustred-dwd-warnings'],
  {
    revalidate: WARNING_FEED_REVALIDATE_SECONDS,
    tags: ['trustred-warnings', 'trustred-warnings-dwd'],
  },
)

const getCachedDwdForecastSnapshot = unstable_cache(
  async (
    forecastUrl: string,
    regionLabel: string,
    sourceUrl: string,
    warningMapUrl: string,
    weatherMapUrl: string,
    wildfireMapUrl: string,
  ) => {
    if (!forecastUrl) {
      return fallbackDwdWeatherSnapshot({
        forecastUrl,
        provider: 'dwd',
        regionLabel,
        showWeatherMap: Boolean(weatherMapUrl),
        showWildfireMap: Boolean(wildfireMapUrl),
        sourceUrl,
        warningMapUrl,
        weatherMapUrl,
        wildfireMapUrl,
      })
    }

    try {
      const response = await fetchWithRetry(forecastUrl, {
        attempts: 2,
        headers: {
          'user-agent': DWD_USER_AGENT,
        },
        timeoutMs: DWD_FORECAST_TIMEOUT_MS,
      })

      if (!response.ok) {
        throw new Error(`DWD forecast request failed: ${response.status}`)
      }

      const html = await response.text()
      const parsed = parseDwdSnapshotFromHtml(html, {
        forecastUrl,
        provider: 'dwd',
        regionLabel,
        showWeatherMap: Boolean(weatherMapUrl),
        showWildfireMap: Boolean(wildfireMapUrl),
        sourceUrl,
        warningMapUrl,
        weatherMapUrl,
        wildfireMapUrl,
      })

      const resolvedWeatherMapUrl =
        parsed.weatherMapUrl && (await getCachedRemoteAssetAvailability(parsed.weatherMapUrl))
          ? parsed.weatherMapUrl
          : null
      const resolvedWildfireMapUrl =
        parsed.wildfireMapUrl && (await getCachedRemoteAssetAvailability(parsed.wildfireMapUrl))
          ? parsed.wildfireMapUrl
          : null

      return {
        ...parsed,
        weatherMapUrl: resolvedWeatherMapUrl,
        wildfireMapUrl: resolvedWildfireMapUrl,
      }
    } catch {
      return fallbackDwdWeatherSnapshot({
        forecastUrl,
        provider: 'dwd',
        regionLabel,
        showWeatherMap: Boolean(weatherMapUrl),
        showWildfireMap: Boolean(wildfireMapUrl),
        sourceUrl,
        warningMapUrl,
        weatherMapUrl,
        wildfireMapUrl,
      })
    }
  },
  ['trustred-dwd-forecast-snapshot'],
  {
    revalidate: FORECAST_REVALIDATE_SECONDS,
    tags: ['trustred-warnings', 'trustred-warnings-dwd'],
  },
)

const getCachedNinaDashboard = unstable_cache(
  async (ars: string) => {
    const response = await fetchWithRetry(
      `https://warnung.bund.de/api31/dashboard/${encodeURIComponent(ars)}.json`,
      {
        attempts: 2,
        next: { revalidate: WARNING_FEED_REVALIDATE_SECONDS },
        timeoutMs: DWD_FORECAST_TIMEOUT_MS,
      },
    )

    if (!response.ok) {
      throw new Error(`NINA dashboard request failed: ${response.status}`)
    }

    return (await response.json()) as Array<{
      id?: string
      i18nTitle?: { de?: string }
      payload?: {
        data?: {
          provider?: string
          severity?: string
          transKeys?: {
            event?: string
          }
        }
      }
      sent?: string
    }>
  },
  ['trustred-nina-dashboard'],
  {
    revalidate: WARNING_FEED_REVALIDATE_SECONDS,
    tags: ['trustred-warnings', 'trustred-warnings-nina'],
  },
)

const getCachedNinaDetail = unstable_cache(
  async (id: string) => {
    const response = await fetchWithRetry(
      `https://warnung.bund.de/api31/warnings/${encodeURIComponent(id)}.json`,
      {
        attempts: 2,
        next: { revalidate: WARNING_FEED_REVALIDATE_SECONDS },
        timeoutMs: DWD_FORECAST_TIMEOUT_MS,
      },
    )

    if (!response.ok) {
      return null
    }

    return (await response.json()) as {
      info?: Array<{
        description?: string
        event?: string
        headline?: string
        instruction?: string
        severity?: string
      }>
    }
  },
  ['trustred-nina-detail'],
  {
    revalidate: WARNING_FEED_REVALIDATE_SECONDS,
    tags: ['trustred-warnings', 'trustred-warnings-nina'],
  },
)

async function getDwdSnapshot(config: WarningConfig): Promise<WarningSnapshot> {
  const payload = await getCachedDwdWarnings()
  const selectedIds = (config.dwdRegionIds ?? [])
    .map((item) => String(item?.regionId ?? '').trim())
    .filter(Boolean)
  const selectedStates = (config.dwdStates ?? [])
    .map((item) => String(item?.state ?? '').trim())
    .filter(Boolean)
  const selectedIdSet = new Set(selectedIds)
  const selectedStateSet = new Set(selectedStates)
  const entryKeys = new Set<string>()

  const entries = Object.entries(payload.warnings ?? {})
    .flatMap(([regionId, warnings]) => {
      const state = String(warnings?.[0]?.state ?? '').trim()
      const includeByRegionId = selectedIdSet.has(regionId)
      const includeByState = state ? selectedStateSet.has(state) : false

      if (!includeByRegionId && !includeByState) {
        return []
      }

      return warnings.flatMap((entry) => {
        const entryKey = [
          String(entry.headline ?? entry.event ?? ''),
          stripHtml(entry.description || entry.instruction || entry.event || ''),
          String(entry.start ?? ''),
          String(entry.end ?? ''),
        ].join(':')

        if (entryKeys.has(entryKey)) {
          return []
        }

        entryKeys.add(entryKey)

        return {
          description: stripHtml(entry.description || entry.instruction || entry.event || ''),
          endsAt: entry.end ? new Date(entry.end).toISOString() : undefined,
          headline: String(entry.headline ?? entry.event ?? 'DWD Warnung'),
          instruction: stripHtml(entry.instruction ?? ''),
          provider: 'dwd' as const,
          severity: severityFromNumber(entry.level),
          source: String(entry.regionName ?? entry.state ?? config.regionLabel ?? 'DWD'),
          startsAt: entry.start ? new Date(entry.start).toISOString() : undefined,
          tag: String(entry.event ?? '').trim() || undefined,
        }
      })
    })
    .sort((left, right) => {
      const leftStart = left.startsAt ? new Date(left.startsAt).getTime() : 0
      const rightStart = right.startsAt ? new Date(right.startsAt).getTime() : 0
      return rightStart - leftStart
    })

  const forecastUrl =
    normalizeAllowedWarningUrl(config.forecastUrl ?? config.sourceUrl, 'dwd') ?? ''
  const warningMapUrl = normalizeAllowedWarningUrl(config.warningMapUrl, 'dwd') ?? ''
  const weatherMapUrl = config.showWeatherMap
    ? (normalizeAllowedWarningUrl(config.weatherMapUrl, 'dwd') ?? '')
    : ''
  const wildfireMapUrl = config.showWildfireMap
    ? (normalizeAllowedWarningUrl(config.wildfireMapUrl, 'dwd') ?? '')
    : ''
  const sourceUrl =
    normalizeAllowedWarningUrl(config.sourceUrl ?? config.forecastUrl, 'dwd') ??
    'https://www.dwd.de'

  const dwdWeather = await getCachedDwdForecastSnapshot(
    forecastUrl,
    String(config.regionLabel ?? 'DWD Region'),
    sourceUrl,
    warningMapUrl,
    weatherMapUrl,
    wildfireMapUrl,
  )

  return {
    dwdWeather,
    entries,
    fetchedAt: new Date().toISOString(),
    note:
      entries.length === 0
        ? 'Der Feed ist erreichbar, enthält derzeit aber keine passenden Warnungen.'
        : undefined,
    provider: 'dwd',
    regionLabel: String(config.regionLabel ?? 'DWD Region'),
    sourceUrl,
    sourceState:
      entries.length === 0
        ? 'empty'
        : dwdWeather.updatedLabel === 'Nicht verfügbar'
          ? 'degraded'
          : 'ok',
    staleAfterSeconds: WARNING_FEED_REVALIDATE_SECONDS,
    status: dwdWeather.updatedLabel === 'Nicht verfügbar' ? 'fallback' : 'live',
    updatedAt: payload.time ? new Date(payload.time).toISOString() : new Date().toISOString(),
  }
}

async function getNinaSnapshot(config: WarningConfig): Promise<WarningSnapshot> {
  const ars = String(config.ninaArs ?? '').trim()
  if (!ars) {
    return {
      entries: [],
      fetchedAt: new Date().toISOString(),
      note: 'Es ist keine ARS-Region hinterlegt.',
      provider: 'nina',
      regionLabel: String(config.regionLabel ?? 'NINA Region'),
      sourceUrl:
        normalizeAllowedWarningUrl(config.sourceUrl, 'nina') ?? 'https://warnung.bund.de/meldungen',
      sourceState: 'degraded',
      staleAfterSeconds: WARNING_FEED_REVALIDATE_SECONDS,
      status: 'fallback',
      updatedAt: new Date().toISOString(),
    }
  }

  const dashboard = await getCachedNinaDashboard(ars)
  const seenEntryKeys = new Set<string>()
  const detailedEntries = await Promise.all(
    dashboard.slice(0, 6).map(async (entry) => {
      const id = String(entry.id ?? '').trim()
      const detail = id ? await getCachedNinaDetail(id) : null
      const info = detail?.info?.[0]

      return {
        description: stripHtml(info?.description ?? ''),
        detailUrl: id ? `https://warnung.bund.de/meldung/${encodeURIComponent(id)}` : undefined,
        headline: String(info?.headline ?? entry.i18nTitle?.de ?? 'NINA Warnung'),
        instruction: stripHtml(info?.instruction ?? ''),
        provider: 'nina' as const,
        severity: severityFromText(info?.severity ?? entry.payload?.data?.severity),
        source: String(entry.payload?.data?.provider ?? 'NINA'),
        startsAt: entry.sent ? new Date(entry.sent).toISOString() : undefined,
        tag: String(info?.event ?? entry.payload?.data?.transKeys?.event ?? '').trim() || undefined,
      } satisfies WarningEntry
    }),
  )

  const entries = detailedEntries
    .filter((entry) => {
      const entryKey = [
        entry.headline,
        entry.description,
        entry.startsAt ?? '',
        entry.tag ?? '',
      ].join(':')
      if (seenEntryKeys.has(entryKey)) {
        return false
      }
      seenEntryKeys.add(entryKey)
      return true
    })
    .sort((left, right) => {
      const leftStart = left.startsAt ? new Date(left.startsAt).getTime() : 0
      const rightStart = right.startsAt ? new Date(right.startsAt).getTime() : 0
      return rightStart - leftStart
    })

  return {
    entries,
    fetchedAt: new Date().toISOString(),
    note:
      entries.length === 0
        ? 'NINA ist erreichbar, liefert aktuell aber keine passenden Warnmeldungen.'
        : undefined,
    provider: 'nina',
    regionLabel: String(config.regionLabel ?? 'NINA Region'),
    sourceUrl:
      normalizeAllowedWarningUrl(config.sourceUrl, 'nina') ?? 'https://warnung.bund.de/meldungen',
    sourceState: entries.length === 0 ? 'empty' : 'ok',
    staleAfterSeconds: WARNING_FEED_REVALIDATE_SECONDS,
    status: 'live',
    updatedAt: new Date().toISOString(),
  }
}

export async function getWarningSnapshotFromConfig(
  config: WarningConfig,
): Promise<WarningSnapshot | null> {
  try {
    if (config.provider === 'dwd') {
      return getDwdSnapshot(config)
    }

    if (config.provider === 'nina') {
      return getNinaSnapshot(config)
    }
  } catch (error) {
    return {
      entries: [],
      fetchedAt: new Date().toISOString(),
      note:
        error instanceof Error
          ? error.message
          : 'Warnungsdaten konnten aktuell nicht geladen werden.',
      provider: config.provider,
      regionLabel: String(config.regionLabel ?? 'Warnregion'),
      sourceUrl:
        normalizeAllowedWarningUrl(config.sourceUrl ?? config.forecastUrl, config.provider) ?? '',
      sourceState: 'degraded',
      staleAfterSeconds: WARNING_FEED_REVALIDATE_SECONDS,
      status: 'error',
      updatedAt: new Date().toISOString(),
    }
  }

  return null
}

export function refreshWarningCaches() {
  revalidateTag('trustred-warnings', 'max')
  revalidateTag('trustred-warnings-assets', 'max')
  revalidateTag('trustred-warnings-dwd', 'max')
  revalidateTag('trustred-warnings-nina', 'max')
}
