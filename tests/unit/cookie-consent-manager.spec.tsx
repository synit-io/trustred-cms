import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CookieConsentManager } from '@/components/trustred/CookieConsentManager'

afterEach(() => {
  window.localStorage.clear()
})

describe('cookie settings dialog', () => {
  it('contains focus, closes on Escape, and returns focus to the opener', () => {
    const { container } = render(<CookieConsentManager />)
    const opener = screen.getByRole('button', { name: 'Cookie-Einstellungen öffnen' })
    opener.focus()
    fireEvent.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Cookie-Einstellungen' })
    const close = screen.getByRole('button', { name: 'Cookie-Einstellungen schließen' })
    expect(document.activeElement).toBe(close)
    expect(container.inert).toBe(true)

    const buttons = dialog.querySelectorAll('button')
    buttons[buttons.length - 1].focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(close)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Cookie-Einstellungen' })).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect(container.inert).toBe(false)
  })
})
