type FAQAccordionEntry = {
  answer?: string | null
  category?: string | null
  id: number | string
  question?: string | null
}

type Props = {
  className?: string
  faqs: FAQAccordionEntry[]
  openId?: number | string | null
  showCategory?: boolean
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function FAQAccordion({ className, faqs, openId, showCategory = true }: Props) {
  const normalizedOpenId = openId == null ? null : String(openId)

  return (
    <div className={cx('grid gap-3', className)}>
      {faqs.map((faq, index) => {
        const faqId = faq.id == null ? null : String(faq.id)
        const fallbackId = `faq-fallback-${index}`
        const renderedId = faqId ?? fallbackId
        const faqKey = faqId ?? `${faq.question || 'faq'}-${index}`
        const isOpen = faqId == null ? false : normalizedOpenId === faqId

        return (
          <details
            className="group overflow-hidden rounded-[1.3rem] border border-neutral-200 bg-white shadow-[0_12px_30px_rgba(0,45,103,0.08)] open:border-[color:var(--brand-500)]/25"
            id={`faq-${renderedId}`}
            key={faqKey}
            open={isOpen}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                {showCategory && faq.category ? (
                  <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--brand-500)]">
                    {faq.category}
                  </p>
                ) : null}
                <h3 className="text-lg leading-tight text-neutral-950 md:text-xl">
                  {faq.question || 'Unbenannte Frage'}
                </h3>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 text-xl font-semibold text-neutral-700 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="border-t border-neutral-200 bg-neutral-50/65 px-5 py-5">
              <p className="whitespace-pre-line text-sm leading-7 text-neutral-700 md:text-base md:leading-8">
                {faq.answer || 'Für diese Frage liegt aktuell noch keine öffentliche Antwort vor.'}
              </p>
            </div>
          </details>
        )
      })}
    </div>
  )
}
