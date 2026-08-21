import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { EquipmentCompartmentsEditor } from '@/components/trustred/editorial/EquipmentCompartmentsEditor'
import { EquipmentFactsEditor } from '@/components/trustred/editorial/EquipmentFactsEditor'
import { EquipmentHighlightsEditor } from '@/components/trustred/editorial/EquipmentHighlightsEditor'
import { MediaSelectField } from '@/components/trustred/editorial/MediaSelectField'
import { PageBlockBuilder } from '@/components/trustred/editorial/PageBlockBuilder'
import { getEditablePageLayout, toRelationId } from '@/lib/trustred/page-builder'
import { normalizeWarningPresets } from '@/lib/trustred/warning-presets'
import {
  deleteCollectionDoc,
  editorialCollections,
  getEditorialPermissions,
  isEditorialCollectionSlug,
  loadCollectionDocById,
  requireEditorialContext,
  saveCollectionDoc,
  toFormValue,
} from '@/lib/trustred/editorial'
import type { Crew, Equipment, Event as PayloadEvent, Faq, Form, Media, Operation, Page, Post, WarningPreset } from '@/payload-types'

type MediaOption = {
  alt: string
  category: Media['category']
  filename: string
  id: number
  url: string | null
}

type FormOption = {
  id: number
  title: string
}

type EquipmentOption = {
  id: number
  label: string
  slug: string
}

type OptionalPlaceholderDoc = {
  showImagePlaceholder?: boolean | null
}

const editorialGuidance: Record<string, { points: string[]; title: string }> = {
  crew: {
    points: [
      'Name, Rolle und Fokus kurz und klar halten.',
      'Portrait nur verwenden, wenn das Bild öffentlich freigegeben ist.',
      'Skills als scanbare Stichworte pflegen, nicht als Fließtext.',
    ],
    title: 'Teamdarstellung',
  },
  equipment: {
    points: [
      'Funkrufname und Zusammenfassung zuerst pflegen, danach Fakten und Abschnitte strukturieren.',
      'Fahrzeugabschnitte so benennen, wie sie später öffentlich schnell erfasst werden können.',
      'Technikdaten und Highlights knapp, einsatznah und ohne internes Fachabkürzungs-Chaos formulieren.',
    ],
    title: 'Technik-Qualitätscheck',
  },
  events: {
    points: [
      'Beginn und Ende vollständig setzen, damit Website und ICS stimmige Zeiträume ausgeben.',
      'Nur öffentliche Termine mit sichtbarer Außenwirkung freigeben.',
      'Zusammenfassung so schreiben, dass Gäste den Termin ohne Rückfrage verstehen.',
    ],
    title: 'Termin-Qualitätscheck',
  },
  faqs: {
    points: [
      'Eine Frage pro Eintrag.',
      'Antwort direkt und ohne unnötige Einleitung formulieren.',
      'Kategorien für spätere Gruppierung konsistent benennen.',
    ],
    title: 'FAQ-Qualitätscheck',
  },
  operations: {
    points: [
      'Nur datenschutzkonforme, öffentlich tragbare Einsatztexte veröffentlichen.',
      'Kurzbericht zuerst, Details nur wenn wirklich nötig.',
      'Bilder nur nutzen, wenn sie keine sensiblen Informationen zeigen.',
    ],
    title: 'Einsatz-Qualitätscheck',
  },
  pages: {
    points: [
      'Die Seite mit strukturierten Blöcken aufbauen und HTML nur als Ausnahme verwenden.',
      'Hero, Feed und Banner bewusst aufeinander abstimmen.',
      'Navigationstitel kurz halten und Seiten nur veröffentlichen, wenn die Blockreihenfolge stimmig ist.',
    ],
    title: 'Seiten-Qualitätscheck',
  },
  posts: {
    points: [
      'Titel und Kurztext so schreiben, dass sie auch in Kartenansichten funktionieren.',
      'Beitragsbild nur setzen, wenn es den Inhalt klar unterstützt.',
      'Der Fließtext sollte auch ohne Bild verständlich bleiben.',
    ],
    title: 'Beitrags-Qualitätscheck',
  },
}

