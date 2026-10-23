import 'dotenv/config'

import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'

// Never let destructive integration fixtures reuse the developer's .env database.
process.env.DATABASE_URL = `file:${join(mkdtempSync(join(tmpdir(), 'trustred-vitest-')), 'test.sqlite')}`
process.env.PAYLOAD_SECRET = 'trustred-vitest-secret'
process.env.SETUP_TOKEN = 'trustred-vitest-setup-token'
process.env.SITE_TIMEZONE = 'Europe/Berlin'
process.env.TRUSTRED_PUBLIC_ORIGIN = 'http://localhost:3000'
// Upload fixtures must stay local even when the developer configured real S3 credentials.
for (const key of ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
  process.env[key] = ''
}
