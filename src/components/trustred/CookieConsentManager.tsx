'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import {
  cookieConsentChangeEvent,
  cookieConsentStorageKey,
  cookieConsentOpenManagerEvent,
  createAcceptedAllCookieConsentState,
  createCustomCookieConsentState,
  createDefaultCookieConsentState,
  createEssentialOnlyCookieConsentState,
  readCookieConsentState,
  sanitizeCookieConsentState,
  writeCookieConsentState,
  type CookieConsentState,
} from '@/lib/trustred/cookie-consent'

const cookieCategories = [
  {
    description: 'Erforderlich für Login, Sicherheit und grundlegende Seitenfunktionen.',
    key: 'essential',
    label: 'Essenzielle Cookies',
    required: true,
  },
  {
    description: 'Externe Inhalte wie YouTube-Einbettungen über die datensparsame nocookie-Domain.',
    key: 'externalMedia',
    label: 'Externe Medien',
    required: false,
  },
  {
    description: 'Social-Media-Plugins und verknüpfte Drittanbieter-Widgets.',
    key: 'socialMedia',
    label: 'Social Media',
    required: false,
  },
  {
    description: 'Nutzungsanalyse und Reichweitenmessung, falls aktiviert.',
    key: 'analytics',
    label: 'Analyse',
    required: false,
  },
] as const

function getCookieConsentSnapshot() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(cookieConsentStorageKey)
}

