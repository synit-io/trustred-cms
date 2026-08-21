import Link from 'next/link'

import type { Media } from '@/payload-types'

type MediaOption = {
  alt: string
  category: Media['category']
  filename: string
  id: number
  url: string | null
}

type BaseProps = {
  browseHref?: string
  hint?: string
  label: string
  options: MediaOption[]
  uploadFields?: {
    altName: string
    captionName: string
    fileName: string
    label?: string
  }
}

type ControlledProps = BaseProps & {
  defaultValue?: never
  name?: never
  onChange: (value: string) => void
  value: string
}

type UncontrolledProps = BaseProps & {
  defaultValue?: number
  name: string
  onChange?: never
  value?: never
}

type Props = ControlledProps | UncontrolledProps

export function MediaSelectField(props: Props) {
  const { browseHref = '/manage/media', hint, label, options } = props
  const isControlled = 'value' in props
  const currentValue = isControlled ? props.value : String(props.defaultValue ?? '')
  const selected = options.find((option) => String(option.id) === currentValue)
  const controlledOnChange = isControlled ? props.onChange : undefined

  return (
    <div className="grid gap-4">
      <label>
        {label}
        {isControlled ? (
          <select className="ff-input" onChange={(event) => controlledOnChange?.(event.target.value)} value={currentValue}>
            <MediaOptions options={options} />
          </select>
        ) : (
          <select className="ff-input" defaultValue={currentValue} name={props.name}>
            <MediaOptions options={options} />
          </select>
        )}
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
        <p>{hint || 'Wähle ein vorhandenes Medium aus der Mediathek aus.'}</p>
        <Link className="ff-btn-ghost min-h-9 px-3" href={browseHref}>
          Mediathek öffnen
        </Link>
      </div>
      {props.uploadFields ? (
        <div className="rounded-[1.2rem] border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            {props.uploadFields.label || 'Neues Medium direkt hochladen'}
          </p>
          <div className="mt-4 grid gap-4">
            <label>
              Datei
              <input accept="image/*" className="ff-input" name={props.uploadFields.fileName} type="file" />
            </label>
            <label>
              Alt-Text
              <input className="ff-input" name={props.uploadFields.altName} placeholder="Beschreibender Alternativtext" />
            </label>
            <label>
              Caption
              <textarea className="ff-input" name={props.uploadFields.captionName} rows={3} />
            </label>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Wenn hier eine Datei gewählt wird, wird sie beim Speichern hochgeladen und ersetzt die aktuelle Auswahl in diesem Feld.
          </p>
        </div>
      ) : null}
      {selected ? (
        <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-start gap-4">
            {selected.url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={selected.alt} className="h-24 w-24 rounded-2xl object-cover" src={selected.url} />
              </>
            ) : null}
            <div className="grid gap-1 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">#{selected.id} · {selected.filename}</p>
              <p>Kategorie: {selected.category}</p>
              <p>{selected.alt || 'Kein Alt-Text hinterlegt.'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
          Noch kein Medium ausgewählt.
        </div>
      )}
    </div>
  )
}

function MediaOptions({ options }: { options: MediaOption[] }) {
  return (
    <>
      <option value="">Kein Medium ausgewählt</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          #{option.id} · {option.category} · {option.filename}
        </option>
      ))}
    </>
  )
}
