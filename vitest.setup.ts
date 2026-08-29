import 'dotenv/config'

import { join } from 'node:path'
import { tmpdir } from 'node:os'

process.env.DATABASE_URL ??= `file:${join(
  tmpdir(),
  `trustred-vitest-${process.env.VITEST_POOL_ID ?? process.pid}.sqlite`,
)}`
process.env.PAYLOAD_SECRET ??= 'trustred-vitest-secret'
process.env.SETUP_TOKEN ??= 'trustred-vitest-setup-token'
process.env.SITE_TIMEZONE ??= 'Europe/Berlin'
