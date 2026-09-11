import Image from 'next/image'

import { getMediaImage } from '@/lib/trustred/public-content'
import type { Media } from '@/payload-types'

type Props = {
  brandMark?: 'flame' | 'none' | null
  className?: string
  logo?: Media | number | null
  siteName?: string | null
  tone?: 'default' | 'inverse'
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

/**
 * Header/footer brand mark: uploaded logo when configured, otherwise the
 * default flame mark in brand color. Renders nothing for `brandMark: 'none'`
 * without a logo.
 */
export function BrandMark({ brandMark = 'flame', className, logo, siteName, tone = 'default' }: Props) {
  const image = getMediaImage(logo)

  if (image?.src) {
    return (
      <span
        className={cx(
          'inline-flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-lg',
          tone === 'inverse' ? 'bg-white/95 px-1.5' : '',
          className,
        )}
      >
        <Image
          alt={image.alt || siteName || 'Logo'}
          className="h-11 w-auto max-w-[9rem] object-contain"
          height={image.height}
          priority
          src={image.src}
          width={image.width}
        />
      </span>
    )
  }

  if (brandMark === 'none') {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)]',
        className,
      )}
      style={{ background: 'var(--brand-500)' }}
    >
      <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.7 2.1c.2 2-1 3.7-2.2 5.2-1.1 1.4-2.1 2.6-2.1 4.1 0 1.6 1.3 2.9 2.9 2.9 2.4 0 4.3-2 4.3-4.4 0-2.8-1.6-4.8-2.9-7.8zm-1.4 20.1c-3.4 0-6.1-2.6-6.1-5.9 0-1.9.9-3.5 2.4-4.8.3 3.2 2.2 4.7 4.3 4.7 3 0 5.3-2.6 5.3-5.8v-.3c1.4 1.2 2.2 2.9 2.2 4.9 0 3.3-2.7 7.2-8.1 7.2z" />
      </svg>
    </span>
  )
}
