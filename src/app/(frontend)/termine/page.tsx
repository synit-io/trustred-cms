import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { EventsAgendaSection } from '@/components/trustred/EventsAgendaSection'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicEvents, getSiteSettings } from '@/lib/trustred/cms'
import { getCurrentTimestamp } from '@/lib/trustred/time'

type Props = {
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function EventsIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'termine',
    pathname: '/termine',
    submittedForm:
      typeof resolvedSearchParams.submittedForm === 'string'
        ? resolvedSearchParams.submittedForm
        : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [events, settings] = await Promise.all([getPublicEvents(), getSiteSettings()])

  return (
    <SiteShell pathname="/termine" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <EventsAgendaSection
            currentTimestamp={getCurrentTimestamp()}
            eyebrow="Termine"
            events={events}
            headline="Übungen, Aktionen und öffentliche Termine"
            intro="Kommende öffentliche Ausbildungs- und Veranstaltungstermine der Wehr in einer klaren, schnell planbaren Übersicht."
            mode="upcoming"
          />
        </div>
      </section>
    </SiteShell>
  )
}
