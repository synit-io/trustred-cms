import Link from 'next/link'

import { SiteShell } from '@/components/trustred/SiteShell'
import { getSiteSettings } from '@/lib/trustred/cms'

export const dynamic = 'force-dynamic'

export default async function NotFound() {
  const settings = await getSiteSettings()

  return (
    <SiteShell pathname="/404" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <article className="ff-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[var(--brand-500)]/10" />
            <div className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-neutral-950/5" />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                <p className="ff-kicker">Fehlalarm</p>
                <h1 className="text-[clamp(2rem,7vw,4.7rem)] leading-none">404</h1>
                <p className="mt-3 text-neutral-700">
                  Wir haben die Seite gesucht wie einen versteckten Schwelbrand, aber sie ist nicht
                  auffindbar.
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  Gute Nachricht: Die Wache ist besetzt, nur die angeforderte URL nicht.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-[clamp(1.4rem,4vw,2.2rem)]">Zurück zur sicheren Route</h2>
                <p className="text-neutral-600">
                  Prüfe die Adresse oder nutze eine der direkten Verbindungen zu unseren wichtigsten
                  Bereichen.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Link className="ff-btn-accent" href="/">
                    Zur Startseite
                  </Link>
                  <Link className="ff-btn-ghost" href="/kontakt">
                    Kontakt
                  </Link>
                  <Link className="ff-btn-ghost" href="/mitmachen">
                    Mitmachen
                  </Link>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-amber-800">
                    Erinnerung für echte Notfälle
                  </p>
                  <p className="mt-1 text-neutral-700">
                    Wenn es wirklich brennt oder Gefahr besteht:{' '}
                    <strong>{settings.contact?.emergencyNumber || '112'}</strong>
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </SiteShell>
  )
}
