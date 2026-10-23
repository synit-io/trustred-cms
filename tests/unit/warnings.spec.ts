import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (callback: unknown) => callback,
}))

import { getWarningSnapshotFromConfig } from '@/lib/trustred/warnings'

describe('warning provider fallback', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each(['dwd', 'nina'] as const)('degrades when %s rejects asynchronously', async (provider) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('provider unavailable')))

    const snapshot = await getWarningSnapshotFromConfig({
      provider,
      ...(provider === 'nina' ? { ninaArs: '110000000000' } : {}),
    })

    expect(snapshot).toMatchObject({
      entries: [],
      note: 'provider unavailable',
      provider,
      sourceState: 'degraded',
      status: 'error',
    })
  })
})
