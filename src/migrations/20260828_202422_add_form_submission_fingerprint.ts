import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const columns = await db.run(sql`PRAGMA table_info('form_submissions');`)
  const hasFingerprint = columns.rows.some(
    (row) => String((row as { name?: unknown }).name) === 'request_fingerprint',
  )

  if (!hasFingerprint) {
    await db.run(sql`ALTER TABLE \`form_submissions\` ADD \`request_fingerprint\` text;`)
  }

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`form_submissions_request_fingerprint_idx\` ON \`form_submissions\` (\`request_fingerprint\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`form_submissions_request_fingerprint_idx\`;`)

  const columns = await db.run(sql`PRAGMA table_info('form_submissions');`)
  const hasFingerprint = columns.rows.some(
    (row) => String((row as { name?: unknown }).name) === 'request_fingerprint',
  )

  if (hasFingerprint) {
    await db.run(sql`ALTER TABLE \`form_submissions\` DROP COLUMN \`request_fingerprint\`;`)
  }
}
