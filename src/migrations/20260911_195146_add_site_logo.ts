import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

type ColumnRow = { name?: unknown }

async function hasColumn(db: MigrateUpArgs['db'], table: string, column: string) {
  const columns = await db.run(sql.raw(`PRAGMA table_info('${table}');`))
  return columns.rows.some((row) => String((row as ColumnRow).name) === column)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (!(await hasColumn(db, 'site_settings', 'theme_logo_id'))) {
    await db.run(
      sql`ALTER TABLE \`site_settings\` ADD \`theme_logo_id\` integer REFERENCES media(id);`,
    )
  }

  if (!(await hasColumn(db, 'site_settings', 'theme_brand_mark'))) {
    await db.run(sql`ALTER TABLE \`site_settings\` ADD \`theme_brand_mark\` text DEFAULT 'flame';`)
  }

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`site_settings_theme_theme_logo_idx\` ON \`site_settings\` (\`theme_logo_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`site_settings_theme_theme_logo_idx\`;`)

  if (await hasColumn(db, 'site_settings', 'theme_brand_mark')) {
    await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_brand_mark\`;`)
  }

  if (await hasColumn(db, 'site_settings', 'theme_logo_id')) {
    await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_logo_id\`;`)
  }
}
