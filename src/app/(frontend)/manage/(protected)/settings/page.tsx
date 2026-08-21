import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  clearDemoData,
  getEditorialPermissions,
  requireEditorialContext,
  saveSiteSettings,
  sendSmtpTestEmail,
} from '@/lib/trustred/editorial'
import type { SiteSetting } from '@/payload-types'

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ManageSettingsPage({ searchParams }: Props) {
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)

  if (!permissions.canAccessSettings) {
    redirect('/manage')
  }

  const settings = (await payload.findGlobal({
    slug: 'site-settings',
  })) as SiteSetting
  const resolvedSearchParams = (await searchParams) ?? {}
  const smtpStatus = readSearchValue(resolvedSearchParams.smtpStatus)
  const smtpMessage = readSearchValue(resolvedSearchParams.smtpMessage)

  async function action(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    await saveSiteSettings(payload, user, formData)
    redirect('/manage/settings?smtpStatus=saved&smtpMessage=Einstellungen+gespeichert')
  }

  async function testSmtpAction(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    await saveSiteSettings(payload, user, formData)

    try {
      const result = await sendSmtpTestEmail(
        payload,
        user,
        String(formData.get('smtp.testRecipient') ?? '').trim(),
      )
      const status = result.skipped ? 'warning' : 'success'
      const message = result.message ?? 'SMTP Test erfolgreich versendet'
      redirect(
        `/manage/settings?smtpStatus=${encodeURIComponent(status)}&smtpMessage=${encodeURIComponent(message)}`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SMTP Test fehlgeschlagen'
      redirect(`/manage/settings?smtpStatus=error&smtpMessage=${encodeURIComponent(message)}`)
    }
  }

  async function clearDemoDataAction() {
    'use server'
    const { payload, user } = await requireEditorialContext()
    await clearDemoData(payload, user)
    redirect(
      '/manage/settings?smtpStatus=saved&smtpMessage=Demo-Daten+gelöscht.+Clean-Starter-Struktur+wurde+erstellt.',
    )
  }

  return (
    <form action={action} className="grid gap-6">
      <section className="ff-card">
        <p className="ff-kicker">Globale Einstellungen</p>
        <h2 className="text-3xl">Site Shell</h2>
      </section>

      {smtpStatus && smtpMessage ? (
        <section
          className={`ff-card ${
            smtpStatus === 'error'
              ? 'border-rose-200 bg-rose-50'
              : smtpStatus === 'warning'
                ? 'border-amber-200 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className="ff-kicker">Status</p>
          <p className="text-sm font-semibold text-neutral-900">{smtpMessage}</p>
        </section>
      ) : null}

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Site Name
            <input
              className="ff-input"
              defaultValue={String(settings.siteName ?? '')}
              name="siteName"
              required
            />
          </label>
          <label>
            Department Name
            <input
              className="ff-input"
              defaultValue={String(settings.departmentName ?? '')}
              name="departmentName"
              required
            />
          </label>
          <label>
            Tagline Primary
            <input
              className="ff-input"
              defaultValue={String(settings.taglinePrimary ?? '')}
              name="taglinePrimary"
            />
          </label>
          <label>
            Tagline Secondary
            <input
              className="ff-input"
              defaultValue={String(settings.taglineSecondary ?? '')}
              name="taglineSecondary"
            />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Announcement Label
            <input
              className="ff-input"
              defaultValue={String(settings.announcement?.label ?? '')}
              name="announcement.label"
            />
          </label>
          <label>
            Announcement Message
            <textarea
              className="ff-input"
              defaultValue={String(settings.announcement?.message ?? '')}
              name="announcement.message"
              rows={4}
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              defaultChecked={Boolean(settings.announcement?.enabled)}
              name="announcement.enabled"
              type="checkbox"
            />
            Announcement aktiv
          </label>
        </div>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Brand Color
            <input
              className="ff-input"
              defaultValue={String(settings.theme?.brandColor ?? '')}
              name="theme.brandColor"
            />
          </label>
          <label>
            Brand Strong
            <input
              className="ff-input"
              defaultValue={String(settings.theme?.brandColorStrong ?? '')}
              name="theme.brandColorStrong"
            />
          </label>
          <label>
            Surface Color
            <input
              className="ff-input"
              defaultValue={String(settings.theme?.surfaceColor ?? '')}
              name="theme.surfaceColor"
            />
          </label>
        </div>
      </section>

      <section className="ff-card">
        <div className="ff-form-grid">
          <label>
            Join Button Label
            <input
              className="ff-input"
              defaultValue={String(settings.joinButton?.label ?? '')}
              name="joinButton.label"
            />
          </label>
          <label>
            Join Button Href
            <input
              className="ff-input"
              defaultValue={String(settings.joinButton?.href ?? '')}
              name="joinButton.href"
            />
          </label>
          <label>
            Contact Email
            <input
              className="ff-input"
              defaultValue={String(settings.contact?.email ?? '')}
              name="contact.email"
            />
          </label>
          <label>
            Emergency Number
            <input
              className="ff-input"
              defaultValue={String(settings.contact?.emergencyNumber ?? '')}
              name="contact.emergencyNumber"
            />
          </label>
          <label>
            Address
            <textarea
              className="ff-input"
              defaultValue={String(settings.contact?.address ?? '')}
              name="contact.address"
              rows={4}
            />
          </label>
          <label>
            Rechtlicher Name
            <input
              className="ff-input"
              defaultValue={String(settings.legal?.organizationName ?? '')}
              name="legal.organizationName"
            />
          </label>
          <label>
            Verantwortliche Person
            <input
              className="ff-input"
              defaultValue={String(settings.legal?.responsiblePerson ?? '')}
              name="legal.responsiblePerson"
            />
          </label>
          <label>
            Impressumstext
            <textarea
              className="ff-input"
              defaultValue={String(settings.legal?.imprintText ?? '')}
              name="legal.imprintText"
              rows={5}
            />
          </label>
        </div>
      </section>

      <section className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">SMTP</p>
          <h3 className="text-2xl">E-Mail-Versand</h3>
          <p className="text-sm text-neutral-600">
            Payload nutzt diese SMTP-Daten für Formular-E-Mails sowie Auth-bezogene Systemmails.
            Ohne aktive SMTP-Konfiguration werden keine externen E-Mails versendet.
          </p>
        </div>

        <div className="ff-form-grid">
          <label className="inline-flex items-center gap-2">
            <input
              defaultChecked={Boolean(settings.smtp?.enabled)}
              name="smtp.enabled"
              type="checkbox"
            />
            SMTP aktivieren
          </label>
          <label>
            SMTP Host
            <input
              className="ff-input"
              defaultValue={String(settings.smtp?.host ?? '')}
              name="smtp.host"
              placeholder="smtp.example.com"
            />
          </label>
          <label>
            SMTP Port
            <input
              className="ff-input"
              defaultValue={String(settings.smtp?.port ?? 587)}
              name="smtp.port"
              placeholder="587"
              type="number"
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              defaultChecked={Boolean(settings.smtp?.secure)}
              name="smtp.secure"
              type="checkbox"
            />
            TLS / Secure-Verbindung verwenden
          </label>
          <label>
            Benutzername
            <input
              className="ff-input"
              defaultValue={String(settings.smtp?.username ?? '')}
              name="smtp.username"
            />
          </label>
          <label>
            Passwort
            <input
              className="ff-input"
              defaultValue=""
              name="smtp.password"
              placeholder={
                settings.smtp?.password ? 'Gespeichertes Passwort beibehalten' : 'SMTP Passwort'
              }
              type="password"
            />
          </label>
          <label>
            Absendername
            <input
              className="ff-input"
              defaultValue={String(settings.smtp?.fromName ?? '')}
              name="smtp.fromName"
            />
          </label>
          <label>
            Absender-E-Mail
            <input
              className="ff-input"
              defaultValue={String(settings.smtp?.fromEmail ?? '')}
              name="smtp.fromEmail"
              type="email"
            />
          </label>
        </div>

        <details className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
          <summary className="cursor-pointer list-none font-semibold text-neutral-900">
            Erweiterte SMTP-Optionen
          </summary>
          <div className="ff-form-grid mt-4">
            <label className="inline-flex items-center gap-2">
              <input
                defaultChecked={Boolean(settings.smtp?.ignoreTLS)}
                name="smtp.ignoreTLS"
                type="checkbox"
              />
              STARTTLS ignorieren
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                defaultChecked={Boolean(settings.smtp?.requireTLS)}
                name="smtp.requireTLS"
                type="checkbox"
              />
              TLS erzwingen
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                defaultChecked={Boolean(settings.smtp?.skipVerify)}
                name="smtp.skipVerify"
                type="checkbox"
              />
              Zertifikatsprüfung überspringen
            </label>
          </div>
        </details>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label>
            Test-E-Mail an
            <input
              className="ff-input"
              defaultValue={user.email}
              name="smtp.testRecipient"
              placeholder="redaktion@example.com"
              type="email"
            />
          </label>
          <button
            className="ff-btn-ghost w-full md:w-fit"
            formAction={testSmtpAction}
            type="submit"
          >
            Verbindung testen
          </button>
        </div>
      </section>

      <section className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">Seiten, Banner & Warnungen</p>
          <h3 className="text-2xl">Page Builder, Navigation und Presets</h3>
          <p className="text-sm text-neutral-600">
            Banner und Navigation werden jetzt direkt über die Seitenverwaltung gepflegt. DWD- und
            NINA-Presets bleiben in einem eigenen Arbeitsbereich.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="ff-btn-ghost inline-flex" href="/manage/content/pages">
            Zu Seiten und Navigation
          </Link>
          <Link className="ff-btn-ghost inline-flex" href="/manage/warnings">
            Zu den Warn-Presets
          </Link>
        </div>
      </section>

      <section className="ff-card grid gap-4 border-rose-200 bg-rose-50">
        <div>
          <p className="ff-kicker">Demo Daten</p>
          <h3 className="text-2xl">Demo Daten löschen</h3>
          <p className="text-sm text-neutral-700">
            Entfernt bekannte Demo-Inhalte, Demo-Medien und Demo-Seiten aus dem Seed und stellt
            eine saubere Basisstruktur mit Navigation, Formularen und Warn-Presets her.
          </p>
        </div>
        <button
          className="ff-btn-ghost w-fit border-rose-300 text-rose-800"
          formAction={clearDemoDataAction}
          type="submit"
        >
          Demo Daten löschen
        </button>
      </section>

      <button className="ff-btn-accent w-fit" type="submit">
        Einstellungen speichern
      </button>
    </form>
  )
}
