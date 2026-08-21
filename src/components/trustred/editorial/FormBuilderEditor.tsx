'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { EditableFormEmail, EditableFormField, EditableFormFieldType } from '@/lib/trustred/editorial-forms'

type Props = {
  initialEmails: EditableFormEmail[]
  initialFields: EditableFormField[]
}

const fieldTypeLabels: Record<EditableFormFieldType, string> = {
  checkbox: 'Checkbox',
  country: 'Land',
  email: 'E-Mail',
  message: 'Hinweis',
  number: 'Zahl',
  select: 'Auswahl',
  state: 'Bundesland',
  text: 'Text',
  textarea: 'Textarea',
}

const fieldTypePalette: EditableFormFieldType[] = [
  'text',
  'email',
  'textarea',
  'select',
  'checkbox',
  'number',
  'message',
  'country',
  'state',
]

function createField(type: EditableFormFieldType): EditableFormField {
  switch (type) {
    case 'message':
      return {
        blockType: 'message',
        message: 'Kurzer Hinweis für Ausfüllende.',
      }
    case 'checkbox':
      return {
        blockType: 'checkbox',
        defaultValue: false,
        label: 'Zustimmung',
        name: 'zustimmung',
        required: false,
        width: 100,
      }
    case 'select':
      return {
        blockType: 'select',
        label: 'Auswahl',
        name: 'auswahl',
        options: [
          { label: 'Option 1', value: 'option-1' },
          { label: 'Option 2', value: 'option-2' },
        ],
        placeholder: 'Bitte auswählen',
        required: true,
        width: 100,
      }
    case 'number':
      return {
        blockType: 'number',
        label: 'Zahl',
        name: 'zahl',
        required: false,
        width: 50,
      }
    default:
      return {
        blockType: type,
        label: fieldTypeLabels[type],
        name: fieldTypeLabels[type].toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        required: true,
        width: type === 'textarea' ? 100 : 50,
      }
  }
}

function createEmail(): EditableFormEmail {
  return {
    emailTo: '',
    message: 'Neue Einsendung:\n\n{{*:table}}',
    subject: 'Neue Formular-Einsendung',
  }
}

