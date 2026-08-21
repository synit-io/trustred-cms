import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { PublicForm } from '@/components/trustred/PublicForm'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getSiteSettings } from '@/lib/trustred/cms'
import { getPublicForm, getPublicFormConfig, submitPublicForm } from '@/lib/trustred/public-forms'

type Props = {
  searchParams: Promise<{
    sent?: string
    submittedForm?: string | string[]
  }>
}

export default async function ContactPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'kontakt',
    pathname: '/kontakt',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [{ sent }, form, settings] = await Promise.all([
    Promise.resolve(resolvedSearchParams),
    getPublicForm('contact'),
    getSiteSettings(),
  ])
  const config = getPublicFormConfig('contact')

  async function submitAction(formData: FormData) {
    'use server'

    await submitPublicForm('contact', formData)
    redirect('/kontakt?sent=1')
  }

  return (
    <SiteShell pathname="/kontakt" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="ff-section-head">
            <p className="ff-kicker">Kontakt</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">Kontakt zur Wehr</h1>
            <p className="text-lg leading-8 text-neutral-700">
              Allgemeine Anfragen, Presse, Zusammenarbeit oder organisatorische Rückfragen laufen hier gebündelt zusammen.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <aside className="grid gap-4">
              <article className="ff-card">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Wichtiger Hinweis</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                  Bei akuter Gefahr oder medizinischem Notfall gilt immer: <strong className="text-neutral-900">{settings.contact?.emergencyNumber || '112'}</strong>. Dieses Formular ist kein Notrufkanal.
                </p>
              </article>
              <article className="ff-card">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Erreichbarkeit</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-700">{settings.contact?.address}</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">E-Mail: {settings.contact?.email}</p>
              </article>
              <article className="ff-card">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Weitere Wege</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="ff-btn-ghost" href="/mitmachen">
                    Mitmachen
                  </Link>
                  <Link className="ff-btn-ghost" href="/faq">
                    FAQ
                  </Link>
                </div>
              </article>
            </aside>

            <div className="grid gap-4">
              {sent === '1' ? (
                <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {config.successMessage}
                </div>
              ) : null}
              <PublicForm action={submitAction} description={config.description} form={form} />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