type Props = {
  params: Promise<{
    collection: string
    id: string
  }>
}

export default async function ManageCollectionEditorPage({ params }: Props) {
  const { collection, id } = await params

  if (!isEditorialCollectionSlug(collection)) {
    notFound()
  }

  const collectionSlug = collection
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)
  const operationsCollections = new Set(['events', 'operations'])
  const guidance = editorialGuidance[collectionSlug]

  if (
    (operationsCollections.has(collectionSlug) && !permissions.canAccessOperations) ||
    (!operationsCollections.has(collectionSlug) && !permissions.canAccessContent)
  ) {
    redirect('/manage')
  }

  const config = editorialCollections[collectionSlug]
  const isNew = id === 'new'
  const [doc, mediaLibrary] = await Promise.all([
    isNew ? Promise.resolve(null) : loadCollectionDocById(payload, user, collectionSlug, Number(id)),
    payload.find({
      collection: 'media',
      limit: 100,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
    }),
  ])
  const mediaOptions = mediaLibrary.docs.map((item) => ({
    alt: item.alt,
    category: item.category,
    filename: item.filename ?? `media-${item.id}`,
    id: item.id,
    url: item.thumbnailURL ?? item.url ?? null,
  }))

  async function saveAction(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    await saveCollectionDoc(payload, user, collectionSlug, id, formData)
    redirect(`/manage/content/${collectionSlug}`)
  }

  async function deleteAction() {
    'use server'
    const { payload, user } = await requireEditorialContext()
    if (!isNew && doc) {
      await deleteCollectionDoc(payload, user, collectionSlug, Number(doc.id))
    }
    redirect(`/manage/content/${collectionSlug}`)
  }

  return (
    <div className="grid gap-6">
      <section className="ff-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ff-kicker">Editor</p>
          <h2 className="text-3xl">
            {config.label}: {isNew ? 'Neu' : String(doc?.[config.titleField] ?? doc?.id)}
          </h2>
        </div>
        <Link className="ff-btn-ghost" href={`/manage/content/${collectionSlug}`}>
          Zurück zur Übersicht
        </Link>
      </section>

      {guidance ? (
        <section className="ff-card">
          <p className="ff-kicker">Hinweise</p>
          <h3 className="text-2xl">{guidance.title}</h3>
          <ul className="ff-feature-list">
            {guidance.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {collectionSlug === 'pages' ? (
        <PageEditorForm deleteAction={deleteAction} doc={doc as Page | null} isNew={isNew} mediaOptions={mediaOptions} saveAction={saveAction} />
      ) : collectionSlug === 'posts' ? (
        <PostEditorForm deleteAction={deleteAction} doc={doc as Post | null} isNew={isNew} mediaOptions={mediaOptions} saveAction={saveAction} />
      ) : collectionSlug === 'events' ? (
        <EventEditorForm deleteAction={deleteAction} doc={doc as PayloadEvent | null} isNew={isNew} mediaOptions={mediaOptions} saveAction={saveAction} />
      ) : collectionSlug === 'operations' ? (
        <OperationEditorForm deleteAction={deleteAction} doc={doc as Operation | null} isNew={isNew} mediaOptions={mediaOptions} saveAction={saveAction} />
      ) : collectionSlug === 'crew' ? (
        <CrewEditorForm deleteAction={deleteAction} doc={doc as Crew | null} isNew={isNew} mediaOptions={mediaOptions} saveAction={saveAction} />
      ) : collectionSlug === 'equipment' ? (
        <EquipmentEditorForm deleteAction={deleteAction} doc={doc as Equipment | null} isNew={isNew} mediaOptions={mediaOptions} saveAction={saveAction} />
      ) : collectionSlug === 'faqs' ? (
        <FaqEditorForm deleteAction={deleteAction} doc={doc as Faq | null} isNew={isNew} saveAction={saveAction} />
      ) : (
        <GenericEditorForm collectionSlug={collectionSlug} deleteAction={deleteAction} doc={doc} isNew={isNew} />
      )}
    </div>
  )
}

function GenericEditorForm({
  collectionSlug,
  deleteAction,
  doc,
  isNew,
}: {
  collectionSlug: keyof typeof editorialCollections
  deleteAction: () => Promise<void>
  doc: Record<string, unknown> | null
  isNew: boolean
}) {
  const config = editorialCollections[collectionSlug]

  return (
    <form
      action={async (formData) => {
        'use server'
        const { payload, user } = await requireEditorialContext()
        await saveCollectionDoc(payload, user, collectionSlug, isNew ? 'new' : String(doc?.id ?? ''), formData)
        redirect(`/manage/content/${collectionSlug}`)
      }}
      className="ff-card"
    >
      <div className="ff-form-grid">
        {config.fields.map((field) => {
          const value = doc ? toFormValue(field.type, doc[field.name]) : field.type === 'json' ? '[]' : field.type === 'checkbox' ? false : ''

          if (field.type === 'textarea' || field.type === 'json' || field.type === 'lines') {
            return (
              <label key={field.name}>
                {field.label}
                <textarea
                  className="ff-input"
                  defaultValue={typeof value === 'string' ? value : ''}
                  name={field.name}
                  rows={field.type === 'json' ? 14 : 6}
                />
              </label>
            )
          }

          if (field.type === 'select') {
            return (
              <label key={field.name}>
                {field.label}
                <select className="ff-input" defaultValue={String(value)} name={field.name}>
                  {field.options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                      {optionLabel}
                    </option>
                  ))}
                </select>
              </label>
            )
          }

          if (field.type === 'checkbox') {
            return (
              <label className="inline-flex items-center gap-2" key={field.name}>
                <input defaultChecked={Boolean(value)} name={field.name} type="checkbox" />
                {field.label}
              </label>
            )
          }

          return (
            <label key={field.name}>
              {field.label}
              <input
                className="ff-input"
                defaultValue={typeof value === 'string' ? value : ''}
                name={field.name}
                type={field.type}
              />
            </label>
          )
        })}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button className="ff-btn-accent" type="submit">
          Speichern
        </button>
        {!isNew ? (
          <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
            Löschen
          </button>
        ) : null}
      </div>
    </form>
  )
}

