import React from 'react'
import { CookieConsentManager } from '@/components/trustred/CookieConsentManager'
import { getSiteSettings } from '@/lib/trustred/cms'
import { createPublicMetadata } from '@/lib/trustred/metadata'
import './styles.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getSiteSettings()
  return createPublicMetadata(
    {
      title: settings.siteName,
      summary: settings.taglineSecondary || settings.taglinePrimary,
      meta: settings.meta,
    },
    settings.siteName,
  )
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="de" data-scroll-behavior="smooth">
      <body>
        <div>{children}</div>
        <CookieConsentManager />
      </body>
    </html>
  )
}
