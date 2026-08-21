'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { MediaSelectField } from '@/components/trustred/editorial/MediaSelectField'
import { defaultHomePage } from '@/lib/trustred/defaults'
import {
  createDefaultPageBlock,
  pageBlockDescriptions,
  pageBlockLabels,
  toRelationId,
  type PageBlockType,
  type PageLayoutBlock,
} from '@/lib/trustred/page-builder'
import {
  applyWarningPresetToBlock,
  type WarningPresetDefinition,
} from '@/lib/trustred/warning-presets'
import { parseYouTubeVideoId } from '@/lib/trustred/youtube'
import type { Media, Page } from '@/payload-types'

type Props = {
  equipmentOptions?: Array<{
    id: number
    label: string
    slug: string
  }>
  formOptions?: Array<{
    id: number
    title: string
  }>
  initialLayout: Page['layout']
  mediaOptions?: Array<{
    alt: string
    category: Media['category']
    filename: string
    id: number
    url: string | null
  }>
  warningPresets?: WarningPresetDefinition[]
}

type WarningPresetOption = WarningPresetDefinition

const blockPalette = (Object.keys(pageBlockLabels) as PageBlockType[]).map((type) => ({
  description: pageBlockDescriptions[type],
  label: pageBlockLabels[type],
  type,
}))

const feedSourceOptions = [
  ['posts', 'News'],
  ['events', 'Events'],
  ['operations', 'Einsaetze'],
  ['crew', 'Crew'],
  ['equipment', 'Technik'],
  ['faqs', 'FAQ'],
] as const

const commonLinkSuggestions = [
  {
    description: 'Öffentliche Kontaktmöglichkeiten und Ansprechpartner.',
    href: '/kontakt',
    label: 'Kontakt',
  },
  {
    description: 'Einsteigen, mitmachen und ehrenamtlich aktiv werden.',
    href: '/mitmachen',
    label: 'Mitmachen',
  },
  {
    description: 'Aktuelle Termine, Übungen und öffentliche Veranstaltungen.',
    href: '/termine',
    label: 'Termine',
  },
  {
    description: 'Neuigkeiten, Berichte und Einblicke der Wehr.',
    href: '/aktuelles',
    label: 'Aktuelles',
  },
] as const

type BlockTemplate = {
  description: string
  label: string
  value: PageLayoutBlock
}

type LayoutTemplate = {
  blocks: Page['layout']
  description: string
  label: string
}

const historyLimit = 40
type WarningLayoutBlock = Extract<PageLayoutBlock, { blockType: 'warnings' }>
type FormLayoutBlock = Extract<PageLayoutBlock, { blockType: 'form' }>
type TechOverviewLayoutBlock = Extract<PageLayoutBlock, { blockType: 'tech-overview' }>
type OperationsLogLayoutBlock = Extract<PageLayoutBlock, { blockType: 'operations-log' }>
type YouTubeLayoutBlock = Extract<PageLayoutBlock, { blockType: 'youtube' }>

function applyWarningPresetSelection(
  block: WarningLayoutBlock,
  preset?: WarningPresetOption | null,
): WarningLayoutBlock {
  if (!preset) {
    return block
  }

  return applyWarningPresetToBlock(block, {
    dwdRegionIds: (preset.dwdRegionIds ?? [])
      .map((entry) => String(entry?.regionId ?? '').trim())
      .filter(Boolean)
      .map((regionId) => ({ regionId })),
    dwdStates: (preset.dwdStates ?? [])
      .map((entry) => String(entry?.state ?? '').trim())
      .filter(Boolean)
      .map((state) => ({ state })),
    forecastUrl: preset.forecastUrl ?? undefined,
    isSystemPreset: preset.isSystemPreset === true,
    key: preset.key,
    label: preset.label,
    ninaArs: preset.ninaArs ?? undefined,
    provider: preset.provider,
    regionLabel: preset.regionLabel ?? preset.label,
    sourceUrl: preset.sourceUrl ?? undefined,
    warningMapUrl: preset.warningMapUrl ?? undefined,
    weatherMapUrl: preset.weatherMapUrl ?? undefined,
    wildfireMapUrl: preset.wildfireMapUrl ?? undefined,
  })
}

