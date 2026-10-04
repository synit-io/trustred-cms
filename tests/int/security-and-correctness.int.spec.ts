// @vitest-environment node
import { sql, type MigrateUpArgs } from '@payloadcms/db-sqlite'
import { createLocalReq, getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { getPageBySlug, getPublicFaqs } from '@/lib/trustred/cms'
import { saveCollectionDoc } from '@/lib/trustred/editorial'
import { sanitizeHtmlFragment } from '@/lib/trustred/html'
import { createLexicalTextContent } from '@/lib/trustred/lexical'
import { submitConfiguredForm, validatePublicFormSubmission } from '@/lib/trustred/public-forms'
import { createInitialAdmin } from '@/lib/trustred/setup'
import { parseSiteDateTime } from '@/lib/trustred/time'
import { decryptSMTPPassword, encryptSMTPPassword } from '@/lib/trustred/smtp-credentials'
import {
  up as encryptLegacySMTP,
  down as restoreLegacySMTP,
} from '@/migrations/20261003_213000_encrypt_smtp_password'
import { up as addFormSubmissionFingerprint } from '@/migrations/20260828_202422_add_form_submission_fingerprint'
import {
  up as upgradePayloadAuth,
  down as restorePayloadAuth,
} from '@/migrations/20261004_092954_upgrade_payload_3_90_2'
import type { Equipment, Form, User } from '@/payload-types'

let payload: Payload
let superAdmin: User
let organizationAdmin: User
const setupToken = process.env.SETUP_TOKEN ?? 'trustred-vitest-setup-token'

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-real-ip': '203.0.113.19' }),
}))

