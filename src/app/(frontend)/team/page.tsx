import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { SiteShell } from '@/components/trustred/SiteShell'
import { TeamDirectorySection } from '@/components/trustred/TeamDirectorySection'
import { getPublicCrew, getSiteSettings } from '@/lib/trustred/cms'

type Props = {
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function CrewIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'team',
    pathname: '/team',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [crew, settings] = await Promise.all([getPublicCrew(), getSiteSettings()])

  return (
    <SiteShell pathname="/team" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="ff-section-head">
            <p className="ff-kicker">Team</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">Menschen der Wehr</h1>
            <p className="text-lg leading-8 text-neutral-700">
              Einblicke in Rollen, Qualifikationen und Schwerpunkte der Mannschaft.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="ff-card">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Öffentliche Profile</p>
              <p className="mt-3 font-headline text-4xl text-[var(--brand-500)]">{crew.length}</p>
            </article>
            <article className="ff-card">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Rollen</p>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                Von Wehrführung über Ausbildung bis Geräte- und Einsatzschwerpunkte.
              </p>
            </article>
            <article className="ff-card">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Mitmachen</p>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                Wer das Team kennenlernen möchte, findet auf der Mitmachen-Seite den direkten Einstieg.
              </p>
            </article>
          </div>

          <TeamDirectorySection
            crew={crew}
            eyebrow="Teamverzeichnis"
            headline="Profile nach Aufgaben und Rollen"
            intro="Die öffentliche Teamansicht ist bewusst als schnell lesbares Verzeichnis aufgebaut, damit Besucherinnen und Besucher Zuständigkeiten, Rollen und Schwerpunkte ohne Suchaufwand finden."
          />
        </div>
      </section>
    </SiteShell>
  )
}
