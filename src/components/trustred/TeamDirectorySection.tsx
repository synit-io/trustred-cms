import Image from 'next/image'
import Link from 'next/link'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { getCrewPath, getMediaImage, getStatusBadgeClass, shouldShowImagePlaceholder } from '@/lib/trustred/public-content'
import type { Crew } from '@/payload-types'

type Props = {
  crew: Crew[]
  eyebrow?: string | null
  headline: string
  intro?: string | null
}

export function TeamDirectorySection({ crew, eyebrow, headline, intro }: Props) {
  const groupedCrew = Array.from(
    crew
      .slice()
      .sort((left, right) => {
        const roleCompare = String(left.role ?? '').localeCompare(String(right.role ?? ''), 'de')
        if (roleCompare !== 0) return roleCompare
        return String(left.name ?? '').localeCompare(String(right.name ?? ''), 'de')
      })
      .reduce((groups, member) => {
        const role = member.role?.trim() || 'Team'
        const existing = groups.get(role) ?? []
        existing.push(member)
        groups.set(role, existing)
        return groups
      }, new Map<string, Crew[]>()),
  )

  return (
    <div className="grid gap-6">
      <div className="ff-section-head">
        {eyebrow ? <p className="ff-kicker">{eyebrow}</p> : null}
        <h2 className="text-[clamp(2rem,5vw,4rem)]">{headline}</h2>
        {intro ? <p className="text-lg leading-8 text-neutral-700">{intro}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {groupedCrew.map(([role, members]) => (
          <a className="ff-pill" href={`#team-${encodeURIComponent(role)}`} key={role}>
            {role} · {members.length}
          </a>
        ))}
      </div>

      <div className="grid gap-8">
        {groupedCrew.map(([role, members]) => (
          <section className="grid gap-4" id={`team-${encodeURIComponent(role)}`} key={role}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="ff-kicker">Teambereich</p>
                <h3 className="text-3xl">{role}</h3>
              </div>
              <span className={getStatusBadgeClass('team')}>{members.length} Profile</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => {
                const portrait = getMediaImage(member.portrait)

                return (
                  <article className="ff-card grid h-full content-start gap-4" key={member.id}>
                    {portrait?.src ? (
                      <div className="overflow-hidden rounded-[1.3rem] border border-neutral-200">
                        <Image
                          alt={portrait.alt}
                          className="h-72 w-full object-cover"
                          height={portrait.height}
                          src={portrait.src}
                          width={portrait.width}
                        />
                      </div>
                    ) : shouldShowImagePlaceholder(member) ? (
                      <MediaPlaceholder className="h-72 w-full" label="Kein Portrait hinterlegt" />
                    ) : null}
                    <div>
                      <p className={`${getStatusBadgeClass('team')} w-fit`}>{member.role}</p>
                      <h4 className="mt-4 text-2xl">{member.name}</h4>
                      <p className="mt-2 text-sm font-semibold text-[var(--brand-500)]">
                        {member.qualification || 'Qualifikation folgt'}
                      </p>
                    </div>
                    <p className="text-sm leading-7 text-neutral-700">
                      {member.focus || 'Öffentlicher Schwerpunkt wird noch ergänzt.'}
                    </p>
                    {(member.skills ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(member.skills ?? []).map((skill, index) => (
                          <span className="ff-skill-badge" key={`crew-skill-${member.id}-${index}`}>
                            {skill.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-auto">
                      <Link className="ff-btn-accent w-full" href={getCrewPath(member.id)}>
                        Profil ansehen
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {groupedCrew.length === 0 ? (
        <article className="ff-card grid gap-4 border-dashed">
          <div>
            <p className="ff-kicker">Noch keine Teamprofile</p>
            <h3 className="text-[clamp(1.4rem,4vw,2.2rem)]">Aktuell sind noch keine öffentlichen Profile der Mannschaft freigegeben.</h3>
          </div>
          <p className="text-sm leading-7 text-neutral-700">
            Sobald Rollen und Zuständigkeiten veröffentlicht werden, erscheint das Team hier als geordnetes Verzeichnis. Für Interesse an der Mitarbeit hilft der direkte Einstieg über Mitmachen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/mitmachen">
              Mitmachen
            </Link>
            <Link className="ff-btn-ghost" href="/kontakt">
              Kontakt
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  )
}
