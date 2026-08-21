import Link from 'next/link'

import {
  editorialCollections,
  getEditorialPermissions,
  loadCollectionDocs,
  requireEditorialContext,
} from '@/lib/trustred/editorial'
import { getSetupState } from '@/lib/trustred/setup'

export default async function ManageDashboardPage() {
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)
  const visibleCollections = Object.entries(editorialCollections).filter(([slug]) =>
    ['events', 'operations'].includes(slug)
      ? permissions.canAccessOperations
      : permissions.canAccessContent,
  )
  const [counts, forms, setupState] = await Promise.all([
    Promise.all(
      visibleCollections.map(async ([slug, config]) => {
        const docs = await loadCollectionDocs(
          payload,
          user,
          slug as keyof typeof editorialCollections,
        )
        return {
          count: docs.length,
          label: config.label,
          slug,
        }
      }),
    ),
    permissions.canAccessContent
      ? payload.find({
          collection: 'forms',
          limit: 1,
          overrideAccess: false,
          user,
        })
      : Promise.resolve({ totalDocs: 0 }),
    getSetupState(payload),
  ])

  return (
    <div className="grid gap-6">
      <section className="ff-card">
        <p className="ff-kicker">Redaktion</p>
        <h2 className="text-3xl">Arbeitsbereiche</h2>
        <p className="mt-4 max-w-3xl text-neutral-700">
          Diese Oberfläche bildet den Einstieg für normale Redakteurinnen und Redakteure. Inhalte,
          Seitenstruktur, Warn-Presets und Kerndaten sollen hier gepflegt werden, ohne das
          Payload-Admin zu benötigen.
        </p>
      </section>
      {permissions.canAccessSettings && setupState.status !== 'completed' ? (
        <section className="ff-card border-amber-200 bg-amber-50">
          <p className="ff-kicker">Setup</p>
          <h3 className="text-2xl">Ersteinrichtung fortsetzen</h3>
          <p className="mt-3 max-w-3xl text-neutral-700">
            Der Einrichtungsassistent wurde noch nicht abgeschlossen. Du kannst ihn fortsetzen oder
            alle Angaben direkt in den Einstellungen bearbeiten.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="ff-btn-accent"
              href={`/setup?step=${setupState.currentStep || 'site'}`}
            >
              Setup öffnen
            </Link>
            <Link className="ff-btn-ghost" href="/manage/settings">
              Einstellungen öffnen
            </Link>
          </div>
        </section>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        {permissions.canAccessContent ? (
          <article className="ff-card">
            <p className="ff-kicker">Formulare</p>
            <h3 className="text-2xl">Payload Form Builder</h3>
            <p className="mt-3 text-neutral-700">
              Eigener Arbeitsbereich für Kontakt-, Mitmach- und individuelle Formulare. Fertige
              Formulare stehen anschließend direkt in Seitenblöcken zur Auswahl.
            </p>
            <p className="mt-4 text-sm text-neutral-500">Aktuell vorhanden: {forms.totalDocs}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link className="ff-btn-accent" href="/manage/forms">
                Formulare öffnen
              </Link>
              <Link className="ff-btn-ghost" href="/manage/forms/new">
                Neues Formular
              </Link>
            </div>
          </article>
        ) : null}
        {permissions.canAccessWarnings ? (
          <article className="ff-card">
            <p className="ff-kicker">Warnungen</p>
            <h3 className="text-2xl">DWD- und NINA-Presets</h3>
            <p className="mt-3 text-neutral-700">
              Eigener Arbeitsbereich für System- und Custom-Presets, damit Warn-Widgets unabhängig
              von den übrigen Seiteneinstellungen gepflegt werden.
            </p>
            <div className="mt-6">
              <Link className="ff-btn-accent" href="/manage/warnings">
                Warnungen öffnen
              </Link>
            </div>
          </article>
        ) : null}
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {counts.map((entry) => (
          <article className="ff-card" key={entry.slug}>
            <p className="ff-kicker">{entry.label}</p>
            <p className="font-headline text-4xl text-[var(--brand-500)]">{entry.count}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link className="ff-btn-accent" href={`/manage/content/${entry.slug}`}>
                Öffnen
              </Link>
              <Link className="ff-btn-ghost" href={`/manage/content/${entry.slug}/new`}>
                Neu
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
