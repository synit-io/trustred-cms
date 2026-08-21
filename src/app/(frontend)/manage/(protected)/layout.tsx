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
    <div className="min-h-screen bg-[var(--surface-page)]">
      <header className="border-b border-neutral-200 bg-white">
        <div className="stripe-bg h-4" />
        <div className="site-container-manage flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="ff-kicker">Trustred Redaktion</p>
            <h1 className="text-3xl">Inhalte verwalten</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Angemeldet als {user.displayName || user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="ff-btn-manage-site mr-2" href="/">
              Zur Seite
            </Link>
            <ManageNavigation permissions={permissions} />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="site-container-manage py-8">{children}</div>
    </div>
  )
}
