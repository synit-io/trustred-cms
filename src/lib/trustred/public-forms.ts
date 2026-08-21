import { cache } from 'react'

import type { Payload } from 'payload'

import { getPayloadClient } from '@/lib/trustred/cms'
import { createLexicalTextContent, readLexicalText } from '@/lib/trustred/lexical'
import type { Form } from '@/payload-types'

type PublicFormKey = 'contact' | 'join'

type PublicFormField = NonNullable<Form['fields']>[number]
type PublicInputField = Exclude<PublicFormField, { blockType: 'message' }>
export type PublicFormReference =
  | { id: number; kind: 'custom' }
  | { key: PublicFormKey; kind: 'preset' }

type PublicFormConfig = {
  description: string
  successMessage: string
  title: string
  fields: NonNullable<Form['fields']>
  submitButtonLabel: string
}

const defaultPublicForms: Record<PublicFormKey, PublicFormConfig> = {
  contact: {
    description: 'Allgemeine Kontaktanfragen an die Wehr. Keine Notrufe über dieses Formular.',
    successMessage: 'Danke für deine Nachricht. Wir melden uns so zeitnah wie möglich zurück.',
    submitButtonLabel: 'Nachricht senden',
    title: 'Kontaktformular',
    fields: [
      {
        blockType: 'text',
        label: 'Name',
        name: 'name',
        required: true,
        width: 50,
      },
      {
        blockType: 'email',
        label: 'E-Mail',
        name: 'email',
        required: true,
        width: 50,
      },
      {
        blockType: 'text',
        label: 'Betreff',
        name: 'subject',
        required: true,
        width: 100,
      },
      {
        blockType: 'textarea',
        label: 'Nachricht',
        name: 'message',
        required: true,
        width: 100,
      },
      {
        blockType: 'checkbox',
        label: 'Ich habe verstanden, dass Notrufe ausschließlich über 112 erfolgen.',
        name: 'notEmergencyAcknowledged',
        required: true,
        width: 100,
      },
    ],
  },
  join: {
    description: 'Anfrage für Interessierte, die mitmachen oder die Wehr kennenlernen möchten.',
    successMessage: 'Danke für dein Interesse. Wir melden uns mit den nächsten Schritten und einem passenden Kennenlerntermin.',
    submitButtonLabel: 'Interesse senden',
    title: 'Mitmachen Formular',
    fields: [
      {
        blockType: 'text',
        label: 'Name',
        name: 'name',
        required: true,
        width: 50,
      },
      {
        blockType: 'email',
        label: 'E-Mail',
        name: 'email',
        required: true,
        width: 50,
      },
      {
        blockType: 'select',
        label: 'Bereich',
        name: 'interest',
        options: [
          { label: 'Aktive Einsatzabteilung', value: 'active' },
          { label: 'Jugend / Nachwuchs', value: 'youth' },
          { label: 'Unterstützung / Organisation', value: 'support' },
        ],
        placeholder: 'Passenden Bereich wählen',
        required: true,
        width: 50,
      },
      {
        blockType: 'select',
        label: 'Vorerfahrung',
        name: 'experience',
        options: [
          { label: 'Noch keine', value: 'none' },
          { label: 'Etwas Erfahrung', value: 'some' },
          { label: 'Bereits Feuerwehr / Hilfsorganisation', value: 'advanced' },
        ],
        placeholder: 'Vorerfahrung einschätzen',
        required: true,
        width: 50,
      },
      {
        blockType: 'textarea',
        label: 'Was interessiert dich besonders?',
        name: 'motivation',
        required: true,
        width: 100,
      },
      {
        blockType: 'checkbox',
        label: 'Ich wünsche mir eine unverbindliche Rückmeldung zu Kennenlern- oder Mitmachmöglichkeiten.',
        name: 'followUpRequested',
        required: false,
        width: 100,
      },
    ],
  },
}

async function ensurePublicForm(payload: Payload, key: PublicFormKey) {
  const config = defaultPublicForms[key]
  const existing = await payload.find({
    collection: 'forms',
    limit: 1,
    where: {
      title: {
        equals: config.title,
      },
    },
  })

  if (existing.docs[0]) {
    return existing.docs[0] as Form
  }

  return (await payload.create({
    collection: 'forms',
    data: {
      confirmationMessage: createLexicalTextContent(config.successMessage),
      confirmationType: 'message',
      fields: config.fields,
      submitButtonLabel: config.submitButtonLabel,
      title: config.title,
    },
  })) as Form
}

export const getPublicForm = cache(async (key: PublicFormKey) => {
  const payload = await getPayloadClient()
  return ensurePublicForm(payload, key)
})

export const getPublicFormByID = cache(async (id: number) => {
  const payload = await getPayloadClient()

  try {
    return (await payload.findByID({
      collection: 'forms',
      id,
    })) as Form
  } catch {
    return null
  }
})

export function getPublicFormConfig(key: PublicFormKey) {
  return defaultPublicForms[key]
}

export async function ensureDefaultPublicForms(payload: Payload) {
  await ensurePublicForm(payload, 'contact')
  await ensurePublicForm(payload, 'join')
}

export async function submitPublicForm(key: PublicFormKey, formData: FormData) {
  return submitConfiguredForm({ key, kind: 'preset' }, formData)
}

export async function getRenderablePublicForm(reference: PublicFormReference) {
  if (reference.kind === 'preset') {
    const form = await getPublicForm(reference.key)
    const config = getPublicFormConfig(reference.key)

    return {
      description: config.description,
      form,
      successMessage: config.successMessage,
    }
  }

  const form = await getPublicFormByID(reference.id)
  if (!form) {
    return null
  }

  return {
    description: undefined,
    form,
    successMessage: readConfirmationMessage(form) || 'Danke für deine Nachricht. Wir haben die Übermittlung erhalten.',
  }
}

export async function submitConfiguredForm(reference: PublicFormReference, formData: FormData) {
  const payload = await getPayloadClient()
  const form =
    reference.kind === 'preset'
      ? await ensurePublicForm(payload, reference.key)
      : await payload.findByID({
          collection: 'forms',
          id: reference.id,
        })
  const entries = collectSubmissionEntries(form.fields ?? [], formData)

  await payload.create({
    collection: 'form-submissions',
    data: {
      form: form.id,
      submissionData: entries,
    },
  })

  return form
}

function readConfirmationMessage(form: Form) {
  return readLexicalText(form.confirmationMessage)
}

function collectSubmissionEntries(fields: NonNullable<Form['fields']>, formData: FormData) {
  return fields.flatMap((field) => {
    if (field.blockType === 'message') {
      return []
    }

    const value = normalizeFieldValue(field as PublicInputField, formData)
    if (!value) {
      return []
    }

    return [{ field: field.name, value }]
  })
}

function normalizeFieldValue(field: PublicInputField, formData: FormData) {
  if (field.blockType === 'checkbox') {
    return formData.has(field.name) ? 'Ja' : field.required ? 'Nein' : ''
  }

  return String(formData.get(field.name) ?? '').trim()
}
