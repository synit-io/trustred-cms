import Link from 'next/link'

import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { FAQAccordion } from '@/components/trustred/FAQAccordion'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicFaqs, getSiteSettings } from '@/lib/trustred/cms'

type Props = {
  searchParams: Promise<{
    open?: string | string[]
    q?: string | string[]
    topic?: string | string[]
    submittedForm?: string | string[]
  }>
}

export default async function FaqIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const openId = typeof resolvedSearchParams.open === 'string' ? resolvedSearchParams.open : null
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q.trim() : ''
  const topic = typeof resolvedSearchParams.topic === 'string' ? resolvedSearchParams.topic.trim() : ''
  const configuredPage = await ConfiguredPageRoute({
    faqOpenId: openId,
    pageSlug: 'faq',
    pathname: '/faq',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [faqs, settings] = await Promise.all([getPublicFaqs(), getSiteSettings()])
  const topics = Array.from(new Set(faqs.map((faq) => faq.category?.trim()).filter((value): value is string => Boolean(value)))).sort((left, right) =>
    left.localeCompare(right, 'de'),
  )
  const normalizedQuery = query.toLocaleLowerCase('de')
  const filteredFaqs = faqs.filter((faq) => {
    const matchesTopic = topic ? faq.category === topic : true
    const searchableText = [faq.question, faq.answer, faq.category].filter(Boolean).join(' ').toLocaleLowerCase('de')
    const matchesQuery = normalizedQuery ? searchableText.includes(normalizedQuery) : true

    return matchesTopic && matchesQuery
  })

  return (
    <SiteShell pathname="/faq" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-8">
          <div className="ff-section-head">
            <p className="ff-kicker">FAQ</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">Häufige Fragen</h1>
            <p className="text-lg leading-8 text-neutral-700">
              Antworten auf die wichtigsten Fragen rund um Feuerwehr, Mitmachen und Vorsorge.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-6">
            {topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Link className={topic ? 'ff-btn-ghost' : 'ff-btn-accent'} href="/faq">
                  Alle Themen
                </Link>
                {topics.map((entry) => (
                  <Link
                    className={topic === entry ? 'ff-btn-accent' : 'ff-btn-ghost'}
                    href={`/faq?topic=${encodeURIComponent(entry)}`}
                    key={entry}
                  >
                    {entry}
                  </Link>
                ))}
              </div>
            ) : null}

            <form className="ff-card grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem_auto] md:items-end" method="get">
              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
                Frage oder Stichwort
                <input
                  className="min-h-12 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-[var(--brand-500)]"
                  defaultValue={query}
                  name="q"
                  placeholder="z. B. Notruf, Mitgliedschaft, Einsatz"
                  type="search"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
                Thema
                <select
                  className="min-h-12 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-[var(--brand-500)]"
                  defaultValue={topic}
                  name="topic"
                >
                  <option value="">Alle Themen</option>
                  {topics.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="ff-btn-accent" type="submit">
                  Antworten filtern
                </button>
                {(query || topic) ? (
                  <Link className="ff-btn-ghost" href="/faq">
                    Filter zurücksetzen
                  </Link>
                ) : null}
              </div>
            </form>

            {filteredFaqs.length > 0 ? (
              <FAQAccordion faqs={filteredFaqs} openId={openId} />
            ) : (
              <div className="ff-card grid gap-4 border-dashed text-neutral-700">
                <div>
                  <p className="ff-kicker">Keine passende Antwort gefunden</p>
                  <h2 className="text-[clamp(1.4rem,4vw,2.2rem)]">Die Suche liefert aktuell keinen passenden FAQ-Eintrag.</h2>
                </div>
                <p className="max-w-2xl text-base leading-8">
                  Passe Suchbegriff oder Thema an oder melde dich direkt, wenn du eine individuelle Frage zur Feuerwehr, zum Mitmachen oder zur Sicherheit hast.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link className="ff-btn-accent" href="/kontakt">
                    Frage stellen
                  </Link>
                  <Link className="ff-btn-ghost" href="/faq">
                    Alle FAQ anzeigen
                  </Link>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link className="ff-btn-accent" href="/kontakt">
                Frage stellen
              </Link>
              <Link className="ff-btn-ghost" href="/sicherheit">
                Mehr Sicherheitshinweise
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