export function PageBlockBuilder({
  equipmentOptions = [],
  formOptions = [],
  initialLayout,
  mediaOptions = [],
  warningPresets = [],
}: Props) {
  const [blocks, setBlocks] = useState<Page['layout']>(() => structuredClone(initialLayout))
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [replacementType, setReplacementType] = useState<PageBlockType | ''>('')
  const [past, setPast] = useState<Page['layout'][]>([])
  const [future, setFuture] = useState<Page['layout'][]>([])
  const safeSelectedIndex = blocks.length === 0 ? 0 : Math.min(selectedIndex, blocks.length - 1)
  const selectedBlock = blocks[safeSelectedIndex]
  const liveLayoutJson = useMemo(() => JSON.stringify(blocks, null, 2), [blocks])
  const canUndo = past.length > 0
  const canRedo = future.length > 0
  const normalizedWarningPresets = warningPresets.map((preset) => ({
    dwdRegionIds: (preset.dwdRegionIds ?? [])
      .map((entry) => String(entry?.regionId ?? '').trim())
      .filter(Boolean)
      .map((regionId) => ({ regionId })),
    dwdStates: (preset.dwdStates ?? [])
      .map((entry) => String(entry?.state ?? '').trim())
      .filter(Boolean)
      .map((state) => ({ state })),
    forecastUrl: preset.forecastUrl ?? undefined,
    isSystemPreset: preset.isSystemPreset === true,
    key: preset.key,
    label: preset.label,
    ninaArs: preset.ninaArs ?? undefined,
    provider: preset.provider,
    regionLabel: preset.regionLabel ?? undefined,
    sourceUrl: preset.sourceUrl ?? undefined,
    warningMapUrl: preset.warningMapUrl ?? undefined,
    weatherMapUrl: preset.weatherMapUrl ?? undefined,
    wildfireMapUrl: preset.wildfireMapUrl ?? undefined,
  }))
  const selectedTemplates = selectedBlock
    ? getBlockTemplates(selectedBlock.blockType, normalizedWarningPresets)
    : []
  const layoutTemplates = getLayoutTemplates(normalizedWarningPresets)
  const pageGuidance = getPageGuidance(blocks, normalizedWarningPresets)

  function pushHistory(current: Page['layout']) {
    setPast((existing) => [...existing.slice(-(historyLimit - 1)), structuredClone(current)])
    setFuture([])
  }

  function commitBlocks(next: Page['layout'], nextSelectedIndex?: number) {
    pushHistory(blocks)
    setBlocks(next)
    setSelectedIndex(() => {
      if (typeof nextSelectedIndex === 'number') {
        return next.length === 0 ? 0 : Math.max(0, Math.min(nextSelectedIndex, next.length - 1))
      }

      return next.length === 0 ? 0 : Math.max(0, Math.min(safeSelectedIndex, next.length - 1))
    })
  }

  function addBlock(type: PageBlockType) {
    const block = createDefaultPageBlock(type)
    const next = [...blocks, block]
    commitBlocks(next, next.length - 1)
  }

  function insertBlock(atIndex: number, type: PageBlockType) {
    const block = createDefaultPageBlock(type)
    const next = [...blocks]
    next.splice(Math.max(0, Math.min(atIndex, next.length)), 0, block)
    commitBlocks(next, atIndex)
  }

  function updateBlock(index: number, updater: (block: PageLayoutBlock) => PageLayoutBlock) {
    commitBlocks(
      blocks.map((block, blockIndex) => (blockIndex === index ? updater(block) : block)),
      index,
    )
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= blocks.length) {
      return
    }

    const next = [...blocks]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    commitBlocks(next, targetIndex)
  }

  function removeBlock(index: number) {
    const next = blocks.filter((_, blockIndex) => blockIndex !== index)
    commitBlocks(next, Math.max(0, Math.min(index - 1, next.length - 1)))
  }

  function duplicateBlock(index: number) {
    const source = blocks[index]
    const clone = structuredClone(source) as PageLayoutBlock
    delete clone.id
    delete clone.blockName
    const next = [...blocks]
    next.splice(index + 1, 0, clone)
    commitBlocks(next, index + 1)
  }

  function replaceBlock(index: number, type: PageBlockType) {
    updateBlock(index, (current) => {
      const next = createDefaultPageBlock(type)
      if (current.blockName) {
        next.blockName = current.blockName
      }
      return next
    })
    setReplacementType('')
  }

  function applyTemplate(index: number, template: BlockTemplate) {
    updateBlock(index, (current) => {
      const next = structuredClone(template.value)
      if (current.blockName) {
        next.blockName = current.blockName
      }
      return next
    })
  }

  function applyLayoutTemplate(template: LayoutTemplate) {
    commitBlocks(structuredClone(template.blocks), 0)
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= blocks.length ||
      toIndex >= blocks.length
    ) {
      return
    }

    const next = [...blocks]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    commitBlocks(next, toIndex)
  }

  function undo() {
    if (!canUndo) return
    const previous = past[past.length - 1]
    setPast((existing) => existing.slice(0, -1))
    setFuture((existing) => [structuredClone(blocks), ...existing])
    setBlocks(previous)
    setSelectedIndex((current) => Math.min(current, Math.max(previous.length - 1, 0)))
  }

  function redo() {
    if (!canRedo) return
    const next = future[0]
    setFuture((existing) => existing.slice(1))
    setPast((existing) => [...existing.slice(-(historyLimit - 1)), structuredClone(blocks)])
    setBlocks(next)
    setSelectedIndex((current) => Math.min(current, Math.max(next.length - 1, 0)))
  }

  return (
    <div className="grid gap-6">
      <section className="ff-manage-panel grid gap-6 xl:grid-cols-[19rem_minmax(0,1.2fr)_25rem]">
        <div className="grid gap-3 xl:sticky xl:top-6 xl:self-start">
          <div>
            <p className="ff-kicker">Block-Palette</p>
            <h3 className="text-2xl">Neue Abschnitte einfuegen</h3>
            <p className="text-sm text-neutral-600">
              Die Palette arbeitet direkt mit den vorhandenen Trustred-Bloecken und schreibt spaeter
              wieder in `pages.layout` zurueck.
            </p>
          </div>
          {blockPalette.map((entry) => (
            <button
              className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--brand-500)] hover:bg-white"
              key={entry.type}
              onClick={() => addBlock(entry.type)}
              type="button"
            >
              <strong className="block text-sm uppercase tracking-[0.08em] text-neutral-900">
                {entry.label}
              </strong>
              <span className="mt-2 block text-sm text-neutral-600">{entry.description}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="ff-kicker">Canvas</p>
              <h3 className="text-2xl">Seitenaufbau</h3>
              <p className="text-sm text-neutral-600">
                Waehle einen Block aus, verschiebe ihn in der Reihenfolge oder dupliziere ihn fuer
                aehnliche Abschnitte.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="ff-btn-ghost min-h-9 px-3"
                disabled={!canUndo}
                onClick={undo}
                type="button"
              >
                Undo
              </button>
              <button
                className="ff-btn-ghost min-h-9 px-3"
                disabled={!canRedo}
                onClick={redo}
                type="button"
              >
                Redo
              </button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
            <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                Seitenvorlagen
              </p>
              <div className="mt-3 grid gap-2">
                {layoutTemplates.map((template) => (
                  <button
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition hover:border-[var(--brand-500)] hover:bg-white"
                    key={template.label}
                    onClick={() => applyLayoutTemplate(template)}
                    type="button"
                  >
                    <strong className="block text-sm text-neutral-900">{template.label}</strong>
                    <span className="mt-1 block text-xs leading-5 text-neutral-600">
                      {template.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <LayoutGuidancePanel issues={pageGuidance} />
          </div>
          {blocks.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
              Noch keine Bloecke vorhanden. Fuege links den ersten Abschnitt hinzu.
            </div>
          ) : (
            <div className="grid gap-3">
              <InsertBlockMenu onInsert={(type) => insertBlock(0, type)} />
              {blocks.map((block, index) => {
                const isSelected = index === safeSelectedIndex
                const validationIssues = getBlockValidationIssues(block, normalizedWarningPresets)

                return (
                  <div className="grid gap-3" key={block.id ?? `${block.blockType}-${index}`}>
                    <div
                      className={`rounded-[1.2rem] border p-4 transition ${
                        dragOverIndex === index
                          ? 'ring-2 ring-[var(--brand-500)] ring-offset-2'
                          : ''
                      } ${
                        isSelected
                          ? 'border-[var(--brand-500)] bg-rose-50/70 shadow-[0_12px_30px_rgba(135,29,51,0.12)]'
                          : 'border-neutral-200 bg-white'
                      }`}
                      draggable
                      onDragEnd={() => {
                        setDraggedIndex(null)
                        setDragOverIndex(null)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragOverIndex(index)
                      }}
                      onDragStart={() => {
                        setDraggedIndex(index)
                        setDragOverIndex(index)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        if (draggedIndex !== null) {
                          reorderBlocks(draggedIndex, index)
                        }
                        setDraggedIndex(null)
                        setDragOverIndex(null)
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setSelectedIndex(index)}
                          type="button"
                        >
                          <p className="ff-pill">Block {index + 1}</p>
                          <h4 className="mt-3 text-xl">{pageBlockLabels[block.blockType]}</h4>
                          <p className="mt-2 text-sm text-neutral-600">{summarizeBlock(block)}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                              Drag & Drop aktiv
                            </p>
                            {validationIssues.length > 0 ? (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                                {validationIssues.length} Hinweis
                                {validationIssues.length === 1 ? '' : 'e'}
                              </span>
                            ) : (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                                Vollstaendig
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="ff-btn-ghost min-h-9 px-3"
                            disabled={index === 0}
                            onClick={(event) => {
                              event.stopPropagation()
                              moveBlock(index, -1)
                            }}
                            type="button"
                          >
                            Hoch
                          </button>
                          <button
                            className="ff-btn-ghost min-h-9 px-3"
                            disabled={index === blocks.length - 1}
                            onClick={(event) => {
                              event.stopPropagation()
                              moveBlock(index, 1)
                            }}
                            type="button"
                          >
                            Runter
                          </button>
                          <button
                            className="ff-btn-ghost min-h-9 px-3"
                            onClick={(event) => {
                              event.stopPropagation()
                              duplicateBlock(index)
                            }}
                            type="button"
                          >
                            Duplizieren
                          </button>
                          <button
                            className="ff-btn-ghost min-h-9 px-3"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeBlock(index)
                            }}
                            type="button"
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>
                    </div>
                    <InsertBlockMenu onInsert={(type) => insertBlock(index + 1, type)} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 xl:sticky xl:top-6 xl:self-start">
          <div>
            <p className="ff-kicker">Inspector</p>
            <h3 className="text-2xl">Block-Details</h3>
            <p className="text-sm text-neutral-600">
              Die rechte Spalte bearbeitet immer den aktuell ausgewaehlten Block aus dem Canvas.
            </p>
          </div>
          {selectedBlock ? (
            <div className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <p className="ff-pill">{pageBlockLabels[selectedBlock.blockType]}</p>
              <div className="mt-4 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Block-Aktionen
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    className="ff-input"
                    onChange={(event) =>
                      setReplacementType(event.target.value as PageBlockType | '')
                    }
                    value={replacementType}
                  >
                    <option value="">Blocktyp ersetzen...</option>
                    {blockPalette.map((entry) => (
                      <option key={`replace-${entry.type}`} value={entry.type}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="ff-btn-ghost min-h-10 px-4"
                    disabled={!replacementType}
                    onClick={() =>
                      replacementType && replaceBlock(safeSelectedIndex, replacementType)
                    }
                    type="button"
                  >
                    Ersetzen
                  </button>
                </div>
                {selectedTemplates.length > 0 ? (
                  <div className="grid gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                      Vorlagen
                    </p>
                    {selectedTemplates.map((template) => (
                      <button
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition hover:border-[var(--brand-500)] hover:bg-white"
                        key={`${selectedBlock.blockType}-${template.label}`}
                        onClick={() => applyTemplate(safeSelectedIndex, template)}
                        type="button"
                      >
                        <strong className="block text-sm text-neutral-900">{template.label}</strong>
                        <span className="mt-1 block text-xs leading-5 text-neutral-600">
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <ValidationPanel block={selectedBlock} warningPresets={normalizedWarningPresets} />
              <div className="mt-4">
                <InspectorFields
                  block={selectedBlock}
                  equipmentOptions={equipmentOptions}
                  formOptions={formOptions}
                  index={safeSelectedIndex}
                  mediaOptions={mediaOptions}
                  warningPresets={normalizedWarningPresets}
                  updateBlock={updateBlock}
                />
              </div>
              <div className="mt-6 rounded-[1.2rem] border border-neutral-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Schnellvorschau
                </p>
                <div className="mt-3">
                  {renderBlockPreview(
                    selectedBlock,
                    normalizedWarningPresets,
                    formOptions,
                    equipmentOptions,
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
              Waehle links einen Block aus, um seine Inhalte zu bearbeiten.
            </div>
          )}
        </div>
      </section>

      <section className="ff-card grid gap-4">
        <div>
          <p className="ff-kicker">Erweitert</p>
          <h3 className="text-2xl">Layout JSON nur fuer Sonderfaelle</h3>
          <p className="text-sm text-neutral-600">
            Im Normalfall arbeitet der Builder direkt mit den Trustred-Bloecken. Das Feld unten
            bleibt nur als gezielte Notfallspur fuer komplexe Sonderanpassungen.
          </p>
        </div>
        <details className="rounded-[1.2rem] border border-neutral-200 bg-neutral-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-700">
            Aktuelles Builder-Layout als JSON anzeigen
          </summary>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs leading-6 text-white">
            {liveLayoutJson}
          </pre>
        </details>
        <details className="rounded-[1.2rem] border border-amber-200 bg-amber-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-amber-900">
            JSON Override nur als letzte Option öffnen
          </summary>
          <div className="mt-4 grid gap-3">
            <p className="text-sm leading-7 text-amber-950">
              Erst Blocktyp ersetzen, Vorlagen anwenden oder die strukturierten Felder im Inspector
              nutzen. Nur wenn das bewusst nicht ausreicht, sollte hier ein vollständiges
              Layout-Override hinterlegt werden.
            </p>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Layout JSON Override
              <textarea
                className="ff-input min-h-40 font-mono text-xs"
                name="layoutRawOverride"
                placeholder="Nur ausfuellen, wenn du das Layout bewusst als JSON ueberschreiben willst."
                rows={14}
              />
            </label>
          </div>
        </details>
      </section>

      <HiddenBuilderInputs blocks={blocks} />
    </div>
  )
}

function HiddenBuilderInputs({ blocks }: { blocks: Page['layout'] }) {
  return (
    <>
      <input name="layout.count" type="hidden" value={blocks.length} />
      {blocks.map((block, index) => (
        <BlockHiddenInputs
          block={block}
          index={index}
          key={`hidden-${block.id ?? `${block.blockType}-${index}`}`}
        />
      ))}
    </>
  )
}

function InsertBlockMenu({ onInsert }: { onInsert: (type: PageBlockType) => void }) {
  return (
    <details className="rounded-[1.1rem] border border-dashed border-neutral-300 bg-neutral-50/80 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-neutral-700">
        Block hier einfuegen
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {blockPalette.map((entry) => (
          <button
            className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm transition hover:border-[var(--brand-500)]"
            key={`insert-${entry.type}`}
            onClick={() => onInsert(entry.type)}
            type="button"
          >
            <strong className="block text-neutral-900">{entry.label}</strong>
            <span className="mt-1 block text-xs leading-5 text-neutral-600">
              {entry.description}
            </span>
          </button>
        ))}
      </div>
    </details>
  )
}

function BlockHiddenInputs({ block, index }: { block: PageLayoutBlock; index: number }) {
  return (
    <>
      <input name={`layout.${index}.blockType`} type="hidden" value={block.blockType} />
      <input
        name={`layout.${index}.blockName`}
        type="hidden"
        value={String(block.blockName ?? '')}
      />
      <input name={`layout.${index}.id`} type="hidden" value={String(block.id ?? '')} />
      <input name={`layout.${index}.position`} type="hidden" value={index + 1} />

      {block.blockType === 'hero' ? (
        <>
          <input
            name={`layout.${index}.eyebrow`}
            type="hidden"
            value={String(block.eyebrow ?? '')}
          />
          <input name={`layout.${index}.headline`} type="hidden" value={block.headline} />
          <input name={`layout.${index}.copy`} type="hidden" value={block.copy} />
          <input
            name={`layout.${index}.primaryActionLabel`}
            type="hidden"
            value={block.primaryActionLabel}
          />
          <input
            name={`layout.${index}.primaryActionHref`}
            type="hidden"
            value={block.primaryActionHref}
          />
          <input
            name={`layout.${index}.secondaryActionLabel`}
            type="hidden"
            value={String(block.secondaryActionLabel ?? '')}
          />
          <input
            name={`layout.${index}.secondaryActionHref`}
            type="hidden"
            value={String(block.secondaryActionHref ?? '')}
          />
          <input
            name={`layout.${index}.heroImage`}
            type="hidden"
            value={String(toRelationId(block.heroImage) ?? '')}
          />
        </>
      ) : null}

      {block.blockType === 'stats' ? (
        <>
          <input
            name={`layout.${index}.items.count`}
            type="hidden"
            value={block.items?.length ?? 0}
          />
          {(block.items ?? []).map((item, itemIndex) => (
            <FragmentInputs
              entries={[
                [`layout.${index}.items.${itemIndex}.value`, item.value],
                [`layout.${index}.items.${itemIndex}.label`, item.label],
              ]}
              key={`stats-item-${index}-${itemIndex}`}
            />
          ))}
        </>
      ) : null}

      {block.blockType === 'rich-text' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.copy`, block.copy],
          ]}
        />
      ) : null}

      {block.blockType === 'link-grid' ? (
        <>
          <input
            name={`layout.${index}.eyebrow`}
            type="hidden"
            value={String(block.eyebrow ?? '')}
          />
          <input name={`layout.${index}.headline`} type="hidden" value={block.headline} />
          <input
            name={`layout.${index}.links.count`}
            type="hidden"
            value={block.links?.length ?? 0}
          />
          {(block.links ?? []).map((link, linkIndex) => (
            <FragmentInputs
              entries={[
                [`layout.${index}.links.${linkIndex}.label`, link.label],
                [`layout.${index}.links.${linkIndex}.href`, link.href],
                [`layout.${index}.links.${linkIndex}.description`, String(link.description ?? '')],
              ]}
              key={`link-grid-${index}-${linkIndex}`}
            />
          ))}
        </>
      ) : null}

      {block.blockType === 'feed' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.source`, block.source],
            [`layout.${index}.limit`, String(block.limit)],
            [`layout.${index}.intro`, String(block.intro ?? '')],
          ]}
        />
      ) : null}

      {block.blockType === 'banner' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.label`, String(block.label ?? '')],
            [`layout.${index}.title`, block.title],
            [`layout.${index}.text`, block.text],
            [`layout.${index}.primaryLabel`, block.primaryLabel],
            [`layout.${index}.primaryHref`, block.primaryHref],
            [`layout.${index}.secondaryLabel`, String(block.secondaryLabel ?? '')],
            [`layout.${index}.secondaryHref`, String(block.secondaryHref ?? '')],
          ]}
        />
      ) : null}

      {block.blockType === 'warnings' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.provider`, block.provider],
            [`layout.${index}.presetKey`, String(block.presetKey ?? '')],
            [`layout.${index}.intro`, String(block.intro ?? '')],
            [`layout.${index}.regionLabel`, String(block.regionLabel ?? '')],
            [
              `layout.${index}.dwdRegionIds`,
              (block.dwdRegionIds ?? [])
                .map((entry) => String(entry.regionId ?? ''))
                .filter(Boolean)
                .join('\n'),
            ],
            [
              `layout.${index}.dwdStates`,
              (block.dwdStates ?? [])
                .map((entry) => String(entry.state ?? ''))
                .filter(Boolean)
                .join('\n'),
            ],
            [`layout.${index}.forecastUrl`, String(block.forecastUrl ?? '')],
            [`layout.${index}.warningMapUrl`, String(block.warningMapUrl ?? '')],
            [`layout.${index}.weatherMapUrl`, String(block.weatherMapUrl ?? '')],
            [`layout.${index}.wildfireMapUrl`, String(block.wildfireMapUrl ?? '')],
            [`layout.${index}.showWeatherMap`, String(Boolean(block.showWeatherMap))],
            [`layout.${index}.showWildfireMap`, String(Boolean(block.showWildfireMap))],
            [`layout.${index}.ninaArs`, String(block.ninaArs ?? '')],
            [`layout.${index}.ninaPresetKey`, String(block.ninaPresetKey ?? '')],
            [`layout.${index}.sourceUrl`, String(block.sourceUrl ?? '')],
          ]}
        />
      ) : null}

      {block.blockType === 'form' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.intro`, String(block.intro ?? '')],
            [`layout.${index}.formMode`, String(block.formMode ?? 'preset')],
            [`layout.${index}.presetKey`, String(block.presetKey ?? 'contact')],
            [`layout.${index}.form`, String(toRelationId(block.form) ?? '')],
            [`layout.${index}.successMessage`, String(block.successMessage ?? '')],
          ]}
        />
      ) : null}

      {block.blockType === 'tech-details' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.intro`, String(block.intro ?? '')],
            [`layout.${index}.equipment`, String(toRelationId(block.equipment) ?? '')],
            [`layout.${index}.showCompartments`, String(Boolean(block.showCompartments !== false))],
            [`layout.${index}.showHighlights`, String(Boolean(block.showHighlights !== false))],
          ]}
        />
      ) : null}

      {block.blockType === 'tech-overview' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.intro`, String(block.intro ?? '')],
            [
              `layout.${index}.featuredEquipment`,
              String(toRelationId(block.featuredEquipment) ?? ''),
            ],
            [`layout.${index}.showStats`, String(Boolean(block.showStats !== false))],
            [
              `layout.${index}.showFeaturedProfile`,
              String(Boolean(block.showFeaturedProfile !== false)),
            ],
            [`layout.${index}.maxItems`, String(block.maxItems ?? 12)],
          ]}
        />
      ) : null}

      {block.blockType === 'operations-log' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.intro`, String(block.intro ?? '')],
            [`layout.${index}.showStats`, String(Boolean(block.showStats !== false))],
            [`layout.${index}.showFilters`, String(Boolean(block.showFilters !== false))],
            [`layout.${index}.maxItems`, String(block.maxItems ?? 100)],
          ]}
        />
      ) : null}

      {block.blockType === 'youtube' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.eyebrow`, String(block.eyebrow ?? '')],
            [`layout.${index}.headline`, block.headline],
            [`layout.${index}.intro`, String(block.intro ?? '')],
            [`layout.${index}.videoId`, String(block.videoId ?? '')],
          ]}
        />
      ) : null}

      {block.blockType === 'html' ? (
        <FragmentInputs
          entries={[
            [`layout.${index}.label`, block.label],
            [`layout.${index}.html`, block.html],
          ]}
        />
      ) : null}
    </>
  )
}

function FragmentInputs({ entries }: { entries: Array<[string, string]> }) {
  return (
    <>
      {entries.map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
    </>
  )
}

function InspectorFields({
  block,
  equipmentOptions,
  formOptions,
  index,
  mediaOptions,
  updateBlock,
  warningPresets,
}: {
  block: PageLayoutBlock
  equipmentOptions: NonNullable<Props['equipmentOptions']>
  formOptions: NonNullable<Props['formOptions']>
  index: number
  mediaOptions: NonNullable<Props['mediaOptions']>
  updateBlock: (index: number, updater: (block: PageLayoutBlock) => PageLayoutBlock) => void
  warningPresets: WarningPresetOption[]
}) {
  const blockNameField = (
    <Field
      label="Interner Blockname"
      value={String(block.blockName ?? '')}
      onChange={(value) =>
        updateBlock(index, (current) => ({ ...current, blockName: value || undefined }))
      }
    />
  )

  if (block.blockType === 'hero') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Copy"
          rows={5}
          value={block.copy}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, copy: value }))}
        />
        <Field
          label="Primary Action Label"
          value={block.primaryActionLabel}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, primaryActionLabel: value }))
          }
        />
        <Field
          label="Primary Action Href"
          value={block.primaryActionHref}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, primaryActionHref: value }))
          }
        />
        <Field
          label="Secondary Action Label"
          value={String(block.secondaryActionLabel ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              secondaryActionLabel: value || undefined,
            }))
          }
        />
        <Field
          label="Secondary Action Href"
          value={String(block.secondaryActionHref ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              secondaryActionHref: value || undefined,
            }))
          }
        />
        <MediaSelectField
          browseHref="/manage/media"
          hint="Hero-Bilder wirken auf öffentlichen Seiten am stärksten, wenn sie bereits in der Mediathek sauber kategorisiert sind."
          label="Hero-Bild"
          options={mediaOptions}
          uploadFields={{
            altName: `layout.${index}.heroImageUploadAlt`,
            captionName: `layout.${index}.heroImageUploadCaption`,
            fileName: `layout.${index}.heroImageUpload`,
            label: 'Oder neues Hero-Bild hochladen',
          }}
          value={String(toRelationId(block.heroImage) ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              heroImage: value ? Number.parseInt(value, 10) : undefined,
            }))
          }
        />
      </div>
    )
  }

  if (block.blockType === 'stats') {
    const items = block.items ?? []

    return (
      <div className="grid gap-4">
        {blockNameField}
        {items.map((item, itemIndex) => (
          <div
            className="rounded-xl border border-neutral-200 bg-white p-4"
            key={`stats-inspector-${itemIndex}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <strong className="text-sm uppercase tracking-[0.08em] text-neutral-700">
                Kennzahl {itemIndex + 1}
              </strong>
              <div className="flex flex-wrap gap-2">
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={itemIndex === 0}
                  onClick={() =>
                    updateBlock(index, (current) => {
                      if (current.blockType !== 'stats') return current
                      const next = [...(current.items ?? [])]
                      const [moved] = next.splice(itemIndex, 1)
                      next.splice(itemIndex - 1, 0, moved)
                      return { ...current, items: next }
                    })
                  }
                  type="button"
                >
                  Hoch
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={itemIndex === items.length - 1}
                  onClick={() =>
                    updateBlock(index, (current) => {
                      if (current.blockType !== 'stats') return current
                      const next = [...(current.items ?? [])]
                      const [moved] = next.splice(itemIndex, 1)
                      next.splice(itemIndex + 1, 0, moved)
                      return { ...current, items: next }
                    })
                  }
                  type="button"
                >
                  Runter
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  onClick={() =>
                    updateBlock(index, (current) => ({
                      ...current,
                      items:
                        (current.blockType === 'stats' ? current.items : [])?.filter(
                          (_, entryIndex) => entryIndex !== itemIndex,
                        ) ?? [],
                    }))
                  }
                  type="button"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <div className="ff-form-grid">
              <Field
                label="Wert"
                value={item.value}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    items:
                      current.blockType === 'stats'
                        ? (current.items?.map((entry, entryIndex) =>
                            entryIndex === itemIndex ? { ...entry, value } : entry,
                          ) ?? [])
                        : [],
                  }))
                }
              />
              <Field
                label="Label"
                value={item.label}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    items:
                      current.blockType === 'stats'
                        ? (current.items?.map((entry, entryIndex) =>
                            entryIndex === itemIndex ? { ...entry, label: value } : entry,
                          ) ?? [])
                        : [],
                  }))
                }
              />
            </div>
          </div>
        ))}
        <button
          className="ff-btn-accent w-full"
          onClick={() =>
            updateBlock(index, (current) => ({
              ...current,
              items: [
                ...(current.blockType === 'stats' ? (current.items ?? []) : []),
                { label: 'Neue Kennzahl', value: '0' },
              ],
            }))
          }
          type="button"
        >
          Kennzahl hinzufuegen
        </button>
      </div>
    )
  }

  if (block.blockType === 'rich-text') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Copy"
          rows={6}
          value={block.copy}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, copy: value }))}
        />
      </div>
    )
  }

  if (block.blockType === 'link-grid') {
    const links = block.links ?? []

    return (
      <div className="grid gap-4">
        <div className="ff-form-grid">
          {blockNameField}
          <Field
            label="Eyebrow"
            value={String(block.eyebrow ?? '')}
            onChange={(value) =>
              updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
            }
          />
          <Field
            label="Headline"
            value={block.headline}
            onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
          />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            Schnellbausteine
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {commonLinkSuggestions.map((suggestion) => (
              <button
                className="ff-btn-ghost min-h-9 px-3"
                key={suggestion.href}
                onClick={() =>
                  updateBlock(index, (current) => ({
                    ...current,
                    links: [
                      ...(current.blockType === 'link-grid' ? (current.links ?? []) : []),
                      { ...suggestion },
                    ],
                  }))
                }
                type="button"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
        {links.map((link, linkIndex) => (
          <div
            className="rounded-xl border border-neutral-200 bg-white p-4"
            key={`link-inspector-${linkIndex}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <strong className="text-sm uppercase tracking-[0.08em] text-neutral-700">
                Link {linkIndex + 1}
              </strong>
              <div className="flex flex-wrap gap-2">
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={linkIndex === 0}
                  onClick={() =>
                    updateBlock(index, (current) => {
                      if (current.blockType !== 'link-grid') return current
                      const next = [...(current.links ?? [])]
                      const [moved] = next.splice(linkIndex, 1)
                      next.splice(linkIndex - 1, 0, moved)
                      return { ...current, links: next }
                    })
                  }
                  type="button"
                >
                  Hoch
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  disabled={linkIndex === links.length - 1}
                  onClick={() =>
                    updateBlock(index, (current) => {
                      if (current.blockType !== 'link-grid') return current
                      const next = [...(current.links ?? [])]
                      const [moved] = next.splice(linkIndex, 1)
                      next.splice(linkIndex + 1, 0, moved)
                      return { ...current, links: next }
                    })
                  }
                  type="button"
                >
                  Runter
                </button>
                <button
                  className="ff-btn-ghost min-h-9 px-3"
                  onClick={() =>
                    updateBlock(index, (current) => ({
                      ...current,
                      links:
                        (current.blockType === 'link-grid' ? current.links : [])?.filter(
                          (_, entryIndex) => entryIndex !== linkIndex,
                        ) ?? [],
                    }))
                  }
                  type="button"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <div className="ff-form-grid">
              <Field
                label="Label"
                value={link.label}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    links:
                      current.blockType === 'link-grid'
                        ? (current.links?.map((entry, entryIndex) =>
                            entryIndex === linkIndex ? { ...entry, label: value } : entry,
                          ) ?? [])
                        : [],
                  }))
                }
              />
              <Field
                label="Href"
                value={link.href}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    links:
                      current.blockType === 'link-grid'
                        ? (current.links?.map((entry, entryIndex) =>
                            entryIndex === linkIndex ? { ...entry, href: value } : entry,
                          ) ?? [])
                        : [],
                  }))
                }
              />
              <Area
                label="Beschreibung"
                rows={4}
                value={String(link.description ?? '')}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    links:
                      current.blockType === 'link-grid'
                        ? (current.links?.map((entry, entryIndex) =>
                            entryIndex === linkIndex
                              ? { ...entry, description: value || undefined }
                              : entry,
                          ) ?? [])
                        : [],
                  }))
                }
              />
            </div>
          </div>
        ))}
        <button
          className="ff-btn-accent w-full"
          onClick={() =>
            updateBlock(index, (current) => ({
              ...current,
              links: [
                ...(current.blockType === 'link-grid' ? (current.links ?? []) : []),
                { description: '', href: '/kontakt', label: 'Neuer Link' },
              ],
            }))
          }
          type="button"
        >
          Link hinzufuegen
        </button>
      </div>
    )
  }

  if (block.blockType === 'feed') {
    const sourceBlueprint = getFeedSourceBlueprint(block.source)

    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <SelectField
          label="Quelle"
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              source: value as Extract<PageLayoutBlock, { blockType: 'feed' }>['source'],
            }))
          }
          options={feedSourceOptions.map(([value, label]) => ({ label, value }))}
          value={block.source}
        />
        <Field
          label="Anzahl"
          type="number"
          value={String(block.limit)}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              limit: clampNumber(value, 1, 12, 3),
            }))
          }
        />
        <Area
          label="Intro"
          rows={5}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            Empfohlene Grundeinstellung
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {sourceBlueprint.eyebrow} · {sourceBlueprint.headline}
          </p>
          <button
            className="ff-btn-ghost mt-3 min-h-9 px-3"
            onClick={() =>
              updateBlock(index, (current) => ({
                ...current,
                eyebrow: sourceBlueprint.eyebrow,
                headline: sourceBlueprint.headline,
                intro: sourceBlueprint.intro,
              }))
            }
            type="button"
          >
            Vorschlag übernehmen
          </button>
        </div>
      </div>
    )
  }

  if (block.blockType === 'banner') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Kicker / Label"
          value={String(block.label ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner' ? { ...current, label: value || undefined } : current,
            )
          }
        />
        <Field
          label="Titel"
          value={block.title}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner' ? { ...current, title: value } : current,
            )
          }
        />
        <Area
          label="Text"
          rows={5}
          value={block.text}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner' ? { ...current, text: value } : current,
            )
          }
        />
        <Field
          label="Primary Label"
          value={block.primaryLabel}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner' ? { ...current, primaryLabel: value } : current,
            )
          }
        />
        <Field
          label="Primary Href"
          value={block.primaryHref}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner' ? { ...current, primaryHref: value } : current,
            )
          }
        />
        <Field
          label="Secondary Label"
          value={String(block.secondaryLabel ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner'
                ? { ...current, secondaryLabel: value || undefined }
                : current,
            )
          }
        />
        <Field
          label="Secondary Href"
          value={String(block.secondaryHref ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) =>
              current.blockType === 'banner'
                ? { ...current, secondaryHref: value || undefined }
                : current,
            )
          }
        />
      </div>
    )
  }

  if (block.blockType === 'warnings') {
    const providerPresets = warningPresets.filter((preset) => preset.provider === block.provider)
    const selectedPreset = providerPresets.find((preset) => preset.key === block.presetKey) ?? null
    const presetOptions = [
      { label: 'Kein Preset / manuell', value: '' },
      ...providerPresets.map((preset) => ({
        label: `${preset.label} (${preset.key})`,
        value: preset.key,
      })),
    ]
    const presetValue =
      block.presetKey && !presetOptions.some((option) => option.value === block.presetKey)
        ? [{ label: `Legacy: ${block.presetKey}`, value: block.presetKey }, ...presetOptions]
        : presetOptions
    const usesPreset = Boolean(selectedPreset)
    const presetModeLabel = selectedPreset
      ? selectedPreset.isSystemPreset
        ? 'System-Preset aktiv: Regionsdaten und Kartenquellen kommen schreibgeschützt aus dem Produktkatalog.'
        : 'Custom Preset aktiv: Änderungen erfolgen zentral unter /manage/warnings und nicht direkt im Block.'
      : 'Kein Preset aktiv: Region, Feed-Filter und Kartenquellen werden direkt im Block gepflegt.'

    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <SelectField
          label="Anbieter"
          onChange={(value) =>
            updateBlock(index, (current) => {
              if (current.blockType !== 'warnings') return current

              return {
                ...current,
                dwdRegionIds: [],
                dwdStates: [],
                forecastUrl: undefined,
                ninaArs: undefined,
                presetKey: '',
                provider: value as WarningLayoutBlock['provider'],
                regionLabel: '',
                sourceUrl: undefined,
                warningMapUrl: undefined,
                weatherMapUrl: undefined,
                wildfireMapUrl: undefined,
              }
            })
          }
          options={[
            { label: 'DWD', value: 'dwd' },
            { label: 'NINA', value: 'nina' },
          ]}
          value={block.provider}
        />
        {presetValue.length > 0 ? (
          <SelectField
            label="Preset"
            onChange={(value) =>
              updateBlock(index, (current) => {
                if (current.blockType !== 'warnings') return current

                if (!value) {
                  return {
                    ...current,
                    presetKey: '',
                  }
                }

                const selectedPreset = providerPresets.find((preset) => preset.key === value)
                return applyWarningPresetSelection(
                  {
                    ...current,
                    presetKey: value,
                  },
                  selectedPreset,
                )
              })
            }
            options={presetValue}
            value={String(block.presetKey ?? '')}
          />
        ) : null}
        <Field
          label="Regionslabel"
          value={String(block.regionLabel ?? '')}
          disabled={usesPreset}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, regionLabel: value || undefined }))
          }
        />
        <Area
          label="Intro"
          rows={5}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            Preset-Modus
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{presetModeLabel}</p>
        </div>
        {providerPresets.length > 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              Preset-Hilfe
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Für {block.provider.toUpperCase()} sind {providerPresets.length} Presets hinterlegt.
              Der empfohlene Ablauf ist: Preset wählen, dann optional Karten ein- oder ausblenden.
            </p>
            <button
              className="ff-btn-ghost mt-3 min-h-9 px-3"
              disabled={!block.presetKey}
              onClick={() => {
                const activePreset = providerPresets.find(
                  (preset) => preset.key === block.presetKey,
                )
                if (!activePreset) return

                updateBlock(index, (current) => {
                  if (current.blockType !== 'warnings') return current

                  return {
                    ...applyWarningPresetSelection(current, activePreset),
                    eyebrow: current.eyebrow || `${activePreset.provider?.toUpperCase()} Live-Lage`,
                    headline: current.headline || activePreset.label,
                    intro:
                      current.intro ||
                      `Automatisch gebundenes Warnmodul für ${activePreset.regionLabel || activePreset.label}.`,
                  }
                })
              }}
              type="button"
            >
              Preset vollständig übernehmen
            </button>
          </div>
        ) : null}
        {block.provider === 'dwd' ? (
          <>
            <SelectField
              label="NINA Zusatzpreset (optional)"
              onChange={(value) =>
                updateBlock(index, (current) =>
                  current.blockType === 'warnings'
                    ? { ...current, ninaPresetKey: value || undefined }
                    : current,
                )
              }
              options={[
                { label: 'Keine NINA-Ergänzung', value: '' },
                ...warningPresets
                  .filter((preset) => preset.provider === 'nina')
                  .map((preset) => ({
                    label: `${preset.label} (${preset.key})`,
                    value: preset.key,
                  })),
              ]}
              value={String(block.ninaPresetKey ?? '')}
            />
            <Area
              label="DWD Bundesländer / Feed-State-Namen"
              rows={4}
              value={(block.dwdStates ?? [])
                .map((entry) => String(entry.state ?? ''))
                .filter(Boolean)
                .join('\n')}
              onChange={(value) =>
                updateBlock(index, (current) => ({
                  ...current,
                  dwdStates: value
                    .split('\n')
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                    .map((state) => ({ state })),
                }))
              }
              disabled={usesPreset}
            />
            <Area
              label="DWD Regions-IDs (optional)"
              rows={4}
              value={(block.dwdRegionIds ?? [])
                .map((entry) => String(entry.regionId ?? ''))
                .filter(Boolean)
                .join('\n')}
              onChange={(value) =>
                updateBlock(index, (current) => ({
                  ...current,
                  dwdRegionIds: value
                    .split('\n')
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                    .map((regionId) => ({ regionId })),
                }))
              }
              disabled={usesPreset}
            />
            <Field
              label="Forecast-URL"
              value={String(block.forecastUrl ?? '')}
              disabled={usesPreset}
              onChange={(value) =>
                updateBlock(index, (current) => ({ ...current, forecastUrl: value || undefined }))
              }
            />
            <Field
              label="Warnkarten-URL"
              value={String(block.warningMapUrl ?? '')}
              disabled={usesPreset}
              onChange={(value) =>
                updateBlock(index, (current) => ({ ...current, warningMapUrl: value || undefined }))
              }
            />
            <Field
              label="Quell-URL"
              value={String(block.sourceUrl ?? '')}
              disabled={usesPreset}
              onChange={(value) =>
                updateBlock(index, (current) => ({ ...current, sourceUrl: value || undefined }))
              }
            />
            <CheckboxField
              checked={block.showWeatherMap === true}
              label="Wetterkarte anzeigen"
              onChange={(checked) =>
                updateBlock(index, (current) => ({ ...current, showWeatherMap: checked }))
              }
            />
            {block.showWeatherMap ? (
              <Field
                label="Wetterkarten-URL"
                value={String(block.weatherMapUrl ?? '')}
                disabled={usesPreset}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    weatherMapUrl: value || undefined,
                  }))
                }
              />
            ) : null}
            <CheckboxField
              checked={block.showWildfireMap === true}
              label="Waldbrandkarte anzeigen"
              onChange={(checked) =>
                updateBlock(index, (current) => ({ ...current, showWildfireMap: checked }))
              }
            />
            {block.showWildfireMap ? (
              <Field
                label="Waldbrandkarten-URL"
                value={String(block.wildfireMapUrl ?? '')}
                disabled={usesPreset}
                onChange={(value) =>
                  updateBlock(index, (current) => ({
                    ...current,
                    wildfireMapUrl: value || undefined,
                  }))
                }
              />
            ) : null}
          </>
        ) : (
          <>
            <Field
              label="NINA ARS"
              value={String(block.ninaArs ?? '')}
              disabled={usesPreset}
              onChange={(value) =>
                updateBlock(index, (current) => ({ ...current, ninaArs: value || undefined }))
              }
            />
            <Field
              label="Quell-URL"
              value={String(block.sourceUrl ?? '')}
              disabled={usesPreset}
              onChange={(value) =>
                updateBlock(index, (current) => ({ ...current, sourceUrl: value || undefined }))
              }
            />
          </>
        )}
      </div>
    )
  }

  if (block.blockType === 'form') {
    const customFormValue = String(toRelationId(block.form) ?? '')

    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Intro"
          rows={5}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <SelectField
          label="Formularquelle"
          onChange={(value) =>
            updateBlock(index, (current) => {
              if (current.blockType !== 'form') return current

              const formMode = value as FormLayoutBlock['formMode']
              const presetKey = (current.presetKey ?? 'contact') as NonNullable<
                FormLayoutBlock['presetKey']
              >

              return {
                ...current,
                form: formMode === 'custom' ? current.form : undefined,
                formMode,
                presetKey,
              }
            })
          }
          options={[
            { label: 'Preset', value: 'preset' },
            { label: 'Custom Form', value: 'custom' },
          ]}
          value={String(block.formMode ?? 'preset')}
        />
        {block.formMode === 'custom' ? (
          <>
            <SelectField
              label="Custom Form"
              onChange={(value) =>
                updateBlock(index, (current) => {
                  if (current.blockType !== 'form') return current

                  return {
                    ...current,
                    form: value ? Number.parseInt(value, 10) : undefined,
                  }
                })
              }
              options={[
                { label: 'Bitte wählen', value: '' },
                ...formOptions.map((option) => ({ label: option.title, value: String(option.id) })),
              ]}
              value={customFormValue}
            />
            <p className="md:col-span-2 text-sm text-neutral-600">
              Formulare werden unter{' '}
              <Link
                className="font-semibold text-[var(--brand-500)] underline underline-offset-4"
                href="/manage/forms"
              >
                /manage/forms
              </Link>{' '}
              aufgebaut und stehen danach hier zur Auswahl bereit.
            </p>
          </>
        ) : (
          <SelectField
            label="Preset"
            onChange={(value) =>
              updateBlock(index, (current) => {
                if (current.blockType !== 'form') return current

                return {
                  ...current,
                  presetKey: value as NonNullable<FormLayoutBlock['presetKey']>,
                }
              })
            }
            options={[
              { label: 'Kontaktformular', value: 'contact' },
              { label: 'Mitmachen Formular', value: 'join' },
            ]}
            value={String(block.presetKey ?? 'contact')}
          />
        )}
        <Area
          label="Success Message Override"
          rows={4}
          value={String(block.successMessage ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, successMessage: value || undefined }))
          }
        />
      </div>
    )
  }

  if (block.blockType === 'tech-details') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Intro"
          rows={5}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <SelectField
          label="Technikprofil"
          onChange={(value) =>
            updateBlock(index, (current) => {
              if (current.blockType !== 'tech-details') return current

              return {
                ...current,
                equipment: value ? Number.parseInt(value, 10) : undefined,
              }
            })
          }
          options={[
            { label: 'Bitte wählen', value: '' },
            ...equipmentOptions.map((option) => ({
              label: option.label,
              value: String(option.id),
            })),
          ]}
          value={String(toRelationId(block.equipment) ?? '')}
        />
        <CheckboxField
          checked={block.showCompartments !== false}
          label="Geräteräume anzeigen"
          onChange={(checked) =>
            updateBlock(index, (current) => ({ ...current, showCompartments: checked }))
          }
        />
        <CheckboxField
          checked={block.showHighlights !== false}
          label="Taktische Schwerpunkte anzeigen"
          onChange={(checked) =>
            updateBlock(index, (current) => ({ ...current, showHighlights: checked }))
          }
        />
      </div>
    )
  }

  if (block.blockType === 'tech-overview') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Intro"
          rows={5}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <SelectField
          label="Hervorgehobenes Technikprofil"
          onChange={(value) =>
            updateBlock(index, (current) => {
              if (current.blockType !== 'tech-overview') return current

              return {
                ...current,
                featuredEquipment: value ? Number.parseInt(value, 10) : undefined,
              }
            })
          }
          options={[
            { label: 'Automatisch erstes Profil verwenden', value: '' },
            ...equipmentOptions.map((option) => ({
              label: option.label,
              value: String(option.id),
            })),
          ]}
          value={String(toRelationId(block.featuredEquipment) ?? '')}
        />
        <Field
          label="Maximale Anzahl öffentlicher Technikprofile"
          type="number"
          value={String(block.maxItems ?? 12)}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              maxItems: clampNumber(value, 1, 48, 12),
            }))
          }
        />
        <CheckboxField
          checked={block.showStats !== false}
          label="Kennzahlen anzeigen"
          onChange={(checked) =>
            updateBlock(index, (current) => ({ ...current, showStats: checked }))
          }
        />
        <CheckboxField
          checked={block.showFeaturedProfile !== false}
          label="Leitprofil hervorheben"
          onChange={(checked) =>
            updateBlock(index, (current) => ({ ...current, showFeaturedProfile: checked }))
          }
        />
      </div>
    )
  }

  if (block.blockType === 'operations-log') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Intro"
          rows={5}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <Field
          label="Maximale Anzahl öffentlicher Einsätze"
          type="number"
          value={String(block.maxItems ?? 100)}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              maxItems: clampNumber(value, 1, 500, 100),
            }))
          }
        />
        <CheckboxField
          checked={block.showStats !== false}
          label="Kennzahlen anzeigen"
          onChange={(checked) =>
            updateBlock(index, (current) => ({ ...current, showStats: checked }))
          }
        />
        <CheckboxField
          checked={block.showFilters !== false}
          label="Filterbare Archivansicht verwenden"
          onChange={(checked) =>
            updateBlock(index, (current) => ({ ...current, showFilters: checked }))
          }
        />
      </div>
    )
  }

  if (block.blockType === 'youtube') {
    return (
      <div className="ff-form-grid">
        {blockNameField}
        <Field
          label="Eyebrow"
          value={String(block.eyebrow ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, eyebrow: value || undefined }))
          }
        />
        <Field
          label="Headline"
          value={block.headline}
          onChange={(value) => updateBlock(index, (current) => ({ ...current, headline: value }))}
        />
        <Area
          label="Intro"
          rows={4}
          value={String(block.intro ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({ ...current, intro: value || undefined }))
          }
        />
        <Field
          label="YouTube URL oder Video-ID"
          value={String(block.videoId ?? '')}
          onChange={(value) =>
            updateBlock(index, (current) => ({
              ...current,
              videoId: parseYouTubeVideoId(value) || value.trim(),
            }))
          }
        />
      </div>
    )
  }

  return (
    <div className="ff-form-grid">
      {blockNameField}
      <Field
        label="Label"
        value={block.label}
        onChange={(value) => updateBlock(index, (current) => ({ ...current, label: value }))}
      />
      <Area
        label="HTML"
        rows={10}
        value={block.html}
        onChange={(value) => updateBlock(index, (current) => ({ ...current, html: value }))}
      />
    </div>
  )
}

function summarizeBlock(block: PageLayoutBlock) {
  if (block.blockType === 'banner') {
    return `${block.title} • ${block.primaryLabel} → ${block.primaryHref}`
  }

  if (block.blockType === 'stats') {
    return `${block.items?.length ?? 0} Kennzahlen`
  }

  if (block.blockType === 'link-grid') {
    return `${block.links?.length ?? 0} Links`
  }

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

  if (block.blockType === 'html') {
    return block.label
  }

  return block.headline
}

function getFeedSourceBlueprint(source: Extract<PageLayoutBlock, { blockType: 'feed' }>['source']) {
  if (source === 'posts') {
    return {
      eyebrow: 'Aktuelles',
      headline: 'Neuigkeiten und Einblicke',
      intro:
        'Aktuelle Beiträge aus Ausbildung, Einsatzgeschehen, Jugend und Öffentlichkeitsarbeit.',
    }
  }

  if (source === 'events') {
    return {
      eyebrow: 'Termine',
      headline: 'Übungen, Aktionen und öffentliche Termine',
      intro:
        'Schnell scanbare Übersicht über anstehende öffentliche Ausbildungs- und Veranstaltungstermine.',
    }
  }

  if (source === 'operations') {
    return {
      eyebrow: 'Einsatzhistorie',
      headline: 'Öffentliche Einsatzübersicht',
      intro: 'Datenschutzkonforme Übersicht der zuletzt freigegebenen Einsätze.',
    }
  }

  if (source === 'crew') {
    return {
      eyebrow: 'Team',
      headline: 'Menschen der Wehr',
      intro: 'Rollen, Qualifikationen und Schwerpunkte unserer Mannschaft in kompakten Profilen.',
    }
  }

  if (source === 'equipment') {
    return {
      eyebrow: 'Technik',
      headline: 'Fahrzeuge und Ausstattung',
      intro: 'Überblick über Fahrzeuge, Funkrufnamen und zentrale technische Merkmale.',
    }
  }

  return {
    eyebrow: 'FAQ',
    headline: 'Häufige Fragen',
    intro:
      'Klar formulierte Antworten auf häufige Fragen rund um Feuerwehr, Vorsorge und Mitmachen.',
  }
}

function getLayoutTemplates(warningPresets: WarningPresetOption[]): LayoutTemplate[] {
  const defaultHomeLayout = structuredClone(defaultHomePage.layout) as Page['layout']
  const normalizedHomeLayout = defaultHomeLayout.map((block) => {
    if (block.blockType !== 'warnings') {
      return block
    }

    const selectedPreset =
      warningPresets.find(
        (preset) => preset.provider === block.provider && preset.key === block.presetKey,
      ) ?? warningPresets.find((preset) => preset.provider === block.provider)

    return selectedPreset ? applyWarningPresetSelection(block, selectedPreset) : block
  })

  return [
    {
      blocks: normalizedHomeLayout,
      description:
        'Komplette Trustred-Startseite mit Hero, Kennzahlen, Warnmodul, Feeds und Kontaktabschluss.',
      label: 'Startseite komplett',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Überblick',
          headline: 'Alles Wichtige auf einen Blick',
          copy: 'Diese kompakte Landingpage eignet sich für neue Themenbereiche, Sonderseiten und schnelle Orientierung mit klarer nächster Aktion.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Kontakt aufnehmen',
          secondaryActionHref: '/aktuelles',
          secondaryActionLabel: 'Aktuelles ansehen',
        },
        {
          blockType: 'rich-text',
          eyebrow: 'Kurz erklärt',
          headline: 'Worum es auf dieser Seite geht',
          copy: 'Nutze diesen Abschnitt für eine verständliche Einordnung, bevor weiterführende Bereiche oder Datensammlungen folgen.',
        },
        {
          blockType: 'link-grid',
          eyebrow: 'Direkt weiter',
          headline: 'Häufige Ziele',
          links: commonLinkSuggestions.map((entry) => ({ ...entry })),
        },
        {
          blockType: 'feed',
          eyebrow: 'Aktuelles',
          headline: 'Neuigkeiten und Hinweise',
          intro: 'Die wichtigsten aktuellen Inhalte dieser Wehr auf einen Blick.',
          limit: 3,
          source: 'posts',
        },
      ],
      description: 'Kurze Landingpage mit Orientierung, Verweisen und einem News-Fenster.',
      label: 'Landing kompakt',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Erreichbarkeit',
          headline: 'Kontakt, Ansprechpartner und wichtige Hinweise',
          copy: 'Ideal für Kontakt-, Service- oder Vorsorgeseiten mit klaren Wegen zur richtigen Stelle.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Kontaktseite öffnen',
          secondaryActionHref: '/faq',
          secondaryActionLabel: 'FAQ ansehen',
        },
        {
          blockType: 'form',
          eyebrow: 'Kontakt',
          formMode: 'preset',
          headline: 'Kontaktformular',
          intro:
            'Allgemeine Fragen, Presse oder Zusammenarbeit laufen hier gebündelt zusammen. In Notfällen gilt immer 112.',
          presetKey: 'contact',
        },
        {
          blockType: 'feed',
          eyebrow: 'Häufig gefragt',
          headline: 'Wichtige Antworten direkt mitgeben',
          intro:
            'Besonders sinnvoll, wenn Besucher häufig dieselben Fragen zu Erreichbarkeit oder Mitgliedschaft haben.',
          limit: 4,
          source: 'faqs',
        },
      ],
      description: 'Kontakt- und Serviceseite mit CTA, Einordnung, Schnellzugriff und FAQ.',
      label: 'Kontakt & Service',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Mitmachen',
          headline: 'Einstieg ins Ehrenamt',
          copy: 'Ideal für Recruiting-Seiten mit klarer Erklärung, aktuellen Terminen und direkter Kontaktaufnahme für Interessierte.',
          primaryActionHref: '/mitmachen',
          primaryActionLabel: 'Interesse senden',
          secondaryActionHref: '/termine',
          secondaryActionLabel: 'Termine ansehen',
        },
        {
          blockType: 'rich-text',
          eyebrow: 'Ablauf',
          headline: 'So gelingt der Einstieg',
          copy: 'Beschreibe hier Kennenlernen, Ausbildung und die ersten Schritte in der Wehr in einer einfachen, verständlichen Sprache.',
        },
        {
          blockType: 'feed',
          eyebrow: 'Termine',
          headline: 'Öffentliche Termine und Übungen',
          intro:
            'Praktisch für Interessierte, die direkt sehen möchten, wann sie die Wehr kennenlernen können.',
          limit: 3,
          source: 'events',
        },
        {
          blockType: 'form',
          eyebrow: 'Interesse',
          formMode: 'preset',
          headline: 'Mitmachen Formular',
          intro:
            'Direkter Einstieg für unverbindliche Anfragen rund um aktive Mitarbeit, Jugend oder unterstützende Rollen.',
          presetKey: 'join',
        },
      ],
      description: 'Mitmachen-Landingpage mit Terminbezug und direktem Formularblock.',
      label: 'Recruiting & Mitmachen',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Technik',
          headline: 'Fahrzeuge und Ausstattung',
          copy: 'Technik, Funkrufnamen und öffentliche Eckdaten lassen sich mit dieser Seitenvorlage vollständig über den visuellen Builder steuern.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Rückfrage stellen',
          secondaryActionHref: '/',
          secondaryActionLabel: 'Zur Startseite',
        },
        {
          blockType: 'tech-overview',
          eyebrow: 'Technikübersicht',
          headline: 'Fahrzeuge und Technikprofile',
          intro:
            'Die Übersicht greift automatisch auf öffentliche Technikprofile zu und zeigt auf Wunsch ein Leitfahrzeug prominent an.',
          maxItems: 12,
          showFeaturedProfile: true,
          showStats: true,
        },
        {
          blockType: 'tech-details',
          eyebrow: 'Technikdetail',
          headline: 'Ausgewähltes Fahrzeug im Detail',
          intro:
            'Optional kann ein einzelnes Fahrzeugprofil zusätzlich prominent innerhalb der Seite eingebunden werden.',
          showCompartments: true,
          showHighlights: true,
        },
      ],
      description:
        'Technikseite mit Übersichtsmodul und vorbereitetem Detailblock für ein hervorgehobenes Fahrzeug.',
      label: 'Technikseite',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Sicherheit',
          headline: 'Warnungen, Verhalten und schnelle Orientierung',
          copy: 'Ideal für Vorsorge- und Sicherheitsthemen mit Lagebild, kompakten Hinweisen und weiterführenden Antworten.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Kontakt',
          secondaryActionHref: '/faq',
          secondaryActionLabel: 'FAQ',
        },
        applyWarningPresetSelection(
          {
            ...createDefaultPageBlock('warnings'),
            eyebrow: 'Lage',
            headline: 'Warnungen und Lage',
            intro:
              'DWD- und NINA-Daten lassen sich über Presets und optionale Karten schnell für die Zielregion zusammenstellen.',
            provider: 'dwd',
          } as WarningLayoutBlock,
          warningPresets.find((preset) => preset.provider === 'dwd') ?? null,
        ),
        {
          blockType: 'rich-text',
          eyebrow: 'Merkblatt',
          headline: 'Was Besucher direkt wissen sollten',
          copy: 'Nutze diesen Abschnitt für Verhaltenshinweise, organisatorische Informationen oder lokale Handlungsempfehlungen bei besonderen Lagen.',
        },
        {
          blockType: 'feed',
          eyebrow: 'FAQ',
          headline: 'Häufige Fragen zur Vorsorge',
          intro:
            'Hilfreich für Seiten, die Warnlage und direkte Alltagsfragen zusammenführen sollen.',
          limit: 4,
          source: 'faqs',
        },
      ],
      description:
        'Sicherheits- und Vorsorgeseite mit Warnlage, erklärendem Text und verknüpften FAQ.',
      label: 'Sicherheit & Lage',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Team',
          headline: 'Menschen, Rollen und Zuständigkeiten',
          copy: 'Diese Vorlage eignet sich für öffentliche Teamseiten, Ansprechpartner oder strukturierte Einblicke in Zuständigkeiten.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Kontakt',
          secondaryActionHref: '/mitmachen',
          secondaryActionLabel: 'Mitmachen',
        },
        {
          blockType: 'feed',
          eyebrow: 'Verzeichnis',
          headline: 'Öffentliche Teamprofile',
          intro:
            'Auf der Teamroute wird dieser Feed automatisch als gruppiertes Verzeichnis statt als generische Kartenwand dargestellt.',
          limit: 8,
          source: 'crew',
        },
        {
          blockType: 'banner',
          label: 'Mitmachen',
          primaryHref: '/mitmachen',
          primaryLabel: 'Mitmachen',
          secondaryHref: '/kontakt',
          secondaryLabel: 'Kontakt',
          text: 'Wer das Team näher kennenlernen möchte, findet hier den direkten Einstieg ins Ehrenamt.',
          title: 'Vom Kennenlernen ins Mitmachen',
        },
      ],
      description:
        'Team- und Ansprechpartnerseite mit route-optimierter Verzeichnisdarstellung und klarer Mitmach-CTA.',
      label: 'Team & Ansprechpartner',
    },
    {
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Einsatzhistorie',
          headline: 'Öffentliche Einsatzübersicht',
          copy: 'Die Operations-Seite nutzt das filterbare Einsatzlog direkt als Seitenblock und bleibt damit komplett im visuellen Builder editierbar.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Kontakt zur Wehr',
          secondaryActionHref: '/',
          secondaryActionLabel: 'Zur Startseite',
        },
        {
          blockType: 'operations-log',
          eyebrow: 'Einsatzlog',
          headline: 'Freigegebene Einsätze',
          intro:
            'Filterbare Einsatzhistorie mit Kennzahlen und Detailverlinkung auf die öffentlichen Einsatzberichte.',
          maxItems: 100,
          showFilters: true,
          showStats: true,
        },
      ],
      description:
        'Einsatzseite mit Hero und dem bisherigen Operations-Archiv als eigenem Seitenblock.',
      label: 'Einsatzübersicht',
    },
  ]
}

function getBlockTemplates(
  type: PageBlockType,
  warningPresets: WarningPresetOption[],
): BlockTemplate[] {
  if (type === 'banner') {
    return [
      {
        description: 'Klassischer CTA für Recruiting und Kontakt.',
        label: 'Mitmachen CTA',
        value: {
          blockType: 'banner',
          label: 'Mitmachen',
          primaryHref: '/mitmachen',
          primaryLabel: 'Mitmachen',
          secondaryHref: '/kontakt',
          secondaryLabel: 'Kontakt zur Wehr',
          text: 'Lerne die Wehr kennen, stelle Fragen und finde den passenden Einstieg in Ausbildung, Öffentlichkeitsarbeit oder aktiven Dienst.',
          title: 'Technik, Teamarbeit und Einsatzbereitschaft direkt erleben',
        },
      },
      {
        description: 'Für News-, FAQ- oder Kontaktseiten mit klarer Nachfolgeaktion.',
        label: 'Kontakt CTA',
        value: {
          blockType: 'banner',
          label: 'Kontakt',
          primaryHref: '/kontakt',
          primaryLabel: 'Kontakt aufnehmen',
          secondaryHref: '/termine',
          secondaryLabel: 'Termine ansehen',
          text: 'Zu Fragen, Veranstaltungen oder Zusammenarbeit kannst du direkt Kontakt aufnehmen oder die nächsten öffentlichen Termine ansehen.',
          title: 'Vom Lesen ins Gespräch',
        },
      },
    ]
  }

  if (type === 'hero') {
    return [
      {
        description: 'Klassischer Startseiten-Einstieg mit Mitmachen-CTA.',
        label: 'Recruiting Hero',
        value: {
          blockType: 'hero',
          eyebrow: 'Ehrenamt',
          headline: 'Mitmachen bei der Feuerwehr',
          copy: 'Du willst Technik, Teamarbeit und Einsatzbereitschaft nicht nur von außen sehen, sondern selbst Teil davon werden? Dann lerne uns direkt bei einem Übungsabend kennen.',
          primaryActionHref: '/mitmachen',
          primaryActionLabel: 'Jetzt mitmachen',
          secondaryActionHref: '/kontakt',
          secondaryActionLabel: 'Fragen klären',
        },
      },
      {
        description: 'Fokussiert auf Erreichbarkeit und schnelle Orientierung.',
        label: 'Kontakt Hero',
        value: {
          blockType: 'hero',
          eyebrow: 'Schneller Draht',
          headline: 'Kontakt und Ansprechpartner',
          copy: 'Hier findest du die wichtigsten Kontaktwege, Hinweise zur Erreichbarkeit und die passenden Ansprechpersonen für allgemeine Fragen rund um die Wehr.',
          primaryActionHref: '/kontakt',
          primaryActionLabel: 'Kontakt öffnen',
          secondaryActionHref: '/aktuelles',
          secondaryActionLabel: 'Aktuelles ansehen',
        },
      },
    ]
  }

  if (type === 'stats') {
    return [
      {
        description: 'Typische Trustred-Kennzahlen für die öffentliche Startkommunikation.',
        label: 'Wehr-Fakten',
        value: {
          blockType: 'stats',
          items: [
            { label: 'Aktive', value: '38' },
            { label: 'Jugend', value: '14' },
            { label: 'Einsätze', value: '112' },
            { label: 'Gründung', value: '1894' },
          ],
        },
      },
    ]
  }

  if (type === 'rich-text') {
    return [
      {
        description: 'Kompakter Infotext mit öffentlicher Einordnung.',
        label: 'Infoblock',
        value: {
          blockType: 'rich-text',
          eyebrow: 'Überblick',
          headline: 'Was Besucher hier finden',
          copy: 'Dieser Abschnitt eignet sich für einen klaren Überblick über Inhalt, Zweck und Einordnung der Seite. Ideal für Begrüßungstexte, Orientierung oder erklärende Hinweise.',
        },
      },
      {
        description: 'Textmodul für Erreichbarkeit, Sicherheit oder Mitmachen.',
        label: 'Kontakt-Hinweis',
        value: {
          blockType: 'rich-text',
          eyebrow: 'Hinweis',
          headline: 'Fragen oder Interesse?',
          copy: 'Für Fragen zu Mitmachen, Öffentlichkeitsarbeit oder Zusammenarbeit erreichst du uns über die Kontaktseite. In Notfällen gilt immer: 112.',
        },
      },
    ]
  }

  if (type === 'link-grid') {
    return [
      {
        description: 'Schnelle Navigation zu den wichtigsten öffentlichen Bereichen.',
        label: 'Schnellzugriff',
        value: {
          blockType: 'link-grid',
          eyebrow: 'Direkt weiter',
          headline: 'Wichtige Bereiche',
          links: commonLinkSuggestions.map((entry) => ({ ...entry })),
        },
      },
    ]
  }

  if (type === 'feed') {
    return feedSourceOptions.map(([source]) => {
      const blueprint = getFeedSourceBlueprint(source)
      return {
        description: blueprint.intro,
        label: `Feed: ${pageBlockLabels.feed} ${blueprint.eyebrow}`,
        value: {
          blockType: 'feed',
          eyebrow: blueprint.eyebrow,
          headline: blueprint.headline,
          intro: blueprint.intro,
          limit: source === 'operations' ? 6 : source === 'faqs' ? 5 : 3,
          source,
        },
      }
    })
  }

  if (type === 'warnings') {
    const dwdPreset = warningPresets.find((preset) => preset.provider === 'dwd')
    const ninaPreset = warningPresets.find((preset) => preset.provider === 'nina')

    return [
      {
        description: 'DWD-Warnmodul mit allgemein formulierter Einleitung.',
        label: 'DWD Warnmodul',
        value: applyWarningPresetSelection(
          {
            ...createDefaultPageBlock('warnings'),
            eyebrow: 'DWD Live-Lage',
            headline: 'Wetter und Warnungen',
            intro: 'Aktuelle Wetter- und Warnlage aus dem ausgewählten DWD-Preset.',
            provider: 'dwd',
          } as WarningLayoutBlock,
          dwdPreset,
        ),
      },
      {
        description: 'NINA-Lageblock für amtliche Warnhinweise.',
        label: 'NINA Warnmodul',
        value: applyWarningPresetSelection(
          {
            ...createDefaultPageBlock('warnings'),
            eyebrow: 'Amtliche Hinweise',
            headline: 'Warnmeldungen und Lagehinweise',
            intro: 'Aktuelle amtliche Warnmeldungen aus dem gewählten NINA-Preset.',
            provider: 'nina',
          } as WarningLayoutBlock,
          ninaPreset,
        ),
      },
    ]
  }

  if (type === 'form') {
    return [
      {
        description: 'Vorkonfigurierter Kontaktblock mit dem Standard-Kontaktformular.',
        label: 'Kontaktformular',
        value: {
          blockType: 'form',
          eyebrow: 'Kontakt',
          formMode: 'preset',
          headline: 'Kontakt zur Wehr',
          intro:
            'Allgemeine Anfragen, Presse oder organisatorische Rückfragen laufen hier gebündelt zusammen.',
          presetKey: 'contact',
        },
      },
      {
        description: 'Mitmachen-Formular für Interessierte mit direktem Einstieg ins Ehrenamt.',
        label: 'Mitmachen Formular',
        value: {
          blockType: 'form',
          eyebrow: 'Mitmachen',
          formMode: 'preset',
          headline: 'Einstieg ins Ehrenamt',
          intro:
            'Wer Interesse hat, kann hier unverbindlich Kontakt aufnehmen und die Wehr kennenlernen.',
          presetKey: 'join',
        },
      },
    ]
  }

  if (type === 'tech-details') {
    return [
      {
        description:
          'Bindet ein einzelnes Technikprofil mit Fakten, Geräteräumen und Einsatzwert ein.',
        label: 'Fahrzeug im Detail',
        value: {
          blockType: 'tech-details',
          eyebrow: 'Technikdetail',
          headline: 'Technik im Detail',
          intro:
            'Dieses Modul zeigt die wichtigsten öffentlichen Informationen zu einem ausgewählten Fahrzeug oder Gerät.',
          showCompartments: true,
          showHighlights: true,
        },
      },
    ]
  }

  if (type === 'tech-overview') {
    return [
      {
        description:
          'Öffentliche Technikseite mit Kennzahlen, Leitprofil und Kartenansicht der weiteren Fahrzeuge.',
        label: 'Technikübersicht',
        value: {
          blockType: 'tech-overview',
          eyebrow: 'Technikübersicht',
          headline: 'Fahrzeuge und Technikprofile',
          intro:
            'Die Übersicht zeigt automatisch alle öffentlichen Technikprofile in der etablierten Trustred-Darstellung.',
          maxItems: 12,
          showFeaturedProfile: true,
          showStats: true,
        } satisfies TechOverviewLayoutBlock,
      },
    ]
  }

  if (type === 'operations-log') {
    return [
      {
        description: 'Filterbares öffentliches Einsatzarchiv mit Kennzahlen und Tabellenansicht.',
        label: 'Einsatzarchiv',
        value: {
          blockType: 'operations-log',
          eyebrow: 'Einsatzlog',
          headline: 'Freigegebene Einsätze',
          intro:
            'Das Einsatzlog nutzt den bisherigen Archivbaustein jetzt direkt als editierbaren Seitenabschnitt.',
          maxItems: 100,
          showFilters: true,
          showStats: true,
        } satisfies OperationsLogLayoutBlock,
      },
    ]
  }

  if (type === 'youtube') {
    return [
      {
        description: 'Datenschutzkonformes YouTube-Embed mit nocookie-Domain und Consent-Gating.',
        label: 'YouTube-Video',
        value: {
          blockType: 'youtube',
          eyebrow: 'Video',
          headline: 'Video-Einblick',
          intro: 'Das Video wird erst nach Zustimmung für externe Medien geladen.',
          videoId: '',
        } satisfies YouTubeLayoutBlock,
      },
    ]
  }

  if (type === 'html') {
    return [
      {
        description: 'Stilisierte Hinweisbox als schnell einsetzbarer Sonderfall.',
        label: 'Hinweisbox',
        value: {
          blockType: 'html',
          label: 'Hinweisbox',
          html: '<div class="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6"><p class="ff-kicker">Hinweis</p><h2>Wichtige Information</h2><p class="mt-4">Nutze diesen Block nur für Sonderdarstellungen, die mit den vorhandenen strukturierten Blöcken nicht sinnvoll abbildbar sind.</p></div>',
        },
      },
      {
        description: 'Zweispaltiger CTA-Sonderfall für Kampagnen oder Aktionen.',
        label: 'CTA Sonderlayout',
        value: {
          blockType: 'html',
          label: 'CTA Sonderlayout',
          html: '<div class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div><p class="ff-kicker">Mitmachen</p><h2>Unterstützung gesucht</h2><p class="mt-4">Dieses Sonderlayout eignet sich für begrenzte Kampagnen oder eine bewusst herausgehobene Aktionsfläche.</p></div><div class="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-6"><p class="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Aktion</p><p class="mt-3">Kontaktdaten, Fristen oder Hinweise lassen sich hier gezielt ergänzen.</p></div></div>',
        },
      },
    ]
  }

  return []
}

function LayoutGuidancePanel({ issues }: { issues: string[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Die Seitenstruktur wirkt stimmig: Einstieg, Orientierung und nächste Schritte sind aktuell
        gut abgedeckt.
      </div>
    )
  }

  return (
    <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
        Layout-Hinweise
      </p>
      <ul className="mt-3 grid gap-2 text-sm text-amber-950">
        {issues.map((issue) => (
          <li key={issue}>- {issue}</li>
        ))}
      </ul>
    </div>
  )
}

function ValidationPanel({
  block,
  warningPresets,
}: {
  block: PageLayoutBlock
  warningPresets: WarningPresetOption[]
}) {
  const issues = getBlockValidationIssues(block, warningPresets)

  if (issues.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Dieser Block ist fuer die aktuellen Pflichtfelder vollstaendig gepflegt.
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
        Offene Hinweise
      </p>
      <ul className="mt-3 grid gap-2 text-sm text-amber-950">
        {issues.map((issue) => (
          <li key={issue}>- {issue}</li>
        ))}
      </ul>
    </div>
  )
}

function getPageGuidance(blocks: Page['layout'], warningPresets: WarningPresetOption[]) {
  const issues: string[] = []

  if (blocks.length === 0) {
    return [
      'Starte mit einer Seitenvorlage oder mindestens einem Hero- beziehungsweise Intro-Block.',
    ]
  }

  const firstBlock = blocks[0]
  const heroBlocks = blocks.filter((block) => block.blockType === 'hero')
  const introBlocks = blocks.filter((block) => block.blockType === 'rich-text')
  const linkGridBlocks = blocks.filter((block) => block.blockType === 'link-grid')
  const htmlBlocks = blocks.filter((block) => block.blockType === 'html')
  const feedBlocks = blocks.filter((block) => block.blockType === 'feed')
  const warningBlocks = blocks.filter((block) => block.blockType === 'warnings')
  const hasStrongCta = blocks.some((block) => {
    if (block.blockType === 'hero') {
      return Boolean(block.primaryActionHref && block.primaryActionLabel)
    }

    if (block.blockType === 'banner') {
      return Boolean(block.primaryHref && block.primaryLabel)
    }

    if (block.blockType === 'link-grid') {
      return (block.links?.length ?? 0) > 0
    }

    return false
  })

  if (firstBlock?.blockType !== 'hero' && firstBlock?.blockType !== 'rich-text') {
    issues.push(
      'Die Seite sollte meist mit Hero oder erklärendem Intro beginnen, nicht direkt mit Feed, HTML oder Warnmodul.',
    )
  }

  if (heroBlocks.length === 0 && introBlocks.length === 0) {
    issues.push(
      'Es fehlt ein klarer Einstieg. Nutze mindestens Hero oder Rich-Text für Orientierung zu Beginn.',
    )
  }

  if (!hasStrongCta) {
    issues.push(
      'Es fehlt ein klarer nächster Schritt. Ergänze Hero-CTA oder Link-Grid für Kontakt, Mitmachen oder weitere Navigation.',
    )
  }

  if (feedBlocks.length >= 3 && introBlocks.length === 0) {
    issues.push(
      'Viele Feed-Blöcke hintereinander wirken technisch. Ergänze mindestens einen erklärenden Textblock dazwischen.',
    )
  }

  if (htmlBlocks.length > 1) {
    issues.push(
      'Mehrere HTML-Sonderblöcke erhöhen Pflegeaufwand. Prüfe, ob Hero, Rich-Text, Link-Grid oder Feed den Zweck bereits abdecken.',
    )
  }

  if (linkGridBlocks.length === 0 && feedBlocks.length === 0) {
    issues.push(
      'Besucher haben aktuell wenig Orientierung für den nächsten Klick. Link-Grid oder Feed schaffen bessere Führung.',
    )
  }

  if (warningBlocks.length > 0) {
    const hasConfiguredWarning = warningBlocks.some(
      (block) =>
        block.blockType === 'warnings' &&
        ((Boolean(block.presetKey) &&
          warningPresets.some(
            (preset) => preset.key === block.presetKey && preset.provider === block.provider,
          )) ||
          (block.provider === 'dwd'
            ? ((block.dwdStates?.length ?? 0) > 0 || (block.dwdRegionIds?.length ?? 0) > 0) &&
              Boolean(block.forecastUrl)
            : Boolean(block.ninaArs))),
    )

    if (!hasConfiguredWarning) {
      issues.push(
        'Warnblöcke sind vorhanden, aber noch nicht sauber mit einem passenden DWD- oder NINA-Preset verbunden.',
      )
    }
  }

  return issues
}

function getBlockValidationIssues(block: PageLayoutBlock, warningPresets: WarningPresetOption[]) {
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

  if (block.blockType === 'tech-details') {
    if (!toRelationId(block.equipment)) {
      issues.push('Es ist noch kein Technikprofil ausgewählt.')
    }
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

function renderBlockPreview(
  block: PageLayoutBlock,
  warningPresets: WarningPresetOption[],
  formOptions: NonNullable<Props['formOptions']>,
  equipmentOptions: NonNullable<Props['equipmentOptions']>,
) {
  if (block.blockType === 'hero') {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-2xl">{block.headline}</h4>
        <p className="mt-3 text-sm leading-7 text-neutral-700">{block.copy}</p>
      </div>
    )
  }

  if (block.blockType === 'stats') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {(block.items ?? []).map((item, index) => (
          <div
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
            key={`preview-stat-${index}`}
          >
            <p className="font-headline text-3xl text-[var(--brand-500)]">{item.value}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-600">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (block.blockType === 'rich-text') {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-2xl">{block.headline}</h4>
        <p className="mt-3 text-sm leading-7 text-neutral-700">{block.copy}</p>
      </div>
    )
  }

  if (block.blockType === 'link-grid') {
    return (
      <div className="grid gap-3">
        <h4 className="text-xl">{block.headline}</h4>
        {(block.links ?? []).slice(0, 3).map((link, index) => (
          <div
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
            key={`preview-link-${index}`}
          >
            <p className="font-semibold text-neutral-900">{link.label}</p>
            <p className="mt-1 text-sm text-neutral-600">{link.description}</p>
          </div>
        ))}
      </div>
    )
  }

  if (block.blockType === 'feed') {
    const feedPreview = getFeedPreviewRows(block.source)

    return (
      <div className="grid gap-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <h4 className="text-xl">{block.headline}</h4>
          <p className="mt-2 text-sm text-neutral-700">
            Quelle: {block.source} · Anzahl: {block.limit}
          </p>
          {block.intro ? (
            <p className="mt-3 text-sm leading-7 text-neutral-600">{block.intro}</p>
          ) : null}
        </div>
        <div className="grid gap-3">
          {feedPreview.slice(0, block.limit).map((entry) => (
            <div
              className="rounded-xl border border-neutral-200 bg-white p-4"
              key={`${block.source}-${entry.title}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="ff-pill">{entry.kicker}</span>
                {entry.meta ? <span className="ff-pill">{entry.meta}</span> : null}
              </div>
              <p className="mt-3 font-semibold text-neutral-900">{entry.title}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{entry.copy}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.blockType === 'banner') {
    return (
      <div className="rounded-xl border border-neutral-200 bg-[linear-gradient(135deg,#0a0a0b,#1f1f24_55%,var(--brand-700))] p-4 text-white">
        {block.label ? <p className="ff-kicker text-rose-200">{block.label}</p> : null}
        <h4 className="text-xl">{block.title}</h4>
        <p className="mt-3 text-sm leading-7 text-neutral-200">{block.text}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
            {block.primaryLabel}
          </span>
          {block.secondaryLabel ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              {block.secondaryLabel}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  if (block.blockType === 'warnings') {
    const selectedPreset = warningPresets.find(
      (preset) => preset.provider === block.provider && preset.key === block.presetKey,
    )

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="text-xl">{block.headline}</h4>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-amber-800">
          {block.provider.toUpperCase()} · {block.regionLabel || block.presetKey || 'Region offen'}
        </p>
        {selectedPreset ? (
          <p className="mt-3 text-sm leading-7 text-neutral-700">
            Aktives Preset: {selectedPreset.label} ({selectedPreset.key})
          </p>
        ) : null}
        {block.provider === 'dwd' ? (
          <>
            <p className="mt-3 text-sm leading-7 text-neutral-700">
              Snapshot aktiv. Wetterkarte: {block.showWeatherMap ? 'Ja' : 'Nein'} · Waldbrandkarte:{' '}
              {block.showWildfireMap ? 'Ja' : 'Nein'}
            </p>
            {block.ninaPresetKey ? (
              <p className="mt-2 text-sm leading-7 text-neutral-700">
                Ergänzt zusätzlich NINA-Preset: {block.ninaPresetKey}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm leading-7 text-neutral-700">
            NINA ARS: {String(block.ninaArs ?? 'nicht gesetzt')}
          </p>
        )}
        {block.intro ? (
          <p className="mt-3 text-sm leading-7 text-neutral-700">{block.intro}</p>
        ) : null}
      </div>
    )
  }

  if (block.blockType === 'form') {
    const customFormTitle =
      formOptions.find((option) => option.id === toRelationId(block.form))?.title ??
      'Kein Formular gewählt'

    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-xl">{block.headline}</h4>
        <p className="mt-2 text-sm text-neutral-700">
          Quelle:{' '}
          {block.formMode === 'custom' ? customFormTitle : `Preset ${block.presetKey ?? 'contact'}`}
        </p>
        {block.intro ? (
          <p className="mt-3 text-sm leading-7 text-neutral-600">{block.intro}</p>
        ) : null}
      </div>
    )
  }

  if (block.blockType === 'tech-details') {
    const equipmentLabel =
      equipmentOptions.find((option) => option.id === toRelationId(block.equipment))?.label ??
      'Kein Technikprofil gewählt'

    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-xl">{block.headline}</h4>
        <p className="mt-2 text-sm text-neutral-700">Technikprofil: {equipmentLabel}</p>
        {block.intro ? (
          <p className="mt-3 text-sm leading-7 text-neutral-600">{block.intro}</p>
        ) : null}
      </div>
    )
  }

  if (block.blockType === 'tech-overview') {
    const equipmentLabel =
      equipmentOptions.find((option) => option.id === toRelationId(block.featuredEquipment))
        ?.label ?? 'Automatisch erstes Profil'

    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-xl">{block.headline}</h4>
        <p className="mt-2 text-sm text-neutral-700">Leitprofil: {equipmentLabel}</p>
        <p className="mt-2 text-sm text-neutral-700">
          Kennzahlen: {block.showStats === false ? 'aus' : 'an'} · Leitprofil:{' '}
          {block.showFeaturedProfile === false ? 'aus' : 'an'} · Maximal {block.maxItems ?? 12}{' '}
          Profile
        </p>
        {block.intro ? (
          <p className="mt-3 text-sm leading-7 text-neutral-600">{block.intro}</p>
        ) : null}
      </div>
    )
  }

  if (block.blockType === 'operations-log') {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-xl">{block.headline}</h4>
        <p className="mt-2 text-sm text-neutral-700">
          Ansicht: {block.showFilters === false ? 'Kompakte Tabelle' : 'Filterbares Archiv'} ·
          Kennzahlen: {block.showStats === false ? 'aus' : 'an'}
        </p>
        <p className="mt-2 text-sm text-neutral-700">
          Maximal sichtbare Einsätze: {block.maxItems ?? 100}
        </p>
        {block.intro ? (
          <p className="mt-3 text-sm leading-7 text-neutral-600">{block.intro}</p>
        ) : null}
      </div>
    )
  }

  if (block.blockType === 'youtube') {
    const videoId = parseYouTubeVideoId(block.videoId)

    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        {block.eyebrow ? <p className="ff-kicker">{block.eyebrow}</p> : null}
        <h4 className="text-xl">{block.headline}</h4>
        {block.intro ? (
          <p className="mt-3 text-sm leading-7 text-neutral-600">{block.intro}</p>
        ) : null}
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
          {videoId ? `Video-ID: ${videoId}` : 'Video-ID fehlt'}
        </p>
      </div>
    )
  }

  if (block.blockType === 'html') {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-950 p-4 text-xs text-white">
        <p className="mb-3 font-semibold uppercase tracking-[0.12em] text-neutral-300">
          {block.label}
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap leading-6 text-neutral-100">
          {block.html}
        </pre>
      </div>
    )
  }

  return null
}

function getFeedPreviewRows(source: Extract<PageLayoutBlock, { blockType: 'feed' }>['source']) {
  if (source === 'posts') {
    return [
      {
        copy: 'Bericht aus Ausbildung, Einsatz oder Öffentlichkeitsarbeit.',
        kicker: 'Aktuelles',
        meta: 'Neu',
        title: 'Beispielbeitrag',
      },
      {
        copy: 'Kurzer Teasertext für die Übersicht.',
        kicker: 'Aktuelles',
        meta: 'Archiv',
        title: 'Weiterer Beitrag',
      },
      {
        copy: 'So wirkt der Feed später auf der Seite.',
        kicker: 'Aktuelles',
        meta: 'Feed',
        title: 'Dritter Beitrag',
      },
    ]
  }

  if (source === 'events') {
    return [
      {
        copy: 'Öffentlicher Termin mit Ort und Zeit.',
        kicker: 'Termin',
        meta: '19:30 Uhr',
        title: 'Übungsabend',
      },
      {
        copy: 'Weitere Veranstaltung aus dem Kalender.',
        kicker: 'Termin',
        meta: 'Sa',
        title: 'Aktionstag',
      },
      {
        copy: 'Sichtbare öffentliche Einträge werden hier zusammengefasst.',
        kicker: 'Termin',
        meta: 'Öffentlich',
        title: 'Workshop',
      },
    ]
  }

  if (source === 'operations') {
    return [
      {
        copy: 'Öffentlicher Kurzbericht eines Einsatzes.',
        kicker: 'Einsatz',
        meta: 'H 1',
        title: 'Baum auf Fahrbahn',
      },
      {
        copy: 'Datenschutzkonforme Einsatzübersicht.',
        kicker: 'Einsatz',
        meta: 'B 1',
        title: 'Kleinbrand',
      },
      {
        copy: 'Verlinkt auf die öffentliche Einsatzdetailseite.',
        kicker: 'Einsatz',
        meta: 'THL',
        title: 'Technische Hilfeleistung',
      },
    ]
  }

  if (source === 'crew') {
    return [
      {
        copy: 'Rolle, Fokus und Kernskills des Teammitglieds.',
        kicker: 'Crew',
        meta: 'Wehrführung',
        title: 'Beispielperson',
      },
      {
        copy: 'Kompakte Teamvorstellung für die Startseite.',
        kicker: 'Crew',
        meta: 'Maschinist',
        title: 'Zweites Profil',
      },
      {
        copy: 'Später erweiterbar mit Portraitbild und Skill-Badges.',
        kicker: 'Crew',
        meta: 'AGT',
        title: 'Drittes Profil',
      },
    ]
  }

  if (source === 'equipment') {
    return [
      {
        copy: 'Fahrzeug oder Gerät mit wichtigsten Fakten.',
        kicker: 'Technik',
        meta: 'TSF-W',
        title: 'Fahrzeugprofil',
      },
      {
        copy: 'Kurzbeschreibung plus zentrale Einsatzdaten.',
        kicker: 'Technik',
        meta: 'Gerät',
        title: 'Ausstattung',
      },
      {
        copy: 'Passt zu den neuen Technikseiten.',
        kicker: 'Technik',
        meta: 'Öffentlich',
        title: 'Weitere Technik',
      },
    ]
  }

  return [
    {
      copy: 'Frage und Antwort in kompakter Übersicht.',
      kicker: 'FAQ',
      meta: 'Antwort',
      title: 'Beispielfrage',
    },
    {
      copy: 'Hilft bei Orientierung und Suchbarkeit.',
      kicker: 'FAQ',
      meta: 'Kategorie',
      title: 'Weitere Frage',
    },
    {
      copy: 'Direktlink zur FAQ-Detailseite möglich.',
      kicker: 'FAQ',
      meta: 'Info',
      title: 'Dritte Frage',
    },
  ]
}

function clampNumber(value: string, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(min, Math.min(max, parsed))
}

function Field({
  disabled = false,
  label,
  onChange,
  type = 'text',
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  type?: React.HTMLInputTypeAttribute
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <input
        className="ff-input"
        defaultValue={value}
        disabled={disabled}
        key={value}
        onBlur={(event) => {
          if (event.currentTarget.value !== value) {
            onChange(event.currentTarget.value)
          }
        }}
        readOnly={disabled}
        type={type}
      />
    </label>
  )
}

function Area({
  disabled = false,
  label,
  onChange,
  rows,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  rows: number
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <textarea
        className="ff-input"
        defaultValue={value}
        disabled={disabled}
        key={value}
        onBlur={(event) => {
          if (event.currentTarget.value !== value) {
            onChange(event.currentTarget.value)
          }
        }}
        readOnly={disabled}
        rows={rows}
      />
    </label>
  )
}

function SelectField({
  disabled = false,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <select
        className="ff-input"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-3 rounded-[1.1rem] border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-semibold text-neutral-700">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  )
}
