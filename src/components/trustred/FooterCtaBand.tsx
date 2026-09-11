'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Banner = {
  key: string
  label?: string | null
  primaryHref: string
  primaryLabel: string
  rotateOnPages?: boolean | null
  secondaryHref?: string | null
  secondaryLabel?: string | null
  text: string
  title: string
}

export function FooterCtaBand({ banners }: { banners: Banner[] }) {
  const shouldRotate = banners.length > 1 && banners.some((banner) => banner.rotateOnPages)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!shouldRotate) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [banners.length, shouldRotate])

  const activeBanner = banners[Math.min(activeIndex, banners.length - 1)]

  return (
    <section className="ff-inverse ff-gradient-band mt-16">
      <div className="stripe-bg h-3" />
      <div className="site-container grid gap-6 py-10 lg:grid-cols-[1.2fr_auto] lg:items-center">
        <div>
          {activeBanner.label ? <p className="mb-2 font-headline text-xs uppercase tracking-[0.17em] text-brand-200">{activeBanner.label}</p> : null}
          <h2 className="text-[clamp(1.6rem,4vw,2.6rem)]">{activeBanner.title}</h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-neutral-300">{activeBanner.text}</p>
          {shouldRotate ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {banners.map((banner, index) => (
                <button
                  aria-label={`CTA ${index + 1} anzeigen`}
                  aria-pressed={index === activeIndex}
                  className={`h-2 w-8 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
                  key={banner.key}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid min-w-56 gap-2 lg:justify-items-end">
          <Link className="ff-btn-light" href={activeBanner.primaryHref}>
            {activeBanner.primaryLabel}
          </Link>
          {activeBanner.secondaryHref && activeBanner.secondaryLabel ? (
            <Link className="ff-btn-ghost ff-btn-ghost-inverse" href={activeBanner.secondaryHref}>
              {activeBanner.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
