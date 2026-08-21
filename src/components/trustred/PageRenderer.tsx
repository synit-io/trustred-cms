import Image from 'next/image'
import Link from 'next/link'
import type { Media } from '@/payload-types'
import type { Operation } from '@/payload-types'

import { EquipmentDetailSection } from '@/components/trustred/EquipmentDetailSection'
import { EquipmentOverviewSection } from '@/components/trustred/EquipmentOverviewSection'
import { EventsAgendaSection } from '@/components/trustred/EventsAgendaSection'
import { FAQAccordion } from '@/components/trustred/FAQAccordion'
import { FooterCtaBand } from '@/components/trustred/FooterCtaBand'
import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { OperationsLogSection } from '@/components/trustred/OperationsLogSection'
import { OperationsTable } from '@/components/trustred/OperationsTable'
import { PageFormBlock } from '@/components/trustred/PageFormBlock'
import { TeamDirectorySection } from '@/components/trustred/TeamDirectorySection'
import { YouTubeConsentEmbed } from '@/components/trustred/YouTubeConsentEmbed'
import {
  getFeedItems,
  getPublicCrew,
  getPublicEquipment,
  getPublicEquipmentById,
  getPublicEvents,
  getPublicOperations,
  getWarningSettings,
} from '@/lib/trustred/cms'
import { toRelationId } from '@/lib/trustred/page-builder'
import {
  eventTypeLabels,
  formatDate,
  formatDateTime,
  getDateBadgeClass,
  getCrewPath,
  getEquipmentPath,
  getEventTypeBadgeClass,
  getEventPath,
  getFaqPath,
  getMediaImage,
  getPostCategoryBadgeClass,
  getPostPath,
  shouldShowImagePlaceholder,
  getStatusBadgeClass,
  postCategoryLabels,
} from '@/lib/trustred/public-content'
import { applyWarningPresetToBlock, findWarningPreset } from '@/lib/trustred/warning-presets'
import { getWarningSnapshotFromConfig } from '@/lib/trustred/warnings'

type Props = {
  faqOpenId?: string | null
  page: {
    layout?: PageBlock[] | null
    summary?: string | null
    title: string
  }
  currentTimestamp: number
  pathname: string
  submittedForm?: string | null
}

type PageBlock = Record<string, unknown> & {
  blockType?: string
}

type HeroBlockData = {
  blockType: 'hero'
  copy: string
  eyebrow?: string | null
  headline: string
  heroImage?: Media | number | null
  primaryActionHref: string
  primaryActionLabel: string
  secondaryActionHref?: string | null
  secondaryActionLabel?: string | null
}

type StatsBlockData = {
  blockType: 'stats'
  items?: Array<{
    label: string
    value: string
  }> | null
}

type RichTextBlockData = {
  blockType: 'rich-text'
  copy: string
  eyebrow?: string | null
  headline: string
}

type LinkGridBlockData = {
  blockType: 'link-grid'
  eyebrow?: string | null
  headline: string
  links?: Array<{
    description?: string | null
    href: string
    label: string
  }> | null
}

type FeedSource = 'posts' | 'events' | 'operations' | 'crew' | 'equipment' | 'faqs'

type FeedBlockData = {
  blockType: 'feed'
  eyebrow?: string | null
  headline: string
  intro?: string | null
  limit: number
  source: FeedSource
}

type BannerBlockData = {
  blockType: 'banner'
  label?: string | null
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string | null
  secondaryLabel?: string | null
  text: string
  title: string
}

type FormBlockData = {
  blockType: 'form'
  blockName?: string | null
  eyebrow?: string | null
  form?: number | { id?: number | null } | null
  formMode?: 'custom' | 'preset' | null
  headline: string
  intro?: string | null
  presetKey?: 'contact' | 'join' | null
  successMessage?: string | null
}

type TechDetailsBlockData = {
  blockType: 'tech-details'
  equipment?: number | { id?: number | null } | null
  eyebrow?: string | null
  headline: string
  intro?: string | null
  showCompartments?: boolean | null
  showHighlights?: boolean | null
}

type TechOverviewBlockData = {
  blockType: 'tech-overview'
  eyebrow?: string | null
  featuredEquipment?: number | { id?: number | null } | null
  headline: string
  intro?: string | null
  maxItems?: number | null
  showFeaturedProfile?: boolean | null
  showStats?: boolean | null
}

