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

export default async function EventsArchivePage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'termine-archiv',
    pathname: '/termine/archiv',
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
            eyebrow="Terminarchiv"
            events={events}
            headline="Vergangene öffentliche Termine"
            intro="Rückblick auf bereits gelaufene Termine, Aktionen und öffentliche Veranstaltungen."
            mode="archive"
          />
        </div>
      </section>
    </SiteShell>
  )
}
