export type WarningProvider = 'dwd' | 'nina'

export type WarningPresetDefinition = {
  dwdRegionIds?: Array<{ regionId: string }> | null
  dwdStates?: Array<{ state: string }> | null
  forecastUrl?: string | null
  isSystemPreset?: boolean
  key: string
  label: string
  ninaArs?: string | null
  provider: WarningProvider
  regionLabel: string
  sourceUrl?: string | null
  warningMapUrl?: string | null
  weatherMapUrl?: string | null
  wildfireMapUrl?: string | null
}

type WarningBlockLike = {
  dwdRegionIds?: Array<{ regionId?: string | null }> | null
  dwdStates?: Array<{ state?: string | null }> | null
  forecastUrl?: string | null
  ninaArs?: string | null
  presetKey?: string | null
  provider: WarningProvider
  regionLabel?: string | null
  showWeatherMap?: boolean | null
  showWildfireMap?: boolean | null
  sourceUrl?: string | null
  warningMapUrl?: string | null
  weatherMapUrl?: string | null
  wildfireMapUrl?: string | null
}

const DWD_WILDFIRE_MAP_URL =
  'https://www.dwd.de/DWD/warnungen/agrar/wbx/wbx_stationen.png'
const NINA_PUBLIC_SOURCE_URL = 'https://warnung.bund.de/meldungen'

const dwdForecastUrls = {
  badenWuerttemberg:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/baden-wuerttemberg/vhs_bawue_node.html',
  bayern: 'https://www.dwd.de/DE/wetter/vorhersage_aktuell/bayern/vhs_bay_node.html',
  berlinBrandenburg:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/berlin_brandenburg/vhs_bbb_node.html',
  hessen: 'https://www.dwd.de/DE/wetter/vorhersage_aktuell/hessen/vhs_hes_node.html',
  mecklenburgVorpommern:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/mecklenburg_vorpommern/vhs_mvp_node.html',
  niedersachsenBremen:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/niedersachsen_bremen/vhs_nib_node.html',
  nordrheinWestfalen:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/nordrhein_westfalen/vhs_nrw_node.html',
  rheinlandPfalzSaarland:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/rheinland-pfalz_saarland/vhs_rps_node.html',
  sachsen: 'https://www.dwd.de/DE/wetter/vorhersage_aktuell/sachsen/vhs_sac_node.html',
  sachsenAnhalt:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/sachen_anhalt/vhs_saa_node.html',
  schleswigHolsteinHamburg:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/schleswig_holstein_hamburg/vhs_shh_node.html',
  thueringen:
    'https://www.dwd.de/DE/wetter/vorhersage_aktuell/thueringen/vhs_thu_node.html',
} as const

const dwdWarningMapUrls = {
  baw: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_baw.png',
  bay: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_bay.png',
  bbb: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_bbb.png',
  hes: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_hes.png',
  mvp: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_mvp.png',
  nib: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_nib.png',
  nrw: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_nrw.png',
  rps: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_rps.png',
  sac: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_sac.png',
  saa: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_saa.png',
  shh: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_shh.png',
  thu: 'https://www.dwd.de/DWD/warnungen/warnapp/json/warning_map_thu.png',
} as const

type DwdForecastKey = keyof typeof dwdForecastUrls
type DwdMapKey = keyof typeof dwdWarningMapUrls

function createDwdWeatherMapUrl(code: DwdMapKey) {
  return `https://www.dwd.de/DWD/wetter/aktuell/${code}/bilder/wx_${code}_akt.jpg`
}

type DwdPresetSeed = {
  forecastKey: DwdForecastKey
  key: string
  label: string
  states: string[]
  warningCode: DwdMapKey
}

