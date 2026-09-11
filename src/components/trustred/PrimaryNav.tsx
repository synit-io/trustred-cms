'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type PrimaryNavItem = {
  active: boolean
  href: string
  label: string
}

type Props = {
  items: PrimaryNavItem[]
  label?: string
  moreLabel?: string
}

const itemGap = 4

/**
 * Priority+ navigation: shows as many items as fit on one row and moves the
 * rest into a "Mehr" dropdown. Server-rendered with all items on a clipped
 * single row, so there is no wrap flash before hydration.
 */
export function PrimaryNav({ items, label = 'Hauptnavigation', moreLabel = 'Mehr' }: Props) {
  const containerRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLUListElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [measured, setMeasured] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const compute = () => {
      const available = container.clientWidth
      const children = Array.from(measure.children) as HTMLElement[]
      const moreWidth = children.at(-1)?.offsetWidth ?? 0
      const widths = children.slice(0, -1).map((child) => child.offsetWidth)
      const prefix: number[] = []
      widths.forEach((width, index) => {
        prefix.push((prefix[index - 1] ?? 0) + width + (index > 0 ? itemGap : 0))
      })

      let count = widths.length
      while (count > 0 && prefix[count - 1] > available) count -= 1

      if (count < widths.length) {
        while (count > 0 && prefix[count - 1] + itemGap + moreWidth > available) count -= 1
      }

      setVisibleCount(count)
      setMeasured(true)
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(container)
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    const details = detailsRef.current
    if (!details) return

    const close = (event: MouseEvent | KeyboardEvent) => {
      if (!details.open) return
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') details.open = false
        return
      }
      if (!details.contains(event.target as Node)) details.open = false
    }

    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [visibleCount])

  const visible = items.slice(0, visibleCount)
  const hidden = items.slice(visibleCount)
  const hiddenActive = hidden.some((item) => item.active)

  return (
    <nav aria-label={label} className="relative min-w-0 flex-1" ref={containerRef}>
      <ul
        className={
          measured
            ? 'flex items-center justify-end gap-1'
            : 'flex h-10 items-center justify-end gap-1 overflow-hidden'
        }
      >
        {visible.map((item) => (
          <li key={item.href}>
            <Link
              aria-current={item.active ? 'page' : undefined}
              className={item.active ? 'nav-pill nav-pill-active whitespace-nowrap' : 'nav-pill whitespace-nowrap'}
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
        {hidden.length > 0 ? (
          <li>
            <details className="group relative" ref={detailsRef}>
              <summary
                aria-label={`${moreLabel}: ${hidden.length} weitere Bereiche`}
                className="nav-pill cursor-pointer list-none gap-1.5 whitespace-nowrap"
              >
                {hiddenActive ? (
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ background: 'var(--brand-500)' }}
                  />
                ) : null}
                <span>{moreLabel}</span>
                <svg
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 min-w-[15rem] rounded-2xl border border-border-subtle bg-white p-2 shadow-overlay">
                <ul className="grid gap-1">
                  {hidden.map((item) => (
                    <li key={item.href}>
                      <Link
                        aria-current={item.active ? 'page' : undefined}
                        className={item.active ? 'nav-pill nav-pill-active w-full' : 'nav-pill w-full'}
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </li>
        ) : null}
      </ul>
      <ul
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex flex-nowrap gap-1"
        ref={measureRef}
      >
        {items.map((item) => (
          <li key={item.href}>
            <span className="nav-pill whitespace-nowrap">{item.label}</span>
          </li>
        ))}
        <li>
          <span className="nav-pill gap-1.5 whitespace-nowrap">
            <span className="size-1.5" />
            <span>{moreLabel}</span>
            <span className="size-3.5" />
          </span>
        </li>
      </ul>
    </nav>
  )
}
