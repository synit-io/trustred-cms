import { notFound, redirect } from 'next/navigation'

import { PageRenderer } from '@/components/trustred/PageRenderer'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPageBySlug, getPayloadClient, getSiteSettings } from '@/lib/trustred/cms'
import { countUsers } from '@/lib/trustred/setup'
import { getCurrentTimestamp } from '@/lib/trustred/time'

type Props = {
  params: Promise<{
    slug?: string[]
  }>
  searchParams: Promise<{
    submittedForm?: string | string[]
  }>
}

export default async function TrustredPage({ params, searchParams }: Props) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const resolvedPath = slug?.join('/') || 'home'
  const submittedForm =
    typeof resolvedSearchParams.submittedForm === 'string'
      ? resolvedSearchParams.submittedForm
      : null
  const userCount = await countUsers(await getPayloadClient())

  if (userCount === 0) {
    redirect('/setup?step=admin')
  }

  const [page, settings] = await Promise.all([getPageBySlug(resolvedPath), getSiteSettings()])

  if (!page) {
    notFound()
  }

  const pathname = resolvedPath === 'home' ? '/' : `/${resolvedPath}`

  return (
    <SiteShell pathname={pathname} settings={settings}>
      <PageRenderer
        currentTimestamp={getCurrentTimestamp()}
        page={page}
        pathname={pathname}
        submittedForm={submittedForm}
      />
    </SiteShell>
  )
}
