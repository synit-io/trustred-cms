import { NextResponse } from 'next/server'

import { trustredRoles, userHasRole } from '@/access/hasRole'
import { getPayloadClient } from '@/lib/trustred/cms'
import type { User } from '@/payload-types'

export async function POST(request: Request) {
  const payload = await getPayloadClient()
  const requestUrl = new URL(request.url)
  const secureCookie = process.env.NODE_ENV === 'production' && requestUrl.protocol === 'https:'
  const { email, password } = (await request.json()) as {
    email?: string
    password?: string
  }

  try {
    const result = await payload.login({
      collection: 'users',
      data: {
        email: String(email ?? ''),
        password: String(password ?? ''),
      },
    })

    if (!result.token) {
      return NextResponse.json(
        { errors: [{ message: 'No token returned from Payload login.' }] },
        { status: 401 },
      )
    }

    if (!userHasRole(result.user as User | null | undefined, trustredRoles.anyEditorial)) {
      const response = NextResponse.json(
        { errors: [{ message: 'User is authenticated but cannot access the editorial dashboard.' }] },
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
