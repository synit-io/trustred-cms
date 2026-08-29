import { toRelationId, type PageLayoutBlock } from '@/lib/trustred/page-builder'
import type { WarningPresetDefinition } from '@/lib/trustred/warning-presets'
import { parseYouTubeVideoId } from '@/lib/trustred/youtube'

export function getBlockValidationIssues(
  block: PageLayoutBlock,
  warningPresets: WarningPresetDefinition[],
) {
  const issues: string[] = []

  if (
    'headline' in block &&
    typeof block.headline === 'string' &&
    block.headline.trim().length === 0
  ) {
    issues.push('Headline fehlt.')
  }

  if (block.blockType === 'hero') {
    if (block.copy.trim().length === 0) {
      issues.push('Der Hero-Text ist leer.')
    }
    if (
      block.primaryActionLabel.trim().length === 0 ||
      block.primaryActionHref.trim().length === 0
    ) {
      issues.push('Die primaere Aktion braucht Label und Ziel.')
    }
    if (!toRelationId(block.heroImage)) {
      issues.push(
        'Ein Hero-Bild ist optional, verbessert aber die öffentliche Seitenwirkung deutlich.',
      )
    }
  }

  if (block.blockType === 'stats' && (block.items?.length ?? 0) === 0) {
    issues.push('Mindestens eine Kennzahl fehlt.')
  }

  if (block.blockType === 'link-grid') {
    if ((block.links?.length ?? 0) === 0) {
      issues.push('Es ist noch kein Link hinterlegt.')
    }
    if (
      (block.links ?? []).some(
        (link) => link.label.trim().length === 0 || link.href.trim().length === 0,
      )
    ) {
      issues.push('Jeder Link braucht Label und Ziel.')
    }
  }

  if (block.blockType === 'feed') {
    if (block.limit < 1) {
      issues.push('Die Feed-Anzahl muss mindestens 1 sein.')
    }
    if ((block.intro ?? '').trim().length === 0) {
      issues.push('Ein kurzer Intro-Text verbessert die Einordnung des Feeds.')
    }
  }

  if (block.blockType === 'banner') {
    if (block.title.trim().length === 0) {
      issues.push('Der Banner-Titel fehlt.')
    }
    if (block.text.trim().length === 0) {
      issues.push('Der Banner-Text ist leer.')
    }
    if (block.primaryLabel.trim().length === 0 || block.primaryHref.trim().length === 0) {
      issues.push('Die primäre Aktion braucht Label und Ziel.')
    }
    if (
      (block.secondaryLabel ?? '').trim().length > 0 &&
      String(block.secondaryHref ?? '').trim().length === 0
    ) {
      issues.push('Für die sekundäre Aktion fehlt das Ziel.')
    }
  }

  if (block.blockType === 'warnings') {
    if (block.provider === 'dwd') {
      if ((block.dwdStates ?? []).length === 0 && (block.dwdRegionIds ?? []).length === 0) {
        issues.push(
          'Für DWD muss mindestens ein Bundeslandfilter oder eine Regions-ID hinterlegt sein.',
        )
      }
      if (String(block.forecastUrl ?? '').trim().length === 0) {
        issues.push('Für den DWD-Snapshot fehlt die Forecast-URL.')
      }
      if (block.showWeatherMap && String(block.weatherMapUrl ?? '').trim().length === 0) {
        issues.push('Wetterkarte aktiviert, aber keine Wetterkarten-URL hinterlegt.')
      }
      if (block.showWildfireMap && String(block.wildfireMapUrl ?? '').trim().length === 0) {
        issues.push('Waldbrandkarte aktiviert, aber keine Waldbrandkarten-URL hinterlegt.')
      }
      if (
        String(block.ninaPresetKey ?? '').trim().length > 0 &&
        !warningPresets.some(
          (preset) => preset.provider === 'nina' && preset.key === block.ninaPresetKey,
        )
      ) {
        issues.push('Das gewählte NINA-Zusatzpreset existiert nicht mehr.')
      }
    } else if (String(block.ninaArs ?? '').trim().length === 0) {
      issues.push('Für NINA muss ein ARS-Wert hinterlegt sein.')
    }
    if (String(block.regionLabel ?? '').trim().length === 0) {
      issues.push('Das Regionslabel fehlt.')
    }
    if (
      String(block.presetKey ?? '').trim().length > 0 &&
      !warningPresets.some(
        (preset) => preset.provider === block.provider && preset.key === block.presetKey,
      )
    ) {
      issues.push('Das gewählte Preset existiert nicht mehr in den globalen Einstellungen.')
    }
  }

  if (block.blockType === 'form') {
    if (block.headline.trim().length === 0) {
      issues.push('Der Formular-Block braucht eine Headline.')
    }
    if (block.formMode === 'custom' && !toRelationId(block.form)) {
      issues.push('Bei Custom Form muss ein Formular ausgewählt werden.')
    }
  }

  if (block.blockType === 'tech-details' && !toRelationId(block.equipment)) {
    issues.push('Es ist noch kein Technikprofil ausgewählt.')
  }

  if (block.blockType === 'tech-overview' && (block.maxItems ?? 0) < 1) {
    issues.push('Die Technikübersicht braucht mindestens ein sichtbares Profil.')
  }

  if (block.blockType === 'operations-log' && (block.maxItems ?? 0) < 1) {
    issues.push('Das Einsatzlog braucht mindestens einen sichtbaren Eintrag.')
  }

  if (block.blockType === 'youtube') {
    if (String(block.videoId ?? '').trim().length === 0) {
      issues.push('Für YouTube muss eine Video-URL oder Video-ID gesetzt sein.')
    } else if (!parseYouTubeVideoId(block.videoId)) {
      issues.push('Die YouTube-URL ist ungültig. Erlaubt sind youtube.com- oder youtu.be-Links.')
    }
  }

  if (block.blockType === 'html' && block.html.trim().length === 0) {
    issues.push('Das HTML-Feld ist leer.')
  }

  return issues
}
