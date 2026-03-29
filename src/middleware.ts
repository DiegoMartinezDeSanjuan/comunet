import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { loginLimiter, apiLimiter } from '@/lib/rate-limit'

const PUBLIC_PATHS = ['/login', '/api/health', '/api/mock']

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    },
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Rate limit API routes
  if (pathname.startsWith('/api/')) {
    const result = await apiLimiter.check(ip)
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfterMs)
    }
  }

  // Check for session cookie (real auth check happens in server components/actions)
  const sessionCookie = request.cookies.get('comunet-session')
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
