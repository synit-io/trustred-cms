'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function onLogout() {
    await fetch('/manage/auth/logout', {
      credentials: 'include',
      method: 'POST',
    })

    router.replace('/manage/login')
    router.refresh()
  }

  return (
    <button className="ff-btn-ghost" onClick={onLogout} type="button">
      Logout
    </button>
  )
}
