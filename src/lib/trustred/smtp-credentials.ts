import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

import { getPayloadSecret } from './environment'

const prefix = 'trustred:smtp:v1:'

function getKey() {
  return Buffer.from(
    hkdfSync('sha256', getPayloadSecret(), 'trustred-smtp', 'credential-encryption-v1', 32),
  )
}

/** Legacy plaintext remains readable until the startup migration encrypts it. */
export function decryptSMTPPassword(value: string) {
  if (!value.startsWith(prefix)) return value
  try {
    const [iv, tag, ciphertext, extra] = value.slice(prefix.length).split(':')
    if (!iv || !tag || !ciphertext || extra !== undefined) throw new Error('Invalid format')
    const nonce = Buffer.from(iv, 'base64')
    const authTag = Buffer.from(tag, 'base64')
    if (nonce.length !== 12 || authTag.length !== 16) throw new Error('Invalid format')
    const decipher = createDecipheriv('aes-256-gcm', getKey(), nonce)
    decipher.setAuthTag(authTag)
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new Error(
      'SMTP credential could not be decrypted. Restore the original PAYLOAD_SECRET or enter the SMTP password again.',
    )
  }
}

/** Authenticate existing ciphertext before preserving it; never double-encrypt a saved password. */
export function encryptSMTPPassword(value: string) {
  if (!value) return value
  if (value.startsWith(prefix)) {
    decryptSMTPPassword(value)
    return value
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `${prefix}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${ciphertext.toString('base64')}`
}
