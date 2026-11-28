import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PageRenderer } from '@/components/trustred/PageRenderer'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (callback: unknown) => callback,
}))

vi.mock('@/lib/trustred/cms', () => ({
  getWarningSettings: async () => [
    {
      key: 'fixture-nina',
      label: 'Testregion',
      ninaArs: '110000000000',
      provider: 'nina',
      regionLabel: 'Testregion',
    },
  ],
}))

const dwdWarningUrl = 'https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html'
const ninaWarningUrl = 'https://warnung.bund.de/meldungen'

const dwdBlock = { dwdRegionIds: [{ regionId: '123' }], provider: 'dwd' }
const ninaBlock = { ninaArs: '110000000000', provider: 'nina' }
const supplementalNinaBlock = { ...dwdBlock, ninaPresetKey: 'fixture-nina' }

async function renderWarnings(block: Record<string, unknown>) {
  render(
    await PageRenderer({
      currentTimestamp: 0,
      page: {
        layout: [{ blockType: 'warnings', headline: 'Warnmeldungen', ...block }],
        title: 'Warnmeldungen',
      },
      pathname: '/',
    }),
  )
}

function mockWarningFeeds({
  dwd = () => new Response('warnWetter.loadWarnings({"warnings":{}});'),
  nina = () => Response.json([]),
  detail = () => Response.json({ info: [{ headline: 'NINA Detailwarnung' }] }),
}: {
  dwd?: () => Response
  nina?: () => Response
  detail?: (url: string) => Response
} = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string) => {
      const url = String(input)
      if (url.includes('/warnapp/json/warnings.json')) return dwd()
      if (url.includes('/api31/dashboard/')) return nina()
      if (url.includes('/api31/warnings/')) return detail(url)
      // Forecast and any ancillary assets are deliberately unavailable.
      throw new Error(`Unexpected request: ${url}`)
    }),
  )
}

describe('public warning blocks', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it.each([
    { block: dwdBlock, source: 'DWD', url: dwdWarningUrl },
    { block: ninaBlock, source: 'NINA', url: ninaWarningUrl },
  ])(
    'shows the official $source link instead of an all-clear after an HTTP error',
    async ({ block, source, url }) => {
      const outage = () => new Response('', { status: 503 })
      mockWarningFeeds({ dwd: outage, nina: outage })

      await renderWarnings(block)

      expect(screen.getByText(`${source}-Warnquelle derzeit nicht verfügbar.`)).toBeTruthy()
      expect(
        screen
          .getByRole('link', { name: `Offizielle ${source}-Warnungen ansehen` })
          .getAttribute('href'),
      ).toBe(url)
      expect(screen.queryByText(/aktuell liegen keine .*Warnmeldungen/i)).toBeNull()
      expect(screen.getByText('Stand: Nicht verfügbar')).toBeTruthy()
    },
  )

  it('does not turn a malformed DWD success response into an all-clear', async () => {
    mockWarningFeeds({ dwd: () => new Response('warnWetter.loadWarnings({});') })

    await renderWarnings(dwdBlock)

    expect(screen.getByText('DWD-Warnquelle derzeit nicht verfügbar.')).toBeTruthy()
    expect(screen.queryByText(/keine amtlichen DWD-Warnmeldungen/)).toBeNull()
  })

  it('keeps active DWD warnings when the forecast and supplemental NINA feed fail', async () => {
    mockWarningFeeds({
      dwd: () =>
        new Response(
          'warnWetter.loadWarnings({"warnings":{"123":[{"headline":"DWD Testwarnung"}]}});',
        ),
      nina: () => {
        throw new Error('NINA dashboard unreachable')
      },
    })

    await renderWarnings({
      ...supplementalNinaBlock,
      forecastUrl: 'https://www.dwd.de/test-forecast',
    })

    expect(screen.getByText('DWD Testwarnung')).toBeTruthy()
    expect(screen.queryByText('DWD-Warnquelle derzeit nicht verfügbar.')).toBeNull()
    expect(screen.getByText('NINA-Warnquelle derzeit nicht verfügbar.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Offizielle NINA-Warnungen ansehen' }).getAttribute('href'),
    ).toBe(ninaWarningUrl)
    expect(screen.queryByText(/keine ergänzenden NINA-Meldungen/)).toBeNull()
  })

  it('keeps supplemental NINA alerts when the DWD feed fails', async () => {
    mockWarningFeeds({
      dwd: () => new Response('', { status: 503 }),
      nina: () => Response.json([{ id: 'active' }]),
    })

    await renderWarnings(supplementalNinaBlock)

    expect(screen.getByText('DWD-Warnquelle derzeit nicht verfügbar.')).toBeTruthy()
    expect(screen.getByText('NINA Detailwarnung')).toBeTruthy()
    expect(screen.queryByText(/keine amtlichen DWD-Warnmeldungen/)).toBeNull()
    expect(screen.queryByText(/keine ergänzenden NINA-Meldungen/)).toBeNull()
  })

  it.each([ninaBlock, supplementalNinaBlock])(
    'retains NINA summaries and healthy details when one detail request fails',
    async (block) => {
      mockWarningFeeds({
        nina: () =>
          Response.json([
            { id: 'broken', i18nTitle: { de: 'NINA Kurzmeldung' }, sent: 'invalid timestamp' },
            { id: 'healthy' },
          ]),
        detail: (url) => {
          if (url.endsWith('/broken.json')) return new Response('not JSON')
          return Response.json({ info: [{ headline: 'NINA Detailwarnung' }] })
        },
      })

      await renderWarnings(block)

      expect(screen.getByText('NINA Kurzmeldung')).toBeTruthy()
      expect(screen.getByText('NINA Detailwarnung')).toBeTruthy()
      expect(
        screen.getByText(/NINA-Warnmeldungen sind verfügbar, einzelne Details fehlen/),
      ).toBeTruthy()
      expect(screen.queryByText('NINA-Warnquelle derzeit nicht verfügbar.')).toBeNull()
    },
  )

  it('does not treat a missing NINA region or a removed supplement preset as healthy', async () => {
    mockWarningFeeds()

    await renderWarnings({ provider: 'nina' })
    expect(screen.getByText('NINA-Warnquelle derzeit nicht verfügbar.')).toBeTruthy()
    expect(screen.queryByText(/keine Warnmeldungen für diese Konfiguration/)).toBeNull()
    cleanup()

    await renderWarnings({ ...dwdBlock, ninaPresetKey: 'removed-nina' })
    expect(screen.getByText('NINA-Warnquelle derzeit nicht verfügbar.')).toBeTruthy()
    expect(screen.queryByText(/keine ergänzenden NINA-Meldungen/)).toBeNull()
  })

  it('shows the usual empty messages after successful empty responses', async () => {
    mockWarningFeeds()

    await renderWarnings(supplementalNinaBlock)
    expect(screen.getByText(/keine amtlichen DWD-Warnmeldungen/)).toBeTruthy()
    expect(screen.getByText(/keine ergänzenden NINA-Meldungen/)).toBeTruthy()
    expect(screen.queryByText(/Warnquelle derzeit nicht verfügbar/)).toBeNull()
    cleanup()

    await renderWarnings(ninaBlock)
    expect(screen.getByText(/keine Warnmeldungen für diese Konfiguration/)).toBeTruthy()
    expect(screen.queryByText(/Warnquelle derzeit nicht verfügbar/)).toBeNull()
  })
})
