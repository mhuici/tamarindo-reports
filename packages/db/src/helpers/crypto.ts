import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 64
const KEY_LENGTH = 32
const ITERATIONS = 100000

/**
 * Get encryption key from environment or generate a warning
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production'
  // Derive a proper key from the secret using PBKDF2
  return crypto.pbkdf2Sync(secret, 'tamarindo-salt', ITERATIONS, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt sensitive data (like OAuth tokens)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getEncryptionKey()

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }

  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const key = getEncryptionKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypt an object (like OAuth credentials)
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt to an object
 */
export function decryptObject<T>(encryptedText: string): T {
  const decrypted = decrypt(encryptedText)
  return JSON.parse(decrypted) as T
}

/**
 * Hash a password using bcrypt-like approach with crypto
 * Note: In production, use bcrypt package instead
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
}

/**
 * Generate a secure random token (for password reset, etc.)
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate a short slug-safe token
 */
export function generateShortToken(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}
