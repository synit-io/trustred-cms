import Link from 'next/link'

import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { FAQAccordion } from '@/components/trustred/FAQAccordion'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicFaqs, getSiteSettings } from '@/lib/trustred/cms'

type Props = {
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function SecurityPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'sicherheit',
    pathname: '/sicherheit',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [faqs, settings] = await Promise.all([getPublicFaqs(), getSiteSettings()])
  const safetyFaqs = faqs.slice(0, 4)

  return (
    <SiteShell pathname="/sicherheit" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="ff-section-head">
            <p className="ff-kicker">Sicherheit</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">Vorsorge, Verhalten und schnelle Orientierung</h1>
            <p className="text-lg leading-8 text-neutral-700">
              Kompakte Hinweise für Alltag, Veranstaltungen und Notfälle. Kein Ersatz für den Notruf: in akuten Lagen immer 112.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Notruf', 'Im Ernstfall zuerst alarmieren, dann Eigenschutz und Umfeld beachten.'],
              ['Zuhause', 'Rauchwarnmelder, Notfallnummern und freie Rettungswege regelmäßig prüfen.'],
              ['Veranstaltungen', 'Zufahrten und Rettungswege niemals zustellen oder blockieren.'],
              ['Digital', 'Wichtige Hinweise und amtliche Warnungen nur aus verlässlichen Quellen teilen.'],
            ].map(([title, copy]) => (
              <article className="ff-card" key={title}>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{title}</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">{copy}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="ff-card">
              <p className="ff-kicker">Schnell reagieren</p>
              <h2 className="text-3xl">Wichtige Grundregeln</h2>
              <ul className="ff-feature-list mt-6">
                <li>
                  <strong>Eigenschutz zuerst</strong>
                  Keine Selbstgefährdung. Abstand halten, Gefahrenbereich erkennen, andere warnen.
                </li>
                <li>
                  <strong>Notruf klar formulieren</strong>
                  Wer meldet, was ist passiert, wo ist es, wie viele Betroffene gibt es, welche Gefahren bestehen?
                </li>
                <li>
                  <strong>Zufahrten freihalten</strong>
                  Rettungswege, Feuerwehrzufahrten und Aufstellflächen dürfen nie blockiert sein.
                </li>
              </ul>
            </article>

            <article className="ff-card">
              <p className="ff-kicker">Häufig gefragt</p>
              <h2 className="text-3xl">Schnelle Antworten ohne Umweg</h2>
              <div className="mt-6">
                <FAQAccordion className="gap-2" faqs={safetyFaqs} showCategory={false} />
              </div>
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/kontakt">
              Kontakt zur Wehr
            </Link>
            <Link className="ff-btn-ghost" href="/faq">
              Gesamte FAQ öffnen
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
