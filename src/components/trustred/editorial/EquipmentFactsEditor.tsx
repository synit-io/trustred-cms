'use client'

import { useState } from 'react'

type Fact = {
  label: string
  value: string
}

export function EquipmentFactsEditor({ initialFacts }: { initialFacts: Fact[] }) {
  const [facts, setFacts] = useState<Fact[]>(initialFacts)

  function updateFact(index: number, nextFact: Fact) {
    setFacts((current) => current.map((fact, factIndex) => (factIndex === index ? nextFact : fact)))
  }

  function removeFact(index: number) {
    setFacts((current) => current.filter((_, factIndex) => factIndex !== index))
  }

  function moveFact(index: number, direction: -1 | 1) {
    setFacts((current) => {
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

  function addFact() {
    setFacts((current) => [...current, { label: 'Merkmal', value: 'Wert' }])
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="ff-kicker">Fakten</p>
        <h3 className="text-2xl">Technikdaten strukturiert pflegen</h3>
        <p className="text-sm text-neutral-600">
          Statt JSON pflegst du hier einzelne Faktenzeilen, so wie sie spaeter auch im öffentlichen
          Technikbereich erscheinen.
        </p>
      </div>

      {facts.length === 0 ? (
        <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
          Noch keine Fakten hinterlegt. Fuege die erste Zeile hinzu.
        </div>
      ) : null}

      <div className="grid gap-3">
        {facts.map((fact, index) => (
          <div
            className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4"
            key={`equipment-fact-${index}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <strong className="text-sm uppercase tracking-[0.08em] text-neutral-700">
                Fakt {index + 1}
              </strong>
              <div className="flex flex-wrap gap-2">
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={index === 0}
                  onClick={() => moveFact(index, -1)}
                  type="button"
                >
                  Hoch
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={index === facts.length - 1}
                  onClick={() => moveFact(index, 1)}
                  type="button"
                >
                  Runter
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  onClick={() => removeFact(index)}
                  type="button"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Label
                <input
                  className="ff-input"
                  onChange={(event) => updateFact(index, { ...fact, label: event.target.value })}
                  value={fact.label}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Wert
                <input
                  className="ff-input"
                  onChange={(event) => updateFact(index, { ...fact, value: event.target.value })}
                  value={fact.value}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button className="ff-btn-accent w-full md:w-fit" onClick={addFact} type="button">
        Fakt hinzufuegen
      </button>

      <input name="facts.count" type="hidden" value={facts.length} />
      {facts.map((fact, index) => (
        <div key={`equipment-fact-hidden-${index}`}>
          <input name={`facts.${index}.label`} type="hidden" value={fact.label} />
          <input name={`facts.${index}.value`} type="hidden" value={fact.value} />
        </div>
      ))}
    </div>
  )
}
