import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const email = process.env.TRUSTRED_EDITOR_EMAIL || 'dev@payloadcms.com'
  const password = process.env.TRUSTRED_EDITOR_PASSWORD || 'test-password-123'

  try {
    if (password.length < 12) {
      throw new Error('TRUSTRED_EDITOR_PASSWORD must contain at least 12 characters.')
    }
    await payload.delete({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        displayName: 'Trustred Dev User',
        email,
        password,
        roles: ['super-admin'],
      },
    })

    console.log(`Seeded editorial user: ${email}`)
  } finally {
    await payload.destroy()
  }
}

void main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  },
)