const builtInDwdPresetSeeds: DwdPresetSeed[] = [
  {
    forecastKey: 'badenWuerttemberg',
    key: 'dwd-baden-wuerttemberg',
    label: 'DWD Baden-Württemberg',
    states: ['Baden-Württemberg'],
    warningCode: 'baw',
  },
  {
    forecastKey: 'bayern',
    key: 'dwd-bayern',
    label: 'DWD Bayern',
    states: ['Bayern'],
    warningCode: 'bay',
  },
  {
    forecastKey: 'berlinBrandenburg',
    key: 'dwd-berlin',
    label: 'DWD Berlin',
    states: ['Berlin'],
    warningCode: 'bbb',
  },
  {
    forecastKey: 'berlinBrandenburg',
    key: 'dwd-brandenburg',
    label: 'DWD Brandenburg',
    states: ['Brandenburg'],
    warningCode: 'bbb',
  },
  {
    forecastKey: 'niedersachsenBremen',
    key: 'dwd-bremen',
    label: 'DWD Bremen',
    states: ['Bremen'],
    warningCode: 'nib',
  },
  {
    forecastKey: 'schleswigHolsteinHamburg',
    key: 'dwd-hamburg',
    label: 'DWD Hamburg',
    states: ['Hamburg'],
    warningCode: 'shh',
  },
  {
    forecastKey: 'hessen',
    key: 'dwd-hessen',
    label: 'DWD Hessen',
    states: ['Hessen'],
    warningCode: 'hes',
  },
  {
    forecastKey: 'mecklenburgVorpommern',
    key: 'dwd-mecklenburg-vorpommern',
    label: 'DWD Mecklenburg-Vorpommern',
    states: ['Mecklenburg-Vorpommern'],
    warningCode: 'mvp',
  },
  {
    forecastKey: 'niedersachsenBremen',
    key: 'dwd-niedersachsen',
    label: 'DWD Niedersachsen',
    states: ['Niedersachsen'],
    warningCode: 'nib',
  },
  {
    forecastKey: 'nordrheinWestfalen',
    key: 'dwd-nordrhein-westfalen',
    label: 'DWD Nordrhein-Westfalen',
    states: ['Nordrhein-Westfalen'],
    warningCode: 'nrw',
  },
  {
    forecastKey: 'rheinlandPfalzSaarland',
    key: 'dwd-rheinland-pfalz',
    label: 'DWD Rheinland-Pfalz',
    states: ['Rheinland-Pfalz'],
    warningCode: 'rps',
  },
  {
    forecastKey: 'rheinlandPfalzSaarland',
    key: 'dwd-saarland',
    label: 'DWD Saarland',
    states: ['Saarland'],
    warningCode: 'rps',
  },
  {
    forecastKey: 'sachsen',
    key: 'dwd-sachsen',
    label: 'DWD Sachsen',
    states: ['Sachsen'],
    warningCode: 'sac',
  },
  {
    forecastKey: 'sachsenAnhalt',
    key: 'dwd-sachsen-anhalt',
    label: 'DWD Sachsen-Anhalt',
    states: ['Sachsen-Anhalt'],
    warningCode: 'saa',
  },
  {
    forecastKey: 'schleswigHolsteinHamburg',
    key: 'dwd-schleswig-holstein',
    label: 'DWD Schleswig-Holstein',
    states: ['Schleswig-Holstein'],
    warningCode: 'shh',
  },
  {
    forecastKey: 'thueringen',
    key: 'dwd-thueringen',
    label: 'DWD Thüringen',
    states: ['Thüringen'],
    warningCode: 'thu',
  },
  {
    forecastKey: 'berlinBrandenburg',
    key: 'dwd-berlin-brandenburg',
    label: 'DWD Berlin / Brandenburg',
    states: ['Berlin', 'Brandenburg'],
    warningCode: 'bbb',
  },
  {
    forecastKey: 'niedersachsenBremen',
    key: 'dwd-niedersachsen-bremen',
    label: 'DWD Niedersachsen / Bremen',
    states: ['Niedersachsen', 'Bremen'],
    warningCode: 'nib',
  },
  {
    forecastKey: 'rheinlandPfalzSaarland',
    key: 'dwd-rheinland-pfalz-saarland',
    label: 'DWD Rheinland-Pfalz / Saarland',
    states: ['Rheinland-Pfalz', 'Saarland'],
    warningCode: 'rps',
  },
  {
    forecastKey: 'schleswigHolsteinHamburg',
    key: 'dwd-schleswig-holstein-hamburg',
    label: 'DWD Schleswig-Holstein / Hamburg',
    states: ['Schleswig-Holstein', 'Hamburg'],
    warningCode: 'shh',
  },
]

type NinaPresetSeed = {
  ars: string
  key: string
  label: string
}

