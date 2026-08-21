import Image from 'next/image'
import Link from 'next/link'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { getEquipmentPath, getMediaImage, getStatusBadgeClass } from '@/lib/trustred/public-content'
import type { Equipment } from '@/payload-types'

type Props = {
  equipment: Equipment[]
  eyebrow?: string | null
  featuredEquipmentId?: number | null
  headline: string
  intro?: string | null
  maxItems?: number | null
  showFeaturedProfile?: boolean | null
  showStats?: boolean | null
}

export function EquipmentOverviewSection({
  equipment,
  eyebrow,
  featuredEquipmentId,
  headline,
  intro,
  maxItems,
  showFeaturedProfile = true,
  showStats = true,
}: Props) {
  const safeMaxItems = Math.max(1, maxItems ?? 12)
  const limitedEquipment = equipment.slice(0, safeMaxItems)
  const featuredItem =
    (featuredEquipmentId
      ? limitedEquipment.find((item) => item.id === featuredEquipmentId) ?? equipment.find((item) => item.id === featuredEquipmentId)
      : limitedEquipment[0]) ?? null
  const overviewItems = limitedEquipment.filter((item) => item.id !== featuredItem?.id)
  const totalFacts = limitedEquipment.reduce((sum, item) => sum + (item.facts?.length ?? 0), 0)

  return (
    <div className="grid gap-6">
      <div className="ff-section-head">
        {eyebrow ? <p className="ff-kicker">{eyebrow}</p> : null}
        <h2 className="text-[clamp(2rem,5vw,4rem)]">{headline}</h2>
        {intro ? <p className="text-lg leading-8 text-neutral-700">{intro}</p> : null}
      </div>

      {showStats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="ff-card">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Öffentliche Technikprofile</p>
            <p className="mt-3 font-headline text-4xl text-[var(--brand-500)]">{limitedEquipment.length}</p>
          </article>
          <article className="ff-card">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Strukturierte Fakten</p>
            <p className="mt-3 font-headline text-4xl text-[var(--brand-500)]">{totalFacts}</p>
          </article>
          <article className="ff-card">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Darstellungsstil</p>
            <p className="mt-3 text-sm leading-7 text-neutral-700">
              Technik mit Bild, Funkrufname und den wichtigsten einsatzrelevanten Eckdaten.
            </p>
          </article>
        </div>
      ) : null}

      {showFeaturedProfile && featuredItem ? (
        <article className="ff-card grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <p className="ff-kicker">Hervorgehobenes Technikprofil</p>
            <h3 className="text-[clamp(1.8rem,4vw,3rem)]">{featuredItem.name}</h3>
            <p className="mt-4 text-base leading-8 text-neutral-700">{featuredItem.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={getStatusBadgeClass('info')}>{featuredItem.callSign || 'Kein Funkrufname'}</span>
              <span className={getStatusBadgeClass('warning')}>{(featuredItem.facts ?? []).length} Fakten</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="ff-btn-accent" href={getEquipmentPath(featuredItem.slug)}>
                Technikprofil öffnen
              </Link>
              <Link className="ff-btn-ghost" href="/kontakt">
                Rückfrage stellen
              </Link>
            </div>
          </div>
          {getMediaImage(featuredItem.heroImage)?.src ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-neutral-200">
              <Image
                alt={getMediaImage(featuredItem.heroImage)?.alt ?? ''}
                className="h-80 w-full object-cover"
                height={getMediaImage(featuredItem.heroImage)?.height ?? 960}
                src={getMediaImage(featuredItem.heroImage)?.src ?? ''}
                width={getMediaImage(featuredItem.heroImage)?.width ?? 1440}
              />
            </div>
          ) : (
            <MediaPlaceholder className="h-80 w-full" />
          )}
        </article>
      ) : null}

      {overviewItems.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {overviewItems.map((item) => (
            <article className="ff-card grid gap-4" key={item.id}>
              {getMediaImage(item.heroImage)?.src ? (
                <div className="overflow-hidden rounded-[1.3rem] border border-neutral-200">
                  <Image
                    alt={getMediaImage(item.heroImage)?.alt ?? ''}
                    className="h-64 w-full object-cover"
                    height={getMediaImage(item.heroImage)?.height ?? 960}
                    src={getMediaImage(item.heroImage)?.src ?? ''}
                    width={getMediaImage(item.heroImage)?.width ?? 1440}
                  />
                </div>
              ) : (
                <MediaPlaceholder className="h-64 w-full" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className={getStatusBadgeClass('info')}>{item.callSign || 'Kein Funkrufname'}</span>
                <span className={getStatusBadgeClass('warning')}>{(item.facts ?? []).length} Fakten</span>
              </div>
              <div>
                <h3 className="text-2xl">{item.name}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-700">{item.summary}</p>
              </div>
              {(item.facts ?? []).length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(item.facts ?? []).slice(0, 3).map((fact, index) => (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3" key={`equipment-preview-${item.id}-${index}`}>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{fact.label}</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">{fact.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div>
                <Link className="ff-btn-accent" href={getEquipmentPath(item.slug)}>
                  Detail ansehen
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="ff-card grid gap-4 border-dashed">
          <div>
            <p className="ff-kicker">Noch keine Technikprofile</p>
            <h3 className="text-[clamp(1.4rem,4vw,2.2rem)]">Aktuell sind noch keine öffentlichen Technikprofile vorhanden.</h3>
          </div>
          <p className="text-sm leading-7 text-neutral-700">
            Sobald Fahrzeuge oder Ausstattung für die öffentliche Darstellung freigegeben wurden, erscheinen sie hier mit Bild, Funkrufname und den wichtigsten Einsatzdaten.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/kontakt">
              Frage stellen
            </Link>
            <Link className="ff-btn-ghost" href="/mitmachen">
              Mitmachen
            </Link>
          </div>
        </article>
      )}
    </div>
  )
}
