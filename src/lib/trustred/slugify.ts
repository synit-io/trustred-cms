const germanTransliterationMap: Record<string, string> = {
  Ä: 'Ae',
  Ö: 'Oe',
  Ü: 'Ue',
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

export function normalizeGermanText(value: string) {
  return value.replace(/[ÄÖÜäöüß]/g, (character) => germanTransliterationMap[character] ?? character)
}

export function toPublicSlug(value: string) {
  return normalizeGermanText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function legacyBuggySlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resolvePublicSlug(storedSlug?: string | null, sourceText?: string | null) {
  const normalizedStoredSlug = toPublicSlug(String(storedSlug ?? ''))
  const normalizedSourceSlug = toPublicSlug(String(sourceText ?? ''))

  if (!normalizedStoredSlug) {
    return normalizedSourceSlug
  }

  if (!normalizedSourceSlug) {
    return normalizedStoredSlug
  }

  const buggySourceSlug = legacyBuggySlug(String(sourceText ?? ''))

  if (normalizedStoredSlug === buggySourceSlug) {
    return normalizedSourceSlug
  }

  return normalizedStoredSlug
}

export function normalizePublicPath(value: string) {
  const segments = value
    .split('/')
    .map((segment) => toPublicSlug(segment.trim()))
    .filter(Boolean)

  const deduped = segments.filter((segment, index) => index === 0 || segment !== segments[index - 1])
  return deduped.length === 0 ? '/' : `/${deduped.join('/')}`
}
