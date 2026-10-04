import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

async function hasResetPasswordRequestedAt(db: MigrateUpArgs['db']) {
  const columns = await db.run(sql`PRAGMA table_info('users');`)
  return columns.rows.some((row) => row.name === 'reset_password_requested_at')
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await hasResetPasswordRequestedAt(db))) {
    await db.run(sql`ALTER TABLE \`users\` ADD \`reset_password_requested_at\` text;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (await hasResetPasswordRequestedAt(db)) {
    await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`reset_password_requested_at\`;`)
  }
}
