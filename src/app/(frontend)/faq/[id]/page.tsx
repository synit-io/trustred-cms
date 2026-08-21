import { redirect } from 'next/navigation'

import { getPublicFaqById } from '@/lib/trustred/cms'
import { getFaqPath } from '@/lib/trustred/public-content'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function FaqDetailPage({ params }: Props) {
  const { id } = await params
  const faq = await getPublicFaqById(id)

  if (!faq) {
    redirect('/faq')
  }

  redirect(getFaqPath(faq.id))
}
