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
          <article className="ff-card mx-auto max-w-4xl">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="ff-tile">
                <p className="ff-kicker">Seite nicht gefunden</p>
                <h1 className="text-[clamp(3rem,8vw,5rem)] leading-none">404</h1>
                <p className="mt-3 text-neutral-700">
                  Die angeforderte Adresse existiert nicht oder wurde verschoben.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-[clamp(1.4rem,4vw,2.2rem)]">Zurück zu den wichtigsten Bereichen</h2>
                <p className="text-neutral-600">
                  Prüfe die Adresse oder nutze eine der direkten Verbindungen.
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

                <div className="ff-callout ff-callout--warning">
                  <p className="text-xs font-bold uppercase tracking-[0.08em]">Im Notfall</p>
                  <p className="mt-1 text-base text-neutral-800">
                    Bei akuter Gefahr immer den Notruf wählen:{' '}
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
