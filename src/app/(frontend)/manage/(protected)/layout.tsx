import Link from 'next/link'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { ManageNavigation } from '@/components/trustred/editorial/ManageNavigation'
import { LogoutButton } from '@/components/trustred/editorial/LogoutButton'
import { getEditorialPermissions, requireEditorialContext } from '@/lib/trustred/editorial'

export default async function ManageProtectedLayout({ children }: { children: ReactNode }) {
  const { user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)

  if (!permissions.canAccessContent && !permissions.canAccessOperations && !permissions.canAccessMedia && !permissions.canAccessSettings && !permissions.canAccessWarnings) {
    redirect('/manage/login')
  }

  return (
    <div className="ff-theme min-h-screen bg-surface-page">
      <div className="stripe-bg h-3" />
      <header className="ff-header">
        <div className="site-container-manage grid gap-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="ff-kicker mb-1">TrustRed Redaktion</p>
              <h1 className="text-2xl">Inhalte verwalten</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden text-sm text-neutral-600 md:inline">
                {user.displayName || user.email}
              </span>
              <Link className="ff-btn-manage-site min-h-10" href="/">
                Zur Website
              </Link>
              <LogoutButton />
            </div>
          </div>
          <ManageNavigation permissions={permissions} />
        </div>
      </header>
      <div className="site-container-manage py-8">{children}</div>
    </div>
  )
}
