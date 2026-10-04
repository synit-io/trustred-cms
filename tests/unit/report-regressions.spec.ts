// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import {
  formatDate,
  formatDateTime,
  formatDateTimeRange,
  formatMonthYear,
} from '@/lib/trustred/public-content'

const { login, count, getFeedItems, getPublicCrew, getPublicEvents } = vi.hoisted(() => ({
  login: vi.fn(),
  count: vi.fn(),
  getFeedItems: vi.fn().mockResolvedValue([]),
  getPublicCrew: vi.fn().mockResolvedValue([]),
  getPublicEvents: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/trustred/cms', () => ({
  getPayloadClient: async () => ({ login, count }),
  getFeedItems,
  getPublicCrew,
  getPublicEvents,
}))

import { PageRenderer } from '@/components/trustred/PageRenderer'
import { POST as loginPost } from '@/app/(frontend)/manage/auth/login/route'
import { POST as logoutPost } from '@/app/(frontend)/manage/auth/logout/route'
import { GET as healthGet } from '@/app/(frontend)/health/route'
import { GET as readyGet } from '@/app/(frontend)/ready/route'
import { createPublicMetadata } from '@/lib/trustred/metadata'
import { getPayloadSecret, validateStorageEnvironment } from '@/lib/trustred/environment'

describe('analysis report regressions', () => {
  it('handles malformed dates without crashing the public renderer', () => {
    expect(formatDate('invalid')).toBe('Kein Datum')
    expect(formatDateTime('invalid')).toBe('Kein Zeitpunkt')
    expect(formatMonthYear('invalid')).toBe('Ohne Zeitraum')
    expect(formatDateTimeRange('2026-01-01T12:00:00Z', 'invalid')).toBe(
      formatDateTime('2026-01-01T12:00:00Z'),
    )
  })

  it.each(['/team', '/termine', '/termine/archiv'])(
    'skips unused generic feed queries on %s',
    async (pathname) => {
      getFeedItems.mockClear()
      getPublicCrew.mockClear()
      getPublicEvents.mockClear()
      await PageRenderer({
        currentTimestamp: Date.now(),
        page: {
          title: 'Overview',
          layout: [
            {
              blockType: 'feed',
              source: pathname === '/team' ? 'crew' : 'events',
              limit: 3,
              headline: 'Overview',
            },
          ],
        },
        pathname,
      })
      expect(getFeedItems).not.toHaveBeenCalled()
      expect(pathname === '/team' ? getPublicCrew : getPublicEvents).toHaveBeenCalledTimes(1)
    },
  )

  it('returns a controlled response for malformed login JSON', async () => {
    const response = await loginPost(
      new Request('https://cms.example.test/manage/auth/login', {
        method: 'POST',
        body: '{',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    expect(response.status).toBe(400)
    expect(login).not.toHaveBeenCalled()
  })

  it.each([loginPost, logoutPost])('rejects cross-site auth mutations', async (post) => {
    const response = await post(
      new Request('https://cms.example.test/manage/auth/login', {
        method: 'POST',
        headers: { Origin: 'https://attacker.example.test', 'Content-Type': 'application/json' },
        body: '{}',
      }),
    )
    expect(response.status).toBe(403)
  })

  it('distinguishes process liveness from database readiness without leaking errors', async () => {
    expect(healthGet().status).toBe(200)
    count.mockResolvedValueOnce({ totalDocs: 0 })
    expect((await readyGet()).status).toBe(200)
    count.mockRejectedValueOnce(new Error('private database details'))
    const response = await readyGet()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable' })
  })

  it('uses edited SEO metadata and safe content fallbacks', () => {
    expect(
      createPublicMetadata(
        {
          title: 'Page',
          summary: 'Summary',
          meta: { title: 'Edited title', description: 'Edited description' },
        },
        'Department',
      ),
    ).toMatchObject({ title: 'Edited title | Department', description: 'Edited description' })
    expect(
      createPublicMetadata({ name: 'Vehicle', summary: 'Details' }, 'Department'),
    ).toMatchObject({ title: 'Vehicle | Department', description: 'Details' })
  })

  it('rejects missing secrets and incomplete storage configuration', () => {
    try {
      vi.stubEnv('PAYLOAD_SECRET', '')
      expect(() => getPayloadSecret()).toThrow('required in all environments')
      for (const key of ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'])
        vi.stubEnv(key, '')
      expect(() => validateStorageEnvironment()).not.toThrow()
      vi.stubEnv('S3_BUCKET', 'test-bucket')
      expect(() => validateStorageEnvironment()).toThrow('Incomplete S3 configuration')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
