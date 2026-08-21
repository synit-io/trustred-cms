import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getEditorialPermissions, requireEditorialContext } from '@/lib/trustred/editorial'
import type { Form } from '@/payload-types'

export default async function ManageFormsPage() {
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)

  if (!permissions.canAccessContent) {
    redirect('/manage')
  }

  const forms = await payload.find({
    collection: 'forms',
    limit: 100,
    overrideAccess: false,
    sort: 'title',
    user,
  })

  return (
    <div className="grid gap-6">
      <section className="ff-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ff-kicker">Formulare</p>
          <h2 className="text-3xl">Form Builder</h2>
          <p className="mt-3 max-w-3xl text-neutral-700">
            Formulare werden hier einmal konfiguriert und stehen danach im Seiten-Builder als auswählbarer Formular-Block bereit.
          </p>
        </div>
        <Link className="ff-btn-accent" href="/manage/forms/new">
          Neues Formular anlegen
        </Link>
      </section>

      <section className="ff-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Titel</th>
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Felder</th>
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Bestätigung</th>
                <th className="py-3 pr-4 font-headline text-xs uppercase tracking-[0.08em]">Aktualisiert</th>
                <th className="py-3 font-headline text-xs uppercase tracking-[0.08em]">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {(forms.docs as Form[]).map((form) => (
                <tr className="border-b border-neutral-100" key={String(form.id)}>
                  <td className="py-3 pr-4">
                    <div className="grid gap-1">
                      <span>{form.title}</span>
                      <span className="text-xs text-neutral-500">ID {form.id}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-neutral-600">{form.fields?.length ?? 0}</td>
                  <td className="py-3 pr-4 text-neutral-600">{form.confirmationType === 'redirect' ? 'Redirect' : 'Nachricht'}</td>
                  <td className="py-3 pr-4 text-neutral-500">{String(form.updatedAt ?? '')}</td>
                  <td className="py-3">
                    <Link className="ff-btn-ghost" href={`/manage/forms/${form.id}`}>
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
              {forms.docs.length === 0 ? (
                <tr>
                  <td className="py-6 text-neutral-600" colSpan={5}>
                    Noch keine Formulare vorhanden.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
