'use client'

import { useMemo, useState } from 'react'

import { OperationsTable } from '@/components/trustred/OperationsTable'
import { getOperationMeta } from '@/lib/trustred/operations'
import type { Operation } from '@/payload-types'

export function OperationsArchive({ operations }: { operations: Operation[] }) {
  const years = useMemo(
    () =>
      Array.from(new Set(operations.map((operation) => new Date(operation.startedAt).getFullYear().toString()))).sort(
        (left, right) => Number(right) - Number(left),
      ),
    [operations],
  )
  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          operations.map((operation) => [
            operation.category,
            getOperationMeta(operation.category).label,
          ]),
        ).entries(),
      ),
    [operations],
  )
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filtered = useMemo(
    () =>
      operations.filter((operation) => {
        const year = new Date(operation.startedAt).getFullYear().toString()
        const yearMatch = selectedYear === 'all' || year === selectedYear
        const categoryMatch = selectedCategory === 'all' || operation.category === selectedCategory
        return yearMatch && categoryMatch
      }),
    [operations, selectedCategory, selectedYear],
  )

  return (
    <div className="grid gap-4">
      <div className="ff-card">
        <div className="ff-grid-3 gap-3">
          <label className="grid gap-1 text-sm font-semibold text-neutral-700">
            Jahr
            <select className="ff-input" onChange={(event) => setSelectedYear(event.target.value)} value={selectedYear}>
              <option value="all">Alle</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-semibold text-neutral-700">
            Einsatzart
            <select className="ff-input" onChange={(event) => setSelectedCategory(event.target.value)} value={selectedCategory}>
              <option value="all">Alle</option>
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              className="ff-btn-ghost w-full md:w-auto"
              onClick={() => {
                setSelectedYear('all')
                setSelectedCategory('all')
              }}
              type="button"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      <OperationsTable operations={filtered} />
      <p className="text-sm text-neutral-600" role="status">
        {filtered.length} von {operations.length} Einsätzen sichtbar.
      </p>
    </div>
  )
}
