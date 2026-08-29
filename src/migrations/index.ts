import * as migration_20260828_201650_baseline from './20260828_201650_baseline'
import * as migration_20260828_202422_add_form_submission_fingerprint from './20260828_202422_add_form_submission_fingerprint'

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
]
