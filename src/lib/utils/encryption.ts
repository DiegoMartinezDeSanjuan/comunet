import crypto from 'crypto'

// Use a 32-byte key from environment
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'base64').length !== 32) {
  console.warn('WARNING: MFA_ENCRYPTION_KEY is missing or invalid. Encryption will fail.')
}

/**
 * Encrypts a text string using AES-256-GCM
 * @param text The plaintext string to encrypt
 * @returns The encrypted string in format: ivBase64:authTagBase64:contentBase64
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) throw new Error('MFA_ENCRYPTION_KEY is not defined')
  
  const key = Buffer.from(ENCRYPTION_KEY, 'base64')
  if (key.length !== 32) throw new Error('MFA_ENCRYPTION_KEY must be exactly 32 bytes (base64 encoded)')

  const iv = crypto.randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypts a text string using AES-256-GCM
 * @param encryptedText The encrypted string in format: ivBase64:authTagBase64:contentBase64
 * @returns The decrypted plaintext string
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) throw new Error('MFA_ENCRYPTION_KEY is not defined')
  
  const key = Buffer.from(ENCRYPTION_KEY, 'base64')
  if (key.length !== 32) throw new Error('MFA_ENCRYPTION_KEY must be exactly 32 bytes (base64 encoded)')

  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  
  const [ivBase64, authTagBase64, contentBase64] = parts
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(contentBase64, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
