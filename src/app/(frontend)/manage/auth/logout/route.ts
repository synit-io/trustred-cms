import { NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/trustred/request-security'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { errors: [{ message: 'Request origin is not allowed.' }] },
      { status: 403 },
    )
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
