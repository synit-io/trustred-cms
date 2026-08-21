import { notFound } from 'next/navigation'

import { getPublicEventBySlug } from '@/lib/trustred/cms'
import { createEventIcs } from '@/lib/trustred/ics'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export async function GET(_: Request, { params }: Props) {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)

  if (!event) {
    notFound()
  }

  return new Response(createEventIcs(event), {
    headers: {
      'Content-Disposition': `attachment; filename="${encodeURIComponent(event.slug)}.ics"`,
      'Content-Type': 'text/calendar; charset=utf-8',
    },
  })
}
