export function safeFormRedirectPath(value: string | null | undefined) {
  const path = String(value ?? '').trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null
  try {
    const url = new URL(path, 'https://trustred.invalid')
    if (url.origin !== 'https://trustred.invalid') return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
