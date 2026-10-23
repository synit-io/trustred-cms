import { NextResponse } from 'next/server'
import { handleEndpoints } from 'payload'

import { getPayloadClient } from '@/lib/trustred/cms'
import { isSameOriginRequest } from '@/lib/trustred/request-security'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { errors: [{ message: 'Request origin is not allowed.' }] },
      { status: 403 },
    )
  }
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (user) {
    const logoutResponse = await handleEndpoints({
      config: payload.config,
      request: new Request(new URL('/api/users/logout', request.url), {
        headers: request.headers,
        method: 'POST',
      }),
    })
    if (!logoutResponse.ok) {
      return NextResponse.json(
        { errors: [{ message: 'Session logout failed.' }] },
        { status: logoutResponse.status },
      )
    }
  }
  const requestUrl = new URL(request.url)
  const secureCookie = process.env.NODE_ENV === 'production' && requestUrl.protocol === 'https:'
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: 'payload-token',
    path: '/',
    sameSite: 'lax',
    secure: secureCookie,
    value: '',
  })
  return response
}
