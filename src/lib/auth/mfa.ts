// @ts-ignore
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

const APP_NAME = 'COMUNET'

export function generateMfaSecret(): string {
  return authenticator.generateSecret()
}

export async function generateQrCodeDataUrl(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, APP_NAME, secret)
  return QRCode.toDataURL(otpauth)
}

export function verifyMfaToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    return false
  }
}
