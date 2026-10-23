import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { EventsAgendaSection } from '@/components/trustred/EventsAgendaSection'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicArchivedEvents, getSiteSettings } from '@/lib/trustred/cms'
import { getCurrentTimestamp } from '@/lib/trustred/time'

type Props = {
  searchParams: Promise<{
    page?: string | string[]
    submittedForm?: string | string[]
  }>
}

export default async function EventsArchivePage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(
    1,
    Number.parseInt(
      typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : '1',
      10,
    ) || 1,
  )
  const configuredPage = await ConfiguredPageRoute({
    archivePage: page,
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

  const [archive, settings] = await Promise.all([getPublicArchivedEvents(page), getSiteSettings()])

  return (
    <SiteShell pathname="/termine" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <EventsAgendaSection
            archivePagination={{ page: archive.page, totalPages: archive.totalPages }}
            currentTimestamp={getCurrentTimestamp()}
            eyebrow="Terminarchiv"
            events={archive.docs}
            headline="Vergangene öffentliche Termine"
            intro="Rückblick auf bereits gelaufene Termine, Aktionen und öffentliche Veranstaltungen."
            mode="archive"
          />
        </div>
      </section>
    </SiteShell>
  )
}