const builtInNinaPresetSeeds: NinaPresetSeed[] = [
  { ars: '080000000000', key: 'nina-baden-wuerttemberg', label: 'NINA Baden-Württemberg' },
  { ars: '090000000000', key: 'nina-bayern', label: 'NINA Bayern' },
  { ars: '110000000000', key: 'nina-berlin', label: 'NINA Berlin' },
  { ars: '120000000000', key: 'nina-brandenburg', label: 'NINA Brandenburg' },
  { ars: '040000000000', key: 'nina-bremen', label: 'NINA Bremen' },
  { ars: '020000000000', key: 'nina-hamburg', label: 'NINA Hamburg' },
  { ars: '060000000000', key: 'nina-hessen', label: 'NINA Hessen' },
  { ars: '130000000000', key: 'nina-mecklenburg-vorpommern', label: 'NINA Mecklenburg-Vorpommern' },
  { ars: '030000000000', key: 'nina-niedersachsen', label: 'NINA Niedersachsen' },
  { ars: '050000000000', key: 'nina-nordrhein-westfalen', label: 'NINA Nordrhein-Westfalen' },
  { ars: '070000000000', key: 'nina-rheinland-pfalz', label: 'NINA Rheinland-Pfalz' },
  { ars: '100000000000', key: 'nina-saarland', label: 'NINA Saarland' },
  { ars: '140000000000', key: 'nina-sachsen', label: 'NINA Sachsen' },
  { ars: '150000000000', key: 'nina-sachsen-anhalt', label: 'NINA Sachsen-Anhalt' },
  { ars: '010000000000', key: 'nina-schleswig-holstein', label: 'NINA Schleswig-Holstein' },
  { ars: '160000000000', key: 'nina-thueringen', label: 'NINA Thüringen' },
]

const builtInWarningPresets: WarningPresetDefinition[] = [
  ...builtInDwdPresetSeeds.map((seed) => {
    const forecastUrl = dwdForecastUrls[seed.forecastKey]
    const warningMapUrl = dwdWarningMapUrls[seed.warningCode]

    return {
      dwdRegionIds: [],
      dwdStates: seed.states.map((state) => ({ state })),
      forecastUrl,
      isSystemPreset: true,
      key: seed.key,
      label: seed.label,
      provider: 'dwd' as const,
      regionLabel: seed.label.replace(/^DWD\s+/, ''),
      sourceUrl: forecastUrl,
      warningMapUrl,
      weatherMapUrl: createDwdWeatherMapUrl(seed.warningCode),
      wildfireMapUrl: DWD_WILDFIRE_MAP_URL,
    }
  }),
  ...builtInNinaPresetSeeds.map((seed) => ({
    isSystemPreset: true,
    key: seed.key,
    label: seed.label,
    ninaArs: seed.ars,
    provider: 'nina' as const,
    regionLabel: seed.label.replace(/^NINA\s+/, ''),
    sourceUrl: NINA_PUBLIC_SOURCE_URL,
  })),
]

function clonePreset(preset: WarningPresetDefinition): WarningPresetDefinition {
  return {
    ...preset,
    dwdRegionIds: preset.dwdRegionIds?.map((entry) => ({ regionId: entry.regionId })) ?? [],
    dwdStates: preset.dwdStates?.map((entry) => ({ state: entry.state })) ?? [],
  }
}

function presetIdentity(
  provider: WarningProvider,
  key: string | null | undefined,
) {
  return `${provider}:${String(key ?? '').trim()}`
}

export function getBuiltInWarningPresets() {
  return builtInWarningPresets.map(clonePreset)
}

export function isBuiltInWarningPresetKey(key: string | null | undefined) {
  const normalized = String(key ?? '').trim()
  return builtInWarningPresets.some((preset) => preset.key === normalized)
}

