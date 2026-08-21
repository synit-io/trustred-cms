import Link from 'next/link'
import Image from 'next/image'

import { ConfiguredPageRoute } from '@/components/trustred/ConfiguredPageRoute'
import { MediaPlaceholder } from '@/components/trustred/MediaPlaceholder'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPublicPosts, getSiteSettings } from '@/lib/trustred/cms'
import { formatDate, getDateBadgeClass, getMediaImage, getPostCategoryBadgeClass, getPostPath, getStatusBadgeClass, postCategoryLabels, shouldShowImagePlaceholder } from '@/lib/trustred/public-content'

type Props = {
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function PostsIndexPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const configuredPage = await ConfiguredPageRoute({
    pageSlug: 'aktuelles',
    pathname: '/aktuelles',
    submittedForm: typeof resolvedSearchParams.submittedForm === 'string' ? resolvedSearchParams.submittedForm : null,
  })

  if (configuredPage) {
    return configuredPage
  }

  const [posts, settings] = await Promise.all([getPublicPosts(), getSiteSettings()])
  const [leadPost, ...remainingPosts] = posts
  const categoryCounts = posts.reduce<Record<string, number>>((counts, post) => {
    counts[post.category] = (counts[post.category] ?? 0) + 1
    return counts
  }, {})
  const leadImage = leadPost ? getMediaImage(leadPost.featuredImage) : null

  return (
    <SiteShell pathname="/aktuelles" settings={settings}>
      <section className="ff-section">
        <div className="site-container grid gap-6">
          <div className="ff-section-head">
            <p className="ff-kicker">Aktuelles</p>
            <h1 className="text-[clamp(2rem,5vw,4rem)]">Neuigkeiten und Einblicke</h1>
            <p className="text-lg leading-8 text-neutral-700">
              Berichte aus Ausbildung, Einsatzgeschehen, Jugend und Öffentlichkeitsarbeit.
            </p>
          </div>

          {Object.keys(categoryCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <span className={getPostCategoryBadgeClass(category)} key={category}>
                  {postCategoryLabels[category] ?? category} · {count}
                </span>
              ))}
            </div>
          ) : null}

          {leadPost ? (
            <article className="ff-card grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
              {leadImage?.src ? (
                <div className="overflow-hidden rounded-[1.6rem] border border-neutral-200">
                  <Image
                    alt={leadImage.alt}
                    className="h-[24rem] w-full object-cover"
                    height={leadImage.height}
                    src={leadImage.src}
                    width={leadImage.width}
                  />
                </div>
              ) : shouldShowImagePlaceholder(leadPost) ? (
                <MediaPlaceholder className="h-[24rem] w-full" label="Kein Beitragsbild hinterlegt" />
              ) : null}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={getStatusBadgeClass('brand')}>Leitbeitrag</span>
                  <span className={getPostCategoryBadgeClass(leadPost.category)}>{postCategoryLabels[leadPost.category] ?? leadPost.category}</span>
                  <span className={getDateBadgeClass()}>{formatDate(leadPost.publishedAt ?? leadPost.updatedAt)}</span>
                </div>
                <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)]">{leadPost.title}</h2>
                <p className="mt-4 text-base leading-8 text-neutral-700">{leadPost.excerpt}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link className="ff-btn-accent" href={getPostPath(leadPost.slug)}>
                    Beitrag lesen
                  </Link>
                  <Link className="ff-btn-ghost" href="/">
                    Zur Startseite
                  </Link>
                </div>
              </div>
            </article>
          ) : (
            <article className="ff-card grid gap-4 border-dashed">
              <div>
                <p className="ff-kicker">Noch keine Beiträge</p>
                <h2 className="text-[clamp(1.4rem,4vw,2.2rem)]">Aktuell sind noch keine veröffentlichten Meldungen hinterlegt.</h2>
              </div>
              <p className="text-base leading-8 text-neutral-700">
                Sobald Beiträge zu Ausbildung, Öffentlichkeitsarbeit, Jugend oder Einsätzen freigegeben wurden, erscheinen sie hier in der News-Übersicht.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link className="ff-btn-accent" href="/kontakt">
                  Kontakt
                </Link>
                <Link className="ff-btn-ghost" href="/mitmachen">
                  Mitmachen
                </Link>
              </div>
            </article>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="ff-card grid gap-0 overflow-hidden p-0">
              {remainingPosts.map((post, index) => (
                <article className="grid gap-5 border-b border-neutral-200 px-6 py-6 last:border-b-0 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center" key={post.id}>
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getPostCategoryBadgeClass(post.category)}>{postCategoryLabels[post.category] ?? post.category}</span>
                      <span className={getDateBadgeClass()}>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Beitrag {index + 2}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem] md:items-start">
                      <div>
                        <h2 className="text-[1.8rem] leading-[1.12]">{post.title}</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-700">{post.excerpt}</p>
                      </div>
                      {getMediaImage(post.featuredImage)?.src ? (
                        <div className="overflow-hidden rounded-[1.1rem] border border-neutral-200">
                          <Image
                            alt={getMediaImage(post.featuredImage)?.alt ?? ''}
                            className="h-28 w-full object-cover"
                            height={getMediaImage(post.featuredImage)?.height ?? 960}
                            src={getMediaImage(post.featuredImage)?.src ?? ''}
                            width={getMediaImage(post.featuredImage)?.width ?? 1440}
                          />
                        </div>
                      ) : shouldShowImagePlaceholder(post) ? (
                        <MediaPlaceholder className="h-28 w-full" label="Kein Beitragsbild hinterlegt" />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex justify-start md:justify-end">
                    <Link className="ff-btn-accent" href={getPostPath(post.slug)}>
                      Beitrag lesen
                    </Link>
                  </div>
                </article>
              ))}
              {remainingPosts.length === 0 ? (
                <div className="px-6 py-8 text-sm text-neutral-600">Weitere veröffentlichte Beiträge erscheinen hier automatisch, sobald sie angelegt wurden.</div>
              ) : null}
            </div>

            <aside className="grid gap-4">
              <article className="ff-card">
                <p className="ff-kicker">Redaktionshinweis</p>
                <h2 className="text-2xl">Was hier erscheint</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                  Die Übersicht bündelt Öffentlichkeitsarbeit, Ausbildungsberichte, Jugendthemen und freigegebene Einsatzbezüge in einem ruhig lesbaren Trustred-Magazinfluss.
                </p>
              </article>
              <article className="ff-card">
                <p className="ff-kicker">Kontakt</p>
                <h2 className="text-2xl">Fragen zu einem Beitrag?</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                  Rückfragen zu Presse, Mitmachen oder Veranstaltungen laufen weiterhin gesammelt über die Kontaktseite.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="ff-btn-accent" href="/kontakt">
                    Kontakt
                  </Link>
                  <Link className="ff-btn-ghost" href="/mitmachen">
                    Mitmachen
                  </Link>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
