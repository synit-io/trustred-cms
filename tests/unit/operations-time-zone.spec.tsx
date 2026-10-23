import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OperationsArchive } from '@/components/trustred/OperationsArchive'
import type { Operation } from '@/payload-types'

describe('operation archive dates', () => {
  it('groups a year-boundary operation in the same zone used to display it', () => {
    const operation = {
      alarmCode: 'Test',
      category: 'brand',
      id: 1,
      location: 'Test location',
      operationNumber: '1',
      startedAt: '2025-12-31T23:30:00.000Z',
      summary: 'Test operation',
    } as Operation

    const utc = render(<OperationsArchive operations={[operation]} timeZone="UTC" />)
    expect(screen.getByRole('option', { name: '2025' })).toBeTruthy()
    utc.unmount()

    render(<OperationsArchive operations={[operation]} timeZone="Europe/Berlin" />)
    expect(screen.getByRole('option', { name: '2026' })).toBeTruthy()
    expect(screen.getAllByText(/01\.01\.2026/).length).toBeGreaterThan(0)
  })
})