export function normalizeWarningPresets(
  presets: Array<Partial<WarningPresetDefinition> | null | undefined> | null | undefined,
  fallbackToBuiltIns = true,
) {
  const merged: WarningPresetDefinition[] = []
  const seenKeys = new Set<string>()

  for (const preset of presets ?? []) {
    const key = String(preset?.key ?? '').trim()
    const label = String(preset?.label ?? '').trim()
    const regionLabel = String(preset?.regionLabel ?? '').trim()
    const provider = preset?.provider === 'nina' ? 'nina' : 'dwd'
    const identity = presetIdentity(provider, key)

    if (!key || !label || !regionLabel || seenKeys.has(identity)) {
      continue
    }

    merged.push({
      dwdRegionIds:
        provider === 'dwd'
          ? (preset?.dwdRegionIds ?? [])
              .map((entry) => String(entry?.regionId ?? '').trim())
              .filter(Boolean)
              .map((regionId) => ({ regionId }))
          : [],
      dwdStates:
        provider === 'dwd'
          ? (preset?.dwdStates ?? [])
              .map((entry) => String(entry?.state ?? '').trim())
              .filter(Boolean)
              .map((state) => ({ state }))
          : [],
      forecastUrl: provider === 'dwd' ? String(preset?.forecastUrl ?? '').trim() || undefined : undefined,
      isSystemPreset: preset?.isSystemPreset === true,
      key,
      label,
      ninaArs: provider === 'nina' ? String(preset?.ninaArs ?? '').trim() || undefined : undefined,
      provider,
      regionLabel,
      sourceUrl: String(preset?.sourceUrl ?? '').trim() || undefined,
      warningMapUrl: provider === 'dwd' ? String(preset?.warningMapUrl ?? '').trim() || undefined : undefined,
      weatherMapUrl: provider === 'dwd' ? String(preset?.weatherMapUrl ?? '').trim() || undefined : undefined,
      wildfireMapUrl: provider === 'dwd' ? String(preset?.wildfireMapUrl ?? '').trim() || undefined : undefined,
    })
    seenKeys.add(identity)
  }

  if (merged.length === 0 && fallbackToBuiltIns) {
    return getBuiltInWarningPresets()
  }

  return merged
}

export function mergeWarningPresets(
  customPresets: Array<Partial<WarningPresetDefinition> | null | undefined> | null | undefined,
) {
  const merged = getBuiltInWarningPresets()
  const seenKeys = new Set(merged.map((preset) => presetIdentity(preset.provider, preset.key)))

  for (const preset of normalizeWarningPresets(customPresets, false)) {
    const identity = presetIdentity(preset.provider, preset.key)

    if (seenKeys.has(identity)) {
      continue
    }

    merged.push(preset)
    seenKeys.add(identity)
  }

  return merged
}

export function findWarningPreset(
  presets: Array<Partial<WarningPresetDefinition> | null | undefined> | null | undefined,
  key: string | null | undefined,
  provider?: WarningProvider | null,
) {
  const normalizedKey = String(key ?? '').trim()
  if (!normalizedKey) {
    return null
  }

  const merged = normalizeWarningPresets(presets)
  return (
    merged.find((preset) => preset.key === normalizedKey && (!provider || preset.provider === provider)) ??
    null
  )
}

export function applyWarningPresetToBlock<T extends WarningBlockLike>(
  block: T,
  preset: WarningPresetDefinition,
): T {
  if (preset.provider === 'dwd') {
    return {
      ...block,
      dwdRegionIds: preset.dwdRegionIds?.map((entry) => ({ regionId: entry.regionId })) ?? [],
      dwdStates: preset.dwdStates?.map((entry) => ({ state: entry.state })) ?? [],
      forecastUrl: preset.forecastUrl ?? undefined,
      ninaArs: undefined,
      presetKey: preset.key,
      provider: 'dwd',
      regionLabel: preset.regionLabel,
      sourceUrl: preset.sourceUrl ?? preset.forecastUrl ?? undefined,
      warningMapUrl: preset.warningMapUrl ?? undefined,
      weatherMapUrl: preset.weatherMapUrl ?? undefined,
      wildfireMapUrl: preset.wildfireMapUrl ?? undefined,
    }
  }

  return {
    ...block,
    dwdRegionIds: [],
    dwdStates: [],
    forecastUrl: undefined,
    ninaArs: preset.ninaArs ?? undefined,
    presetKey: preset.key,
    provider: 'nina',
    regionLabel: preset.regionLabel,
    sourceUrl: preset.sourceUrl ?? undefined,
    warningMapUrl: undefined,
    weatherMapUrl: undefined,
    wildfireMapUrl: undefined,
  }
}
