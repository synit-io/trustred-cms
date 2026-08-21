export const cookieConsentStorageKey = 'trustred-cookie-consent-v1'
export const cookieConsentChangeEvent = 'trustred:consent-changed'
export const cookieConsentOpenManagerEvent = 'trustred:open-consent-manager'

export type CookieConsentCategory = 'essential' | 'analytics' | 'externalMedia' | 'socialMedia'

export type CookieConsentPreferences = Record<CookieConsentCategory, boolean>

export type CookieConsentDecision = 'accepted-all' | 'essential-only' | 'custom'

export type CookieConsentState = {
  decision: CookieConsentDecision
  preferences: CookieConsentPreferences
  updatedAt: string
  version: 1
}

export const defaultCookieConsentPreferences: CookieConsentPreferences = {
  analytics: false,
  essential: true,
  externalMedia: false,
  socialMedia: false,
}

export function createDefaultCookieConsentState(): CookieConsentState {
  return {
    decision: 'essential-only',
    preferences: {
      ...defaultCookieConsentPreferences,
    },
    updatedAt: new Date(0).toISOString(),
    version: 1,
  }
}

export function createAcceptedAllCookieConsentState(): CookieConsentState {
  return {
    decision: 'accepted-all',
    preferences: {
      analytics: true,
      essential: true,
      externalMedia: true,
      socialMedia: true,
    },
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

export function createEssentialOnlyCookieConsentState(): CookieConsentState {
  return {
    decision: 'essential-only',
    preferences: {
      ...defaultCookieConsentPreferences,
    },
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

export function createCustomCookieConsentState(preferences: Partial<CookieConsentPreferences>): CookieConsentState {
  return {
    decision: 'custom',
    preferences: {
      ...defaultCookieConsentPreferences,
      ...preferences,
      essential: true,
    },
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

export function sanitizeCookieConsentState(value: unknown): CookieConsentState | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<CookieConsentState>

  if (candidate.version !== 1) {
    return null
  }

  if (!candidate.preferences || typeof candidate.preferences !== 'object') {
    return null
  }

  const preferences: CookieConsentPreferences = {
    analytics: Boolean((candidate.preferences as Partial<CookieConsentPreferences>).analytics),
    essential: true,
    externalMedia: Boolean((candidate.preferences as Partial<CookieConsentPreferences>).externalMedia),
    socialMedia: Boolean((candidate.preferences as Partial<CookieConsentPreferences>).socialMedia),
  }

  const decision: CookieConsentDecision =
    candidate.decision === 'accepted-all' || candidate.decision === 'custom' || candidate.decision === 'essential-only'
      ? candidate.decision
      : 'custom'

  const updatedAt = typeof candidate.updatedAt === 'string' && candidate.updatedAt.length > 0
    ? candidate.updatedAt
    : new Date().toISOString()

  return {
    decision,
    preferences,
    updatedAt,
    version: 1,
  }
}

export function readCookieConsentState(): CookieConsentState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(cookieConsentStorageKey)
  if (!raw) {
    return null
  }

  try {
    return sanitizeCookieConsentState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeCookieConsentState(state: CookieConsentState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(cookieConsentStorageKey, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(cookieConsentChangeEvent, { detail: state }))
}

export function hasCookieConsent(category: Exclude<CookieConsentCategory, 'essential'>, state?: CookieConsentState | null) {
  const source = state ?? readCookieConsentState()
  if (!source) {
    return false
  }

  return Boolean(source.preferences[category])
}
