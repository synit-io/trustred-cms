'use client'

import { useState } from 'react'

type LoginResponse = {
  redirectTo?: string
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const response = await fetch('/manage/auth/login', {
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      setLoading(false)
      setError('Login fehlgeschlagen. Bitte Zugangsdaten prüfen.')
      return
    }

    const result = (await response.json()) as LoginResponse
    window.location.assign(result.redirectTo ?? '/manage')
  }

  return (
    <form className="ff-form-grid" onSubmit={onSubmit}>
      <label>
        E-Mail
        <input className="ff-input" name="email" required type="email" />
      </label>
      <label>
        Passwort
        <input className="ff-input" name="password" required type="password" />
      </label>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
      <button className="ff-btn-accent w-fit" disabled={loading} type="submit">
        {loading ? 'Anmeldung...' : 'Anmelden'}
      </button>
    </form>
  )
}
