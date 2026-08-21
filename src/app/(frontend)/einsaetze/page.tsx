import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { OperationsLogSection } from '@/components/trustred/OperationsLogSection'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicOperations, getSiteSettings } from '@/lib/trustred/cms'

type Props = {
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function OperationsIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'einsaetze',
    pathname: '/einsaetze',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [operations, settings] = await Promise.all([getPublicOperations(), getSiteSettings()])

  return (
    <SiteShell pathname="/einsaetze" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <OperationsLogSection
            eyebrow="Einsatzhistorie"
            headline="Öffentliche Einsatzübersicht"
            intro="Kompakte Übersicht der zuletzt freigegebenen Einsätze. Die Darstellung orientiert sich bewusst am dichten, schnell scanbaren Trustred-Muster aus dem bisherigen System."
            maxItems={100}
            operations={operations}
            showFilters
            showStats
          />
        </div>
      </section>
    </SiteShell>
  )
}
