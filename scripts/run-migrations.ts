import 'dotenv/config'

import { createClient } from '@libsql/client'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

process.env.TRUSTRED_ALLOW_DEMO_CONTENT ??= 'false'
const BASELINE_MIGRATION_NAME = '20260828_201650_baseline'

async function hasUsersTable() {
  const client = createClient({
    url: process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), 'data/trustred.sqlite')}`,
  })

  try {
    const result = await client.execute({
      args: ['users'],
      sql: "select name from sqlite_master where type = 'table' and name = ?",
    })

    return result.rows.length > 0
  } finally {
    client.close()
  }
}

async function removeDevMigrationMarker() {
  const client = createClient({
    url: process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), 'data/trustred.sqlite')}`,
  })

  try {
    const migrationTable = await client.execute({
      args: ['payload_migrations'],
      sql: "select name from sqlite_master where type = 'table' and name = ?",
    })

    if (migrationTable.rows.length === 0) {
      return
    }

    const result = await client.execute('delete from payload_migrations where batch = -1')
    if (result.rowsAffected > 0) {
      console.log('Removed Payload development-schema migration marker.')
    }
  } finally {
    client.close()
  }
}

async function initializeFreshSchema() {
  const previousNodeEnv = process.env.NODE_ENV
  const previousForcePush = process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
  const previousMigrating = process.env.PAYLOAD_MIGRATING

  process.env.NODE_ENV = 'development'
  process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
  delete process.env.PAYLOAD_MIGRATING

  try {
    await getPayload({ config })
    console.log('Fresh SQLite schema initialized.')
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }

    if (previousForcePush === undefined) {
      delete process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
    } else {
      process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = previousForcePush
    }

    if (previousMigrating === undefined) {
      delete process.env.PAYLOAD_MIGRATING
    } else {
      process.env.PAYLOAD_MIGRATING = previousMigrating
    }
  }
}

async function main() {
  const bundledMigrationIndex = path.resolve(process.cwd(), 'migrations', 'index.js')
  const sourceMigrationIndex = path.resolve(process.cwd(), 'src', 'migrations', 'index.ts')
  const migrationIndex = existsSync(bundledMigrationIndex)
    ? bundledMigrationIndex
    : sourceMigrationIndex

  const existingSchema = await hasUsersTable()

  if (!existsSync(migrationIndex)) {
    if (!existingSchema) {
      await initializeFreshSchema()
      return
    }

    console.log('No bundled migrations found. Skipping migrations.')
    return
  }

  process.env.PAYLOAD_MIGRATING = 'true'

  const migrationModule = (await import(pathToFileURL(migrationIndex).href)) as {
    migrations?: Array<{
      down: (...args: unknown[]) => Promise<void>
      name: string
      up: (...args: unknown[]) => Promise<void>
    }>
  }
  const migrations = migrationModule.migrations ?? []

  if (migrations.length === 0) {
    console.log('Migration bundle is empty. Skipping migrations.')
    return
  }

  const applicableMigrations = existingSchema
    ? migrations.filter((migration) => migration.name !== BASELINE_MIGRATION_NAME)
    : migrations

  if (existingSchema) {
    await removeDevMigrationMarker()
  }

  const payload = await getPayload({ config })
  await payload.db.migrate({ migrations: applicableMigrations })
  console.log('Migrations completed.')
}

void main()
