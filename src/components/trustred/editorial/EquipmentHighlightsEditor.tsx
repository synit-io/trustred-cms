'use client'

import { useState } from 'react'

type Highlight = {
  description: string
  title: string
}

export function EquipmentHighlightsEditor({
  initialHighlights,
}: {
  initialHighlights: Highlight[]
}) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights)

  function updateHighlight(index: number, nextHighlight: Highlight) {
    setHighlights((current) =>
      current.map((highlight, currentIndex) =>
        currentIndex === index ? nextHighlight : highlight,
      ),
    )
  }

  function removeHighlight(index: number) {
    setHighlights((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function moveHighlight(index: number, direction: -1 | 1) {
    setHighlights((current) => {
      const target = index + direction

      if (target < 0 || target >= current.length) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function addHighlight() {
    setHighlights((current) => [
      ...current,
      {
        description: 'Kurze Beschreibung des taktischen Mehrwerts.',
        title: 'Neuer Schwerpunkt',
      },
    ])
  }

  return (
    <div className="grid gap-4">
      {highlights.length === 0 ? (
        <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
          Noch keine Schwerpunktkarten hinterlegt. Fuege den ersten Schwerpunkt hinzu.
        </div>
      ) : null}

      <div className="grid gap-3">
        {highlights.map((highlight, index) => (
          <section
            className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4"
            key={`equipment-highlight-${index}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <strong className="text-sm uppercase tracking-[0.08em] text-neutral-700">
                Schwerpunkt {index + 1}
              </strong>
              <div className="flex flex-wrap gap-2">
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={index === 0}
                  onClick={() => moveHighlight(index, -1)}
                  type="button"
                >
                  Hoch
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={index === highlights.length - 1}
                  onClick={() => moveHighlight(index, 1)}
                  type="button"
                >
                  Runter
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  onClick={() => removeHighlight(index)}
                  type="button"
                >
                  Entfernen
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Titel
                <input
                  className="ff-input"
                  onChange={(event) =>
                    updateHighlight(index, { ...highlight, title: event.target.value })
                  }
                  value={highlight.title}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Beschreibung
                <textarea
                  className="ff-input"
                  onChange={(event) =>
                    updateHighlight(index, { ...highlight, description: event.target.value })
                  }
                  rows={4}
                  value={highlight.description}
                />
              </label>
            </div>
          </section>
        ))}
      </div>

      <button className="ff-btn-accent w-full md:w-fit" onClick={addHighlight} type="button">
        Schwerpunkt hinzufuegen
      </button>

      <input name="highlights.count" type="hidden" value={highlights.length} />
      {highlights.map((highlight, index) => (
        <div key={`equipment-highlight-hidden-${index}`}>
          <input name={`highlights.${index}.title`} type="hidden" value={highlight.title} />
          <input
            name={`highlights.${index}.description`}
            type="hidden"
            value={highlight.description}
          />
        </div>
      ))}
    </div>
  )
}
