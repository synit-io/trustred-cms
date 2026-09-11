import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { BrandMark } from '@/components/trustred/BrandMark'
import { PrimaryNav } from '@/components/trustred/PrimaryNav'
import { getEditorialContext } from '@/lib/trustred/editorial'
import type { Media, User } from '@/payload-types'

type NavItem = {
  href: string
  label: string
}

type Props = {
  children: ReactNode
  pathname: string
  settings: {
    announcement?: {
      enabled?: boolean | null
      label?: string | null
      message?: string | null
    } | null
    contact?: {
      address?: string | null
      email?: string | null
      emergencyNumber?: string | null
    } | null
    joinButton?: {
      href?: string | null
      label?: string | null
    } | null
    navigation?: NavItem[] | null
    siteName?: string | null
    taglinePrimary?: string | null
    taglineSecondary?: string | null
    theme?: {
      brandColor?: string | null
      brandColorStrong?: string | null
      brandMark?: 'flame' | 'none' | null
      logo?: Media | number | null
      surfaceColor?: string | null
    } | null
  }
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

async function getCanAccessManage() {
  try {
    const { user } = await getEditorialContext()
    return userHasRole(user as User | null | undefined, trustredRoles.anyEditorial)
  } catch {
    return false
  }
}

export async function SiteShell({ children, pathname, settings }: Props) {
  const nav = settings.navigation ?? []
  const joinHref = settings.joinButton?.href || '/mitmachen'
  const joinLabel = settings.joinButton?.label || 'Mitmachen'
  const announcementEnabled = settings.announcement?.enabled
  const theme = settings.theme ?? {}
  const canAccessManage = await getCanAccessManage()

  return (
    <div
      className="ff-theme min-h-screen bg-surface-page text-neutral-900"
      style={
        {
          '--brand-500': theme.brandColor ?? '#871d33',
          '--brand-700': theme.brandColorStrong ?? '#6d1729',
          '--surface-page': theme.surfaceColor ?? '#f7f7f4',
        } as CSSProperties
      }
    >
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        href="#main-content"
      >
        Direkt zum Inhalt
      </a>
      <div className="sticky top-0 z-40">
        <div className="stripe-bg h-3" />
        {announcementEnabled ? (
          <div className="ff-announcement">
            <div className="site-container flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm font-semibold">
              <span aria-hidden="true" className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <strong className="font-headline text-xs uppercase tracking-[0.18em]">
                {settings.announcement?.label}
              </strong>
              <span className="font-normal text-white/95">{settings.announcement?.message}</span>
            </div>
          </div>
        ) : null}
        <header className="ff-header">
          <div className="site-container flex flex-col gap-3 py-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
            <div className="flex items-center justify-between gap-4 xl:shrink-0">
              <Link
                className="inline-flex min-w-0 max-w-[22rem] shrink-0 items-center gap-3 rounded-lg"
                href="/"
              >
                <BrandMark
                  brandMark={theme.brandMark}
                  logo={theme.logo}
                  siteName={settings.siteName}
                />
                <span className="flex min-w-0 flex-col leading-none">
                  <span className="line-clamp-2 font-headline text-[0.95rem] uppercase leading-[1.15] tracking-[0.03em] text-neutral-900 xl:text-base">
                    {settings.siteName}
                  </span>
                  {settings.taglinePrimary ? (
                    <span className="mt-1 line-clamp-1 text-[0.66rem] font-bold uppercase leading-snug tracking-[0.16em] text-brand-500">
                      {settings.taglinePrimary}
                    </span>
                  ) : null}
                </span>
              </Link>
              <details className="group relative xl:hidden">
                <summary className="ff-btn-ghost min-h-10 cursor-pointer list-none px-3">
                  <span>Menü</span>
                  <svg
                    aria-hidden="true"
                    className="size-4 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border-subtle bg-white p-3 shadow-overlay">
                  <nav aria-label="Hauptnavigation mobil" className="grid gap-1">
                    {nav.map((item) => (
                      <Link
                        key={`mobile-${item.href}`}
                        aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                        className={
                          isActive(pathname, item.href)
                            ? 'nav-pill nav-pill-active w-full'
                            : 'nav-pill w-full'
                        }
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link className="ff-btn-accent mt-2 w-full" href={joinHref}>
                      {joinLabel}
                    </Link>
                    {canAccessManage ? (
                      <Link className="ff-btn-manage-site mt-1 w-full" href="/manage">
                        Verwaltung
                      </Link>
                    ) : null}
                  </nav>
                </div>
              </details>
            </div>
            <div className="hidden xl:flex xl:min-w-0 xl:flex-1 xl:items-center xl:justify-end xl:gap-3">
              <PrimaryNav
                items={nav.map((item) => ({
                  active: isActive(pathname, item.href),
                  href: item.href,
                  label: item.label,
                }))}
              />
              <div className="ml-2 flex shrink-0 items-center gap-2 border-l border-border-subtle pl-4">
                <Link className="ff-btn-accent min-h-10" href={joinHref}>
                  {joinLabel}
                </Link>
                {canAccessManage ? (
                  <Link className="ff-btn-manage-site min-h-10" href="/manage">
                    Verwaltung
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </header>
      </div>
      <main className="ff-main" id="main-content">
        {children}
      </main>
      <footer className="ff-inverse mt-20">
        <div className="stripe-bg h-3" />
        <div className="site-container grid gap-10 py-12 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.9fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark
                brandMark={theme.brandMark}
                logo={theme.logo}
                siteName={settings.siteName}
                tone="inverse"
              />
              <h2 className="text-2xl">{settings.siteName}</h2>
            </div>
            {settings.taglinePrimary ? (
              <p className="mt-3 text-neutral-300">{settings.taglinePrimary}</p>
            ) : null}
            {settings.taglineSecondary ? (
              <p className="mt-1 text-neutral-400">{settings.taglineSecondary}</p>
            ) : null}
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
              Navigation
            </h3>
            <ul className="grid gap-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    className="inline-flex min-h-8 items-center text-neutral-200 underline-offset-4 hover:text-white hover:underline"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
              Notfall
            </h3>
            <p className="text-neutral-300">Bei akuter Gefahr immer:</p>
            <p className="my-2 font-headline text-5xl leading-none text-white">
              {settings.contact?.emergencyNumber}
            </p>
            <Link className="ff-btn-light mt-3" href="/kontakt">
              Kontakt aufnehmen
            </Link>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
              Kontakt
            </h3>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="whitespace-pre-line text-neutral-200">{settings.contact?.address}</p>
              {settings.contact?.email ? (
                <p className="mt-3 text-neutral-200">
                  <a className="underline-offset-4 hover:underline" href={`mailto:${settings.contact.email}`}>
                    {settings.contact.email}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="site-container flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-neutral-400">
            <span>{settings.siteName}</span>
            <span>Betrieben mit TrustRed CMS</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
