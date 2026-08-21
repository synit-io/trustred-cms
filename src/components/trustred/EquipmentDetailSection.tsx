import Image from 'next/image'
import Link from 'next/link'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { getMediaImage, getStatusBadgeClass } from '@/lib/trustred/public-content'
import type { Equipment } from '@/payload-types'

type Props = {
  item: Equipment
  intro?: string | null
  kicker?: string
  overviewHref?: string
  showActions?: boolean
  showCompartments?: boolean
  showHighlights?: boolean
  title?: string
}

export function EquipmentDetailSection({
  item,
  intro,
  kicker = 'Technikdetail',
  overviewHref = '/technik',
  showActions = true,
  showCompartments = true,
  showHighlights = true,
  title,
}: Props) {
  const image = getMediaImage(item.heroImage)
  const facts = item.facts ?? []
  const compartments = item.compartments ?? []
  const highlights = item.highlights ?? []

  return (
    <div className="grid gap-6">
      <article className="grid gap-6 lg:grid-cols-[minmax(20rem,0.95fr)_minmax(0,1.25fr)] lg:items-start xl:grid-cols-[minmax(24rem,1.05fr)_minmax(0,1.2fr)]">
        <div className="ff-card min-w-0">
          {image?.src ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-neutral-200">
              <Image
                alt={image.alt}
                className="h-[24rem] w-full object-cover lg:h-[30rem]"
                height={image.height}
                src={image.src}
                width={image.width}
              />
            </div>
          ) : (
            <MediaPlaceholder className="h-[24rem] w-full lg:h-[30rem]" />
          )}
        </div>

        <article className="ff-card grid min-w-0 gap-4">
          <div>
            <p className="ff-kicker">{kicker}</p>
            <h2 className="max-w-full break-words [hyphens:auto] [overflow-wrap:anywhere] text-[clamp(2rem,5vw,4rem)]">
              {title || item.name}
            </h2>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-500)]">
              Funkrufname: {item.callSign || 'Nicht hinterlegt'}
            </p>
            <p className="mt-4 text-base leading-8 text-neutral-700">{intro || item.summary}</p>
          </div>

          {facts.length > 0 ? (
            <div className="grid gap-3">
              {facts.map((fact, index) => (
                <div className="rounded-[1rem] border border-rose-100 bg-rose-50/35 p-4" key={`equipment-fact-${index}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{fact.label}</p>
                  <p className="mt-2 text-sm leading-7 text-neutral-800">{fact.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1rem] border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
              Für dieses Technikprofil sind noch keine öffentlichen Kerndaten hinterlegt.
            </div>
          )}
        </article>
      </article>

      <div className="ff-section-head mb-0">
        <p className="ff-kicker">Technikübersicht</p>
        <h3 className="text-[clamp(1.6rem,4vw,2.8rem)]">Fahrzeugprofil und Beladung</h3>
        <p className="text-neutral-700">
          Das Profil kombiniert die kompakte Trustred-Öffentlichkeitsdarstellung mit einer klaren, strukturierten Übersicht für Fahrzeugabschnitte und taktische Schwerpunkte.
        </p>
      </div>

      {showCompartments ? (
        <section className="ff-section ff-section-alt py-0">
          <div className="grid gap-6">
            <div className="ff-section-head mb-0">
              <p className="ff-kicker">Geräteräume</p>
              <h3 className="text-[clamp(1.6rem,4vw,2.8rem)]">Beladung nach Fahrzeugabschnitten</h3>
              <p className="text-neutral-700">
                Dokumentation der einzelnen Fächer und Bereiche mit Inhaltsübersicht.
              </p>
            </div>

            {compartments.length > 0 ? (
              <div className="ff-grid-3">
                {compartments.map((compartment, index) => {
                  const compartmentImage = getMediaImage(compartment.image)

                  return (
                    <article className="ff-card" key={`equipment-compartment-${index}`}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-lg">{compartment.title}</h3>
                        <span className={getStatusBadgeClass('brand')}>{compartment.code}</span>
                      </div>
                      {compartmentImage?.src ? (
                        <Image
                          alt={compartmentImage.alt}
                          className="mb-4 h-40 w-full rounded-[1.2rem] object-cover"
                          height={compartmentImage.height}
                          src={compartmentImage.src}
                          width={compartmentImage.width}
                        />
                      ) : compartment.showImagePlaceholder ? (
                        <MediaPlaceholder className="mb-4 h-40 w-full" />
                      ) : null}
                      {compartment.description ? (
                        <p className="text-sm leading-7 text-neutral-700">{compartment.description}</p>
                      ) : null}
                      {(compartment.contents ?? []).length > 0 ? (
                        <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
                          {(compartment.contents ?? []).map((entry, entryIndex) => (
                            <li className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2" key={`equipment-compartment-entry-${index}-${entryIndex}`}>
                              {entry.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-neutral-600">Keine Inhalte hinterlegt.</p>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : (
              <article className="ff-card">
                <p className="text-neutral-600">Noch keine Geräteräume hinterlegt.</p>
              </article>
            )}
          </div>
        </section>
      ) : null}

      {showHighlights ? (
        <section className="ff-section py-0">
          <div className="grid gap-6">
            <div className="ff-section-head mb-0">
              <p className="ff-kicker">Einsatzwert</p>
              <h3 className="max-w-full break-words [hyphens:auto] [overflow-wrap:anywhere] text-[clamp(1.6rem,4vw,2.8rem)]">
                Taktische Schwerpunkte von {item.name}
              </h3>
            </div>

            {highlights.length > 0 ? (
              <div className="ff-grid-3">
                {highlights.map((highlight, index) => (
                  <article className="ff-card" key={`equipment-highlight-${index}`}>
                    <h3 className="text-xl">{highlight.title}</h3>
                    <p className="mt-2 text-neutral-700">{highlight.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <article className="ff-card">
                <p className="text-neutral-600">Noch keine Einsatzwert-Karten hinterlegt.</p>
              </article>
            )}
          </div>
        </section>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap gap-3">
          <Link className="ff-btn-accent" href={overviewHref}>
            Zur Übersicht
          </Link>
          <Link className="ff-btn-ghost" href="/">
            Startseite
          </Link>
        </div>
      ) : null}
    </div>
  )
}
