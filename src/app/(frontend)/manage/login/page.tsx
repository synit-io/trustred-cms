import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getEditorialContext } from '@/lib/trustred/editorial'
import { countUsers } from '@/lib/trustred/setup'
import { LoginForm } from '@/components/trustred/editorial/LoginForm'
import { LogoutButton } from '@/components/trustred/editorial/LogoutButton'

export default async function ManageLoginPage() {
  const { hasAccess, payload, user } = await getEditorialContext()
  const userCount = await countUsers(payload)

  if (userCount === 0) {
    redirect('/setup?step=admin')
  }

  if (user && hasAccess) {
    return (
      <div className="ff-section">
        <div className="site-container max-w-xl">
          <div className="ff-card">
            <p className="ff-kicker">Editorial Login</p>
            <h1 className="text-4xl">Bereits angemeldet</h1>
            <p className="mt-4 text-neutral-700">
              Für den Einstieg in die Frontend-Redaktion bist du bereits authentifiziert.
            </p>
            <Link className="ff-btn-accent mt-6" href="/manage">
              Zum Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (user && !hasAccess) {
    return (
      <div className="ff-section">
        <div className="site-container max-w-xl">
          <div className="ff-card">
            <p className="ff-kicker">Editorial Login</p>
            <h1 className="text-4xl">Kein Zugriff</h1>
            <p className="mt-4 text-neutral-700">
              Diese Anmeldung ist gültig, hat aber keine Rolle für die Frontend-Redaktion.
            </p>
            <div className="mt-6">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ff-section">
      <div className="site-container max-w-xl">
        <div className="ff-card">
          <p className="ff-kicker">Editorial Login</p>
          <h1 className="text-4xl">Frontend-Redaktion</h1>
          <p className="mt-4 text-neutral-700">
            TrustRed CMS Inhalte bearbeiten. Zum Fortfahren bitte anmelden.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