async function PageEditorForm({
  deleteAction,
  doc,
  isNew,
  mediaOptions,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: Page | null
  isNew: boolean
  mediaOptions: MediaOption[]
  saveAction: (formData: FormData) => Promise<void>
}) {
  const { payload, user } = await requireEditorialContext()
  const [warningPresets, forms, equipment] = await Promise.all([
    payload.find({
      collection: 'warning-presets',
      limit: 200,
      overrideAccess: false,
      sort: 'label',
      user,
    }) as Promise<{ docs: WarningPreset[] }>,
    payload.find({
      collection: 'forms',
      limit: 100,
      overrideAccess: false,
      sort: 'title',
      user,
    }) as Promise<{ docs: Form[] }>,
    payload.find({
      collection: 'equipment',
      limit: 100,
      overrideAccess: false,
      sort: 'name',
      user,
    }) as Promise<{ docs: Equipment[] }>,
  ])

  const formOptions: FormOption[] = forms.docs.map((form) => ({
    id: form.id,
    title: form.title,
  }))

  const equipmentOptions: EquipmentOption[] = equipment.docs.map((item) => ({
    id: item.id,
    label: item.callSign ? `${item.name} (${item.callSign})` : item.name,
    slug: item.slug,
  }))

  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Titel
            <input className="ff-input" defaultValue={String(doc?.title ?? '')} name="title" required />
          </label>
          <label>
            Slug
            <input className="ff-input" defaultValue={String(doc?.slug ?? '')} name="slug" required />
          </label>
          <label>
            Navigationslabel
            <input className="ff-input" defaultValue={String(doc?.navigationLabel ?? '')} name="navigationLabel" />
          </label>
          <label>
            Navigationsreihenfolge
            <input
              className="ff-input"
              defaultValue={String(doc?.navigationOrder ?? 100)}
              min={1}
              name="navigationOrder"
              type="number"
            />
          </label>
          <label>
            Status
            <select className="ff-input" defaultValue={String(doc?._status ?? 'draft')} name="_status">
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </label>
          <label>
            Kurzbeschreibung
            <textarea className="ff-input" defaultValue={String(doc?.summary ?? '')} name="summary" rows={5} />
          </label>
          <label className="inline-flex items-center gap-2">
            <input defaultChecked={Boolean(doc?.showInNavigation ?? true)} name="showInNavigation" type="checkbox" />
            In Navigation anzeigen
          </label>
        </div>
      </section>

      <PageBlockBuilder
        equipmentOptions={equipmentOptions}
        formOptions={formOptions}
        initialLayout={getEditablePageLayout(doc?.layout)}
        key={`${String(doc?.id ?? 'new')}:${String(doc?.updatedAt ?? 'draft')}`}
        mediaOptions={mediaOptions}
        warningPresets={normalizeWarningPresets(warningPresets.docs)}
      />

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function EquipmentEditorForm({
  deleteAction,
  doc,
  isNew,
  mediaOptions,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: Equipment | null
  isNew: boolean
  mediaOptions: MediaOption[]
  saveAction: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Name
            <input className="ff-input" defaultValue={String(doc?.name ?? '')} name="name" required />
          </label>
          <label>
            Slug
            <input className="ff-input" defaultValue={String(doc?.slug ?? '')} name="slug" required />
          </label>
          <label>
            Funkrufname
            <input className="ff-input" defaultValue={String(doc?.callSign ?? '')} name="callSign" />
          </label>
          <label>
            Zusammenfassung
            <textarea className="ff-input" defaultValue={String(doc?.summary ?? '')} name="summary" rows={6} />
          </label>
        </div>
        <div className="mt-6">
          <MediaSelectField
            defaultValue={toRelationId(doc?.heroImage)}
            hint="Das Bild erscheint auf den Technik-Übersichten und der Detailseite."
            label="Hero-Bild"
            name="heroImage"
            options={mediaOptions}
            uploadFields={{
              altName: 'heroImageUploadAlt',
              captionName: 'heroImageUploadCaption',
              fileName: 'heroImageUpload',
              label: 'Oder neues Technikbild hochladen',
            }}
          />
        </div>
      </section>

      <section className="ff-card">
        <EquipmentFactsEditor initialFacts={(doc?.facts ?? []).map((fact) => ({ label: fact.label, value: fact.value }))} />
      </section>

      <section className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">Einsatzwert</p>
          <h3 className="text-2xl">Taktische Schwerpunkte</h3>
          <p className="mt-3 text-sm leading-7 text-neutral-700">
            Diese Karten erscheinen als eigener Abschnitt auf der Technik-Detailseite und sollten den praktischen Nutzen des Fahrzeugs oder Geräts beschreiben.
          </p>
        </div>
        <EquipmentHighlightsEditor
          initialHighlights={(doc?.highlights ?? []).map((highlight) => ({
            description: highlight.description,
            title: highlight.title,
          }))}
        />
      </section>

      <section className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">Geräteräume</p>
          <h3 className="text-2xl">Beladung nach Abschnitten</h3>
          <p className="mt-3 text-sm leading-7 text-neutral-700">
            Codes, Titel und Inhalte bilden die Struktur der alten Technik-Detailseiten nach. Inhalte jeweils zeilenweise pflegen.
          </p>
        </div>
        <EquipmentCompartmentsEditor
          initialCompartments={(doc?.compartments ?? []).map((compartment) => ({
            code: compartment.code,
            contents: (compartment.contents ?? []).map((entry) => entry.label).join('\n'),
            description: String(compartment.description ?? ''),
            image: String(toRelationId(compartment.image) ?? ''),
            showImagePlaceholder: Boolean(compartment.showImagePlaceholder),
            title: compartment.title,
          }))}
          mediaOptions={mediaOptions}
        />
      </section>

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function PostEditorForm({
  deleteAction,
  doc,
  isNew,
  mediaOptions,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: Post | null
  isNew: boolean
  mediaOptions: MediaOption[]
  saveAction: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Titel
            <input className="ff-input" defaultValue={String(doc?.title ?? '')} name="title" required />
          </label>
          <label>
            Slug
            <input className="ff-input" defaultValue={String(doc?.slug ?? '')} name="slug" required />
          </label>
          <label>
            Kategorie
            <select className="ff-input" defaultValue={String(doc?.category ?? 'oeffentlichkeitsarbeit')} name="category">
              <option value="oeffentlichkeitsarbeit">Öffentlichkeitsarbeit</option>
              <option value="einsatz">Einsatz</option>
              <option value="ausbildung">Ausbildung</option>
              <option value="jugend">Jugend</option>
            </select>
          </label>
          <label>
            Status
            <select className="ff-input" defaultValue={String(doc?._status ?? 'draft')} name="_status">
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </label>
          <label>
            Veröffentlichung
            <input className="ff-input" defaultValue={String(toFormValue('datetime-local', doc?.publishedAt))} name="publishedAt" type="datetime-local" />
          </label>
        </div>
        <div className="mt-6">
          <MediaSelectField
            defaultValue={toRelationId(doc?.featuredImage)}
            hint="Das Beitragsbild wird auf `/aktuelles` und der Beitragsdetailseite prominent verwendet."
            label="Beitragsbild"
            name="featuredImage"
            options={mediaOptions}
            uploadFields={{
              altName: 'featuredImageUploadAlt',
              captionName: 'featuredImageUploadCaption',
              fileName: 'featuredImageUpload',
              label: 'Oder neues Beitragsbild hochladen',
            }}
          />
        </div>
        <label className="mt-4 inline-flex items-center gap-2">
          <input defaultChecked={Boolean((doc as OptionalPlaceholderDoc | null)?.showImagePlaceholder)} name="showImagePlaceholder" type="checkbox" />
          Platzhalter anzeigen, wenn noch kein Beitragsbild vorhanden ist
        </label>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Kurztext
            <textarea className="ff-input" defaultValue={String(doc?.excerpt ?? '')} name="excerpt" rows={5} />
          </label>
          <label>
            Inhalt
            <textarea className="ff-input min-h-64" defaultValue={String(doc?.content ?? '')} name="content" rows={14} />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <p className="ff-kicker">Medienhinweis</p>
        <h3 className="text-2xl">Beitragsbild bewusst pflegen</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          Wähle nach Möglichkeit ein vorhandenes News- oder General-Medium. Das Bild wird dann auf den öffentlichen Aktuelles-Seiten als Leit- oder Kartenbild genutzt.
        </p>
      </section>

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function EventEditorForm({
  deleteAction,
  doc,
  isNew,
  mediaOptions,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: PayloadEvent | null
  isNew: boolean
  mediaOptions: MediaOption[]
  saveAction: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Titel
            <input className="ff-input" defaultValue={String(doc?.title ?? '')} name="title" required />
          </label>
          <label>
            Slug
            <input className="ff-input" defaultValue={String(doc?.slug ?? '')} name="slug" required />
          </label>
          <label>
            Typ
            <select className="ff-input" defaultValue={String(doc?.eventType ?? 'ausbildung')} name="eventType">
              <option value="ausbildung">Ausbildung</option>
              <option value="uebung">Übung</option>
              <option value="jugend">Jugend</option>
              <option value="organisation">Organisation</option>
              <option value="oeffentlich">Öffentlich</option>
            </select>
          </label>
          <label>
            Sichtbarkeit
            <select className="ff-input" defaultValue={String(doc?.visibility ?? 'public')} name="visibility">
              <option value="public">Öffentlich</option>
              <option value="internal">Intern</option>
            </select>
          </label>
          <label>
            Beginn
            <input className="ff-input" defaultValue={String(toFormValue('datetime-local', doc?.startsAt))} name="startsAt" type="datetime-local" />
          </label>
          <label>
            Ende
            <input className="ff-input" defaultValue={String(toFormValue('datetime-local', doc?.endsAt))} name="endsAt" type="datetime-local" />
          </label>
          <label>
            Ort
            <input className="ff-input" defaultValue={String(doc?.location ?? '')} name="location" required />
          </label>
        </div>
        <div className="mt-6">
          <MediaSelectField
            defaultValue={toRelationId(doc?.featuredImage)}
            hint="Das Terminbild kann auf der Termin-Detailseite und in künftigen Übersichten als visuelle Ergänzung verwendet werden."
            label="Terminbild"
            name="featuredImage"
            options={mediaOptions}
            uploadFields={{
              altName: 'featuredImageUploadAlt',
              captionName: 'featuredImageUploadCaption',
              fileName: 'featuredImageUpload',
              label: 'Oder neues Terminbild hochladen',
            }}
          />
        </div>
        <label className="mt-4 inline-flex items-center gap-2">
          <input defaultChecked={Boolean((doc as OptionalPlaceholderDoc | null)?.showImagePlaceholder)} name="showImagePlaceholder" type="checkbox" />
          Platzhalter anzeigen, wenn noch kein Terminbild vorhanden ist
        </label>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Zusammenfassung
            <textarea className="ff-input" defaultValue={String(doc?.summary ?? '')} name="summary" rows={7} />
          </label>
          <label className="inline-flex items-center gap-2">
            <input defaultChecked={Boolean(doc?.registrationEnabled)} name="registrationEnabled" type="checkbox" />
            Anmeldung aktiv
          </label>
        </div>
      </section>

      <section className="ff-card">
        <p className="ff-kicker">Öffentliche Wirkung</p>
        <h3 className="text-2xl">Termin bewusst freigeben</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          Öffentliche Termine erscheinen direkt auf den neuen `/termine`-Seiten. Interne Termine bleiben aus den öffentlichen Routen heraus, können aber intern weiter gepflegt werden.
        </p>
      </section>

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function OperationEditorForm({
  deleteAction,
  doc,
  isNew,
  mediaOptions,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: Operation | null
  isNew: boolean
  mediaOptions: MediaOption[]
  saveAction: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Einsatznummer
            <input className="ff-input" defaultValue={String(doc?.operationNumber ?? '')} name="operationNumber" required />
          </label>
          <label>
            Alarmcode
            <input className="ff-input" defaultValue={String(doc?.alarmCode ?? '')} name="alarmCode" required />
          </label>
          <label>
            Kategorie
            <select className="ff-input" defaultValue={String(doc?.category ?? 'sonstiges')} name="category">
              <option value="brand">Brand</option>
              <option value="hilfe">Technische Hilfe</option>
              <option value="wetter">Wetter</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </label>
          <label>
            Beginn
            <input className="ff-input" defaultValue={String(toFormValue('datetime-local', doc?.startedAt))} name="startedAt" type="datetime-local" />
          </label>
          <label>
            Ort
            <input className="ff-input" defaultValue={String(doc?.location ?? '')} name="location" required />
          </label>
          <label className="inline-flex items-center gap-2">
            <input defaultChecked={Boolean(doc?.isPublic ?? true)} name="isPublic" type="checkbox" />
            Öffentlich sichtbar
          </label>
        </div>
        <div className="mt-6">
          <MediaSelectField
            defaultValue={toRelationId(doc?.featuredImage)}
            hint="Das Einsatzbild erscheint im Medienbereich der Einsatz-Detailseite und sollte datenschutzkonform gewählt werden."
            label="Einsatzbild"
            name="featuredImage"
            options={mediaOptions}
            uploadFields={{
              altName: 'featuredImageUploadAlt',
              captionName: 'featuredImageUploadCaption',
              fileName: 'featuredImageUpload',
              label: 'Oder neues Einsatzbild hochladen',
            }}
          />
        </div>
        <label className="mt-4 inline-flex items-center gap-2">
          <input defaultChecked={Boolean((doc as OptionalPlaceholderDoc | null)?.showImagePlaceholder)} name="showImagePlaceholder" type="checkbox" />
          Platzhalter anzeigen, wenn noch kein Einsatzbild vorhanden ist
        </label>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Kurzbericht
            <textarea className="ff-input" defaultValue={String(doc?.summary ?? '')} name="summary" rows={6} />
          </label>
          <label>
            Weitere Informationen
            <textarea className="ff-input" defaultValue={String(doc?.details ?? '')} name="details" rows={10} />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <p className="ff-kicker">Öffentliche Wirkung</p>
        <h3 className="text-2xl">Einsatzbericht kontrolliert freigeben</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          Aktivierte öffentliche Sichtbarkeit führt dazu, dass der Einsatz auf `/einsaetze` und der zugehörigen Detailseite erscheint. Formuliere Kurzbericht und Details deshalb bewusst datenschutzkonform und ohne personenbezogene Inhalte.
        </p>
      </section>

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function CrewEditorForm({
  deleteAction,
  doc,
  isNew,
  mediaOptions,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: Crew | null
  isNew: boolean
  mediaOptions: MediaOption[]
  saveAction: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Name
            <input className="ff-input" defaultValue={String(doc?.name ?? '')} name="name" required />
          </label>
          <label>
            Rolle
            <input className="ff-input" defaultValue={String(doc?.role ?? '')} name="role" required />
          </label>
          <label>
            Qualifikation
            <input className="ff-input" defaultValue={String(doc?.qualification ?? '')} name="qualification" />
          </label>
          <label>
            Schwerpunkt
            <input className="ff-input" defaultValue={String(doc?.focus ?? '')} name="focus" />
          </label>
        </div>
        <div className="mt-6">
          <MediaSelectField
            defaultValue={toRelationId(doc?.portrait)}
            hint="Portraits werden in Team- und Feed-Darstellungen quadratisch oder als kompakte Karten verwendet."
            label="Portrait"
            name="portrait"
            options={mediaOptions}
            uploadFields={{
              altName: 'portraitUploadAlt',
              captionName: 'portraitUploadCaption',
              fileName: 'portraitUpload',
              label: 'Oder neues Portrait hochladen',
            }}
          />
        </div>
        <label className="mt-4 inline-flex items-center gap-2">
          <input defaultChecked={Boolean((doc as OptionalPlaceholderDoc | null)?.showImagePlaceholder)} name="showImagePlaceholder" type="checkbox" />
          Platzhalter anzeigen, wenn noch kein Portrait vorhanden ist
        </label>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Skills
            <textarea
              className="ff-input"
              defaultValue={String(toFormValue('lines', doc?.skills))}
              name="skills"
              rows={8}
            />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <p className="ff-kicker">Öffentliche Wirkung</p>
        <h3 className="text-2xl">Teamdarstellung bewusst pflegen</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          Name, Rolle, Skills und Portrait können in öffentlichen Team- oder Feed-Darstellungen auftauchen. Halte die Einträge deshalb knapp, konsistent und gut scanbar.
        </p>
      </section>

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function FaqEditorForm({
  deleteAction,
  doc,
  isNew,
  saveAction,
}: {
  deleteAction: () => Promise<void>
  doc: Faq | null
  isNew: boolean
  saveAction: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={saveAction} className="grid gap-6">
      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Frage
            <input className="ff-input" defaultValue={String(doc?.question ?? '')} name="question" required />
          </label>
          <label>
            Kategorie
            <input className="ff-input" defaultValue={String(doc?.category ?? '')} name="category" />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Antwort
            <textarea className="ff-input min-h-56" defaultValue={String(doc?.answer ?? '')} name="answer" rows={12} />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <p className="ff-kicker">Öffentliche Wirkung</p>
        <h3 className="text-2xl">Antworten klar und wiederverwendbar halten</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          FAQ-Einträge erscheinen direkt auf den öffentlichen `/faq`-Seiten. Kurze Fragen, saubere Kategorien und klare Antworten verbessern Übersicht, Suchbarkeit und Verlinkbarkeit.
        </p>
      </section>

      <div className="ff-card">
        <div className="flex flex-wrap gap-3">
          <button className="ff-btn-accent" type="submit">
            Speichern
          </button>
          {!isNew ? (
            <button className="ff-btn-ghost" formAction={deleteAction} type="submit">
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}
