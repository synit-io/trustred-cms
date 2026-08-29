import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { getPayloadClient } from '@/lib/trustred/cms'
import { defaultSiteSettings } from '@/lib/trustred/defaults'
import { saveSiteSettings, sendSmtpTestEmail } from '@/lib/trustred/editorial'
import {
  canUseSetup,
  countUsers,
  createInitialAdmin,
  getSetupState,
  markSetupCompleted,
  markSetupInProgress,
  markSetupSkipped,
  normalizeSetupStep,
  saveHomepageHero,
  type SetupStep,
} from '@/lib/trustred/setup'
import type { SiteSetting, User } from '@/payload-types'

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getStepIndex(step: SetupStep) {
  return ['admin', 'site', 'contact', 'appearance', 'mail', 'done'].indexOf(step)
}

function nextStepHref(step: SetupStep) {
  return `/setup?step=${step}`
}

function SetupProgress({ step }: { step: SetupStep }) {
  const items: Array<{ label: string; step: SetupStep }> = [
    { label: 'Admin', step: 'admin' },
    { label: 'Site', step: 'site' },
    { label: 'Kontakt', step: 'contact' },
    { label: 'Auftritt', step: 'appearance' },
    { label: 'Mail', step: 'mail' },
  ]
  const currentIndex = getStepIndex(step)

  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {items.map((item, index) => (
        <li
          className={`rounded-[1rem] border px-3 py-2 text-sm font-semibold ${
            index <= currentIndex
              ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]'
              : 'border-neutral-200 bg-white text-neutral-500'
          }`}
          key={item.step}
        >
          {index + 1}. {item.label}
        </li>
      ))}
    </ol>
  )
}

function HiddenSettingsFields({ settings }: { settings: SiteSetting }) {
  return (
    <>
      <input
        name="announcement.enabled"
        type="hidden"
        value={settings.announcement?.enabled ? 'on' : ''}
      />
      <input
        name="announcement.label"
        type="hidden"
        value={String(settings.announcement?.label ?? '')}
      />
      <input
        name="announcement.message"
        type="hidden"
        value={String(settings.announcement?.message ?? '')}
      />
      <input
        name="joinButton.href"
        type="hidden"
        value={String(settings.joinButton?.href ?? '/mitmachen')}
      />
      <input
        name="joinButton.label"
        type="hidden"
        value={String(settings.joinButton?.label ?? 'Mitmachen')}
      />
      <input
        name="theme.brandColor"
        type="hidden"
        value={String(settings.theme?.brandColor ?? defaultSiteSettings.theme.brandColor)}
      />
      <input
        name="theme.brandColorStrong"
        type="hidden"
        value={String(
          settings.theme?.brandColorStrong ?? defaultSiteSettings.theme.brandColorStrong,
        )}
      />
      <input
        name="theme.surfaceColor"
        type="hidden"
        value={String(settings.theme?.surfaceColor ?? defaultSiteSettings.theme.surfaceColor)}
      />
      <input name="contact.address" type="hidden" value={String(settings.contact?.address ?? '')} />
      <input name="contact.email" type="hidden" value={String(settings.contact?.email ?? '')} />
      <input
        name="contact.emergencyNumber"
        type="hidden"
        value={String(settings.contact?.emergencyNumber ?? '112')}
      />
      <input
        name="legal.organizationName"
        type="hidden"
        value={String(settings.legal?.organizationName ?? '')}
      />
      <input
        name="legal.responsiblePerson"
        type="hidden"
        value={String(settings.legal?.responsiblePerson ?? '')}
      />
      <input
        name="legal.imprintText"
        type="hidden"
        value={String(settings.legal?.imprintText ?? '')}
      />
      <input name="smtp.enabled" type="hidden" value={settings.smtp?.enabled ? 'on' : ''} />
      <input name="smtp.fromEmail" type="hidden" value={String(settings.smtp?.fromEmail ?? '')} />
      <input name="smtp.fromName" type="hidden" value={String(settings.smtp?.fromName ?? '')} />
      <input name="smtp.host" type="hidden" value={String(settings.smtp?.host ?? '')} />
      <input name="smtp.ignoreTLS" type="hidden" value={settings.smtp?.ignoreTLS ? 'on' : ''} />
      <input name="smtp.password" type="hidden" value="" />
      <input name="smtp.port" type="hidden" value={String(settings.smtp?.port ?? 587)} />
      <input name="smtp.requireTLS" type="hidden" value={settings.smtp?.requireTLS ? 'on' : ''} />
      <input name="smtp.secure" type="hidden" value={settings.smtp?.secure ? 'on' : ''} />
      <input name="smtp.skipVerify" type="hidden" value={settings.smtp?.skipVerify ? 'on' : ''} />
      <input name="smtp.username" type="hidden" value={String(settings.smtp?.username ?? '')} />
    </>
  )
}

