/** The same stable secret protects sessions, request fingerprints, and SMTP credentials. */
export function getPayloadSecret() {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) throw new Error('PAYLOAD_SECRET is required in all environments.')
  return secret
}

/** Payload's cookie CSRF check needs an explicit canonical browser origin. */
export function getPublicOrigin() {
  const configured = process.env.TRUSTRED_PUBLIC_ORIGIN?.trim()
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('TRUSTRED_PUBLIC_ORIGIN is required in production.')
  }
  const value = configured || 'http://localhost:3000'
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('TRUSTRED_PUBLIC_ORIGIN must be an HTTP(S) origin.')
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('TRUSTRED_PUBLIC_ORIGIN must be an HTTP(S) origin.')
  }
  return url.origin
}

export function validateStorageEnvironment() {
  const required = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const
  const configured = required.filter((key) => process.env[key]?.trim())
  if (configured.length > 0 && configured.length !== required.length) {
    throw new Error(`Incomplete S3 configuration. Required variables: ${required.join(', ')}.`)
  }
}
