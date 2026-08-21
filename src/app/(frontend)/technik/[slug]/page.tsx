import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EquipmentDetailSection } from '@/components/trustred/EquipmentDetailSection'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicEquipment, getPublicEquipmentBySlug, getSiteSettings } from '@/lib/trustred/cms'
import { getEquipmentPath } from '@/lib/trustred/public-content'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function EquipmentDetailPage({ params }: Props) {
  const { slug } = await params
  const [item, equipment, settings] = await Promise.all([getPublicEquipmentBySlug(slug), getPublicEquipment(), getSiteSettings()])

  if (!item) {
    notFound()
  }

  const relatedEquipment = equipment.filter((entry) => entry.id !== item.id).slice(0, 3)

  return (
    <SiteShell pathname="/technik" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            <Link className="transition hover:text-[var(--brand-500)]" href="/">
              Start
            </Link>
            <span>/</span>
            <Link className="transition hover:text-[var(--brand-500)]" href="/technik">
              Technik
            </Link>
            <span>/</span>
            <span className="text-neutral-700">Fahrzeugprofil</span>
          </div>
          <EquipmentDetailSection item={item} />
          {relatedEquipment.length > 0 ? (
            <section className="grid gap-4">
              <div className="ff-section-head mb-0">
                <p className="ff-kicker">Weitere Technik</p>
                <h2 className="text-[clamp(1.6rem,4vw,2.6rem)]">Weitere Fahrzeuge und Ausstattung</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {relatedEquipment.map((relatedItem) => (
                  <article className="ff-card grid gap-4" key={relatedItem.id}>
                    <div>
                      <p className="ff-kicker">Technikprofil</p>
                      <h2 className="text-2xl">{relatedItem.name}</h2>
                      <p className="mt-2 text-sm font-semibold text-[var(--brand-500)]">
                        {relatedItem.callSign || 'Kein Funkrufname'}
                      </p>
                    </div>
                    <p className="text-sm leading-7 text-neutral-700">{relatedItem.summary}</p>
                    <div className="mt-auto">
                      <Link className="ff-btn-accent w-full" href={getEquipmentPath(relatedItem.slug)}>
                        Detail ansehen
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          <aside className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className="ff-card">
              <p className="ff-kicker">Orientierung</p>
              <h2 className="text-[clamp(1.4rem,3vw,2rem)]">Mehr Technik im Überblick</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                In der Technikübersicht lassen sich Fahrzeuge, Ausstattung und Einsatzschwerpunkte direkt miteinander vergleichen.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="ff-btn-accent" href="/technik">
                  Zur Technikübersicht
                </Link>
                <Link className="ff-btn-ghost" href="/kontakt">
                  Frage stellen
                </Link>
              </div>
            </article>
            <article className="ff-card">
              <p className="ff-kicker">Nächster Schritt</p>
              <h2 className="text-[clamp(1.4rem,3vw,2rem)]">Technik live erleben</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                Wenn dich Fahrzeuge, Geräte oder Taktik interessieren, ist der direkte Einstieg meist ein Besuch bei Übung oder Mitmachabend.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="ff-btn-accent" href="/mitmachen">
                  Mitmachen
                </Link>
                <Link className="ff-btn-ghost" href="/termine">
                  Termine ansehen
                </Link>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </SiteShell>
  )
}