export function FormBuilderEditor({ initialEmails, initialFields }: Props) {
  const [fields, setFields] = useState<EditableFormField[]>(() =>
    initialFields.length > 0 ? structuredClone(initialFields) : [createField('text'), createField('email'), createField('textarea')],
  )
  const [emails, setEmails] = useState<EditableFormEmail[]>(() => structuredClone(initialEmails))

  function updateField(index: number, updater: (field: EditableFormField) => EditableFormField) {
    setFields((current) => current.map((field, currentIndex) => (currentIndex === index ? updater(field) : field)))
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((current) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  function duplicateField(index: number) {
    setFields((current) => {
      const next = [...current]
      next.splice(index + 1, 0, structuredClone(current[index]))
      return next
    })
  }

  function updateEmail(index: number, updater: (email: EditableFormEmail) => EditableFormEmail) {
    setEmails((current) => current.map((email, currentIndex) => (currentIndex === index ? updater(email) : email)))
  }

  return (
    <div className="grid gap-6">
      <input name="form.fields" type="hidden" value={JSON.stringify(fields)} />
      <input name="form.emails" type="hidden" value={JSON.stringify(emails)} />

      <section className="ff-card grid gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ff-kicker">Feldaufbau</p>
            <h3 className="text-2xl">Formular-Felder</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-700">
              Felder werden hier strukturiert aufgebaut und stehen danach direkt im Seiten-Builder als auswählbares Payload-Formular zur Verfügung.
            </p>
          </div>
          <Link className="ff-btn-ghost" href="/manage/content/pages">
            Zu Seitenblöcken
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {fieldTypePalette.map((type) => (
            <button
              className="ff-btn-ghost"
              key={type}
              onClick={() => setFields((current) => [...current, createField(type)])}
              type="button"
            >
              + {fieldTypeLabels[type]}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {fields.map((field, index) => (
            <article className="rounded-[1.35rem] border border-neutral-200 bg-neutral-50 p-5" key={`${field.blockType}-${index}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="ff-kicker">{fieldTypeLabels[field.blockType]}</p>
                  <h4 className="text-xl">
                    {field.blockType === 'message' ? field.message || 'Hinweisblock' : field.label || field.name || 'Unbenanntes Feld'}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="ff-btn-ghost" onClick={() => moveField(index, -1)} type="button">
                    Nach oben
                  </button>
                  <button className="ff-btn-ghost" onClick={() => moveField(index, 1)} type="button">
                    Nach unten
                  </button>
                  <button className="ff-btn-ghost" onClick={() => duplicateField(index)} type="button">
                    Duplizieren
                  </button>
                  <button className="ff-btn-ghost" onClick={() => setFields((current) => current.filter((_, currentIndex) => currentIndex !== index))} type="button">
                    Entfernen
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  Feldtyp
                  <select
                    className="ff-input"
                    onChange={(event) => updateField(index, () => createField(event.target.value as EditableFormFieldType))}
                    value={field.blockType}
                  >
                    {fieldTypePalette.map((type) => (
                      <option key={type} value={type}>
                        {fieldTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>

                {field.blockType !== 'message' ? (
                  <>
                    <label>
                      Label
                      <input
                        className="ff-input"
                        onChange={(event) => updateField(index, (current) => ({ ...current, label: event.target.value }))}
                        value={String(field.label ?? '')}
                      />
                    </label>
                    <label>
                      Technischer Name
                      <input
                        className="ff-input"
                        onChange={(event) => updateField(index, (current) => ({ ...current, name: event.target.value }))}
                        value={String(field.name ?? '')}
                      />
                    </label>
                    <label>
                      Breite
                      <select
                        className="ff-input"
                        onChange={(event) => updateField(index, (current) => ({ ...current, width: Number(event.target.value) }))}
                        value={Number(field.width ?? 100)}
                      >
                        <option value={50}>Halb</option>
                        <option value={100}>Voll</option>
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-3 pt-8">
                      <input
                        checked={Boolean(field.required)}
                        onChange={(event) => updateField(index, (current) => ({ ...current, required: event.target.checked }))}
                        type="checkbox"
                      />
                      Pflichtfeld
                    </label>
                  </>
                ) : (
                  <label className="md:col-span-2">
                    Hinweistext
                    <textarea
                      className="ff-input min-h-32"
                      onChange={(event) => updateField(index, (current) => ({ ...current, message: event.target.value }))}
                      rows={5}
                      value={String(field.message ?? '')}
                    />
                  </label>
                )}

                {field.blockType === 'text' || field.blockType === 'textarea' ? (
                  <label className="md:col-span-2">
                    Standardwert
                    <input
                      className="ff-input"
                      onChange={(event) => updateField(index, (current) => ({ ...current, defaultValue: event.target.value }))}
                      value={String(field.defaultValue ?? '')}
                    />
                  </label>
                ) : null}

                {field.blockType === 'number' ? (
                  <label>
                    Standardwert
                    <input
                      className="ff-input"
                      onChange={(event) => updateField(index, (current) => ({ ...current, defaultValue: event.target.value }))}
                      type="number"
                      value={String(field.defaultValue ?? '')}
                    />
                  </label>
                ) : null}

                {field.blockType === 'checkbox' ? (
                  <label className="inline-flex items-center gap-3 pt-8">
                    <input
                      checked={Boolean(field.defaultValue)}
                      onChange={(event) => updateField(index, (current) => ({ ...current, defaultValue: event.target.checked }))}
                      type="checkbox"
                    />
                    Standardmäßig aktiviert
                  </label>
                ) : null}

                {field.blockType === 'select' ? (
                  <>
                    <label className="md:col-span-2">
                      Platzhalter
                      <input
                        className="ff-input"
                        onChange={(event) => updateField(index, (current) => ({ ...current, placeholder: event.target.value }))}
                        value={String(field.placeholder ?? '')}
                      />
                    </label>
                    <div className="md:col-span-2 grid gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-headline text-xs uppercase tracking-[0.08em] text-neutral-500">Optionen</p>
                        <button
                          className="ff-btn-ghost"
                          onClick={() =>
                            updateField(index, (current) => ({
                              ...current,
                              options: [...(current.options ?? []), { label: 'Neue Option', value: 'neue-option' }],
                            }))
                          }
                          type="button"
                        >
                          Option hinzufügen
                        </button>
                      </div>
                      {(field.options ?? []).map((option, optionIndex) => (
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={`${option.value}-${optionIndex}`}>
                          <input
                            className="ff-input"
                            onChange={(event) =>
                              updateField(index, (current) => ({
                                ...current,
                                options: (current.options ?? []).map((entry, currentOptionIndex) =>
                                  currentOptionIndex === optionIndex ? { ...entry, label: event.target.value } : entry,
                                ),
                              }))
                            }
                            placeholder="Label"
                            value={option.label}
                          />
                          <input
                            className="ff-input"
                            onChange={(event) =>
                              updateField(index, (current) => ({
                                ...current,
                                options: (current.options ?? []).map((entry, currentOptionIndex) =>
                                  currentOptionIndex === optionIndex ? { ...entry, value: event.target.value } : entry,
                                ),
                              }))
                            }
                            placeholder="Wert"
                            value={option.value}
                          />
                          <button
                            className="ff-btn-ghost"
                            onClick={() =>
                              updateField(index, (current) => ({
                                ...current,
                                options: (current.options ?? []).filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex),
                              }))
                            }
                            type="button"
                          >
                            Entfernen
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ff-card grid gap-6">
        <div>
          <p className="ff-kicker">Benachrichtigungen</p>
          <h3 className="text-2xl">E-Mail-Aktionen</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-700">
            Diese E-Mails werden beim Absenden über Payload ausgelöst. Platzhalter wie <code>{'{{name}}'}</code>, <code>{'{{email}}'}</code> oder <code>{'{{*:table}}'}</code> können direkt im Betreff und Nachrichtentext genutzt werden.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="ff-btn-ghost" onClick={() => setEmails((current) => [...current, createEmail()])} type="button">
            E-Mail-Aktion hinzufügen
          </button>
        </div>

        <div className="grid gap-4">
          {emails.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
              Aktuell sind keine Benachrichtigungs-E-Mails konfiguriert.
            </div>
          ) : null}

          {emails.map((email, index) => (
            <article className="rounded-[1.35rem] border border-neutral-200 bg-neutral-50 p-5" key={`${email.subject}-${index}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ff-kicker">E-Mail {index + 1}</p>
                  <h4 className="text-xl">{email.subject || 'Neue E-Mail-Aktion'}</h4>
                </div>
                <button className="ff-btn-ghost" onClick={() => setEmails((current) => current.filter((_, currentIndex) => currentIndex !== index))} type="button">
                  Entfernen
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  Empfänger
                  <input
                    className="ff-input"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, emailTo: event.target.value }))}
                    placeholder='"Webseite" <info@example.com>'
                    value={String(email.emailTo ?? '')}
                  />
                </label>
                <label>
                  CC
                  <input
                    className="ff-input"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, cc: event.target.value }))}
                    value={String(email.cc ?? '')}
                  />
                </label>
                <label>
                  BCC
                  <input
                    className="ff-input"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, bcc: event.target.value }))}
                    value={String(email.bcc ?? '')}
                  />
                </label>
                <label>
                  Reply-To
                  <input
                    className="ff-input"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, replyTo: event.target.value }))}
                    value={String(email.replyTo ?? '')}
                  />
                </label>
                <label>
                  Absender überschreiben
                  <input
                    className="ff-input"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, emailFrom: event.target.value }))}
                    placeholder='"Trustred CMS" <noreply@example.com>'
                    value={String(email.emailFrom ?? '')}
                  />
                </label>
                <label className="md:col-span-2">
                  Betreff
                  <input
                    className="ff-input"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, subject: event.target.value }))}
                    value={email.subject}
                  />
                </label>
                <label className="md:col-span-2">
                  Nachricht
                  <textarea
                    className="ff-input min-h-40"
                    onChange={(event) => updateEmail(index, (current) => ({ ...current, message: event.target.value }))}
                    rows={8}
                    value={String(email.message ?? '')}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
