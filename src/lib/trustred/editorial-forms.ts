import type { Payload } from 'payload'

import { createLexicalTextContent, readLexicalText } from '@/lib/trustred/lexical'
import type { Form, User } from '@/payload-types'

type FormField = NonNullable<Form['fields']>[number]
type FormEmail = NonNullable<Form['emails']>[number]

export type EditableFormFieldType = FormField['blockType']

export type EditableFormField = {
  blockType: EditableFormFieldType
  defaultValue?: boolean | number | string | null
  label?: string
  message?: string
  name?: string
  options?: Array<{
    label: string
    value: string
  }>
  placeholder?: string
  required?: boolean
  width?: number
}

export type EditableFormEmail = {
  bcc?: string
  cc?: string
  emailFrom?: string
  emailTo?: string
  message?: string
  replyTo?: string
  subject: string
}

function parseJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return fallback
  }

  try {
    return JSON.parse(normalized) as T
  } catch {
    return fallback
  }
}

function toOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

function slugifyFieldName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function clampWidth(value: unknown) {
  return Number(value) <= 50 ? 50 : 100
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(String(value ?? '').trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function sanitizeOptions(options: EditableFormField['options']) {
  return (options ?? [])
    .map((option) => ({
      label: String(option?.label ?? '').trim(),
      value: String(option?.value ?? '').trim(),
    }))
    .filter((option) => option.label && option.value)
}

function sanitizeField(field: EditableFormField, index: number): FormField | null {
  const blockType = field.blockType

  if (!blockType) {
    return null
  }

  if (blockType === 'message') {
    const message = String(field.message ?? '').trim()

    return {
      blockType,
      message: createLexicalTextContent(message || 'Hinweis'),
    }
  }

  const label = String(field.label ?? '').trim()
  const baseName = String(field.name ?? '').trim() || label || `field_${index + 1}`
  const name = slugifyFieldName(baseName) || `field_${index + 1}`
  const common = {
    label: label || undefined,
    name,
    required: Boolean(field.required),
    width: clampWidth(field.width),
  }

  switch (blockType) {
    case 'checkbox':
      return {
        ...common,
        blockType,
        defaultValue: Boolean(field.defaultValue),
      }
    case 'number':
      return {
        ...common,
        blockType,
        defaultValue: normalizeNumber(field.defaultValue),
      }
    case 'select': {
      const options = sanitizeOptions(field.options)

      return {
        ...common,
        blockType,
        defaultValue: String(field.defaultValue ?? '').trim() || undefined,
        options: options.length > 0 ? options : [{ label: 'Option 1', value: 'option-1' }],
        placeholder: String(field.placeholder ?? '').trim() || undefined,
      }
    }
    case 'text':
      return {
        ...common,
        blockType,
        defaultValue: String(field.defaultValue ?? '').trim() || undefined,
      }
    case 'textarea':
      return {
        ...common,
        blockType,
        defaultValue: String(field.defaultValue ?? '').trim() || undefined,
      }
    case 'country':
      return {
        ...common,
        blockType,
      }
    case 'email':
      return {
        ...common,
        blockType,
      }
    case 'state':
      return {
        ...common,
        blockType,
      }
    default:
      return null
  }
}

function sanitizeEmail(email: EditableFormEmail): FormEmail | null {
  const subject = String(email.subject ?? '').trim()
  const emailTo = String(email.emailTo ?? '').trim()

  if (!subject && !emailTo) {
    return null
  }

  const message = String(email.message ?? '').trim()

  return {
    bcc: String(email.bcc ?? '').trim() || undefined,
    cc: String(email.cc ?? '').trim() || undefined,
    emailFrom: String(email.emailFrom ?? '').trim() || undefined,
    emailTo: emailTo || undefined,
    message: message ? createLexicalTextContent(message) : undefined,
    replyTo: String(email.replyTo ?? '').trim() || undefined,
    subject: subject || 'Neue Formular-Einsendung',
  }
}

export function getEditableFormFields(fields: Form['fields']): EditableFormField[] {
  return (fields ?? []).map((field) => {
    switch (field.blockType) {
      case 'message':
        return {
          blockType: field.blockType,
          message: readLexicalText(field.message),
        }
      case 'select':
        return {
          blockType: field.blockType,
          defaultValue: field.defaultValue ?? '',
          label: field.label ?? '',
          name: field.name,
          options: (field.options ?? []).map((option) => ({
            label: option.label,
            value: option.value,
          })),
          placeholder: field.placeholder ?? '',
          required: Boolean(field.required),
          width: field.width ?? 100,
        }
      case 'checkbox':
        return {
          blockType: field.blockType,
          defaultValue: Boolean(field.defaultValue),
          label: field.label ?? '',
          name: field.name,
          required: Boolean(field.required),
          width: field.width ?? 100,
        }
      case 'number':
        return {
          blockType: field.blockType,
          defaultValue: field.defaultValue ?? null,
          label: field.label ?? '',
          name: field.name,
          required: Boolean(field.required),
          width: field.width ?? 100,
        }
      default:
        return {
          blockType: field.blockType,
          defaultValue: 'defaultValue' in field ? field.defaultValue ?? '' : '',
          label: field.label ?? '',
          name: field.name,
          required: Boolean(field.required),
          width: field.width ?? 100,
        }
    }
  })
}

export function getEditableFormEmails(emails: Form['emails']): EditableFormEmail[] {
  return (emails ?? []).map((email) => ({
    bcc: email.bcc ?? '',
    cc: email.cc ?? '',
    emailFrom: email.emailFrom ?? '',
    emailTo: email.emailTo ?? '',
    message: readLexicalText(email.message),
    replyTo: email.replyTo ?? '',
    subject: email.subject,
  }))
}

export function getEditableConfirmationMessage(form: Form | null) {
  return readLexicalText(form?.confirmationMessage)
}

export async function saveEditorialForm(payload: Payload, user: User, id: string, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const submitButtonLabel = toOptionalString(formData.get('submitButtonLabel'))
  const confirmationType: NonNullable<Form['confirmationType']> =
    String(formData.get('confirmationType') ?? 'message') === 'redirect' ? 'redirect' : 'message'
  const confirmationMessageText = String(formData.get('confirmationMessageText') ?? '').trim()
  const redirectUrl = String(formData.get('redirectUrl') ?? '').trim()
  const fields = parseJson<EditableFormField[]>(formData.get('form.fields'), [])
    .map((field, index) => sanitizeField(field, index))
    .filter(Boolean) as Form['fields']
  const emails = parseJson<EditableFormEmail[]>(formData.get('form.emails'), [])
    .map((email) => sanitizeEmail(email))
    .filter(Boolean) as Form['emails']

  const data = {
    confirmationMessage:
      confirmationType === 'message'
        ? createLexicalTextContent(
            confirmationMessageText || 'Danke für deine Nachricht. Wir haben die Übermittlung erhalten.',
          )
        : undefined,
    confirmationType,
    emails,
    fields,
    redirect: confirmationType === 'redirect' ? { url: redirectUrl || '/' } : undefined,
    submitButtonLabel,
    title,
  }

  if (id !== 'new') {
    return payload.update({
      collection: 'forms',
      data,
      id: Number(id),
      overrideAccess: false,
      user,
    })
  }

  return payload.create({
    collection: 'forms',
    data,
    overrideAccess: false,
    user,
  })
}

export async function deleteEditorialForm(payload: Payload, user: User, id: number) {
  return payload.delete({
    collection: 'forms',
    id,
    overrideAccess: false,
    user,
  })
}
