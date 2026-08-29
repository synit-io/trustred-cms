import { redirect } from 'next/navigation'

import {
  getEditorialPermissions,
  requireEditorialContext,
  saveWarningSettings,
} from '@/lib/trustred/editorial'
import { getWarningSnapshotFromConfig, refreshWarningCaches } from '@/lib/trustred/warnings'
import { formatDateTime } from '@/lib/trustred/public-content'
import type { WarningPreset } from '@/payload-types'

const DWD_OBJECT_EMBED_DOCS_URL =
  'https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/objekteinbindung_node.html'
const NINA_API_DOCS_URL = 'https://nina.api.bund.dev/'

function presetSummary(preset: WarningPreset) {
  return `${preset.provider.toUpperCase()} · ${preset.regionLabel}`
}

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatRelativeCacheWindow(updatedAt?: string, staleAfterSeconds = 900) {
  if (!updatedAt) return 'Keine Laufzeitdaten'

  const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000))
  const staleMinutes = Math.max(1, Math.round(staleAfterSeconds / 60))
  return `${ageMinutes} Min. alt · Zielintervall ${staleMinutes} Min.`
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ManageWarningsPage({ searchParams }: Props) {
  const { payload, user } = await requireEditorialContext()
  const permissions = getEditorialPermissions(user)

  if (!permissions.canAccessWarnings) {
    redirect('/manage')
  }

  const params = (await searchParams) ?? {}
  const status = readSearchValue(params.status)?.trim() ?? ''
  const message = readSearchValue(params.message)?.trim() ?? ''

  const result = await payload.find({
    collection: 'warning-presets',
    limit: 200,
    overrideAccess: false,
    sort: 'label',
    user,
  })

  const presets = result.docs as WarningPreset[]
  const systemPresets = presets.filter((preset) => preset.isSystemPreset === true)
  const customPresets = presets.filter((preset) => preset.isSystemPreset !== true)
  const sampleDwdPreset = systemPresets.find((preset) => preset.provider === 'dwd')
  const sampleNinaPreset = systemPresets.find((preset) => preset.provider === 'nina')
  const [dwdHealth, ninaHealth] = await Promise.all([
    sampleDwdPreset ? getWarningSnapshotFromConfig(sampleDwdPreset) : Promise.resolve(null),
    sampleNinaPreset ? getWarningSnapshotFromConfig(sampleNinaPreset) : Promise.resolve(null),
  ])
  const warningPresetRows = [
    ...customPresets,
    {
      dwdRegionIds: [],
      dwdStates: [],
      forecastUrl: '',
      isSystemPreset: false,
      key: '',
      label: '',
      ninaArs: '',
      provider: 'dwd' as const,
      regionLabel: '',
      sourceUrl: '',
      warningMapUrl: '',
      weatherMapUrl: '',
      wildfireMapUrl: '',
    },
  ]

  async function action(formData: FormData) {
    'use server'
    const { payload, user } = await requireEditorialContext()
    await saveWarningSettings(payload, user, formData)
    redirect('/manage/warnings?status=success&message=Custom-Presets+gespeichert')
  }

  async function refreshAction() {
    'use server'
    refreshWarningCaches()
    redirect('/manage/warnings?status=success&message=Warn-Cache+aktualisiert')
  }

  return (
    <div className="grid gap-6">
      <section className="ff-card">
        <p className="ff-kicker">Warnungen</p>
        <h2 className="text-3xl">DWD- und NINA-Presets</h2>
        <p className="mt-4 max-w-3xl text-neutral-700">
          Presets liegen jetzt als eigene Payload-Collection vor. Das Admin-Backend kann alle
          Datensätze vollständig bearbeiten. Diese Frontend-Oberfläche zeigt System-Presets bewusst
          kompakt und schreibgeschützt, während nur Custom-Presets hier detailliert gepflegt werden.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-neutral-600">
          DWD-Systemwerte basieren auf dem bisherigen Trustred-Presetkatalog und den offiziellen
          DWD-Einbindungsdaten aus{' '}
          <a
            className="text-[var(--brand-600)] underline"
            href={DWD_OBJECT_EMBED_DOCS_URL}
            rel="noreferrer"
            target="_blank"
          >
            Ihr Homepagewetter
          </a>
          . NINA-Bundesland-Defaults folgen der offiziellen{' '}
          <a
            className="text-[var(--brand-600)] underline"
            href={NINA_API_DOCS_URL}
            rel="noreferrer"
            target="_blank"
          >
            NINA API
          </a>
          .
        </p>
      </section>

      {status && message ? (
        <section
          className={`ff-card ${status === 'error' ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}
        >
          <p className="ff-kicker">Status</p>
          <p className="text-sm font-semibold text-neutral-900">{message}</p>
        </section>
      ) : null}

      <section className="ff-card grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ff-kicker">Laufzeitstatus</p>
            <h3 className="text-2xl">Fetch- und Cache-Überblick</h3>
          </div>
          <form action={refreshAction}>
            <button className="ff-btn-ghost" type="submit">
              Warn-Cache aktualisieren
            </button>
          </form>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[dwdHealth, ninaHealth].filter(Boolean).map((snapshot) => (
            <article
              className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4"
              key={`${snapshot?.provider}-${snapshot?.regionLabel}`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                {snapshot?.provider?.toUpperCase()} · {snapshot?.regionLabel}
              </p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                Status:{' '}
                {snapshot?.status === 'live'
                  ? 'Live'
                  : snapshot?.status === 'fallback'
                    ? 'Fallback'
                    : 'Fehler'}
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                {snapshot?.entries.length ?? 0} Warnungen · Aktualisiert{' '}
                {snapshot?.updatedAt ? formatDateTime(snapshot.updatedAt) : 'unbekannt'}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                {formatRelativeCacheWindow(snapshot?.updatedAt, snapshot?.staleAfterSeconds)}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Quelle:{' '}
                {snapshot?.sourceState === 'ok'
                  ? 'Stabil'
                  : snapshot?.sourceState === 'empty'
                    ? 'Leer, aber erreichbar'
                    : 'Degradiert'}
              </p>
              {snapshot?.note ? (
                <p className="mt-2 text-sm leading-7 text-neutral-600">{snapshot.note}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">System-Presets</p>
          <h3 className="text-2xl">Kompakt und schreibgeschützt</h3>
          <p className="text-sm text-neutral-600">
            Die Liste ist standardmäßig eingeklappt. Bei Bedarf kann jedes Preset aufgeklappt
            werden, um die hinterlegten Werte zu prüfen.
          </p>
        </div>
        <div className="grid gap-3">
          {systemPresets.map((preset) => (
            <details
              className="rounded-[1.2rem] border border-neutral-200 bg-white p-4"
              key={preset.key}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-neutral-900">{preset.label}</p>
                  <p className="mt-1 text-sm text-neutral-600">{presetSummary(preset)}</p>
                </div>
                <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  Read only
                </span>
              </summary>
              <div className="mt-4 grid gap-3 text-sm text-neutral-700 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                    Schlüssel
                  </p>
                  <p className="mt-2 break-all">{preset.key}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                    Quelle
                  </p>
                  <p className="mt-2 break-all">{preset.sourceUrl || 'Nicht gesetzt'}</p>
                </div>
                {preset.provider === 'dwd' ? (
                  <>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                        Bundesländer
                      </p>
                      <p className="mt-2">
                        {(preset.dwdStates ?? []).map((entry) => entry.state).join(', ') ||
                          'Nicht gesetzt'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                        Karten
                      </p>
                      <p className="mt-2">
                        Warnkarte: {preset.warningMapUrl ? 'Ja' : 'Nein'} · Wetterkarte:{' '}
                        {preset.weatherMapUrl ? 'Ja' : 'Nein'} · Waldbrandkarte:{' '}
                        {preset.wildfireMapUrl ? 'Ja' : 'Nein'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                      NINA ARS
                    </p>
                    <p className="mt-2">{preset.ninaArs || 'Nicht gesetzt'}</p>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      <form action={action} className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">Eigene Presets</p>
          <h3 className="text-2xl">Custom verwalten</h3>
          <p className="text-sm text-neutral-600">
            Hier werden ausschließlich eigene Presets bearbeitet. Diese Datensätze sind anschließend
            ebenfalls im Payload-Admin als Collection-Einträge sichtbar.
          </p>
        </div>
        <input name="warningPresets.count" type="hidden" value={warningPresetRows.length} />
        <div className="grid gap-4">
          {warningPresetRows.map((preset, index) => (
            <details
              className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4"
              key={`warning-preset-${index}`}
              open={Boolean(preset.label || preset.regionLabel)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg">{preset.label || `Custom Preset ${index + 1}`}</h4>
                  <p className="text-sm text-neutral-600">
                    {preset.regionLabel || 'Region offen'} ·{' '}
                    {String(preset.provider ?? 'dwd').toUpperCase()}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <input name={`warningPresets.${index}.remove`} type="checkbox" />
                  Beim Speichern entfernen
                </label>
              </summary>
              <div className="mt-4 ff-form-grid">
                <label>
                  Schlüssel
                  <input
                    className="ff-input"
                    defaultValue={String(preset.key ?? '')}
                    name={`warningPresets.${index}.key`}
                  />
                </label>
                <label>
                  Anzeige-Label
                  <input
                    className="ff-input"
                    defaultValue={String(preset.label ?? '')}
                    name={`warningPresets.${index}.label`}
                  />
                </label>
                <label>
                  Anbieter
                  <select
                    className="ff-input"
                    defaultValue={String(preset.provider ?? 'dwd')}
                    name={`warningPresets.${index}.provider`}
                  >
                    <option value="dwd">DWD</option>
                    <option value="nina">NINA</option>
                  </select>
                </label>
                <label>
                  Regionslabel
                  <input
                    className="ff-input"
                    defaultValue={String(preset.regionLabel ?? '')}
                    name={`warningPresets.${index}.regionLabel`}
                  />
                </label>
                <label>
                  DWD Bundesländer / Feed-State-Namen
                  <textarea
                    className="ff-input"
                    defaultValue={(preset.dwdStates ?? []).map((state) => state.state).join('\n')}
                    name={`warningPresets.${index}.dwdStates`}
                    rows={4}
                  />
                </label>
                <label>
                  DWD Regions-IDs
                  <textarea
                    className="ff-input"
                    defaultValue={(preset.dwdRegionIds ?? [])
                      .map((region) => region.regionId)
                      .join('\n')}
                    name={`warningPresets.${index}.dwdRegionIds`}
                    rows={4}
                  />
                </label>
                <label>
                  DWD Forecast-URL
                  <input
                    className="ff-input"
                    defaultValue={String(preset.forecastUrl ?? '')}
                    name={`warningPresets.${index}.forecastUrl`}
                  />
                </label>
                <label>
                  DWD Warnkarten-URL
                  <input
                    className="ff-input"
                    defaultValue={String(preset.warningMapUrl ?? '')}
                    name={`warningPresets.${index}.warningMapUrl`}
                  />
                </label>
                <label>
                  DWD Wetterkarten-URL
                  <input
                    className="ff-input"
                    defaultValue={String(preset.weatherMapUrl ?? '')}
                    name={`warningPresets.${index}.weatherMapUrl`}
                  />
                </label>
                <label>
                  DWD Waldbrandkarten-URL
                  <input
                    className="ff-input"
                    defaultValue={String(preset.wildfireMapUrl ?? '')}
                    name={`warningPresets.${index}.wildfireMapUrl`}
                  />
                </label>
                <label>
                  NINA ARS
                  <input
                    className="ff-input"
                    defaultValue={String(preset.ninaArs ?? '')}
                    name={`warningPresets.${index}.ninaArs`}
                  />
                </label>
                <label>
                  Quell-URL
                  <input
                    className="ff-input"
                    defaultValue={String(preset.sourceUrl ?? '')}
                    name={`warningPresets.${index}.sourceUrl`}
                  />
                </label>
              </div>
            </details>
          ))}
        </div>
        <button className="ff-btn-accent w-fit" type="submit">
          Custom-Presets speichern
        </button>
      </form>
    </div>
  )
}