describe('security and correctness regressions', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({
      collection: 'users',
      where: { id: { exists: true } },
    })
    const suffix = `${process.pid}-${Date.now()}`

    const setupData = new FormData()
    setupData.set('admin.displayName', 'Security Test Super Admin')
    setupData.set('admin.email', `security-super-${suffix}@example.test`)
    setupData.set('admin.password', 'test-password-123')
    setupData.set('admin.setupToken', setupToken)
    superAdmin = await createInitialAdmin(payload, setupData)

    organizationAdmin = (await payload.create({
      collection: 'users',
      data: {
        displayName: 'Security Test Organization Admin',
        email: `security-organization-${suffix}@example.test`,
        password: 'test-password-123',
        roles: ['organization-admin'],
      },
    })) as User
  })

  it('allows initial setup only once with configured token', async () => {
    const setupData = new FormData()
    setupData.set('admin.displayName', 'Second Admin')
    setupData.set('admin.email', `second-${Date.now()}@example.test`)
    setupData.set('admin.password', 'test-password-123')
    setupData.set('admin.setupToken', setupToken)

    await expect(createInitialAdmin(payload, setupData)).rejects.toThrow(
      'Initial admin can only be created while no users exist.',
    )
  })

  it('blocks form writes and submission access unless explicitly allowed', async () => {
    const form = await payload.create({
      collection: 'forms',
      data: {
        confirmationMessage: createLexicalTextContent('Danke'),
        confirmationType: 'message',
        fields: [],
        title: `Security form ${Date.now()}`,
      },
      overrideAccess: false,
      user: superAdmin,
    })

    await expect(
      payload.create({
        collection: 'forms',
        data: {
          confirmationMessage: createLexicalTextContent('Danke'),
          confirmationType: 'message',
          fields: [],
          title: 'Anonymous form',
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.find({
        collection: 'forms',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        collection: 'forms',
        data: { title: 'Taken over' },
        id: form.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'forms', id: form.id, overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'form-submissions',
        data: { form: form.id, submissionData: [] },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const submission = await payload.create({
      collection: 'form-submissions',
      data: {
        form: form.id,
        requestFingerprint: 'integration-test',
        submissionData: [],
      },
    })
    await expect(
      payload.find({
        collection: 'form-submissions',
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({
        collection: 'form-submissions',
        id: submission.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('prevents non-super-admin privilege escalation', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: {
          displayName: 'Escalated User',
          email: `escalated-${Date.now()}@example.test`,
          password: 'test-password-123',
          roles: ['super-admin'],
        },
        overrideAccess: false,
        user: organizationAdmin,
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'users',
        data: { displayName: 'Compromised Super Admin' },
        id: superAdmin.id,
        overrideAccess: false,
        user: organizationAdmin,
      }),
    ).rejects.toThrow()
  })

  it('sanitizes executable HTML', () => {
    const sanitized = sanitizeHtmlFragment(
      '<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
    )

    expect(sanitized).toBe('<p>Safe</p><a>x</a>')
  })

  it('encrypts SMTP passwords in SQLite and keeps them out of public settings', async () => {
    const password = 'smtp-regression-secret'
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { smtp: { password } },
      overrideAccess: false,
      user: superAdmin,
    })
    const db = (payload.db as typeof payload.db & { drizzle: MigrateUpArgs['db'] }).drizzle
    const result = await db.run(sql`SELECT smtp_password FROM site_settings`)
    expect(result.rows[0]?.smtp_password).not.toBe(password)
    expect(String(result.rows[0]?.smtp_password)).toMatch(/^trustred:smtp:v1:/)
    expect(decryptSMTPPassword(String(result.rows[0]?.smtp_password))).toBe(password)

    const publicSettings = await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: false,
    })
    expect(publicSettings.smtp).toBeUndefined()
  })

  it('migrates legacy SMTP credentials idempotently and supports rollback', async () => {
    const db = (payload.db as typeof payload.db & { drizzle: MigrateUpArgs['db'] }).drizzle
    const req = await createLocalReq({}, payload)
    const args = { db, payload, req }
    await db.run(sql`UPDATE site_settings SET smtp_password = 'legacy-password'`)
    await encryptLegacySMTP(args)
    const once = await db.run(sql`SELECT smtp_password FROM site_settings`)
    expect(decryptSMTPPassword(String(once.rows[0]?.smtp_password))).toBe('legacy-password')
    await encryptLegacySMTP(args)
    expect((await db.run(sql`SELECT smtp_password FROM site_settings`)).rows).toEqual(once.rows)
    await restoreLegacySMTP(args)
    expect(
      (await db.run(sql`SELECT smtp_password FROM site_settings`)).rows[0]?.smtp_password,
    ).toBe('legacy-password')
    await encryptLegacySMTP(args)
  })

  it('authenticates SMTP ciphertext and preserves its exact password', () => {
    const password = '  whitespace-sensitive SMTP password  '
    const encrypted = encryptSMTPPassword(password)
    expect(decryptSMTPPassword(encrypted)).toBe(password)
    expect(encryptSMTPPassword(encrypted)).toBe(encrypted)
    expect(encryptSMTPPassword(password)).not.toBe(encrypted)
    const parts = encrypted.split(':')
    parts[4] = Buffer.alloc(16).toString('base64')
    expect(() => decryptSMTPPassword(parts.join(':'))).toThrow('could not be decrypted')
  })

  it('upgrades existing auth tables without changing users or sessions', async () => {
    const db = (payload.db as typeof payload.db & { drizzle: MigrateUpArgs['db'] }).drizzle
    const req = await createLocalReq({}, payload)
    const args = { db, payload, req }
    await db.run(sql`INSERT INTO users_sessions (_order, _parent_id, id, created_at, expires_at)
      VALUES (0, ${superAdmin.id}, 'upgrade-preserved-session', '2026-10-04T00:00:00Z', '2026-10-05T00:00:00Z')`)
    const usersBefore = await db.run(sql`SELECT id, email, hash, salt FROM users ORDER BY id`)
    const sessionsBefore = await db.run(sql`SELECT * FROM users_sessions ORDER BY id`)

    await restorePayloadAuth(args)
    await restorePayloadAuth(args)
    await upgradePayloadAuth(args)
    await upgradePayloadAuth(args)
    expect((await db.run(sql`SELECT id, email, hash, salt FROM users ORDER BY id`)).rows).toEqual(
      usersBefore.rows,
    )
    expect((await db.run(sql`SELECT * FROM users_sessions ORDER BY id`)).rows).toEqual(
      sessionsBefore.rows,
    )
    expect(
      (await db.run(sql`SELECT reset_password_requested_at FROM users WHERE id = ${superAdmin.id}`))
        .rows[0]?.reset_password_requested_at,
    ).toBeNull()
  })

  it('logs user mutations without logging passwords or document bodies', async () => {
    const info = vi.spyOn(payload.logger, 'info')
    try {
      const doc = await payload.create({
        collection: 'users',
        data: {
          displayName: 'Audit fixture',
          email: `audit-${Date.now()}@example.test`,
          password: 'audit-password-123',
          roles: ['editor'],
        },
        overrideAccess: false,
        user: superAdmin,
      })
      expect(info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'audit',
          actorId: superAdmin.id,
          collection: 'users',
          operation: 'create',
          documentId: doc.id,
        }),
        expect.any(String),
      )
      expect(JSON.stringify(info.mock.calls)).not.toContain('audit-password-123')
      await payload.delete({
        collection: 'users',
        id: doc.id,
        overrideAccess: false,
        user: superAdmin,
      })
      expect(info).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'audit', operation: 'delete', documentId: doc.id }),
        expect.any(String),
      )
    } finally {
      info.mockRestore()
    }
  })

  it('rejects oversized media through the Local API', async () => {
    const data = Buffer.alloc(10 * 1024 * 1024 + 1)
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'Oversized file', category: 'general' },
        file: { data, mimetype: 'text/plain', name: 'large.txt', size: data.length },
        overrideAccess: false,
        user: superAdmin,
      }),
    ).rejects.toThrow('10 MiB')
  })

  it('preserves JPEG uploads and generated image sizes after dependency updates', async () => {
    const data = await sharp({
      create: { width: 1600, height: 1000, channels: 3, background: '#aabbcc' },
    }).jpeg().toBuffer()
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'Dependency compatibility fixture', category: 'general' },
      file: { data, mimetype: 'image/jpeg', name: `compatibility-${Date.now()}.jpg`, size: data.length },
      overrideAccess: false,
      user: superAdmin,
    })
    try {
      expect(doc.mimeType).toBe('image/jpeg')
      expect(doc.sizes?.card).toMatchObject({ width: 640, height: 420 })
      expect(doc.sizes?.feature).toMatchObject({ width: 1440, height: 960 })
      expect(doc.sizes?.square).toMatchObject({ width: 640, height: 640 })
    } finally {
      await payload.delete({ collection: 'media', id: doc.id, overrideAccess: false, user: superAdmin })
    }
  })

  it('rejects SVG uploads containing scripts under the new Payload policy', async () => {
    const data = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'Unsafe SVG fixture', category: 'general' },
        file: { data, mimetype: 'image/svg+xml', name: 'unsafe.svg', size: data.length },
        overrideAccess: false,
        user: superAdmin,
      }),
    ).rejects.toThrow('file')
  })

  it('rejects short new user passwords without restricting existing logins', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: {
          displayName: 'Weak password',
          email: `weak-${Date.now()}@example.test`,
          password: 'short',
          roles: ['editor'],
        },
        overrideAccess: false,
        user: superAdmin,
      }),
    ).rejects.toThrow('12')
  })

  it('validates public form requirements, types, and options', () => {
    const fields = [
      { blockType: 'email', label: 'E-Mail', name: 'email', required: true },
      {
        blockType: 'select',
        label: 'Bereich',
        name: 'interest',
        options: [{ label: 'Aktiv', value: 'active' }],
        required: true,
      },
      { blockType: 'checkbox', label: 'Bestätigung', name: 'consent', required: true },
    ] satisfies NonNullable<Form['fields']>
    const invalid = new FormData()
    invalid.set('email', 'not-an-email')
    invalid.set('interest', 'invalid')

    expect(() => validatePublicFormSubmission(fields, invalid)).toThrow()

    const valid = new FormData()
    valid.set('email', 'person@example.test')
    valid.set('interest', 'active')
    valid.set('consent', 'on')
    expect(validatePublicFormSubmission(fields, valid)).toEqual([
      { field: 'email', value: 'person@example.test' },
      { field: 'interest', value: 'active' },
      { field: 'consent', value: 'Ja' },
    ])
  })

  it('limits public form submissions to five per client and form in ten minutes', async () => {
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: `Rate limit ${Date.now()}`,
        fields: [],
        confirmationMessage: createLexicalTextContent('Danke'),
        confirmationType: 'message',
      },
    })
    const reference = { id: form.id, kind: 'custom' } as const
    for (let i = 0; i < 5; i += 1) await submitConfiguredForm(reference, new FormData())
    await expect(submitConfiguredForm(reference, new FormData())).rejects.toThrow(
      'Zu viele Formularanfragen',
    )
  })

  it('parses German wall time independently from server timezone', () => {
    expect(parseSiteDateTime('2026-08-28T19:30')).toBe('2026-08-28T17:30:00.000Z')
    expect(() => parseSiteDateTime('2026-03-29T02:30')).toThrow()
  })

  it('stores equipment compartment contents as labels', async () => {
    const formData = new FormData()
    formData.set('name', 'Testfahrzeug')
    formData.set('slug', `testfahrzeug-${Date.now()}`)
    formData.set('summary', 'Test')
    formData.set('compartments.count', '1')
    formData.set('compartments.0.code', 'G1')
    formData.set('compartments.0.title', 'Geräteraum')
    formData.set('compartments.0.contents', 'Schlauch\nStrahlrohr')

    const equipment = (await saveCollectionDoc(
      payload,
      superAdmin,
      'equipment',
      null,
      formData,
    )) as Equipment
    expect(equipment.compartments?.[0]?.contents?.map((item) => item.label)).toEqual([
      'Schlauch',
      'Strahlrohr',
    ])
  })

  it('returns empty public collections without fictional fallback records', async () => {
    await payload.delete({
      collection: 'faqs',
      where: { id: { exists: true } },
    })

    expect(await getPublicFaqs()).toEqual([])
  })

  it('retries the additive migration safely on existing databases', async () => {
    const req = await createLocalReq({}, payload)
    const db = (payload.db as typeof payload.db & { drizzle: MigrateUpArgs['db'] }).drizzle
    const migrationArgs = { db, payload, req } as MigrateUpArgs

    await addFormSubmissionFingerprint(migrationArgs)
    await addFormSubmissionFingerprint(migrationArgs)

    const columns = await db.run(sql`PRAGMA table_info(form_submissions)`)
    expect(
      columns.rows.some(
        (row) => String((row as { name?: unknown }).name) === 'request_fingerprint',
      ),
    ).toBe(true)
  })

  it('resolves nested page paths without colliding with flat slugs', async () => {
    const suffix = `${process.pid}-${Date.now()}`
    const parentSlug = `parent-${suffix}`
    const childSlug = `child-${suffix}`
    await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        layout: [{ blockType: 'rich-text', copy: 'Flat', headline: 'Flat' }],
        slug: `${parentSlug}-${childSlug}`,
        title: 'Flat page',
      },
    })
    const parent = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        layout: [{ blockType: 'rich-text', copy: 'Parent', headline: 'Parent' }],
        slug: parentSlug,
        title: 'Parent page',
      },
    })
    const child = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        layout: [{ blockType: 'rich-text', copy: 'Child', headline: 'Child' }],
        parent: parent.id,
        slug: childSlug,
        title: 'Child page',
      },
    })

    const resolved = await getPageBySlug(`${parentSlug}/${childSlug}`)
    expect(resolved?.id).toBe(child.id)
  })
})
