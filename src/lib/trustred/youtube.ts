const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/

export function parseYouTubeVideoId(value: string | null | undefined): string {
  const rawValue = String(value ?? '').trim()
  if (!rawValue) {
    return ''
  }

  if (youtubeIdPattern.test(rawValue)) {
    return rawValue
  }

  try {
    const url = new URL(rawValue)
    const hostname = url.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const pathId = url.pathname.split('/').filter(Boolean)[0]
      return youtubeIdPattern.test(pathId ?? '') ? pathId : ''
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const watchId = url.searchParams.get('v')
      if (youtubeIdPattern.test(watchId ?? '')) {
        return watchId ?? ''
      }

      const segments = url.pathname.split('/').filter(Boolean)
      const markerIndex = segments.findIndex((segment) => ['embed', 'shorts', 'live', 'v'].includes(segment))
      if (markerIndex >= 0) {
        const candidate = segments[markerIndex + 1]
        return youtubeIdPattern.test(candidate ?? '') ? candidate : ''
      }
    }
  } catch {
    return ''
  }

  return ''
}

export function buildYouTubeNoCookieEmbedUrl(videoId: string): string {
  const normalizedId = parseYouTubeVideoId(videoId)
  if (!normalizedId) {
    return ''
  }

  return `https://www.youtube-nocookie.com/embed/${normalizedId}?rel=0&modestbranding=1`
}
