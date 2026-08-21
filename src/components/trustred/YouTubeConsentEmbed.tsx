'use client'

import { useMemo, useSyncExternalStore } from 'react'

import {
  cookieConsentChangeEvent,
  cookieConsentOpenManagerEvent,
  cookieConsentStorageKey,
  sanitizeCookieConsentState,
} from '@/lib/trustred/cookie-consent'
import { buildYouTubeNoCookieEmbedUrl, parseYouTubeVideoId } from '@/lib/trustred/youtube'

type Props = {
  title: string
  videoIdOrUrl: string
}

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

function hasExternalMediaConsent(snapshot: string | null) {
  if (!snapshot) {
    return false
  }

  try {
    return Boolean(sanitizeCookieConsentState(JSON.parse(snapshot))?.preferences.externalMedia)
  } catch {
    return false
  }
}

export function YouTubeConsentEmbed({ title, videoIdOrUrl }: Props) {
  const consentSnapshot = useSyncExternalStore(
    subscribeToCookieConsentChanges,
    getCookieConsentSnapshot,
    () => null,
  )
  const hasMediaConsent = useMemo(() => hasExternalMediaConsent(consentSnapshot), [consentSnapshot])
  const videoId = useMemo(() => parseYouTubeVideoId(videoIdOrUrl), [videoIdOrUrl])
  const embedUrl = useMemo(() => buildYouTubeNoCookieEmbedUrl(videoId), [videoId])

  if (!videoId || !embedUrl) {
    return (
      <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
        Ungueltige YouTube-URL oder Video-ID. Bitte im Seitenbuilder eine gueltige YouTube-Adresse
        eintragen.
      </div>
    )
  }

  if (!hasMediaConsent) {
    return (
      <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-6">
        <p className="ff-kicker">Externer Inhalt</p>
        <h3 className="text-xl">YouTube-Video ist datenschutzgeschuetzt blockiert</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          Das Video wird erst geladen, wenn du unter Cookie-Einstellungen externe Medien erlaubst.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="ff-btn-accent min-h-9 px-3"
            onClick={() => window.dispatchEvent(new Event(cookieConsentOpenManagerEvent))}
            type="button"
          >
            Cookie-Einstellungen oeffnen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ff-youtube-embed">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        title={title}
      />
    </div>
  )
}
