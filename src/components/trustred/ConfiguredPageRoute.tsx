import { PageRenderer } from '@/components/trustred/PageRenderer'
import { SiteShell } from '@/components/trustred/SiteShell'
import { getPageBySlug, getSiteSettings } from '@/lib/trustred/cms'
import { getCurrentTimestamp } from '@/lib/trustred/time'

type Props = {
  faqOpenId?: string | null
  pageSlug: string
  pathname: string
  submittedForm?: string | null
}

export async function ConfiguredPageRoute({ pageSlug, pathname, submittedForm, faqOpenId }: Props) {
  const [page, settings] = await Promise.all([getPageBySlug(pageSlug), getSiteSettings()])

  if (!page) {
    return null
  }

  return (
    <SiteShell pathname={pathname} settings={settings}>
      <PageRenderer
        currentTimestamp={getCurrentTimestamp()}
        faqOpenId={faqOpenId}
        page={page}
        pathname={pathname}
        submittedForm={submittedForm}
      />
    </SiteShell>
  )
}
