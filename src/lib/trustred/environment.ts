/** The same stable secret protects sessions, request fingerprints, and SMTP credentials. */
export function getPayloadSecret() {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) throw new Error('PAYLOAD_SECRET is required in all environments.')
  return secret
}

export function validateStorageEnvironment() {
  const required = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const
  const configured = required.filter((key) => process.env[key]?.trim())
  if (configured.length > 0 && configured.length !== required.length) {
    throw new Error(`Incomplete S3 configuration. Required variables: ${required.join(', ')}.`)
  }
}
