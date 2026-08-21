import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { getEditorialContext } from '@/lib/trustred/editorial'
import type { User } from '@/payload-types'

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
      className="min-h-screen bg-[var(--surface-page)] text-neutral-900"
      style={
        {
          '--brand-500': theme.brandColor ?? '#871d33',
          '--brand-700': theme.brandColorStrong ?? '#6d1729',
          '--surface-page': theme.surfaceColor ?? '#f7f7f4',
        } as CSSProperties
      }
    >
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-neutral-950 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        href="#main-content"
      >
        Direkt zum Inhalt
      </a>
      <div className="sticky top-0 z-40">
        {announcementEnabled ? (
          <div className="border-b-2 border-amber-200 bg-[var(--brand-500)] text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
            <div className="site-container flex items-center gap-3 py-3 text-sm font-semibold">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200/90 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-200" />
              </span>
              <strong className="font-headline text-xs uppercase tracking-[0.18em]">
                {settings.announcement?.label}
              </strong>
              <span>{settings.announcement?.message}</span>
            </div>
          </div>
        ) : null}
        <header className="border-b border-neutral-200/80 bg-white/95 shadow-[0_10px_24px_rgba(0,45,103,0.08)] backdrop-blur">
          <div className="stripe-bg h-4" />
          <div className="site-container flex min-h-21 flex-col gap-4 py-4 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-6">
            <Link className="inline-flex max-w-[15.5rem] shrink-0 flex-col leading-none" href="/">
              <span className="font-headline text-base uppercase tracking-[0.03em] xl:text-[1.05rem]">
                {settings.siteName}
              </span>
              <span className="mt-1 max-w-[14rem] text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-500)]">
                {settings.taglinePrimary}
              </span>
            </Link>
            <details className="group xl:hidden">
              <summary className="inline-flex cursor-pointer list-none rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white">
                Menü
              </summary>
              <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_10px_24px_rgba(0,45,103,0.08)]">
                <nav aria-label="Hauptnavigation mobil" className="grid gap-2">
                  {nav.map((item) => (
                    <Link
                      key={`mobile-${item.href}`}
                      className={isActive(pathname, item.href) ? 'nav-pill nav-pill-active w-full' : 'nav-pill w-full'}
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
            <div className="hidden xl:flex xl:min-w-0 xl:items-center xl:justify-end xl:gap-4">
              <nav aria-label="Hauptnavigation" className="flex flex-wrap justify-end gap-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    className={isActive(pathname, item.href) ? 'nav-pill nav-pill-active' : 'nav-pill'}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link className="ff-btn-accent" href={joinHref}>
                {joinLabel}
              </Link>
              {canAccessManage ? (
                <Link className="ff-btn-manage-site" href="/manage">
                  Verwaltung
                </Link>
              ) : null}
            </div>
          </div>
        </header>
      </div>
      <main id="main-content">{children}</main>
      <footer className="mt-20 bg-neutral-950 text-white">
        <div className="stripe-bg h-4" />
        <div className="site-container grid gap-8 py-10 md:grid-cols-2 xl:grid-cols-[1.05fr_0.95fr_0.95fr_1.1fr]">
          <div>
            <h2 className="mb-3 text-xl">{settings.siteName}</h2>
            <p className="text-neutral-200">{settings.taglinePrimary}</p>
            <p className="text-neutral-200">{settings.taglineSecondary}</p>
          </div>
          <div>
            <h3 className="mb-3 text-lg">Navigation</h3>
            <ul className="grid gap-2 text-neutral-200">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link className="hover:text-rose-200" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-lg">Notfall</h3>
            <p className="text-neutral-200">Bei akuter Gefahr immer:</p>
            <p className="my-2 font-headline text-5xl leading-none">
              {settings.contact?.emergencyNumber}
            </p>
            <Link className="ff-btn-accent" href="/kontakt">
              Kontakt zur Wehr
            </Link>
          </div>
          <div>
            <h3 className="mb-3 text-lg">Kontakt</h3>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              <p className="whitespace-pre-line text-neutral-200">{settings.contact?.address}</p>
              <p className="mt-3 text-neutral-200">E-Mail: {settings.contact?.email}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
