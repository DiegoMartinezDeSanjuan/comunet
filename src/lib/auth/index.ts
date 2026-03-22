import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export interface Session {
  userId: string
  officeId: string
  role: UserRole
  name: string
  email: string
  linkedOwnerId: string | null
  linkedProviderId: string | null
}

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'comunet-dev-secret-change-in-production-min-32-chars'
)
const COOKIE_NAME = 'comunet-session'
const EXPIRATION = '7d'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRATION)
    .setIssuedAt()
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, SECRET)
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
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
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
