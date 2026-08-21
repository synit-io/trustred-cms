import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicCrew, getPublicCrewById, getSiteSettings } from '@/lib/trustred/cms'
import { getCrewPath } from '@/lib/trustred/public-content'
import { getMediaImage, shouldShowImagePlaceholder } from '@/lib/trustred/public-content'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function CrewDetailPage({ params }: Props) {
  const { id } = await params
  const [member, crew, settings] = await Promise.all([getPublicCrewById(id), getPublicCrew(), getSiteSettings()])

  if (!member) {
    notFound()
  }

  const portrait = getMediaImage(member.portrait)
  const relatedCrew = crew
    .filter((entry) => entry.id !== member.id)
    .sort((left, right) => {
      const leftScore = left.role === member.role ? 1 : 0
      const rightScore = right.role === member.role ? 1 : 0
      return rightScore - leftScore
    })
    .slice(0, 3)

  return (
    <SiteShell pathname="/team" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="ff-section-head">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              <Link className="transition hover:text-[var(--brand-500)]" href="/">
                Start
              </Link>
              <span>/</span>
              <Link className="transition hover:text-[var(--brand-500)]" href="/team">
                Team
              </Link>
              <span>/</span>
              <span className="text-neutral-700">Profil</span>
            </div>
            <p className="ff-kicker">Teamprofil</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">{member.name}</h1>
            <p className="text-lg leading-8 text-neutral-700">
              {member.role}
              {member.qualification ? ` · ${member.qualification}` : ''}
            </p>
          </div>

          <article className="ff-card grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <aside className="grid gap-4">
              {portrait?.src ? (
                <div className="overflow-hidden rounded-[1.4rem] border border-neutral-200">
                  <Image
                    alt={portrait.alt}
                    className="h-[28rem] w-full object-cover"
                    height={portrait.height}
                    src={portrait.src}
                    width={portrait.width}
                  />
                </div>
              ) : shouldShowImagePlaceholder(member) ? (
                <MediaPlaceholder className="h-[28rem] w-full" label="Kein Portrait hinterlegt" />
              ) : null}
              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Kurzprofil</p>
                <ul className="mt-4 grid gap-3 text-sm text-neutral-700">
                  <li><strong className="text-neutral-900">Rolle:</strong> {member.role}</li>
                  <li><strong className="text-neutral-900">Qualifikation:</strong> {member.qualification || 'Nicht öffentlich hinterlegt'}</li>
                  <li><strong className="text-neutral-900">Schwerpunkt:</strong> {member.focus || 'Folgt'}</li>
                </ul>
              </div>
            </aside>

            <div className="grid gap-4">
              <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Schwerpunkt</p>
                <p className="mt-4 text-base leading-8 text-neutral-800">
                  {member.focus || 'Für dieses Profil wurden noch keine ausführlicheren öffentlichen Schwerpunktinformationen hinterlegt.'}
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Skills</p>
                {(member.skills ?? []).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(member.skills ?? []).map((skill, index) => (
                      <span className="ff-skill-badge" key={`member-skill-${index}`}>
                        {skill.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-neutral-700">
                    Aktuell sind für dieses Profil keine öffentlichen Skills hinterlegt.
                  </p>
                )}
              </div>

              <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Nächster Schritt</p>
                <p className="mt-4 text-sm leading-7 text-neutral-700">
                  Wenn du das Team näher kennenlernen möchtest, findest du in der Teamübersicht weitere Profile oder kannst direkt unverbindlich Kontakt aufnehmen.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="ff-btn-accent" href="/team">
                    Teamübersicht
                  </Link>
                  <Link className="ff-btn-ghost" href="/kontakt">
                    Kontakt
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {relatedCrew.length > 0 ? (
            <section className="grid gap-4 lg:grid-cols-3">
              {relatedCrew.map((relatedMember) => (
                <article className="ff-card grid gap-4" key={relatedMember.id}>
                  <div>
                    <p className="ff-kicker">Teamprofil</p>
                    <h2 className="text-2xl">{relatedMember.name}</h2>
                    <p className="mt-2 text-sm font-semibold text-[var(--brand-500)]">{relatedMember.role}</p>
                  </div>
                  <p className="text-sm leading-7 text-neutral-700">
                    {relatedMember.focus || 'Öffentlicher Schwerpunkt wird noch ergänzt.'}
                  </p>
                  <div className="mt-auto">
                    <Link className="ff-btn-accent w-full" href={getCrewPath(relatedMember.id)}>
                      Profil ansehen
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/team">
              Zum Team
            </Link>
            <Link className="ff-btn-ghost" href="/mitmachen">
              Mitmachen
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
