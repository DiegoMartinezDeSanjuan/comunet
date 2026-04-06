import 'server-only'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { passwordResetLimiter } from '@/lib/cache/rate-limit'
import { hashPassword, revokeAllUserTokens } from '@/lib/auth'
import { logAudit } from '@/modules/audit/server/services'
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '@/lib/email'
import { 
  createPasswordResetTokenDb, 
  getValidPasswordResetTokenDb, 
  consumePasswordResetTokenDb 
} from './repository'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function requestPasswordReset(email: string, ip: string, userAgent?: string) {
  // 1. Rate limiting check
  const rlResult = await passwordResetLimiter.check(ip)
  if (!rlResult.allowed) {
    throw new Error('Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.')
  }

  // To prevent enumeration, we always take exactly identical execution paths for generic responses when possible.
  // Wait, Prisma lookups are fast, but returning success generically masks user existence.
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { office: true },
  })

  // We only permit ACTIVE. NEVER BLOCKED, INACTIVE or archived.
  if (!user || user.archivedAt || user.status !== 'ACTIVE' || !user.office) {
    // Silently succeed to prevent enumeration, but do not send email.
    return { success: true }
  }

  // Generate tokens
  const plainToken = generateOpaqueToken()
  const tokenHash = hashToken(plainToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 Hour

  // Store in DB, clearing old unused tokens for this user
  await createPasswordResetTokenDb(user.id, tokenHash, expiresAt, ip, userAgent)

  // Audit
  await logAudit({
    officeId: user.officeId,
    userId: user.id,
    entityType: 'user',
    entityId: user.id,
    action: 'PASSWORD_RESET_REQUEST',
    meta: { ip, userAgent },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Send Email
  await sendPasswordResetEmail({
    to: user.email,
    userName: user.name,
    resetToken: plainToken,
    appUrl,
  })

  return { success: true }
}

export async function executePasswordReset(plainToken: string, newPassword: string, ip: string, userAgent?: string) {
  // 1. Rate limiting check (we use a prefixed key to differentiate from request limit)
  const rlResult = await passwordResetLimiter.check(`execute:${ip}`)
  if (!rlResult.allowed) {
    throw new Error('Demasiados intentos. Por favor, inténtelo de nuevo más tarde.')
  }

  // Hash the incoming token
  const tokenHash = hashToken(plainToken)

  // Validate token in DB
  const tokenRecord = await getValidPasswordResetTokenDb(tokenHash)

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
    throw new Error('El enlace de recuperación es inválido o ha expirado.')
  }

  const user = tokenRecord.user
  if (!user || user.archivedAt || user.status !== 'ACTIVE') {
    throw new Error('Usuario inválido o bloqueado.')
  }

  // Perform secure operations
  const hashedNewPassword = await hashPassword(newPassword)

  // Atomically update user password and consume token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() }
    })
  ])

  // Revoke any existing active JWT sessions
  await revokeAllUserTokens(user.id)

  // Audit
  await logAudit({
    officeId: user.officeId,
    userId: user.id,
    entityType: 'user',
    entityId: user.id,
    action: 'PASSWORD_RESET_COMPLETE',
    meta: { ip, userAgent, tokenId: tokenRecord.id },
  })

  // Send Confirmation Email
  await sendPasswordChangedEmail({
    to: user.email,
    userName: user.name,
  })

  return { success: true }
}
