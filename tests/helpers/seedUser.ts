import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import type { User } from '../../src/payload-types'

export const testUser = {
  displayName: 'Payload Dev',
  email: 'dev@payloadcms.com',
  password: 'test',
  roles: ['super-admin'] as NonNullable<User['roles']>,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  const user = await payload.create({
    collection: 'users',
    data: testUser,
  })

  await payload.updateGlobal({
    slug: 'setup-state',
    data: {
      currentStep: 'done',
      skippedAt: new Date().toISOString(),
      status: 'skipped',
      version: 1,
    },
    overrideAccess: false,
    user,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
