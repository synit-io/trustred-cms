import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FooterCtaBand } from '@/components/trustred/FooterCtaBand'

afterEach(() => vi.useRealTimers())

describe('footer CTA rotation', () => {
  it('stops changing while paused or focused', () => {
    vi.useFakeTimers()
    render(<FooterCtaBand banners={[
      { key: 'first', title: 'First', text: 'First text', primaryHref: '/first', primaryLabel: 'First link', rotateOnPages: true },
      { key: 'second', title: 'Second', text: 'Second text', primaryHref: '/second', primaryLabel: 'Second link' },
    ]} />)

    act(() => vi.advanceTimersByTime(7000))
    expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Rotation pausieren' }))
    act(() => vi.advanceTimersByTime(14000))
    expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Rotation fortsetzen' }))
    const link = screen.getByRole('link', { name: 'Second link' })
    fireEvent.focus(link)
    act(() => vi.advanceTimersByTime(7000))
    expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy()
  })
})
