import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { PublicForm } from '@/components/trustred/PublicForm'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicEvents, getSiteSettings } from '@/lib/trustred/cms'
import { formatDateTime, getEventPath } from '@/lib/trustred/public-content'
import { getPublicForm, getPublicFormConfig, submitPublicForm } from '@/lib/trustred/public-forms'

type Props = {
  searchParams: Promise<{
    sent?: string
    submittedForm?: string | string[]
  }>
}

export default async function JoinPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'mitmachen',
    pathname: '/mitmachen',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [{ sent }, form, events, settings] = await Promise.all([
    Promise.resolve(resolvedSearchParams),
    getPublicForm('join'),
    getPublicEvents(),
    getSiteSettings(),
  ])
  const config = getPublicFormConfig('join')
  const upcomingEvents = events.slice(0, 2)

  async function submitAction(formData: FormData) {
    'use server'

    await submitPublicForm('join', formData)
    redirect('/mitmachen?sent=1')
  }

  return (
    <SiteShell pathname="/mitmachen" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="ff-section-head">
            <p className="ff-kicker">Mitmachen</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">Einstieg ins Ehrenamt</h1>
            <p className="text-lg leading-8 text-neutral-700">
              Teamarbeit, Technik und Verantwortung. Wer Interesse hat, kann unverbindlich Kontakt aufnehmen und die Wehr kennenlernen.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <aside className="grid gap-4">
              <article className="ff-card">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">So läuft der Einstieg</p>
                <ul className="ff-feature-list mt-4">
                  <li>
                    <strong>Unverbindlich starten</strong>
                    Erst kennenlernen, Fragen stellen und einen Eindruck vom Team bekommen.
                  </li>
                  <li>
                    <strong>Passenden Bereich finden</strong>
                    Einsatzdienst, Nachwuchs, Organisation oder unterstützende Rollen.
                  </li>
                  <li>
                    <strong>Schrittweise einsteigen</strong>
                    Ausbildung, Übungen und Begleitung bauen aufeinander auf.
                  </li>
                </ul>
              </article>

              <article className="ff-card">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Nächste Termine</p>
                <div className="mt-4 grid gap-3">
                  {upcomingEvents.map((event) => (
                    <Link className="rounded-[1.1rem] border border-neutral-200 bg-neutral-50 px-4 py-4 transition hover:border-[var(--brand-500)] hover:bg-white" href={getEventPath(event.slug)} key={event.id}>
                      <strong className="block text-neutral-900">{event.title}</strong>
                      <span className="mt-2 block text-sm leading-6 text-neutral-600">
                        {formatDateTime(event.startsAt)} · {event.location}
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            </aside>

            <div className="grid gap-4">
              {sent === '1' ? (
                <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {config.successMessage}
                </div>
              ) : null}
              <PublicForm action={submitAction} description={config.description} form={form} />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
