import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { EquipmentOverviewSection } from '@/components/trustred/EquipmentOverviewSection'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicEquipment, getSiteSettings } from '@/lib/trustred/cms'

type Props = {
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function EquipmentIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'technik',
    pathname: '/technik',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [equipment, settings] = await Promise.all([getPublicEquipment(), getSiteSettings()])

  return (
    <SiteShell pathname="/technik" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <EquipmentOverviewSection
            equipment={equipment}
            eyebrow="Technik"
            headline="Fahrzeuge und Ausstattung"
            intro="Übersicht über Fahrzeuge, Funkrufnamen und zentrale technische Merkmale."
            maxItems={12}
            showFeaturedProfile
            showStats
          />
        </div>
      </section>
    </SiteShell>
  )
}