export default async function SetupPage({ searchParams }: Props) {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const userCount = await countUsers(payload)
  const hasUsers = userCount > 0
  const setupUser = user as User | null | undefined
  const canAccessSetup = canUseSetup(setupUser, hasUsers)

  if (!canAccessSetup) {
    redirect(hasUsers ? '/manage/login' : '/setup?step=admin')
  }

  const resolvedSearchParams = (await searchParams) ?? {}
  const step = normalizeSetupStep(readSearchValue(resolvedSearchParams.step), hasUsers)
  const status = readSearchValue(resolvedSearchParams.status)
  const message = readSearchValue(resolvedSearchParams.message)
  const [settings, setupState] = await Promise.all([
    payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
    }) as Promise<SiteSetting>,
    getSetupState(payload),
  ])

  if (hasUsers && setupState.status === 'completed' && step !== 'done') {
    redirect('/manage')
  }

  async function createAdminAction(formData: FormData) {
    'use server'
    const payload = await getPayloadClient()
    const user = await createInitialAdmin(payload, formData)
    const login = await payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password: String(formData.get('admin.password') ?? ''),
      },
    })

    if (!login.token) {
      redirect('/manage/login')
    }

    const cookieStore = await cookies()
    cookieStore.set({
      httpOnly: true,
      name: 'payload-token',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      value: login.token,
    })

    await markSetupInProgress(payload, 'site')
    redirect(nextStepHref('site'))
  }

  async function saveSiteAction(formData: FormData) {
    'use server'
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!userHasRole(user as User | null | undefined, trustredRoles.settings)) {
      redirect('/manage/login')
    }
    await saveSiteSettings(payload, user as User, formData)
    await markSetupInProgress(payload, 'contact')
    redirect(nextStepHref('contact'))
  }

  async function saveContactAction(formData: FormData) {
    'use server'
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!userHasRole(user as User | null | undefined, trustredRoles.settings)) {
      redirect('/manage/login')
    }
    await saveSiteSettings(payload, user as User, formData)
    await markSetupInProgress(payload, 'appearance')
    redirect(nextStepHref('appearance'))
  }

  async function saveAppearanceAction(formData: FormData) {
    'use server'
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!userHasRole(user as User | null | undefined, trustredRoles.settings)) {
      redirect('/manage/login')
    }
    await saveSiteSettings(payload, user as User, formData)
    await saveHomepageHero(payload, user as User, formData)
    await markSetupInProgress(payload, 'mail')
    redirect(nextStepHref('mail'))
  }

  async function saveMailAction(formData: FormData) {
    'use server'
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!userHasRole(user as User | null | undefined, trustredRoles.settings)) {
      redirect('/manage/login')
    }
    await saveSiteSettings(payload, user as User, formData)
    await markSetupCompleted(payload, user as User)
    redirect(nextStepHref('done'))
  }

  async function testMailAction(formData: FormData) {
    'use server'
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!userHasRole(user as User | null | undefined, trustredRoles.settings)) {
      redirect('/manage/login')
    }
    await saveSiteSettings(payload, user as User, formData)
    const result = await sendSmtpTestEmail(
      payload,
      user as User,
      String(formData.get('smtp.testRecipient') ?? '').trim(),
    )
    const nextStatus = result.skipped ? 'warning' : 'success'
    redirect(`/setup?step=mail&status=${nextStatus}&message=${encodeURIComponent(result.message)}`)
  }

  async function skipAction() {
    'use server'
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    if (!userHasRole(user as User | null | undefined, trustredRoles.settings)) {
      redirect('/manage/login')
    }
    await markSetupSkipped(payload, user as User)
    redirect('/manage')
  }

  return (
    <div className="ff-section">
      <div className="site-container grid max-w-5xl gap-6">
        <section className="ff-card grid gap-4">
          <p className="ff-kicker">Ersteinrichtung</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl">Trustred CMS einrichten</h1>
              <p className="mt-3 max-w-2xl text-neutral-700">
                Dieser Assistent legt die wichtigsten Startdaten an. Alle Angaben bleiben später im
                Dashboard editierbar.
              </p>
            </div>
            {hasUsers && step !== 'done' ? (
              <form action={skipAction}>
                <button className="ff-btn-ghost" type="submit">
                  Setup überspringen
                </button>
              </form>
            ) : null}
          </div>
          <SetupProgress step={step} />
        </section>

        {status && message ? (
          <section
            className={`ff-card ${
              status === 'warning'
                ? 'border-amber-200 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            <p className="ff-kicker">Status</p>
            <p className="text-sm font-semibold text-neutral-900">{message}</p>
          </section>
        ) : null}

        {step === 'admin' ? (
          <form action={createAdminAction} className="ff-card grid gap-5">
            <div>
              <p className="ff-kicker">Schritt 1</p>
              <h2 className="text-3xl">Ersten Admin anlegen</h2>
            </div>
            <div className="ff-form-grid">
              <label>
                Name
                <input className="ff-input" name="admin.displayName" required />
              </label>
              <label>
                E-Mail
                <input className="ff-input" name="admin.email" required type="email" />
              </label>
              <label>
                Passwort
                <input
                  className="ff-input"
                  minLength={12}
                  name="admin.password"
                  required
                  type="password"
                />
              </label>
              <label>
                Setup-Token
                <input
                  autoComplete="off"
                  className="ff-input"
                  name="admin.setupToken"
                  required
                  type="password"
                />
              </label>
            </div>
            <button className="ff-btn-accent w-fit" type="submit">
              Admin anlegen
            </button>
          </form>
        ) : null}

        {step === 'site' ? (
          <form action={saveSiteAction} className="ff-card grid gap-5">
            <HiddenSettingsFields settings={settings} />
            <div>
              <p className="ff-kicker">Schritt 2</p>
              <h2 className="text-3xl">Organisation</h2>
            </div>
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
                Orts-/Abteilungsname
                <input
                  className="ff-input"
                  defaultValue={String(settings.departmentName ?? '')}
                  name="departmentName"
                  required
                />
              </label>
              <label>
                Hauptclaim
                <input
                  className="ff-input"
                  defaultValue={String(settings.taglinePrimary ?? '')}
                  name="taglinePrimary"
                />
              </label>
              <label>
                Unterclaim
                <input
                  className="ff-input"
                  defaultValue={String(settings.taglineSecondary ?? '')}
                  name="taglineSecondary"
                />
              </label>
            </div>
            <button className="ff-btn-accent w-fit" type="submit">
              Weiter
            </button>
          </form>
        ) : null}

        {step === 'contact' ? (
          <form action={saveContactAction} className="ff-card grid gap-5">
            <HiddenSettingsFields settings={settings} />
            <input name="siteName" type="hidden" value={String(settings.siteName ?? '')} />
            <input
              name="departmentName"
              type="hidden"
              value={String(settings.departmentName ?? '')}
            />
            <input
              name="taglinePrimary"
              type="hidden"
              value={String(settings.taglinePrimary ?? '')}
            />
            <input
              name="taglineSecondary"
              type="hidden"
              value={String(settings.taglineSecondary ?? '')}
            />
            <div>
              <p className="ff-kicker">Schritt 3</p>
              <h2 className="text-3xl">Kontakt & Impressum</h2>
            </div>
            <div className="ff-form-grid">
              <label>
                Kontakt-E-Mail
                <input
                  className="ff-input"
                  defaultValue={String(settings.contact?.email ?? '')}
                  name="contact.email"
                  type="email"
                />
              </label>
              <label>
                Notrufnummer
                <input
                  className="ff-input"
                  defaultValue={String(settings.contact?.emergencyNumber ?? '112')}
                  name="contact.emergencyNumber"
                />
              </label>
              <label>
                Adresse
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
            <button className="ff-btn-accent w-fit" type="submit">
              Weiter
            </button>
          </form>
        ) : null}

        {step === 'appearance' ? (
          <form action={saveAppearanceAction} className="ff-card grid gap-5">
            <HiddenSettingsFields settings={settings} />
            <input name="siteName" type="hidden" value={String(settings.siteName ?? '')} />
            <input
              name="departmentName"
              type="hidden"
              value={String(settings.departmentName ?? '')}
            />
            <input
              name="taglinePrimary"
              type="hidden"
              value={String(settings.taglinePrimary ?? '')}
            />
            <input
              name="taglineSecondary"
              type="hidden"
              value={String(settings.taglineSecondary ?? '')}
            />
            <div>
              <p className="ff-kicker">Schritt 4</p>
              <h2 className="text-3xl">Auftritt & Startbild</h2>
            </div>
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
              <label>
                Hero Headline
                <input
                  className="ff-input"
                  defaultValue="Einsatzbereit für unsere Stadt"
                  name="hero.headline"
                />
              </label>
              <label>
                Hero Text
                <textarea
                  className="ff-input"
                  defaultValue="Wir stehen für schnelle Hilfe, verlässliche Ausbildung und gelebtes Ehrenamt."
                  name="hero.copy"
                  rows={4}
                />
              </label>
              <label>
                Hero Bild
                <input className="ff-input" name="heroImageUpload" type="file" />
              </label>
              <label>
                Bildbeschreibung
                <input className="ff-input" name="heroImageAlt" />
              </label>
            </div>
            <button className="ff-btn-accent w-fit" type="submit">
              Weiter
            </button>
          </form>
        ) : null}

        {step === 'mail' ? (
          <form action={saveMailAction} className="ff-card grid gap-5">
            <HiddenSettingsFields settings={settings} />
            <input name="siteName" type="hidden" value={String(settings.siteName ?? '')} />
            <input
              name="departmentName"
              type="hidden"
              value={String(settings.departmentName ?? '')}
            />
            <input
              name="taglinePrimary"
              type="hidden"
              value={String(settings.taglinePrimary ?? '')}
            />
            <input
              name="taglineSecondary"
              type="hidden"
              value={String(settings.taglineSecondary ?? '')}
            />
            <div>
              <p className="ff-kicker">Schritt 5</p>
              <h2 className="text-3xl">E-Mail-Versand</h2>
              <p className="mt-2 text-sm text-neutral-600">
                SMTP kann leer bleiben und später unter Einstellungen gepflegt werden.
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
                />
              </label>
              <label>
                SMTP Port
                <input
                  className="ff-input"
                  defaultValue={String(settings.smtp?.port ?? 587)}
                  name="smtp.port"
                  type="number"
                />
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  defaultChecked={Boolean(settings.smtp?.secure)}
                  name="smtp.secure"
                  type="checkbox"
                />
                TLS / Secure
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
              <label>
                Test-E-Mail an
                <input
                  className="ff-input"
                  defaultValue={setupUser?.email ?? ''}
                  name="smtp.testRecipient"
                  type="email"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="ff-btn-ghost" formAction={testMailAction} type="submit">
                Verbindung testen
              </button>
              <button className="ff-btn-accent" type="submit">
                Setup abschließen
              </button>
            </div>
          </form>
        ) : null}

        {step === 'done' ? (
          <section className="ff-card grid gap-4">
            <p className="ff-kicker">Fertig</p>
            <h2 className="text-3xl">Setup abgeschlossen</h2>
            <p className="text-neutral-700">
              Die wichtigsten Startdaten sind gespeichert. Weitere Inhalte, Bilder und Einstellungen
              können im Dashboard bearbeitet werden.
            </p>
            <Link className="ff-btn-accent w-fit" href="/manage">
              Zum Dashboard
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  )
}
