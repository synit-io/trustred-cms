/** Browser auth mutations must originate from the host serving the form. */
export function isSameOriginRequest(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (!origin) return true // Non-browser API clients do not send Origin.
  try {
    const requestUrl = new URL(request.url)
    const host =
      request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host
    return new URL(origin).host === host
  } catch {
    return false
  }
}
