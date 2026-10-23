import { describe, expect, it } from 'vitest'

import { getMediaImage } from '@/lib/trustred/public-content'
import type { Media } from '@/payload-types'

describe('public media images', () => {
  it('uses the requested generated size and falls back to the original', () => {
    const media = {
      alt: 'Vehicle',
      height: 2000,
      sizes: { card: { height: 420, url: '/media/card.jpg', width: 640 } },
      url: '/media/original.jpg',
      width: 3000,
    } as Media

    expect(getMediaImage(media, 'card')).toMatchObject({
      height: 420,
      src: '/media/card.jpg',
      width: 640,
    })
    expect(getMediaImage(media, 'square')).toMatchObject({
      height: 2000,
      src: '/media/original.jpg',
      width: 3000,
    })
  })
})
