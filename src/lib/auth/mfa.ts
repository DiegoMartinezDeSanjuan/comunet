import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import { encrypt, decrypt } from '../utils/encryption'

export function encryptSecret(secret: string): string {
  return encrypt(secret)
}

export function decryptSecret(encrypted: string): string {
  return decrypt(encrypted)
}
const APP_NAME = 'COMUNET'

export function generateMfaSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32
}

export async function generateQrCodeDataUrl(email: string, secret: string): Promise<string> {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  })
  return QRCode.toDataURL(totp.toString())
}

export function verifyMfaToken(token: string, secret: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    })
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  } catch (error) {
    return false
  }
}
