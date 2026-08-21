import { describe, expect, it } from 'vitest'

import { defaultHomePage, defaultManagedPages, fallbackFeedData } from '@/lib/trustred/defaults'

describe('starter content', () => {
  it('keeps event starter data split across upcoming and archive use cases', () => {
    const now = Date.now()
    const upcoming = fallbackFeedData.events.filter((event) => new Date(event.endsAt ?? event.startsAt).getTime() >= now)
    const archived = fallbackFeedData.events.filter((event) => new Date(event.endsAt ?? event.startsAt).getTime() < now)

    expect(upcoming.length).toBeGreaterThan(0)
    expect(archived.length).toBeGreaterThan(0)
  })

  it('keeps editable starter pages wired to the route-specific overview blocks', () => {
    const termine = defaultManagedPages.find((page) => page.slug === 'termine')
    const technik = defaultManagedPages.find((page) => page.slug === 'technik')
    const einsaetze = defaultManagedPages.find((page) => page.slug === 'einsaetze')

    expect(termine?.layout.some((block) => block.blockType === 'feed' && block.source === 'events')).toBe(true)
    expect(technik?.layout.some((block) => block.blockType === 'tech-overview')).toBe(true)
    expect(technik?.layout.some((block) => block.blockType === 'tech-details')).toBe(true)
    expect(einsaetze?.layout.some((block) => block.blockType === 'operations-log')).toBe(true)
  })

  it('keeps the homepage starter data connected to public collection-driven sections', () => {
    expect(defaultHomePage.layout.some((block) => block.blockType === 'feed' && block.source === 'events')).toBe(true)
    expect(defaultHomePage.layout.some((block) => block.blockType === 'feed' && block.source === 'equipment')).toBe(true)
    expect(defaultHomePage.layout.some((block) => block.blockType === 'warnings')).toBe(true)
  })
})