function subscribeToCookieConsentChanges(onStoreChange: () => void) {
  window.addEventListener(cookieConsentChangeEvent, onStoreChange)
  window.addEventListener('storage', onStoreChange)

  return () => {
    window.removeEventListener(cookieConsentChangeEvent, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

function parseCookieConsentSnapshot(snapshot: string | null) {
  if (!snapshot) {
    return null
  }

  try {
    return sanitizeCookieConsentState(JSON.parse(snapshot))
  } catch {
    return null
  }
}

function getDraftPreferencesFromState(state: CookieConsentState | null) {
  const source = state ?? createDefaultCookieConsentState()

  return {
    analytics: source.preferences.analytics,
    externalMedia: source.preferences.externalMedia,
    socialMedia: source.preferences.socialMedia,
  }
}

export function CookieConsentManager() {
  const consentSnapshot = useSyncExternalStore(
    subscribeToCookieConsentChanges,
    getCookieConsentSnapshot,
    () => null,
  )
  const consentState = useMemo(() => parseCookieConsentSnapshot(consentSnapshot), [consentSnapshot])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftPreferences, setDraftPreferences] = useState({
    analytics: false,
    externalMedia: false,
    socialMedia: false,
  })

  function openSettings() {
    setDraftPreferences(getDraftPreferencesFromState(readCookieConsentState()))
    setSettingsOpen(true)
  }

  useEffect(() => {
    function handleOpenManager() {
      setDraftPreferences(getDraftPreferencesFromState(readCookieConsentState()))
      setSettingsOpen(true)
    }

    window.addEventListener(cookieConsentOpenManagerEvent, handleOpenManager)

    return () => {
      window.removeEventListener(cookieConsentOpenManagerEvent, handleOpenManager)
    }
  }, [])

  const hasDecision = Boolean(consentState)

  return (
    <>
      {!hasDecision ? (
        <section className="ff-cookie-banner" role="dialog" aria-label="Cookie-Hinweis">
          <div className="ff-cookie-banner__content">
            <p className="ff-kicker">Datenschutz</p>
            <h2 className="text-2xl">Cookie-Einstellungen für externe Inhalte</h2>
            <p className="mt-2 text-sm leading-7 text-neutral-700">
              Wir verwenden nur notwendige Cookies standardmäßig. Externe Medien wie YouTube,
              Social-Media-Plugins und Analyse werden erst nach Zustimmung aktiviert.
            </p>
          </div>
          <div className="ff-cookie-banner__actions">
            <button
              className="ff-btn-ghost min-h-9 px-3"
              onClick={() => {
                const state = createEssentialOnlyCookieConsentState()
                writeCookieConsentState(state)
                setSettingsOpen(false)
              }}
              type="button"
            >
              Nur essenziell
            </button>
            <button className="ff-btn-ghost min-h-9 px-3" onClick={openSettings} type="button">
              Einstellungen
            </button>
            <button
              className="ff-btn-accent min-h-9 px-3"
              onClick={() => {
                const state = createAcceptedAllCookieConsentState()
                writeCookieConsentState(state)
                setSettingsOpen(false)
              }}
              type="button"
            >
              Alle akzeptieren
            </button>
          </div>
        </section>
      ) : null}

      <button
        aria-label="Cookie-Einstellungen öffnen"
        className="ff-cookie-settings-btn"
        onClick={openSettings}
        type="button"
      >
        <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
          <path
            d="M13.56 2.63a1 1 0 0 1 .68 1.02A4.25 4.25 0 0 0 19.9 8.3a1 1 0 0 1 1.02.68c.2.62.3 1.27.3 1.95A10.22 10.22 0 1 1 11.07.7c.68 0 1.33.1 1.95.3Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <circle cx="9" cy="9.5" fill="currentColor" r="1.1" />
          <circle cx="14.5" cy="13" fill="currentColor" r="1.35" />
          <circle cx="8.5" cy="15" fill="currentColor" r="1" />
        </svg>
      </button>

      {settingsOpen ? (
        <div
          className="ff-cookie-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Cookie-Einstellungen"
        >
          <div className="ff-cookie-modal__backdrop" onClick={() => setSettingsOpen(false)} />
          <div className="ff-cookie-modal__panel">
            <div>
              <p className="ff-kicker">Datenschutzcenter</p>
              <h3 className="text-2xl">Cookie- und Plugin-Einstellungen</h3>
              <p className="mt-2 text-sm leading-7 text-neutral-700">
                Hier steuerst du Cookies und Drittanbieter-Integrationen wie YouTube-Einbettungen
                oder Social-Media-Plugins.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {cookieCategories.map((category) => {
                const checked =
                  category.required ||
                  (category.key === 'analytics'
                    ? draftPreferences.analytics
                    : category.key === 'externalMedia'
                      ? draftPreferences.externalMedia
                      : draftPreferences.socialMedia)

                return (
                  <label className="ff-cookie-option" key={category.key}>
                    <div>
                      <p className="font-semibold text-neutral-900">{category.label}</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {category.description}
                      </p>
                    </div>
                    <input
                      checked={checked}
                      disabled={category.required}
                      onChange={(event) => {
                        setDraftPreferences((current) => ({
                          analytics:
                            category.key === 'analytics' ? event.target.checked : current.analytics,
                          externalMedia:
                            category.key === 'externalMedia'
                              ? event.target.checked
                              : current.externalMedia,
                          socialMedia:
                            category.key === 'socialMedia'
                              ? event.target.checked
                              : current.socialMedia,
                        }))
                      }}
                      type="checkbox"
                    />
                  </label>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="ff-btn-ghost min-h-9 px-3"
                onClick={() => {
                  const state = createEssentialOnlyCookieConsentState()
                  writeCookieConsentState(state)
                  setSettingsOpen(false)
                }}
                type="button"
              >
                Nur essenziell
              </button>
              <button
                className="ff-btn-ghost min-h-9 px-3"
                onClick={() => {
                  const state = createAcceptedAllCookieConsentState()
                  writeCookieConsentState(state)
                  setSettingsOpen(false)
                }}
                type="button"
              >
                Alle akzeptieren
              </button>
              <button
                className="ff-btn-accent min-h-9 px-3"
                onClick={() => {
                  const state = createCustomCookieConsentState({
                    analytics: draftPreferences.analytics,
                    externalMedia: draftPreferences.externalMedia,
                    socialMedia: draftPreferences.socialMedia,
                  })
                  writeCookieConsentState(state)
                  setSettingsOpen(false)
                }}
                type="button"
              >
                Auswahl speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
