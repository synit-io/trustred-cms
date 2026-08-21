'use client'

import { useState } from 'react'

export function ShareActions({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const resolvedUrl = typeof window !== 'undefined' && url.startsWith('/') ? `${window.location.origin}${url}` : url

  async function copyLink() {
    await navigator.clipboard.writeText(resolvedUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function shareNative() {
    if (!navigator.share) {
      await copyLink()
      return
    }

    await navigator.share({ title, url: resolvedUrl })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button className="ff-btn-ghost" onClick={copyLink} type="button">
        {copied ? 'Link kopiert' : 'Direktlink kopieren'}
      </button>
      <button className="ff-btn-ghost" onClick={shareNative} type="button">
        Teilen
      </button>
    </div>
  )
}
