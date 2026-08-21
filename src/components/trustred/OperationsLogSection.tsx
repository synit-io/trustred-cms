import Link from 'next/link'

import { OperationsArchive } from '@/components/trustred/OperationsArchive'
import { OperationsTable } from '@/components/trustred/OperationsTable'
import { getOperationMeta } from '@/lib/trustred/operations'
import type { Operation } from '@/payload-types'

type Props = {
  eyebrow?: string | null
  headline: string
  intro?: string | null
  maxItems?: number | null
  operations: Operation[]
  showFilters?: boolean | null
  showStats?: boolean | null
}

export function OperationsLogSection({
  eyebrow,
  headline,
  intro,
  maxItems,
  operations,
  showFilters = true,
  showStats = true,
}: Props) {
  const visibleOperations = operations.slice(0, Math.max(1, maxItems ?? 100))
  const categoryCounts = visibleOperations.reduce<Map<string, number>>((counts, operation) => {
    const label = getOperationMeta(operation.category).label
    counts.set(label, (counts.get(label) ?? 0) + 1)
    return counts
  }, new Map())

  return (
    <div className="grid gap-6">
      <div className="ff-section-head">
        {eyebrow ? <p className="ff-kicker">{eyebrow}</p> : null}
        <h2 className="text-[clamp(2rem,5vw,4rem)]">{headline}</h2>
        {intro ? <p className="text-lg leading-8 text-neutral-700">{intro}</p> : null}
      </div>

      {showStats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <article className="ff-card">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Freigegebene Einsätze</p>
            <p className="mt-3 font-headline text-4xl text-[var(--brand-500)]">{visibleOperations.length}</p>
          </article>
          {[...categoryCounts.entries()].slice(0, 3).map(([label, count]) => (
            <article className="ff-card" key={label}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
              <p className="mt-3 font-headline text-4xl text-[var(--brand-500)]">{count}</p>
            </article>
          ))}
        </div>
      ) : null}

      {showFilters ? <OperationsArchive operations={visibleOperations} /> : <OperationsTable operations={visibleOperations} />}

      {visibleOperations.length === 0 ? (
        <article className="ff-card grid gap-4 border-dashed">
          <div>
            <p className="ff-kicker">Noch keine Einsatzberichte</p>
            <h3 className="text-[clamp(1.4rem,4vw,2.2rem)]">Aktuell sind keine freigegebenen öffentlichen Einsätze hinterlegt.</h3>
          </div>
          <p className="text-sm leading-7 text-neutral-700">
            Öffentliche Einsatzberichte erscheinen hier erst nach bewusster Freigabe. Für akute Hilfe gilt immer der Notruf, für allgemeine Fragen der direkte Kontakt zur Wehr.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/kontakt">
              Kontakt zur Wehr
            </Link>
            <Link className="ff-btn-ghost" href="/sicherheit">
              Sicherheitshinweise
            </Link>
          </div>
        </article>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link className="ff-btn-accent" href="/">
          Zur Startseite
        </Link>
        <Link className="ff-btn-ghost" href="/kontakt">
          Kontakt zur Wehr
        </Link>
      </div>
    </div>
  )
}