type OperationsLogBlockData = {
  blockType: 'operations-log'
  eyebrow?: string | null
  headline: string
  intro?: string | null
  maxItems?: number | null
  showFilters?: boolean | null
  showStats?: boolean | null
}

type WarningsBlockData = {
  blockType: 'warnings'
  dwdRegionIds?: Array<{ regionId?: string | null }> | null
  dwdStates?: Array<{ state?: string | null }> | null
  eyebrow?: string | null
  forecastUrl?: string | null
  headline: string
  intro?: string | null
  ninaArs?: string | null
  ninaPresetKey?: string | null
  presetKey?: string | null
  provider: 'dwd' | 'nina'
  regionLabel?: string | null
  showWeatherMap?: boolean | null
  showWildfireMap?: boolean | null
  sourceUrl?: string | null
  warningMapUrl?: string | null
  weatherMapUrl?: string | null
  wildfireMapUrl?: string | null
}

type HtmlBlockData = {
  blockType: 'html'
  html: string
}

type YouTubeBlockData = {
  blockType: 'youtube'
  eyebrow?: string | null
  headline: string
  intro?: string | null
  videoId: string
}

const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function imageUrl(media?: number | Media | null) {
  if (!media || typeof media === 'number') return null
  return media.url ?? media.thumbnailURL ?? null
}

