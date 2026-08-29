import React from 'react'
import { CookieConsentManager } from '@/components/trustred/CookieConsentManager'
import './styles.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Trustred CMS rewrite based on Payload CMS and Next.js for first aid organizations.',
  title: 'Trustred CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="de" data-scroll-behavior="smooth">
      <body>
        <main>{children}</main>
        <CookieConsentManager />
      </body>
    </html>
  )
}
