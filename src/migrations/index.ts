import * as migration_20260828_201650_baseline from './20260828_201650_baseline'
import * as migration_20260828_202422_add_form_submission_fingerprint from './20260828_202422_add_form_submission_fingerprint'
import * as migration_20260911_195146_add_site_logo from './20260911_195146_add_site_logo'
import * as migration_20261003_213000_encrypt_smtp_password from './20261003_213000_encrypt_smtp_password'
import * as migration_20261004_092954_upgrade_payload_3_90_2 from './20261004_092954_upgrade_payload_3_90_2'

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
  {
    up: migration_20261003_213000_encrypt_smtp_password.up,
    down: migration_20261003_213000_encrypt_smtp_password.down,
    name: '20261003_213000_encrypt_smtp_password',
  },
  {
    up: migration_20261004_092954_upgrade_payload_3_90_2.up,
    down: migration_20261004_092954_upgrade_payload_3_90_2.down,
    name: '20261004_092954_upgrade_payload_3_90_2',
  },
]
