import { getOperationMeta } from '@/lib/trustred/operations'

export function OperationTypeBadge({ type }: { type: string }) {
  const meta = getOperationMeta(type)

  return (
    <span className={meta.chipClass}>
      {meta.key === 'brand' ? (
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.7 2.1c.2 2-1 3.7-2.2 5.2-1.1 1.4-2.1 2.6-2.1 4.1 0 1.6 1.3 2.9 2.9 2.9 2.4 0 4.3-2 4.3-4.4 0-2.8-1.6-4.8-2.9-7.8zm-1.4 20.1c-3.4 0-6.1-2.6-6.1-5.9 0-1.9.9-3.5 2.4-4.8.3 3.2 2.2 4.7 4.3 4.7 3 0 5.3-2.6 5.3-5.8v-.3c1.4 1.2 2.2 2.9 2.2 4.9 0 3.3-2.7 7.2-8.1 7.2z" />
        </svg>
      ) : null}
      {meta.key === 'hilfe' ? (
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 21l6-6m2-2l10-10 2 2-10 10m-2 2l-3 3m0 0H3v-5l3-3" />
        </svg>
      ) : null}
      {meta.key === 'wetter' ? (
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 18a4 4 0 110-8c.5 0 1 .1 1.4.3A5.5 5.5 0 0119 12a3 3 0 010 6H7zm7.4-6.7L12 15h2l-1.2 4.7L16 14h-2l.4-2.7z" />
        </svg>
      ) : null}
      {meta.key === 'sonstiges' ? (
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
      ) : null}
      <span>{meta.label}</span>
    </span>
  )
}
