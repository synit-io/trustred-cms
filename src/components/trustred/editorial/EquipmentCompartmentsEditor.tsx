'use client'

import { useState } from 'react'

import { MediaSelectField } from '@/components/trustred/editorial/MediaSelectField'
import type { Media } from '@/payload-types'

type Compartment = {
  code: string
  contents: string
  description: string
  image: string
  showImagePlaceholder: boolean
  title: string
}

type MediaOption = {
  alt: string
  category: Media['category']
  filename: string
  id: number
  url: string | null
}

export function EquipmentCompartmentsEditor({
  initialCompartments,
  mediaOptions,
}: {
  initialCompartments: Compartment[]
  mediaOptions: MediaOption[]
}) {
  const [compartments, setCompartments] = useState<Compartment[]>(initialCompartments)

  function updateCompartment(index: number, nextCompartment: Compartment) {
    setCompartments((current) =>
      current.map((compartment, currentIndex) =>
        currentIndex === index ? nextCompartment : compartment,
      ),
    )
  }

  function removeCompartment(index: number) {
    setCompartments((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function moveCompartment(index: number, direction: -1 | 1) {
    setCompartments((current) => {
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

  function addCompartment() {
    setCompartments((current) => [
      ...current,
      {
        code: `G${current.length + 1}`,
        contents: '',
        description: '',
        image: '',
        showImagePlaceholder: false,
        title: 'Neuer Fahrzeugabschnitt',
      },
    ])
  }

  return (
    <div className="grid gap-4">
      {compartments.length === 0 ? (
        <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
          Noch keine Fahrzeugabschnitte hinterlegt. Fuege den ersten Abschnitt hinzu.
        </div>
      ) : null}

      <div className="grid gap-3">
        {compartments.map((compartment, index) => (
          <section
            className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4"
            key={`equipment-compartment-${index}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <strong className="text-sm uppercase tracking-[0.08em] text-neutral-700">
                Abschnitt {index + 1}
              </strong>
              <div className="flex flex-wrap gap-2">
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={index === 0}
                  onClick={() => moveCompartment(index, -1)}
                  type="button"
                >
                  Hoch
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={index === compartments.length - 1}
                  onClick={() => moveCompartment(index, 1)}
                  type="button"
                >
                  Runter
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  onClick={() => removeCompartment(index)}
                  type="button"
                >
                  Entfernen
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
                <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                  Code
                  <input
                    className="ff-input"
                    onChange={(event) =>
                      updateCompartment(index, { ...compartment, code: event.target.value })
                    }
                    value={compartment.code}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                  Titel
                  <input
                    className="ff-input"
                    onChange={(event) =>
                      updateCompartment(index, { ...compartment, title: event.target.value })
                    }
                    value={compartment.title}
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Kurzbeschreibung
                <textarea
                  className="ff-input"
                  onChange={(event) =>
                    updateCompartment(index, { ...compartment, description: event.target.value })
                  }
                  rows={3}
                  value={compartment.description}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Inhalte
                <textarea
                  className="ff-input"
                  onChange={(event) =>
                    updateCompartment(index, { ...compartment, contents: event.target.value })
                  }
                  placeholder={
                    'Je Zeile ein Eintrag, z. B.\nSchlauchmaterial\nArmaturen\nVerteiler'
                  }
                  rows={6}
                  value={compartment.contents}
                />
              </label>

              <MediaSelectField
                hint="Optionales Bild fuer diesen Fahrzeugabschnitt."
                label="Abschnittsbild"
                options={mediaOptions}
                uploadFields={{
                  altName: `compartments.${index}.imageUploadAlt`,
                  captionName: `compartments.${index}.imageUploadCaption`,
                  fileName: `compartments.${index}.imageUpload`,
                  label: 'Oder neues Abschnittsbild hochladen',
                }}
                value={compartment.image}
                onChange={(value) => updateCompartment(index, { ...compartment, image: value })}
              />

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <input
                  checked={compartment.showImagePlaceholder}
                  onChange={(event) =>
                    updateCompartment(index, {
                      ...compartment,
                      showImagePlaceholder: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                Platzhalter anzeigen, wenn kein Abschnittsbild vorhanden ist
              </label>
            </div>
          </section>
        ))}
      </div>

      <button className="ff-btn-accent w-full md:w-fit" onClick={addCompartment} type="button">
        Fahrzeugabschnitt hinzufuegen
      </button>

      <input name="compartments.count" type="hidden" value={compartments.length} />
      {compartments.map((compartment, index) => (
        <div key={`equipment-compartment-hidden-${index}`}>
          <input name={`compartments.${index}.code`} type="hidden" value={compartment.code} />
          <input name={`compartments.${index}.title`} type="hidden" value={compartment.title} />
          <input
            name={`compartments.${index}.description`}
            type="hidden"
            value={compartment.description}
          />
          <input name={`compartments.${index}.image`} type="hidden" value={compartment.image} />
          {compartment.showImagePlaceholder ? (
            <input name={`compartments.${index}.showImagePlaceholder`} type="hidden" value="on" />
          ) : null}
          <textarea
            className="hidden"
            name={`compartments.${index}.contents`}
            readOnly
            value={compartment.contents}
          />
        </div>
      ))}
    </div>
  )
}
