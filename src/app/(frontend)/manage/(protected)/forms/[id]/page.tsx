import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { FormBuilderEditor } from '@/components/trustred/editorial/FormBuilderEditor'
import {
  deleteEditorialForm,
  getEditableConfirmationMessage,
  getEditableFormEmails,
  getEditableFormFields,
  saveEditorialForm,
} from '@/lib/trustred/editorial-forms'
import { getEditorialPermissions, requireEditorialContext } from '@/lib/trustred/editorial'
import type { Form } from '@/payload-types'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function ManageFormEditorPage({ params }: Props) {
  const { id } = await params
  const isNew = id === 'new'
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)

  if (!permissions.canAccessContent) {
    redirect('/manage')
  }

  const doc = isNew
    ? null
    : await (async () => {
        try {
          return (await payload.findByID({
            collection: 'forms',
            id: Number(id),
            overrideAccess: false,
            user,
          })) as Form
        } catch {
          return null
        }
      })()

  if (!isNew && !doc) {
    notFound()
  }

  async function saveAction(formData: FormData) {
    'use server'

    const { payload, user } = await requireEditorialContext()
    await saveEditorialForm(payload, user, id, formData)
    redirect('/manage/forms')
  }

  async function deleteAction() {
    'use server'

    const { payload, user } = await requireEditorialContext()

    if (!isNew && doc) {
      await deleteEditorialForm(payload, user, doc.id)
    }

    redirect('/manage/forms')
  }

  return (
    <div className="grid gap-6">
      <section className="ff-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ff-kicker">Form Builder</p>
          <h2 className="text-3xl">{isNew ? 'Neues Formular' : doc?.title}</h2>
          <p className="mt-3 max-w-3xl text-neutral-700">
            Dieses Formular kann anschließend in Seiten-Blöcken als individuelles Payload-Formular ausgewählt werden.
          </p>
        </div>
        <Link className="ff-btn-ghost" href="/manage/forms">
          Zurück zu Formularen
        </Link>
      </section>

      <form action={saveAction} className="grid gap-6">
        <section className="ff-card">
          <div className="ff-form-grid">
            <label>
              Titel
              <input className="ff-input" defaultValue={String(doc?.title ?? '')} name="title" required />
            </label>
            <label>
              Submit-Button Label
              <input className="ff-input" defaultValue={String(doc?.submitButtonLabel ?? '')} name="submitButtonLabel" />
            </label>
            <label>
              Bestätigungsart
              <select className="ff-input" defaultValue={String(doc?.confirmationType ?? 'message')} name="confirmationType">
                <option value="message">Nachricht auf der Seite</option>
                <option value="redirect">Redirect</option>
              </select>
            </label>
            <label>
              Redirect-URL
              <input className="ff-input" defaultValue={String(doc?.redirect?.url ?? '')} name="redirectUrl" placeholder="/danke" />
            </label>
            <label className="md:col-span-2">
              Bestätigungsnachricht
              <textarea
                className="ff-input min-h-36"
                defaultValue={getEditableConfirmationMessage(doc)}
                name="confirmationMessageText"
                rows={6}
              />
            </label>
          </div>
        </section>

        <FormBuilderEditor
          initialEmails={getEditableFormEmails(doc?.emails)}
          initialFields={getEditableFormFields(doc?.fields)}
        />

        <section className="ff-card">
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
        </section>
      </form>
    </div>
  )
}
