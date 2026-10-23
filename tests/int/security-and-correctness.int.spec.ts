// @vitest-environment node
import { sql, type MigrateUpArgs } from '@payloadcms/db-sqlite'
import { createLocalReq, getPayload, handleEndpoints, type Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { POST as editorialLogout } from '@/app/(frontend)/manage/auth/logout/route'
import { getPageBySlug, getPublicArchivedEvents, getPublicEvents, getPublicFaqs, getSiteSettings } from '@/lib/trustred/cms'
import { clearDemoData, loadCollectionDocById, saveCollectionDoc, saveWarningSettings } from '@/lib/trustred/editorial'
import { sanitizeHtmlFragment } from '@/lib/trustred/html'
import { createLexicalTextContent } from '@/lib/trustred/lexical'
import { defaultHomePage } from '@/lib/trustred/defaults'
import { getMediaUsage } from '@/lib/trustred/media-usage'
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

const requestHeaders = vi.hoisted(() => new Headers({ 'x-real-ip': '203.0.113.19', 'user-agent': 'original' }))
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }))

describe('security and correctness regressions', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({
      collection: 'users',
      where: { id: { exists: true } },
    })
    const suffix = `${process.pid}-${Date.now()}`

    const anonymousRegistration = await handleEndpoints({
      config: await config,
      request: new Request('http://localhost/api/users/first-register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Untrusted first user',
          email: `untrusted-${suffix}@example.test`,
          password: 'test-password-123',
          roles: ['super-admin'],
        }),
      }),
    })
    expect(anonymousRegistration.status).toBe(403)

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
      overrideAccess: false,
      user: superAdmin,
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

  it('rejects same-site sibling REST writes with a logged-in cookie', async () => {
    const login = await payload.login({
      collection: 'users',
      data: { email: superAdmin.email, password: 'test-password-123' },
    })
    expect(login.token).toBeTruthy()
    const email = `sibling-${process.pid}-${Date.now()}@example.test`
    const body = new FormData()
    body.set('_payload', JSON.stringify({
      displayName: 'Sibling registration',
      email,
      password: 'test-password-123',
      roles: ['super-admin'],
    }))
    const siblingResponse = await handleEndpoints({
      config: await config,
      request: new Request('http://localhost:3000/api/users', {
        method: 'POST',
        body,
        headers: {
          cookie: `payload-token=${login.token}`,
          origin: 'http://attacker.localhost:3000',
          'sec-fetch-site': 'same-site',
        },
      }),
    })
    expect(siblingResponse.status).not.toBe(201)
    expect((await payload.count({ collection: 'users', where: { email: { equals: email } } })).totalDocs).toBe(0)

    const canonicalResponse = await handleEndpoints({
      config: await config,
      request: new Request('http://localhost:3000/api/users', {
        method: 'POST',
        body,
        headers: {
          cookie: `payload-token=${login.token}`,
          origin: 'http://localhost:3000',
          'sec-fetch-site': 'same-origin',
        },
      }),
    })
    expect(canonicalResponse.status).toBe(201)
  })

  it('revokes the current server session on editorial logout', async () => {
    const login = await payload.login({
      collection: 'users',
      data: { email: superAdmin.email, password: 'test-password-123' },
    })
    const headers = new Headers({
      cookie: `payload-token=${login.token}`,
      origin: 'http://localhost:3000',
    })
    expect((await payload.auth({ headers })).user?.id).toBe(superAdmin.id)

    const response = await editorialLogout(new Request('http://localhost:3000/manage/auth/logout', {
      headers,
      method: 'POST',
    }))
    expect(response.status).toBe(200)
    expect((await payload.auth({ headers })).user).toBeNull()
  })

  it('keeps custom warning presets when a replacement fails validation or conflicts with a system key', async () => {
    const suffix = `${process.pid}-${Date.now()}`
    const originalKey = `original-${suffix}`
    const systemKey = `system-${suffix}`
    const original = await payload.create({
      collection: 'warning-presets',
      data: { isSystemPreset: false, key: originalKey, label: 'Original', provider: 'dwd', regionLabel: 'Berlin' },
      overrideAccess: false,
      user: superAdmin,
    })
    await payload.create({
      collection: 'warning-presets',
      data: {
        isSystemPreset: true,
        key: systemKey,
        label: 'System',
        provider: 'dwd',
        regionLabel: 'Berlin',
      },
      overrideAccess: false,
      user: superAdmin,
    })

    const replacement = new FormData()
    replacement.set('warningPresets.count', '1')
    replacement.set('warningPresets.0.key', `new-${suffix}`)
    replacement.set('warningPresets.0.provider', 'dwd')
    replacement.set('warningPresets.0.regionLabel', 'Berlin')
    await expect(saveWarningSettings(payload, superAdmin, replacement)).rejects.toThrow()

    replacement.set('warningPresets.0.label', 'Replacement')
    replacement.set('warningPresets.0.key', systemKey)
    await expect(saveWarningSettings(payload, superAdmin, replacement)).rejects.toThrow()

    const preserved = await payload.findByID({
      collection: 'warning-presets',
      id: original.id,
      overrideAccess: false,
      user: superAdmin,
    })
    expect(preserved.key).toBe(originalKey)
    expect(preserved.label).toBe('Original')
  })

  it('preserves customized pages and customer settings during demo cleanup', async () => {
    const existingHome = await payload.find({ collection: 'pages', limit: 1, where: { slug: { equals: 'home' } } })
    if (existingHome.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existingHome.docs[0].id,
        data: { title: 'Customer home' },
        overrideAccess: false,
        user: superAdmin,
      })
    } else {
      await payload.create({
        collection: 'pages',
        data: { ...defaultHomePage, title: 'Customer home', _status: 'published' } as never,
        overrideAccess: false,
        user: superAdmin,
      })
    }
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { contact: { email: 'customer@example.test' }, siteName: 'Customer name' },
      overrideAccess: false,
      user: superAdmin,
    })

    await clearDemoData(payload, superAdmin)

    const home = await payload.find({ collection: 'pages', limit: 1, where: { slug: { equals: 'home' } } })
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    expect(home.docs[0]?.title).toBe('Customer home')
    expect(settings.siteName).toBe('Customer name')
    expect(settings.contact?.email).toBe('customer@example.test')
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

  it('rejects form fields whose submitted names collide after normalization', async () => {
    await expect(payload.create({
      collection: 'forms',
      data: {
        confirmationMessage: createLexicalTextContent('Danke'),
        confirmationType: 'message',
        fields: [
          { blockType: 'text', label: 'First', name: 'user-name', required: true },
          { blockType: 'text', label: 'Second', name: 'user name', required: true },
        ],
        title: 'Colliding field names',
      },
      overrideAccess: false,
      user: superAdmin,
    })).rejects.toThrow('Duplicate form field name: user_name')
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

  it('blocks media deletion when site settings still reference it', async () => {
    const data = Buffer.from('media usage fixture')
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Usage fixture', category: 'general' },
      file: { data, mimetype: 'text/plain', name: `usage-${Date.now()}.txt`, size: data.length },
      overrideAccess: false,
      user: superAdmin,
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { theme: { logo: media.id } },
      overrideAccess: false,
      user: superAdmin,
    })

    expect((await getMediaUsage(payload, media.id)).some((item) => item.source === 'Einstellungen')).toBe(true)
    await expect(payload.delete({
      collection: 'media',
      id: media.id,
      overrideAccess: false,
      user: superAdmin,
    })).rejects.toThrow('still referenced')
    const login = await payload.login({
      collection: 'users',
      data: { email: superAdmin.email, password: 'test-password-123' },
    })
    const apiDeletion = await handleEndpoints({
      config: await config,
      request: new Request(`http://localhost:3000/api/media/${media.id}`, {
        method: 'DELETE',
        headers: {
          cookie: `payload-token=${login.token}`,
          origin: 'http://localhost:3000',
        },
      }),
    })
    expect(apiDeletion.status).toBe(409)

    await payload.updateGlobal({
      slug: 'site-settings',
      data: { theme: { logo: null } },
      overrideAccess: false,
      user: superAdmin,
    })
    await payload.delete({ collection: 'media', id: media.id, overrideAccess: false, user: superAdmin })
  })

  it('keeps media used by a published post even when its newer draft removes the image', async () => {
    const data = Buffer.from('published image fixture')
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Published image', category: 'news' },
      file: { data, mimetype: 'text/plain', name: `published-image-${Date.now()}.txt`, size: data.length },
      overrideAccess: false,
      user: superAdmin,
    })
    const post = await payload.create({
      collection: 'posts',
      data: {
        _status: 'published',
        category: 'ausbildung',
        content: 'Published content',
        excerpt: 'Published excerpt',
        featuredImage: media.id,
        slug: `published-media-${Date.now()}`,
        title: 'Published media post',
      },
      overrideAccess: false,
      user: superAdmin,
    })
    await payload.update({
      collection: 'posts',
      data: { featuredImage: null },
      draft: true,
      id: post.id,
      overrideAccess: false,
      user: superAdmin,
    })
    expect((await getMediaUsage(payload, media.id)).some((item) => item.href === `/manage/content/posts/${post.id}`)).toBe(true)
    await expect(payload.delete({ collection: 'media', id: media.id, overrideAccess: false, user: superAdmin })).rejects.toThrow('still referenced')
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
    requestHeaders.set('user-agent', 'rotated')
    await expect(submitConfiguredForm(reference, new FormData())).rejects.toThrow(
      'Zu viele Formularanfragen',
    )
    requestHeaders.set('user-agent', 'original')
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

  it('keeps a future event visible after more than 100 past events', async () => {
    const suffix = `${process.pid}-${Date.now()}`
    for (let index = 0; index < 101; index += 1) {
      await payload.create({
        collection: 'events',
        data: {
          eventType: 'uebung',
          location: 'Test location',
          slug: `past-${suffix}-${index}`,
          startsAt: new Date(Date.UTC(2020, 0, 1 + index)).toISOString(),
          summary: 'Past fixture',
          title: `Past ${index}`,
          visibility: 'public',
        },
        overrideAccess: false,
        user: superAdmin,
      })
    }
    const future = await payload.create({
      collection: 'events',
      data: {
        eventType: 'uebung',
        location: 'Test location',
        slug: `future-${suffix}`,
        startsAt: '2035-01-01T12:00:00.000Z',
        summary: 'Future fixture',
        title: 'Future event',
        visibility: 'public',
      },
      overrideAccess: false,
      user: superAdmin,
    })
    expect((await getPublicEvents()).some((event) => event.id === future.id)).toBe(true)
    const secondArchivePage = await getPublicArchivedEvents(2)
    expect(secondArchivePage.docs.length).toBeGreaterThan(0)
    expect(secondArchivePage.totalPages).toBeGreaterThan(2)
  })

  it('loads the latest unpublished draft in the editorial editor', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        _status: 'published',
        category: 'ausbildung',
        content: 'Published content',
        excerpt: 'Published excerpt',
        slug: `draft-review-${Date.now()}`,
        title: 'Published title',
      },
      overrideAccess: false,
      user: superAdmin,
    })
    await payload.update({
      collection: 'posts',
      data: { title: 'Newer draft title' },
      draft: true,
      id: post.id,
      overrideAccess: false,
      user: superAdmin,
    })
    const loaded = await loadCollectionDocById(payload, superAdmin, 'posts', post.id)
    expect(loaded.title).toBe('Newer draft title')
    const formData = new FormData()
    formData.set('_status', 'draft')
    formData.set('category', 'ausbildung')
    formData.set('content', 'Newer draft content')
    formData.set('excerpt', 'Newer draft excerpt')
    formData.set('slug', post.slug)
    formData.set('title', 'Edited draft title')
    await saveCollectionDoc(payload, superAdmin, 'posts', String(post.id), formData)
    const savedDraft = await payload.findByID({ collection: 'posts', draft: true, id: post.id })
    const published = await payload.findByID({ collection: 'posts', id: post.id })
    expect(savedDraft.title).toBe('Edited draft title')
    expect(published.title).toBe('Published title')
  })

  it('clears optional dates and keeps an unchanged ambiguous autumn instant', async () => {
    const event = await payload.create({
      collection: 'events',
      data: {
        endsAt: '2026-10-25T03:30:00.000Z',
        eventType: 'uebung',
        location: 'Test location',
        slug: `dst-edit-${Date.now()}`,
        startsAt: '2026-10-25T00:30:00.000Z',
        summary: 'DST fixture',
        title: 'DST event',
        visibility: 'public',
      },
      overrideAccess: false,
      user: superAdmin,
    })
    const data = new FormData()
    data.set('title', 'DST event')
    data.set('slug', event.slug)
    data.set('eventType', 'uebung')
    data.set('visibility', 'public')
    data.set('location', 'Test location')
    data.set('summary', 'DST fixture')
    data.set('startsAt', '2026-10-25T02:30')
    data.set('endsAt', '')
    await saveCollectionDoc(payload, superAdmin, 'events', String(event.id), data)
    const saved = await payload.findByID({ collection: 'events', id: event.id })
    expect(saved.startsAt).toBe('2026-10-25T00:30:00.000Z')
    expect(saved.endsAt).toBeNull()

    const post = await payload.create({
      collection: 'posts',
      data: {
        _status: 'published',
        category: 'ausbildung',
        content: 'Date fixture content',
        excerpt: 'Date fixture excerpt',
        publishedAt: '2026-10-25T00:30:00.000Z',
        slug: `optional-date-${Date.now()}`,
        title: 'Optional date post',
      },
      overrideAccess: false,
      user: superAdmin,
    })
    const postData = new FormData()
    postData.set('_status', 'published')
    postData.set('category', 'ausbildung')
    postData.set('content', 'Date fixture content')
    postData.set('excerpt', 'Date fixture excerpt')
    postData.set('publishedAt', '')
    postData.set('slug', post.slug)
    postData.set('title', post.title)
    await saveCollectionDoc(payload, superAdmin, 'posts', String(post.id), postData)
    expect((await payload.findByID({ collection: 'posts', id: post.id })).publishedAt).toBeNull()
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
    const settings = await getSiteSettings()
    expect(settings.navigation).toContainEqual({ href: `/${parentSlug}/${childSlug}`, label: 'Child page' })
  })
})
