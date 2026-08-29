import type { Page } from '@/payload-types'
import { parseYouTubeVideoId } from '@/lib/trustred/youtube'

export type PageLayoutBlock = Page['layout'][number]

export const pageBlockRegistry = {
  banner: {
    description:
      'Prominenter CTA-Banner mit Titel, Text und primären Aktionen direkt innerhalb der Seite.',
    label: 'Banner',
  },
  feed: {
    description: 'Zeigt Inhalte aus News, Terminen, Einsaetzen oder FAQ als dynamischen Abschnitt.',
    label: 'Feed',
  },
  form: {
    description:
      'Bindet ein Kontakt-, Mitmachen- oder individuelles Payload-Formular direkt in die Seite ein.',
    label: 'Formular',
  },
  hero: {
    description: 'Markanter Seitenauftakt mit Text, Aktionen und optionalem Bild.',
    label: 'Hero',
  },
  html: {
    description: 'Freies HTML fuer Sonderfaelle, wenn strukturierte Bloecke nicht ausreichen.',
    label: 'HTML',
  },
  'link-grid': {
    description: 'Sammlung wichtiger Links mit kurzen Beschreibungen.',
    label: 'Link-Liste',
  },
  'operations-log': {
    description:
      'Rendert die filterbare Einsatzhistorie mit optionalen Kennzahlen direkt als Seitenabschnitt.',
    label: 'Einsatzprotokoll',
  },
  'rich-text': {
    description: 'Textabschnitt mit Ueberschrift und freiem Copy-Text.',
    label: 'Text',
  },
  stats: {
    description: 'Kennzahlen oder kompakte Fakten in Kartenform.',
    label: 'Kennzahlen',
  },
  'tech-details': {
    description:
      'Rendert ein ausgewaehltes Fahrzeug oder Technikprofil direkt innerhalb der Seite.',
    label: 'Technik-Details',
  },
  'tech-overview': {
    description:
      'Zeigt Fahrzeuge und Technik als öffentliche Übersichtsseite mit Leitprofil und Karten.',
    label: 'Technik-Übersicht',
  },
  warnings: {
    description:
      'DWD- oder NINA-Block mit blockeigener Regionskonfiguration, Snapshot und optionalen Karten.',
    label: 'DWD / NINA',
  },
  youtube: {
    description:
      'Bindet ein YouTube-Video datenschutzkonform per youtube-nocookie.com ein und lädt erst nach Consent.',
    label: 'YouTube',
  },
} as const

export type PageBlockType = keyof typeof pageBlockRegistry

export const pageBlockLabels = Object.fromEntries(
  (Object.keys(pageBlockRegistry) as PageBlockType[]).map((type) => [
    type,
    pageBlockRegistry[type].label,
  ]),
) as { [Type in PageBlockType]: (typeof pageBlockRegistry)[Type]['label'] }

export const pageBlockDescriptions = Object.fromEntries(
  (Object.keys(pageBlockRegistry) as PageBlockType[]).map((type) => [
    type,
    pageBlockRegistry[type].description,
  ]),
) as { [Type in PageBlockType]: (typeof pageBlockRegistry)[Type]['description'] }