function renderFeedCard(source: string, item: Record<string, unknown>, index: number) {
  if (source === 'posts') {
    const image = getMediaImage((item.featuredImage as Media | number | null | undefined) ?? null)
    const slug = typeof item.slug === 'string' ? item.slug : ''
    return (
      <article className="ff-card grid gap-4" key={index}>
        {image?.src ? (
          <div className="overflow-hidden rounded-[1.2rem] border border-neutral-200">
            <Image
              alt={image.alt}
              className="h-48 w-full object-cover"
              height={image.height}
              src={image.src}
              width={image.width}
            />
          </div>
        ) : shouldShowImagePlaceholder(item as { showImagePlaceholder?: boolean | null }) ? (
          <MediaPlaceholder className="h-48 w-full" label="Beitragsbild folgt" />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className={getPostCategoryBadgeClass(String(item.category ?? ''))}>
            {postCategoryLabels[String(item.category ?? '')] ??
              String(item.category ?? 'Aktuelles')}
          </span>
          <span className={getDateBadgeClass()}>
            {formatDate(
              typeof item.publishedAt === 'string'
                ? item.publishedAt
                : typeof item.updatedAt === 'string'
                  ? item.updatedAt
                  : null,
            )}
          </span>
        </div>
        <h3 className="text-xl">{String(item.title ?? '')}</h3>
        <p className="text-sm leading-7 text-neutral-600">{String(item.excerpt ?? '')}</p>
        {slug ? (
          <Link className="ff-btn-ghost min-h-9 px-3" href={getPostPath(slug)}>
            Beitrag ansehen
          </Link>
        ) : null}
      </article>
    )
  }

  if (source === 'events') {
    const slug = typeof item.slug === 'string' ? item.slug : ''
    const image = getMediaImage((item.featuredImage as Media | number | null | undefined) ?? null)
    return (
      <article className="ff-card grid gap-4" key={index}>
        {image?.src ? (
          <div className="overflow-hidden rounded-[1.2rem] border border-neutral-200">
            <Image
              alt={image.alt}
              className="h-48 w-full object-cover"
              height={image.height}
              src={image.src}
              width={image.width}
            />
          </div>
        ) : shouldShowImagePlaceholder(item as { showImagePlaceholder?: boolean | null }) ? (
          <MediaPlaceholder className="h-48 w-full" label="Terminbild folgt" />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className={`${getEventTypeBadgeClass(String(item.eventType ?? ''))} w-fit`}>
            {eventTypeLabels[String(item.eventType ?? '')] ?? String(item.eventType ?? 'Termin')}
          </p>
          {item.registrationEnabled ? (
            <span className={getStatusBadgeClass('published')}>Anmeldung aktiv</span>
          ) : null}
        </div>
        <h3 className="mt-3 text-xl">{String(item.title ?? '')}</h3>
        <p className="mt-3 text-sm text-neutral-700">
          {typeof item.startsAt === 'string' ? formatDateTime(item.startsAt) : ''} ·{' '}
          {String(item.location ?? '')}
        </p>
        <p className="text-sm leading-7 text-neutral-600">{String(item.summary ?? '')}</p>
        {slug ? (
          <Link className="ff-btn-ghost min-h-9 px-3" href={getEventPath(slug)}>
            Termin öffnen
          </Link>
        ) : null}
      </article>
    )
  }

  if (source === 'operations') {
    return null
  }

  if (source === 'crew') {
    const skills = Array.isArray(item.skills) ? item.skills : []
    const portrait = getMediaImage((item.portrait as Media | number | null | undefined) ?? null)
    const crewId = typeof item.id === 'number' || typeof item.id === 'string' ? item.id : null
    return (
      <article className="ff-card grid gap-4" key={index}>
        {portrait?.src ? (
          <div className="overflow-hidden rounded-[1.2rem] border border-neutral-200">
            <Image
              alt={portrait.alt}
              className="h-56 w-full object-cover"
              height={portrait.height}
              src={portrait.src}
              width={portrait.width}
            />
          </div>
        ) : shouldShowImagePlaceholder(item as { showImagePlaceholder?: boolean | null }) ? (
          <MediaPlaceholder className="h-56 w-full" label="Kein Portrait hinterlegt" />
        ) : null}
        <h3 className="text-xl">{String(item.name ?? '')}</h3>
        <p className="mt-1 text-sm font-semibold text-[var(--brand-500)]">
          {String(item.role ?? '')} {item.qualification ? `· ${String(item.qualification)}` : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill, skillIndex) => (
            <span className="ff-skill-badge" key={skillIndex}>
              {typeof skill === 'object' && skill && 'label' in skill ? String(skill.label) : ''}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-600">Schwerpunkt: {String(item.focus ?? '')}</p>
        {crewId !== null ? (
          <Link className="ff-btn-ghost min-h-9 px-3" href={getCrewPath(crewId)}>
            Profil öffnen
          </Link>
        ) : null}
      </article>
    )
  }

  if (source === 'equipment') {
    const facts = Array.isArray(item.facts) ? item.facts : []
    const image = getMediaImage((item.heroImage as Media | number | null | undefined) ?? null)
    const slug = typeof item.slug === 'string' ? item.slug : ''
    return (
      <article className="ff-card grid gap-4" key={index}>
        {image?.src ? (
          <div className="overflow-hidden rounded-[1.2rem] border border-neutral-200">
            <Image
              alt={image.alt}
              className="h-48 w-full object-cover"
              height={image.height}
              src={image.src}
              width={image.width}
            />
          </div>
        ) : null}
        <p className="ff-kicker">{String(item.callSign ?? 'Fahrzeug')}</p>
        <h3 className="text-xl">{String(item.name ?? '')}</h3>
        <p className="mt-3 text-sm text-neutral-600">{String(item.summary ?? '')}</p>
        <dl className="mt-4 grid gap-2 text-sm">
          {facts.slice(0, 3).map((fact, factIndex) => (
            <div className="flex gap-2" key={factIndex}>
              <dt className="font-semibold text-neutral-900">
                {typeof fact === 'object' && fact && 'label' in fact ? String(fact.label) : ''}
              </dt>
              <dd className="text-neutral-600">
                {typeof fact === 'object' && fact && 'value' in fact ? String(fact.value) : ''}
              </dd>
            </div>
          ))}
        </dl>
        {slug ? (
          <Link className="ff-btn-ghost min-h-9 px-3" href={getEquipmentPath(slug)}>
            Technikprofil
          </Link>
        ) : null}
      </article>
    )
  }

  if (source === 'faqs') {
    const faqId = typeof item.id === 'number' || typeof item.id === 'string' ? item.id : null
    return (
      <article className="ff-card grid h-full content-start gap-4" key={index}>
        {item.category ? (
          <span className={`${getStatusBadgeClass('info')} w-fit`}>{String(item.category)}</span>
        ) : null}
        <h3 className="text-xl">{String(item.question ?? '')}</h3>
        <p className="text-sm leading-7 text-neutral-600">{String(item.answer ?? '')}</p>
        {faqId !== null ? (
          <Link className="ff-btn-ghost mt-auto w-full" href={getFaqPath(faqId)}>
            Antwort öffnen
          </Link>
        ) : null}
      </article>
    )
  }

  return null
}

function severityLabel(value: string) {
  switch (value) {
    case 'extreme':
      return 'Extrem'
    case 'severe':
      return 'Schwer'
    case 'moderate':
      return 'Moderat'
    case 'minor':
      return 'Leicht'
    default:
      return 'Hinweis'
  }
}

function getFeedOverviewPath(source: FeedSource) {
  if (source === 'posts') return '/aktuelles'
  if (source === 'events') return '/termine'
  if (source === 'operations') return '/einsaetze'
  if (source === 'crew') return '/team'
  if (source === 'equipment') return '/technik'
  if (source === 'faqs') return '/faq'
  return null
}

export async function PageRenderer({
  currentTimestamp,
  faqOpenId,
  page,
  pathname,
  submittedForm,
}: Props) {
  const sections = await Promise.all(
    (page.layout ?? []).map(async (block, index) => {
      if (block.blockType === 'hero') {
        const heroBlock = block as unknown as HeroBlockData
        const mediaSrc = imageUrl(heroBlock.heroImage)

        return (
          <section className="ff-section" key={index}>
            <div className="site-container grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                {heroBlock.eyebrow ? <p className="ff-kicker">{heroBlock.eyebrow}</p> : null}
                <h1 className="max-w-4xl text-5xl md:text-6xl">{heroBlock.headline}</h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
                  {heroBlock.copy}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link className="ff-btn-accent" href={heroBlock.primaryActionHref}>
                    {heroBlock.primaryActionLabel}
                  </Link>
                  {heroBlock.secondaryActionHref && heroBlock.secondaryActionLabel ? (
                    <Link className="ff-btn-ghost" href={heroBlock.secondaryActionHref}>
                      {heroBlock.secondaryActionLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/70 bg-white p-4 shadow-[0_20px_60px_rgba(0,45,103,0.12)]">
                {mediaSrc ? (
                  <Image
                    alt={
                      typeof heroBlock.heroImage === 'object' && heroBlock.heroImage?.alt
                        ? heroBlock.heroImage.alt
                        : ''
                    }
                    className="h-[26rem] w-full rounded-[1.5rem] object-cover"
                    height={
                      typeof heroBlock.heroImage === 'object' &&
                      typeof heroBlock.heroImage?.height === 'number'
                        ? heroBlock.heroImage.height
                        : 960
                    }
                    src={mediaSrc}
                    width={
                      typeof heroBlock.heroImage === 'object' &&
                      typeof heroBlock.heroImage?.width === 'number'
                        ? heroBlock.heroImage.width
                        : 1440
                    }
                  />
                ) : (
                  <div className="flex h-[26rem] items-end rounded-[1.5rem] bg-[linear-gradient(160deg,rgba(135,29,51,0.16),rgba(255,255,255,0.92)),linear-gradient(0deg,rgba(17,24,39,0.28),rgba(17,24,39,0.04))] p-6">
                    <div className="rounded-2xl border border-white/70 bg-white/85 p-5 backdrop-blur">
                      <p className="ff-kicker">Trustred CMS</p>
                      <p className="text-lg font-semibold text-neutral-900">Das Feuerwehr CMS.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      }

      if (block.blockType === 'stats') {
        const statsBlock = block as unknown as StatsBlockData
        return (
          <section className="pb-6" key={index}>
            <div className="site-container grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statsBlock.items?.map((item, itemIndex) => (
                <article className="ff-card" key={itemIndex}>
                  <p className="font-headline text-4xl text-[var(--brand-500)]">{item.value}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-600">
                    {item.label}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )
      }

      if (block.blockType === 'rich-text') {
        const richTextBlock = block as unknown as RichTextBlockData
        return (
          <section className="ff-section" key={index}>
            <div className="site-container max-w-4xl">
              {richTextBlock.eyebrow ? <p className="ff-kicker">{richTextBlock.eyebrow}</p> : null}
              <h2 className="text-4xl">{richTextBlock.headline}</h2>
              <p className="mt-5 text-lg leading-8 text-neutral-700">{richTextBlock.copy}</p>
            </div>
          </section>
        )
      }

      if (block.blockType === 'link-grid') {
        const linkGridBlock = block as unknown as LinkGridBlockData
        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              {linkGridBlock.eyebrow ? <p className="ff-kicker">{linkGridBlock.eyebrow}</p> : null}
              <h2 className="text-4xl">{linkGridBlock.headline}</h2>
              <div className="mt-8 ff-grid-3">
                {linkGridBlock.links?.map((item, itemIndex) => (
                  <Link className="ff-card block" href={item.href} key={itemIndex}>
                    <h3 className="text-xl">{item.label}</h3>
                    {item.description ? (
                      <p className="mt-3 text-sm text-neutral-600">{item.description}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      }

      if (block.blockType === 'feed') {
        const feedBlock = block as unknown as FeedBlockData
        const routeIsTeamDirectory = feedBlock.source === 'crew' && pathname === '/team'
        const routeIsUpcomingEvents = feedBlock.source === 'events' && pathname === '/termine'
        const routeIsArchivedEvents =
          feedBlock.source === 'events' && pathname === '/termine/archiv'
        const usesSpecialRoutePresentation =
          routeIsTeamDirectory || routeIsUpcomingEvents || routeIsArchivedEvents
        const items = await getFeedItems(feedBlock.source, feedBlock.limit)
        const directoryCrew = routeIsTeamDirectory ? await getPublicCrew() : null
        const routeEvents =
          routeIsUpcomingEvents || routeIsArchivedEvents ? await getPublicEvents() : null

        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              {usesSpecialRoutePresentation ? null : (
                <>
                  {feedBlock.eyebrow ? <p className="ff-kicker">{feedBlock.eyebrow}</p> : null}
                  <div className="ff-section-head">
                    <h2 className="text-4xl">{feedBlock.headline}</h2>
                    {feedBlock.intro ? (
                      <p className="mt-4 text-lg leading-8 text-neutral-700">{feedBlock.intro}</p>
                    ) : null}
                  </div>
                </>
              )}
              {feedBlock.source === 'operations' ? (
                <OperationsTable operations={items as Operation[]} />
              ) : routeIsUpcomingEvents || routeIsArchivedEvents ? (
                <EventsAgendaSection
                  currentTimestamp={currentTimestamp}
                  eyebrow={feedBlock.eyebrow}
                  events={routeEvents ?? []}
                  headline={feedBlock.headline}
                  intro={feedBlock.intro}
                  mode={routeIsArchivedEvents ? 'archive' : 'upcoming'}
                />
              ) : routeIsTeamDirectory ? (
                <TeamDirectorySection
                  eyebrow={feedBlock.eyebrow}
                  crew={directoryCrew ?? []}
                  headline={feedBlock.headline}
                  intro={feedBlock.intro}
                />
              ) : feedBlock.source === 'faqs' ? (
                <FAQAccordion
                  faqs={
                    items as Array<{
                      answer?: string | null
                      category?: string | null
                      id: number | string
                      question?: string | null
                    }>
                  }
                  openId={faqOpenId}
                  showCategory={pathname !== '/faq'}
                />
              ) : (
                <div className="ff-grid-3">
                  {items.map((item, itemIndex) =>
                    renderFeedCard(feedBlock.source, item as Record<string, unknown>, itemIndex),
                  )}
                </div>
              )}
              {getFeedOverviewPath(feedBlock.source) &&
              !(feedBlock.source === 'faqs' && pathname === '/faq') &&
              !(feedBlock.source === 'crew' && pathname === '/team') &&
              !(
                feedBlock.source === 'events' &&
                (pathname === '/termine' || pathname === '/termine/archiv')
              ) ? (
                <div className="mt-6 flex justify-end">
                  <Link
                    className="ff-btn-ghost"
                    href={getFeedOverviewPath(feedBlock.source) ?? '/'}
                  >
                    Mehr aus diesem Bereich
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        )
      }

      if (block.blockType === 'banner') {
        const bannerBlock = block as unknown as BannerBlockData

        return (
          <FooterCtaBand
            banners={[
              {
                key: `banner-${index}`,
                label: bannerBlock.label,
                primaryHref: bannerBlock.primaryHref,
                primaryLabel: bannerBlock.primaryLabel,
                secondaryHref: bannerBlock.secondaryHref,
                secondaryLabel: bannerBlock.secondaryLabel,
                text: bannerBlock.text,
                title: bannerBlock.title,
              },
            ]}
            key={index}
          />
        )
      }

      if (block.blockType === 'warnings') {
        let warningsBlock = block as unknown as WarningsBlockData
        const presets = await getWarningSettings()

        if (
          warningsBlock.presetKey &&
          (!warningsBlock.regionLabel ||
            (warningsBlock.provider === 'dwd' &&
              (warningsBlock.dwdRegionIds?.length ?? 0) === 0 &&
              !warningsBlock.forecastUrl) ||
            (warningsBlock.provider === 'nina' && !warningsBlock.ninaArs))
        ) {
          const preset = findWarningPreset(presets, warningsBlock.presetKey, warningsBlock.provider)

          if (preset) {
            const hydratedBlock = applyWarningPresetToBlock(
              {
                ...warningsBlock,
                dwdRegionIds: (warningsBlock.dwdRegionIds ?? [])
                  .map((entry) => String(entry?.regionId ?? '').trim())
                  .filter(Boolean)
                  .map((regionId) => ({ regionId })),
                showWeatherMap: warningsBlock.showWeatherMap ?? false,
                showWildfireMap: warningsBlock.showWildfireMap ?? false,
              },
              preset,
            )

            warningsBlock = {
              ...warningsBlock,
              ...hydratedBlock,
            }
          }
        }

        const snapshot = await getWarningSnapshotFromConfig({
          dwdRegionIds: warningsBlock.dwdRegionIds,
          dwdStates: warningsBlock.dwdStates,
          forecastUrl: warningsBlock.forecastUrl,
          ninaArs: warningsBlock.ninaArs,
          provider: warningsBlock.provider,
          regionLabel: warningsBlock.regionLabel,
          showWeatherMap: warningsBlock.showWeatherMap,
          showWildfireMap: warningsBlock.showWildfireMap,
          sourceUrl: warningsBlock.sourceUrl,
          warningMapUrl: warningsBlock.warningMapUrl,
          weatherMapUrl: warningsBlock.weatherMapUrl,
          wildfireMapUrl: warningsBlock.wildfireMapUrl,
        })
        const ninaPreset =
          warningsBlock.provider === 'dwd' && warningsBlock.ninaPresetKey
            ? findWarningPreset(presets, warningsBlock.ninaPresetKey, 'nina')
            : null
        const ninaSnapshot = ninaPreset
          ? await getWarningSnapshotFromConfig({
              ninaArs: ninaPreset.ninaArs,
              provider: 'nina',
              regionLabel: ninaPreset.regionLabel,
              sourceUrl: ninaPreset.sourceUrl,
            })
          : null

        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <article className="ff-card">
                  <p className="ff-kicker">{warningsBlock.eyebrow}</p>
                  <h2 className="text-4xl">{warningsBlock.headline}</h2>
                  {warningsBlock.intro ? (
                    <p className="mt-4 text-neutral-700">{warningsBlock.intro}</p>
                  ) : null}
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-800">
                      Region:{' '}
                      {String(
                        snapshot?.regionLabel ??
                          warningsBlock.regionLabel ??
                          warningsBlock.presetKey,
                      )}
                    </p>
                    <p className="mt-2 text-sm text-amber-900">
                      Stand:{' '}
                      {warningsBlock.provider === 'dwd'
                        ? (snapshot?.dwdWeather?.updatedLabel ?? 'Nicht verfügbar')
                        : snapshot?.updatedAt
                          ? dateFormat.format(new Date(snapshot.updatedAt))
                          : 'Nicht verfügbar'}
                    </p>
                    {warningsBlock.provider === 'dwd' ? (
                      <div className="mt-4 grid gap-4">
                        <div className="rounded-xl border border-amber-200 bg-white px-4 py-4">
                          <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-amber-800">
                            DWD Snapshot
                          </p>
                          <p className="mt-2 font-semibold text-neutral-900">
                            {snapshot?.dwdWeather?.warningHeadline ??
                              'Aktuelle Wetter- und Warnlage'}
                          </p>
                          <div className="mt-4 grid gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                                Kurzlage
                              </p>
                              <p className="mt-2 text-sm text-neutral-700">
                                {snapshot?.dwdWeather?.summary ??
                                  'Aktuell liegt keine Kurzlage vor.'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                                Ausblick
                              </p>
                              <p className="mt-2 text-sm text-neutral-700">
                                {snapshot?.dwdWeather?.tonightTomorrow ??
                                  'Aktuell liegt kein Ausblick vor.'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {snapshot?.entries.length ? (
                          <ul className="grid gap-3 text-sm text-neutral-700">
                            {snapshot.entries.map((item, itemIndex) => (
                              <li
                                className="rounded-xl border border-amber-200 bg-white px-4 py-3"
                                key={`${item.headline}-${itemIndex}`}
                              >
                                <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-amber-800">
                                  {severityLabel(item.severity)} · {item.tag || item.source}
                                </p>
                                <p className="mt-2 font-semibold text-neutral-900">
                                  {item.headline}
                                </p>
                                {item.description ? (
                                  <p className="mt-2">{item.description}</p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-neutral-700">
                            Aktuell liegen keine amtlichen DWD-Warnmeldungen für diese Region vor.
                          </div>
                        )}
                        {ninaSnapshot ? (
                          <div className="rounded-xl border border-amber-200 bg-white px-4 py-4">
                            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-amber-800">
                              NINA Ergänzung
                            </p>
                            <p className="mt-2 font-semibold text-neutral-900">
                              Ergänzende Bevölkerungswarnungen für {ninaSnapshot.regionLabel}
                            </p>
                            {ninaSnapshot.entries.length > 0 ? (
                              <ul className="mt-4 grid gap-3 text-sm text-neutral-700">
                                {ninaSnapshot.entries.map((item, itemIndex) => (
                                  <li
                                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                                    key={`nina-extra-${item.headline}-${itemIndex}`}
                                  >
                                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-amber-800">
                                      {severityLabel(item.severity)} · {item.tag || item.source}
                                    </p>
                                    <p className="mt-2 font-semibold text-neutral-900">
                                      {item.headline}
                                    </p>
                                    {item.description ? (
                                      <p className="mt-2">{item.description}</p>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-3 text-sm text-neutral-700">
                                Aktuell liegen keine ergänzenden NINA-Meldungen für diese Region
                                vor.
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : snapshot?.entries.length ? (
                      <ul className="mt-4 grid gap-3 text-sm text-neutral-700">
                        {snapshot.entries.map((item, itemIndex) => (
                          <li
                            className="rounded-xl border border-amber-200 bg-white px-4 py-3"
                            key={`${item.headline}-${itemIndex}`}
                          >
                            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-amber-800">
                              {severityLabel(item.severity)} · {item.tag || item.source}
                            </p>
                            <p className="mt-2 font-semibold text-neutral-900">{item.headline}</p>
                            {item.description ? <p className="mt-2">{item.description}</p> : null}
                            {item.instruction ? (
                              <p className="mt-2 text-neutral-600">
                                <strong>Hinweis:</strong> {item.instruction}
                              </p>
                            ) : null}
                            {item.detailUrl ? (
                              <a
                                className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand-500)]"
                                href={item.detailUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Meldung öffnen
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        Aktuell liegen keine Warnmeldungen für diese Konfiguration vor.
                      </div>
                    )}
                  </div>
                </article>
                <article className="ff-card">
                  <p className="ff-kicker">
                    {warningsBlock.provider === 'dwd' ? 'Karten & Quelle' : 'Quelle & Details'}
                  </p>
                  <h3 className="text-2xl">
                    {warningsBlock.provider === 'dwd'
                      ? 'DWD Snapshot und Karten'
                      : 'NINA Warnmeldungen'}
                  </h3>
                  {warningsBlock.provider === 'dwd' ? (
                    <div className="mt-4 grid gap-3">
                      {snapshot?.dwdWeather?.warningMapUrl ? (
                        <figure className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={`DWD Warnkarte ${snapshot.regionLabel}`}
                            className="h-72 w-full rounded-xl border border-neutral-200 bg-neutral-50 object-contain object-center"
                            loading="lazy"
                            src={snapshot.dwdWeather.warningMapUrl}
                          />
                          <figcaption className="text-xs text-neutral-500">
                            Amtliche Warnkarte (DWD)
                          </figcaption>
                        </figure>
                      ) : null}
                      {snapshot?.dwdWeather?.weatherMapUrl ? (
                        <figure className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={`DWD Wetterkarte ${snapshot.regionLabel}`}
                            className="h-72 w-full rounded-xl border border-neutral-200 bg-neutral-50 object-contain object-center"
                            loading="lazy"
                            src={snapshot.dwdWeather.weatherMapUrl}
                          />
                          <figcaption className="text-xs text-neutral-500">Wetterkarte</figcaption>
                        </figure>
                      ) : null}
                      {snapshot?.dwdWeather?.wildfireMapUrl ? (
                        <figure className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt="DWD Waldbrandgefahr"
                            className="h-72 w-full rounded-xl border border-neutral-200 bg-neutral-50 object-contain object-center"
                            loading="lazy"
                            src={snapshot.dwdWeather.wildfireMapUrl}
                          />
                          <figcaption className="text-xs text-neutral-500">
                            Waldbrandgefahr
                          </figcaption>
                        </figure>
                      ) : null}
                    </div>
                  ) : (
                    <ul className="ff-feature-list mt-4">
                      <li>
                        <strong>Block-eigene Konfiguration</strong>
                        Region, Quelle und Kennung werden direkt im Seitenblock gespeichert.
                      </li>
                      <li>
                        <strong>Preset-gestützter Einstieg</strong>
                        Im visuellen Builder kann die Redaktion nur das passende Preset auswählen
                        und bei Bedarf Details überschreiben.
                      </li>
                    </ul>
                  )}
                  {snapshot?.sourceUrl ? (
                    <a
                      className="ff-btn-accent mt-4 inline-flex"
                      href={snapshot.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {warningsBlock.provider === 'dwd'
                        ? 'DWD Detailansicht'
                        : 'Alle NINA-Meldungen'}
                    </a>
                  ) : null}
                </article>
              </div>
            </div>
          </section>
        )
      }

      if (block.blockType === 'form') {
        const formBlock = block as unknown as FormBlockData

        return (
          <PageFormBlock
            block={formBlock}
            index={index}
            key={index}
            pathname={pathname}
            submittedForm={submittedForm}
          />
        )
      }

      if (block.blockType === 'tech-details') {
        const techDetailsBlock = block as unknown as TechDetailsBlockData
        const equipmentId = toRelationId(techDetailsBlock.equipment)
        const item =
          typeof equipmentId === 'number'
            ? await getPublicEquipmentById(equipmentId)
            : ((await getPublicEquipment())[0] ?? null)

        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              {item ? (
                <EquipmentDetailSection
                  intro={techDetailsBlock.intro}
                  item={item}
                  kicker={techDetailsBlock.eyebrow || 'Technikdetail'}
                  showActions={false}
                  showCompartments={techDetailsBlock.showCompartments !== false}
                  showHighlights={techDetailsBlock.showHighlights !== false}
                  title={techDetailsBlock.headline}
                />
              ) : (
                <div className="ff-card border-amber-200 bg-amber-50 text-sm text-amber-950">
                  Für diesen Technik-Block ist noch kein Fahrzeug oder Gerät ausgewählt.
                </div>
              )}
            </div>
          </section>
        )
      }

      if (block.blockType === 'tech-overview') {
        const techOverviewBlock = block as unknown as TechOverviewBlockData
        const equipment = await getPublicEquipment()

        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              <EquipmentOverviewSection
                equipment={equipment}
                eyebrow={techOverviewBlock.eyebrow}
                featuredEquipmentId={toRelationId(techOverviewBlock.featuredEquipment) ?? null}
                headline={techOverviewBlock.headline}
                intro={techOverviewBlock.intro}
                maxItems={techOverviewBlock.maxItems}
                showFeaturedProfile={techOverviewBlock.showFeaturedProfile}
                showStats={techOverviewBlock.showStats}
              />
            </div>
          </section>
        )
      }

      if (block.blockType === 'operations-log') {
        const operationsLogBlock = block as unknown as OperationsLogBlockData
        const operations = await getPublicOperations()

        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              <OperationsLogSection
                eyebrow={operationsLogBlock.eyebrow}
                headline={operationsLogBlock.headline}
                intro={operationsLogBlock.intro}
                maxItems={operationsLogBlock.maxItems}
                operations={operations}
                showFilters={operationsLogBlock.showFilters}
                showStats={operationsLogBlock.showStats}
              />
            </div>
          </section>
        )
      }

      if (block.blockType === 'youtube') {
        const youtubeBlock = block as unknown as YouTubeBlockData

        return (
          <section className="ff-section" key={index}>
            <div className="site-container">
              {youtubeBlock.eyebrow ? <p className="ff-kicker">{youtubeBlock.eyebrow}</p> : null}
              <h2 className="text-4xl">{youtubeBlock.headline}</h2>
              {youtubeBlock.intro ? (
                <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                  {youtubeBlock.intro}
                </p>
              ) : null}
              <div className="mt-8">
                <YouTubeConsentEmbed
                  title={youtubeBlock.headline}
                  videoIdOrUrl={youtubeBlock.videoId}
                />
              </div>
            </div>
          </section>
        )
      }

      if (block.blockType === 'html') {
        const htmlBlock = block as unknown as HtmlBlockData
        return (
          <section className="ff-section" key={index}>
            <div
              className="site-container prose prose-neutral max-w-none rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm"
              dangerouslySetInnerHTML={{ __html: htmlBlock.html }}
            />
          </section>
        )
      }

      return null
    }),
  )

  return <>{sections}</>
}
