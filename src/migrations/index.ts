import * as migration_20260828_201650_baseline from './20260828_201650_baseline'
import * as migration_20260828_202422_add_form_submission_fingerprint from './20260828_202422_add_form_submission_fingerprint'
import * as migration_20260911_195146_add_site_logo from './20260911_195146_add_site_logo'

export const migrations = [
  {
    up: migration_20260828_201650_baseline.up,
    down: migration_20260828_201650_baseline.down,
    name: '20260828_201650_baseline',
  },
  {
    up: migration_20260828_202422_add_form_submission_fingerprint.up,
    down: migration_20260828_202422_add_form_submission_fingerprint.down,
    name: '20260828_202422_add_form_submission_fingerprint',
  },
  {
    up: migration_20260911_195146_add_site_logo.up,
    down: migration_20260911_195146_add_site_logo.down,
    name: '20260911_195146_add_site_logo',
  },
]