export function createDefaultPageBlock(type: PageBlockType = 'hero'): PageLayoutBlock {
  switch (type) {
    case 'stats':
      return {
        blockType: 'stats',
        items: [{ label: 'Kennzahl', value: '24/7' }],
      }
    case 'rich-text':
      return {
        blockType: 'rich-text',
        copy: 'Beschreibe hier Hintergruende, Hinweise oder weitere Informationen fuer Besucherinnen und Besucher.',
        headline: 'Textabschnitt',
      }
    case 'link-grid':
      return {
        blockType: 'link-grid',
        headline: 'Wichtige Links',
        links: [
          { description: 'Kurze Beschreibung des Ziels.', href: '/kontakt', label: 'Kontakt' },
        ],
      }
    case 'feed':
      return {
        blockType: 'feed',
        headline: 'Aktuelle Inhalte',
        intro: 'Dieser Feed zeigt automatisch aktuelle Inhalte aus dem ausgewaehlten Bereich.',
        limit: 3,
        source: 'posts',
      }
    case 'banner':
      return {
        blockType: 'banner',
        label: 'Mitmachen',
        primaryHref: '/mitmachen',
        primaryLabel: 'Mitmachen',
        secondaryHref: '/kontakt',
        secondaryLabel: 'Kontakt zur Wehr',
        text: 'Lerne die Wehr kennen, stelle Fragen und finde den passenden Einstieg in Ausbildung, Oeffentlichkeitsarbeit oder aktiven Dienst.',
        title: 'Technik, Teamarbeit und Einsatzbereitschaft direkt erleben',
      }
    case 'warnings':
      return {
        blockType: 'warnings',
        dwdRegionIds: [],
        dwdStates: [],
        forecastUrl: '',
        headline: 'Warnungen und Lage',
        intro: 'Dieser Block bindet ein Warn-Preset aus den globalen Einstellungen ein.',
        presetKey: '',
        provider: 'dwd',
        regionLabel: '',
        showWeatherMap: false,
        showWildfireMap: false,
        sourceUrl: '',
        warningMapUrl: '',
        weatherMapUrl: '',
        wildfireMapUrl: '',
      }
    case 'form':
      return {
        blockType: 'form',
        formMode: 'preset',
        headline: 'Kontaktformular',
        intro:
          'Nutze diesen Block fuer allgemeine Anfragen oder eine klar gefuehrte Kontaktaufnahme.',
        presetKey: 'contact',
      }
    case 'tech-details':
      return {
        blockType: 'tech-details',
        headline: 'Technik im Detail',
        intro:
          'Dieses Modul bindet ein ausgewaehltes Fahrzeug- oder Geraeteprofil direkt in die Seite ein.',
        showCompartments: true,
        showHighlights: true,
      }
    case 'tech-overview':
      return {
        blockType: 'tech-overview',
        headline: 'Fahrzeuge und Ausstattung',
        intro:
          'Die Technikübersicht zeigt Fahrzeuge, Funkrufnamen und wichtige Kerndaten in der gewohnten Trustred-Darstellung.',
        maxItems: 12,
        showFeaturedProfile: true,
        showStats: true,
      }
    case 'operations-log':
      return {
        blockType: 'operations-log',
        headline: 'Öffentliche Einsatzübersicht',
        intro:
          'Filterbare, datenschutzkonforme Einsatzhistorie mit Überblickskarten und Detailverlinkung.',
        maxItems: 100,
        showFilters: true,
        showStats: true,
      }
    case 'html':
      return {
        blockType: 'html',
        html: '<section><p>Individueller Inhalt</p></section>',
        label: 'Freier HTML-Bereich',
      }
    case 'youtube':
      return {
        blockType: 'youtube',
        headline: 'Video',
        intro: 'Datenschutzkonformes YouTube-Embed mit Consent-Gating.',
        videoId: '',
      }
    case 'hero':
    default:
      return {
        blockType: 'hero',
        copy: 'Beschreibe hier den Einstieg in die Seite, den Anlass und die wichtigsten Informationen fuer Besucherinnen und Besucher.',
        headline: 'Neue Seite',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt aufnehmen',
      }
  }
}

export function getEditablePageLayout(layout: Page['layout'] | null | undefined): Page['layout'] {
  if (Array.isArray(layout) && layout.length > 0) {
    return layout
  }

  return [createDefaultPageBlock()]
}

export function toRelationId(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'object' && value && 'id' in value && typeof value.id === 'number') {
    return value.id
  }

  return undefined
}

export function summarizePageBlock(block: PageLayoutBlock) {
  if (block.blockType === 'banner') {
    return `${block.title} • ${block.primaryLabel} → ${block.primaryHref}`
  }
  if (block.blockType === 'stats') return `${block.items?.length ?? 0} Kennzahlen`
  if (block.blockType === 'link-grid') return `${block.links?.length ?? 0} Links`
  if (block.blockType === 'feed') {
    return `${block.headline} • Quelle ${block.source} • ${block.limit} Eintraege`
  }
  if (block.blockType === 'warnings') {
    return `${block.headline} • ${block.provider.toUpperCase()} • ${block.regionLabel || block.presetKey || 'Region offen'}`
  }
  if (block.blockType === 'form') {
    return `${block.headline} • ${block.formMode === 'custom' ? 'Custom Form' : `Preset ${block.presetKey || 'contact'}`}`
  }
  if (block.blockType === 'tech-details') {
    return `${block.headline} • Technik-ID ${toRelationId(block.equipment) ?? 'offen'}`
  }
  if (block.blockType === 'tech-overview') {
    return `${block.headline} • max. ${block.maxItems ?? 12} Profile • Leitprofil ${block.showFeaturedProfile === false ? 'aus' : 'an'}`
  }
  if (block.blockType === 'operations-log') {
    return `${block.headline} • max. ${block.maxItems ?? 100} Einsaetze • ${block.showFilters === false ? 'Tabelle' : 'Archiv'}`
  }
  if (block.blockType === 'youtube') {
    return `${block.headline} • ${parseYouTubeVideoId(block.videoId) ? 'Video gesetzt' : 'Video-ID fehlt'}`
  }
  if (block.blockType === 'html') return block.label
  return block.headline
}
