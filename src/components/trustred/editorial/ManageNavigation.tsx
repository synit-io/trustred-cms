'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type ManageNavItem = {
  href: string
  label: string
  match: string
}

type Props = {
  permissions: {
    canAccessContent: boolean
    canAccessMedia: boolean
    canAccessOperations: boolean
    canAccessSettings: boolean
    canAccessWarnings: boolean
  }
}

function isActive(pathname: string, item: ManageNavItem) {
  if (item.match === '/manage') {
    return pathname === '/manage'
  }

  return pathname === item.match || pathname.startsWith(`${item.match}/`)
}

export function ManageNavigation({ permissions }: Props) {
  const pathname = usePathname()
  const contentHref = permissions.canAccessContent ? '/manage/content/pages' : '/manage/content/operations'
  const items: ManageNavItem[] = [
    { href: '/manage', label: 'Dashboard', match: '/manage' },
    ...(permissions.canAccessContent || permissions.canAccessOperations
      ? [{ href: contentHref, label: 'Inhalte', match: '/manage/content' }]
      : []),
    ...(permissions.canAccessSettings
      ? [{ href: '/manage/settings', label: 'Einstellungen', match: '/manage/settings' }]
      : []),
    ...(permissions.canAccessContent ? [{ href: '/manage/forms', label: 'Formulare', match: '/manage/forms' }] : []),
    ...(permissions.canAccessWarnings ? [{ href: '/manage/warnings', label: 'Warnungen', match: '/manage/warnings' }] : []),
    ...(permissions.canAccessMedia ? [{ href: '/manage/media', label: 'Medien', match: '/manage/media' }] : []),
  ]

  return (
    <nav aria-label="Redaktionsnavigation" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = isActive(pathname, item)

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={active ? 'nav-pill nav-pill-active' : 'nav-pill'}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
