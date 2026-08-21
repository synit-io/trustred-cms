import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { ShareActions } from '@/components/trustred/ShareActions'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicPostBySlug, getPublicPosts, getSiteSettings } from '@/lib/trustred/cms'
import { formatDate, getDateBadgeClass, getMediaImage, getPostCategoryBadgeClass, getPostPath, postCategoryLabels, shouldShowImagePlaceholder } from '@/lib/trustred/public-content'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params
  const [post, posts, settings] = await Promise.all([getPublicPostBySlug(slug), getPublicPosts(), getSiteSettings()])

  if (!post) {
    notFound()
  }

  const image = getMediaImage(post.featuredImage)
  const rawContent = String(post.content ?? '').trim()
  const paragraphs = String(post.content ?? '')
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const wordCount = rawContent.split(/\s+/).filter(Boolean).length
  const readingMinutes = Math.max(1, Math.round(wordCount / 180))
  const relatedPosts = posts
    .filter((entry) => entry.slug !== post.slug)
    .sort((left, right) => {
      const leftScore = left.category === post.category ? 1 : 0
      const rightScore = right.category === post.category ? 1 : 0
      return rightScore - leftScore
    })
    .slice(0, 3)

  return (
    <SiteShell pathname="/aktuelles" settings={settings}>
      <section className="ff-section">
        <div className="site-container">
          <article className="mx-auto w-full max-w-5xl overflow-hidden rounded-[1.8rem] border border-neutral-200 bg-white shadow-[0_18px_40px_rgba(0,45,103,0.08)]">
            <div className="grid gap-8 p-6 md:p-8 lg:p-10">
              <header className="max-w-4xl space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <Link className="transition hover:text-[var(--brand-500)]" href="/">
                    Start
                  </Link>
                  <span>/</span>
                  <Link className="transition hover:text-[var(--brand-500)]" href="/aktuelles">
                    Aktuelles
                  </Link>
                  <span>/</span>
                  <span className="text-neutral-700">Beitrag</span>
                </div>
                <p className="ff-kicker">Aktuelles</p>
                <h1 className="text-[clamp(2.2rem,5vw,4.4rem)]">{post.title}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                  <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
                  <span className="text-neutral-300">|</span>
                  <span>{postCategoryLabels[post.category] ?? post.category}</span>
                  <span className="text-neutral-300">|</span>
                  <span>{readingMinutes} Min. Lesezeit</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={getPostCategoryBadgeClass(post.category)}>{postCategoryLabels[post.category] ?? post.category}</span>
                  <span className={getDateBadgeClass()}>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
                </div>

                {post.excerpt ? (
                  <p className="max-w-3xl text-[1.2rem] leading-9 text-neutral-700 md:text-[1.3rem]">
                    {post.excerpt}
                  </p>
                ) : null}
              </header>

              {image?.src ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200">
                  <Image
                    alt={image.alt}
                    className="h-[18rem] w-full object-cover md:h-[24rem]"
                    height={image.height}
                    src={image.src}
                    width={image.width}
                  />
                </div>
              ) : shouldShowImagePlaceholder(post) ? (
                <MediaPlaceholder className="h-[18rem] w-full md:h-[24rem]" label="Kein Beitragsbild hinterlegt" />
              ) : null}

              <div className="grid gap-8 border-t border-neutral-200 pt-8 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                <div className="min-w-0 space-y-5">
                  {(paragraphs.length > 0 ? paragraphs : [rawContent]).map((paragraph, index) => (
                    <p
                      className="max-w-none text-[1.06rem] leading-9 text-neutral-800 md:text-[1.12rem]"
                      key={`post-paragraph-${index}`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <aside className="grid gap-4 xl:sticky xl:top-28">
                  <div className="rounded-[1.3rem] border border-neutral-200 bg-neutral-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Beitragsdaten</p>
                    <div className="mt-4 grid gap-3 text-sm leading-7 text-neutral-700">
                      <p>
                        <strong className="text-neutral-900">Bereich:</strong>{' '}
                        {postCategoryLabels[post.category] ?? post.category}
                      </p>
                      <p>
                        <strong className="text-neutral-900">Veröffentlicht:</strong>{' '}
                        {formatDate(post.publishedAt ?? post.updatedAt)}
                      </p>
                      <p>
                        <strong className="text-neutral-900">Lesedauer:</strong> ca. {readingMinutes} Minute{readingMinutes === 1 ? '' : 'n'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.3rem] border border-neutral-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Nächster Schritt</p>
                    <p className="mt-3 text-sm leading-7 text-neutral-700">
                      Lies weitere Meldungen aus {postCategoryLabels[post.category] ?? post.category} oder melde dich direkt, wenn du Rückfragen oder Interesse am Thema hast.
                    </p>
                    <div className="mt-4 grid gap-3">
                      <Link className="ff-btn-accent w-full" href="/aktuelles">
                        Zur Übersicht
                      </Link>
                      <Link className="ff-btn-ghost w-full" href="/kontakt">
                        Rückfrage stellen
                      </Link>
                      <Link className="ff-btn-ghost w-full" href="/mitmachen">
                        Mitmachen
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-[1.3rem] border border-neutral-200 bg-neutral-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Teilen</p>
                    <p className="mt-3 text-sm leading-7 text-neutral-700">
                      Beitrag direkt weitergeben oder den Link für Presse, Team oder Interessierte kopieren.
                    </p>
                    <div className="mt-4">
                      <ShareActions title={post.title} url={getPostPath(post.slug)} />
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </article>

          {relatedPosts.length > 0 ? (
            <section className="mx-auto mt-6 grid w-full max-w-5xl gap-4">
              <div className="ff-section-head mb-0">
                <p className="ff-kicker">Weiterlesen</p>
                <h2 className="text-[clamp(1.6rem,4vw,2.6rem)]">Weitere Meldungen aus diesem Umfeld</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <article className="ff-card grid gap-4" key={relatedPost.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getPostCategoryBadgeClass(relatedPost.category)}>
                        {postCategoryLabels[relatedPost.category] ?? relatedPost.category}
                      </span>
                      <span className={getDateBadgeClass()}>{formatDate(relatedPost.publishedAt ?? relatedPost.updatedAt)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl">{relatedPost.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-neutral-700">{relatedPost.excerpt}</p>
                    </div>
                    <div className="mt-auto">
                      <Link className="ff-btn-accent w-full" href={getPostPath(relatedPost.slug)}>
                        Beitrag lesen
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap gap-3">
            <Link className="ff-btn-accent" href="/aktuelles">
              Zur Übersicht
            </Link>
            <Link className="ff-btn-ghost" href="/">
              Startseite
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
