import { sql, type MigrateUpArgs } from '@payloadcms/db-sqlite'
import { createLocalReq, getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { getPageBySlug, getPublicFaqs } from '@/lib/trustred/cms'
import { saveCollectionDoc } from '@/lib/trustred/editorial'
import { sanitizeHtmlFragment } from '@/lib/trustred/html'
import { createLexicalTextContent } from '@/lib/trustred/lexical'
import { validatePublicFormSubmission } from '@/lib/trustred/public-forms'
import { createInitialAdmin } from '@/lib/trustred/setup'
import { parseSiteDateTime } from '@/lib/trustred/time'
import { up as addFormSubmissionFingerprint } from '@/migrations/20260828_202422_add_form_submission_fingerprint'
import type { Equipment, Form, User } from '@/payload-types'

let payload: Payload
let superAdmin: User
let organizationAdmin: User
const setupToken = process.env.SETUP_TOKEN ?? 'trustred-vitest-setup-token'

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
