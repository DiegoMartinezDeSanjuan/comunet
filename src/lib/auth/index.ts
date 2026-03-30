import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { getCache } from '@/lib/cache/config'

export interface Session {
  userId: string
  officeId: string
  role: UserRole
  name: string
  email: string
  linkedOwnerId: string | null
  linkedProviderId: string | null
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET

  if (!secret) {
    throw new Error(
      'FATAL: AUTH_SECRET environment variable is not set. ' +
      'This is required in all environments. Generate one with: openssl rand -base64 32',
    )
  }

  return new TextEncoder().encode(secret)
}

// Lazy: SECRET se evalúa en runtime, no durante el build de Docker
let _secret: Uint8Array | null = null
function getSecret(): Uint8Array {
  if (!_secret) _secret = getAuthSecret()
  return _secret
}
const COOKIE_NAME = 'comunet-session'
const EXPIRATION = '7d'
const EXPIRATION_SECONDS = 60 * 60 * 24 * 7 // 7 days in seconds

// ─── JWT Blocklist Key Convention ─────────────────────────
// Key: jwt:bl:{jti} — TTL: remaining seconds until token expiry

function blocklistKey(jti: string): string {
  return `jwt:bl:${jti}`
}

/**
 * Generate a unique JWT ID (jti) for token revocation.
 * Uses crypto.randomUUID which is available in Node.js 19+ and Edge runtimes.
 */
function generateJti(): string {
  return crypto.randomUUID()
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(session: Session): Promise<void> {
  const jti = generateJti()

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRATION)
    .setIssuedAt()
    .setJti(jti)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: EXPIRATION_SECONDS,
  })
}

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())

    // Check if token has been revoked via blocklist
    if (payload.jti) {
      const isRevoked = await isTokenRevoked(payload.jti)
      if (isRevoked) return null
    }

    return {
      userId: payload.userId as string,
      officeId: payload.officeId as string,
      role: payload.role as UserRole,
      name: payload.name as string,
      email: payload.email as string,
      linkedOwnerId: (payload.linkedOwnerId as string) || null,
      linkedProviderId: (payload.linkedProviderId as string) || null,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getCurrentSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await requireAuth()
  if (!roles.includes(session.role)) {
    throw new Error('FORBIDDEN')
  }
  return session
}

export async function destroySession(): Promise<void> {
  try {
    // Revoke the JWT so it can't be reused even if the cookie is stolen
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (token) {
      const { payload } = await jwtVerify(token, getSecret())
      if (payload.jti && payload.exp) {
        const remainingSec = Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
        if (remainingSec > 0) {
          await revokeToken(payload.jti, remainingSec)
        }
      }
    }
  } catch {
    // If token is already invalid/expired, just proceed with cookie deletion
  }

  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// ─── Token Blocklist Helpers ──────────────────────────────

async function revokeToken(jti: string, ttlSec: number): Promise<void> {
  try {
    await getCache().kv.set(blocklistKey(jti), true, ttlSec)
  } catch (err) {
    // Log but don't crash — graceful degradation
    console.error('[auth] Failed to revoke token in cache:', err)
  }
}

async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    const revoked = await getCache().kv.get<boolean>(blocklistKey(jti))
    return revoked === true
  } catch (err) {
    // If cache is down, allow the request (fail open) but log it
    console.error('[auth] Failed to check token blocklist:', err)
    return false
  }
}

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({
    where: { email, archivedAt: null },
    include: { office: true },
  })

  if (!user || user.status !== 'ACTIVE') return null
  if (!user.office || user.office.archivedAt) return null

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  return {
    userId: user.id,
    officeId: user.officeId,
    role: user.role,
    name: user.name,
    email: user.email,
    linkedOwnerId: user.linkedOwnerId,
    linkedProviderId: user.linkedProviderId,
  }
}

// Role hierarchy helpers
const BACKOFFICE_ROLES: UserRole[] = ['SUPERADMIN', 'OFFICE_ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER']
const PORTAL_ROLES: UserRole[] = ['OWNER', 'PRESIDENT', 'PROVIDER']

export function isBackofficeRole(role: UserRole): boolean {
  return BACKOFFICE_ROLES.includes(role)
}

export function isPortalRole(role: UserRole): boolean {
  return PORTAL_ROLES.includes(role)
}

export function getPostLoginRedirect(role: UserRole): string {
  if (isBackofficeRole(role)) return '/dashboard'
  if (role === 'PROVIDER') return '/portal'
  return '/portal' // OWNER, PRESIDENT
}
