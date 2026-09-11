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
            className="group overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card open:border-brand-200"
            id={`faq-${renderedId}`}
            key={faqKey}
            open={isOpen}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-neutral-50">
              <div className="min-w-0">
                {showCategory && faq.category ? (
                  <p className="mb-1.5 font-headline text-[0.68rem] uppercase tracking-[0.12em] text-brand-500">
                    {faq.category}
                  </p>
                ) : null}
                <h3 className="text-lg leading-snug text-neutral-900 md:text-xl">
                  {faq.question || 'Unbenannte Frage'}
                </h3>
              </div>
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-white text-neutral-700 transition-transform group-open:rotate-45"
              >
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <div className="border-t border-border-subtle bg-neutral-50 px-5 py-5">
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
