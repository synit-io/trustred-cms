import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
