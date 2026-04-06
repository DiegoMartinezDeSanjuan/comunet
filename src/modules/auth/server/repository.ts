import { prisma } from '@/lib/db'

export async function createPasswordResetTokenDb(userId: string, tokenHash: string, expiresAt: Date, reqIp?: string, reqUa?: string) {
  // First expire/delete any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null }
  })

  return prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      requestedIp: reqIp,
      requestedUserAgent: reqUa,
    }
  })
}

export async function getValidPasswordResetTokenDb(tokenHash: string) {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  })
}

export async function consumePasswordResetTokenDb(tokenId: string) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() }
  })
}
