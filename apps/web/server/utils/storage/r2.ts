import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// R2 configuration from environment
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

/**
 * Check if R2 storage is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL)
}

/**
 * Get R2 client instance (lazy initialization)
 */
let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured. Please set R2_* environment variables.')
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  }

  return r2Client
}

/**
 * Generate a safe filename for storage
 */
function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'png'
  const safeName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars
    .substring(0, 50) // Limit length

  return `${timestamp}-${randomSuffix}-${safeName}.${extension}`
}

/**
 * Upload a file to R2 storage
 * @param file - Buffer containing file data
 * @param filename - Original filename
 * @param contentType - MIME type of the file
 * @param folder - Folder prefix (default: 'logos')
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string,
  folder: string = 'logos',
): Promise<string> {
  const client = getR2Client()
  const safeFilename = generateSafeFilename(filename)
  const key = `${folder}/${safeFilename}`

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  }))

  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Delete a file from R2 storage
 * @param url - Public URL of the file to delete
 */
export async function deleteFromR2(url: string): Promise<void> {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) {
    // Not an R2 URL, skip deletion
    return
  }

  const client = getR2Client()
  const key = url.replace(`${R2_PUBLIC_URL}/`, '')

  await client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }))
}

/**
 * Validate file for upload
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
]

export function validateImageFile(
  data: Buffer | undefined,
  contentType: string | undefined,
): FileValidationResult {
  if (!data || data.length === 0) {
    return { valid: false, error: 'No file data provided' }
  }

  if (data.length > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  if (!contentType || !ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return { valid: false, error: `Invalid file type. Allowed: PNG, JPG, WebP, SVG` }
  }

  return { valid: true }
}
