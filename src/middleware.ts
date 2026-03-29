import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { loginLimiter, apiLimiter } from '@/lib/rate-limit'

const PUBLIC_PATHS = ['/login', '/api/health']

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

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev 
    ? `'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'` 
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https:;
    connect-src 'self';
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
  `
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  const setCsp = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)
    return res
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return setCsp(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  // Block mock endpoints in production
  if (pathname.startsWith('/api/mock') && !isDev) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Allow mock endpoints in development without auth
  if (pathname.startsWith('/api/mock') && isDev) {
    return setCsp(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  // Rate limit API routes
  if (pathname.startsWith('/api/')) {
    const result = await apiLimiter.check(ip)
    if (!result.allowed) {
      return setCsp(rateLimitResponse(result.retryAfterMs))
    }
  }

  // Check for session cookie (real auth check happens in server components/actions)
  if (!PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    const sessionCookie = request.cookies.get('comunet-session')
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return setCsp(NextResponse.redirect(loginUrl))
    }
  }

  return setCsp(NextResponse.next({ request: { headers: requestHeaders } }))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
