import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const email = process.env.TRUSTRED_EDITOR_EMAIL || 'dev@payloadcms.com'
  const password = process.env.TRUSTRED_EDITOR_PASSWORD || 'test'

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
}

void main()
