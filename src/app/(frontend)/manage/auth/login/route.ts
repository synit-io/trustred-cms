import { NextResponse } from 'next/server'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { getPayloadClient } from '@/lib/trustred/cms'
import type { User } from '@/payload-types'
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
  let credentials: unknown
  try {
    credentials = await request.json()
  } catch {
    return NextResponse.json({ errors: [{ message: 'Invalid login request.' }] }, { status: 400 })
  }
  if (
    !credentials ||
    typeof credentials !== 'object' ||
    !('email' in credentials) ||
    typeof credentials.email !== 'string' ||
    !('password' in credentials) ||
    typeof credentials.password !== 'string'
  ) {
    return NextResponse.json({ errors: [{ message: 'Invalid login request.' }] }, { status: 400 })
  }
  const { email, password } = credentials

  try {
    const payload = await getPayloadClient()
    const result = await payload.login({
      collection: 'users',
      data: {
        email: String(email ?? ''),
        password: String(password ?? ''),
      },
    })

    if (!result.token) {
      return NextResponse.json(
        { errors: [{ message: 'The email or password provided is incorrect.' }] },
        { status: 401 },
      )
    }

    if (!userHasRole(result.user as User | null | undefined, trustredRoles.anyEditorial)) {
      const response = NextResponse.json(
        {
          errors: [{ message: 'User is authenticated but cannot access the editorial dashboard.' }],
        },
        { status: 403 },
      )

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

    const response = NextResponse.json({
      ok: true,
      redirectTo: '/manage',
      user: result.user,
    })
    response.headers.set('Cache-Control', 'no-store')

    response.cookies.set({
      httpOnly: true,
      name: 'payload-token',
      path: '/',
      sameSite: 'lax',
      secure: secureCookie,
      value: result.token,
    })

    return response
  } catch {
    return NextResponse.json(
      { errors: [{ message: 'The email or password provided is incorrect.' }] },
      { status: 401 },
    )
  }
}
