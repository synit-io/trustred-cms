import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

import { decryptSMTPPassword, encryptSMTPPassword } from '../lib/trustred/smtp-credentials'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const result = await db.run(
    sql`SELECT id, smtp_password FROM site_settings WHERE smtp_password IS NOT NULL`,
  )
  for (const row of result.rows) {
    const password = String(row.smtp_password)
    const encrypted = encryptSMTPPassword(password)
    if (encrypted !== password) {
      await db.run(sql`UPDATE site_settings SET smtp_password = ${encrypted} WHERE id = ${row.id}`)
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const result = await db.run(
    sql`SELECT id, smtp_password FROM site_settings WHERE smtp_password IS NOT NULL`,
  )
  for (const row of result.rows) {
    await db.run(
      sql`UPDATE site_settings SET smtp_password = ${decryptSMTPPassword(String(row.smtp_password))} WHERE id = ${row.id}`,
    )
  }
}
