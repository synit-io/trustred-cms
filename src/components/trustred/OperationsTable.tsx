import Link from 'next/link'

import { OperationTypeBadge } from '@/components/trustred/OperationTypeBadge'
import { getOperationDetailPath } from '@/lib/trustred/operations'
import { getOperationMeta } from '@/lib/trustred/operations'
import { getStatusBadgeClass } from '@/lib/trustred/public-content'
import type { Operation } from '@/payload-types'

const dateTimeFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function OperationsTable({ operations }: { operations: Operation[] }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:hidden">
        {operations.map((operation, index) => {
          const meta = getOperationMeta(operation.category)
          const operationId = operation.id == null ? null : String(operation.id)
          const fallbackKey = `${operation.operationNumber || 'operation'}-${operation.startedAt || index}`
          const operationKey = operationId ?? fallbackKey
          const detailsHref = operationId ? getOperationDetailPath(operation) : null

          return (
            <article className={`ff-card ${meta.rowClass}`} key={operationKey}>
              <div className="flex flex-wrap items-center gap-2">
                {detailsHref ? (
                  <Link className={`${getStatusBadgeClass('brand')} hover:text-[var(--brand-700)]`} href={detailsHref}>
                    {operation.operationNumber}
                  </Link>
                ) : (
                  <span className={getStatusBadgeClass('brand')}>{operation.operationNumber}</span>
                )}
                <span className={getStatusBadgeClass('warning')}>{operation.alarmCode}</span>
                <OperationTypeBadge type={operation.category} />
              </div>
              <h3 className="mt-4 text-xl">{operation.location}</h3>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                {dateTimeFormat.format(new Date(operation.startedAt))}
              </p>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{operation.summary}</p>
              {detailsHref ? (
                <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--brand-500)] hover:text-[var(--brand-700)]" href={detailsHref}>
                  Details
                </Link>
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="ff-table-wrap hidden md:block">
        <table className="ff-table">
          <caption className="sr-only">
            Letzte Einsätze mit Zeitpunkt, Stichwort, Kategorie, Ort und Kurzbericht.
          </caption>
          <thead>
            <tr>
              <th scope="col">Einsatz-Nr.</th>
              <th scope="col">Zeitpunkt</th>
              <th scope="col">Stichwort</th>
              <th scope="col">Kategorie</th>
              <th scope="col">Ort</th>
              <th scope="col">Kurzbericht</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((operation, index) => {
              const meta = getOperationMeta(operation.category)
              const operationId = operation.id == null ? null : String(operation.id)
              const fallbackKey = `${operation.operationNumber || 'operation'}-${operation.startedAt || index}`
              const operationKey = operationId ?? fallbackKey
              const detailsHref = operationId ? getOperationDetailPath(operation) : null

              return (
                <tr className={meta.rowClass} key={operationKey}>
                  <th scope="row">
                    {detailsHref ? (
                      <Link className="font-semibold text-[var(--brand-500)] hover:text-[var(--brand-700)]" href={detailsHref}>
                        {operation.operationNumber}
                      </Link>
                    ) : (
                      operation.operationNumber
                    )}
                  </th>
                  <td>{dateTimeFormat.format(new Date(operation.startedAt))}</td>
                  <td>
                    <span className={getStatusBadgeClass('warning')}>{operation.alarmCode}</span>
                  </td>
                  <td>
                    <OperationTypeBadge type={operation.category} />
                  </td>
                  <td>{operation.location}</td>
                  <td>{operation.summary}</td>
                  <td>
                    {detailsHref ? (
                      <Link className="font-semibold text-[var(--brand-500)] hover:text-[var(--brand-700)]" href={detailsHref}>
                        Details
                      </Link>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
