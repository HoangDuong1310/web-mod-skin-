import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'modskinslol'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.modskinslol.com'

// S3-compatible client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// R2 folder prefixes
export const R2_PREFIXES = {
  SOFTWARE: 'software',
  SKINS: 'skins',
  PREVIEWS: 'previews',
  PRODUCT_IMAGES: 'images/products',
} as const

/**
 * Upload a file buffer to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  return {
    key,
    url: getR2PublicUrl(key),
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  )
}

/**
 * Check if a file exists in R2
 */
export async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

/**
 * Get file from R2 as a readable stream/buffer
 */
export async function getFromR2(key: string): Promise<{
  body: ReadableStream | null
  contentType: string | undefined
  contentLength: number | undefined
}> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  )

  return {
    body: response.Body?.transformToWebStream() as ReadableStream | null,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  }
}

/**
 * Get file from R2 as a Buffer (for smaller files)
 */
export async function getBufferFromR2(key: string): Promise<{
  buffer: Buffer
  contentType: string | undefined
  contentLength: number | undefined
}> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  )

  const byteArray = await response.Body?.transformToByteArray()
  return {
    buffer: Buffer.from(byteArray || []),
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  }
}

/**
 * Generate a presigned URL for downloading (time-limited access)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn }
  )
}

/**
 * Generate a presigned URL for uploading (time-limited access)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  )
}

/**
 * Get the public CDN URL for a file
 */
export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Extract R2 key from a public URL or stored path
 * Handles:
 *   - Full URL: https://cdn.modskinslol.com/software/file.zip → software/file.zip
 *   - Stored path: /uploads/skins/file.zip → skins/file.zip
 *   - API path: /api/uploads/images/products/file.jpg → images/products/file.jpg
 *   - Already a key: software/file.zip → software/file.zip
 */
export function extractR2Key(pathOrUrl: string): string {
  if (!pathOrUrl) return ''

  // Full CDN URL
  if (pathOrUrl.startsWith(R2_PUBLIC_URL)) {
    return pathOrUrl.slice(R2_PUBLIC_URL.length + 1)
  }

  // API serve path: /api/uploads/images/products/file.jpg
  if (pathOrUrl.startsWith('/api/uploads/')) {
    return pathOrUrl.replace('/api/uploads/', '')
  }

  // Local upload path: /uploads/skins/file.zip or uploads/skins/file.zip
  if (pathOrUrl.includes('/uploads/')) {
    return pathOrUrl.split('/uploads/').pop() || pathOrUrl
  }

  // Already a clean key
  return pathOrUrl.replace(/^\//, '')
}

/**
 * Generate a safe filename for R2 storage
 */
export function generateR2Key(
  prefix: string,
  originalName: string,
  identifier?: string
): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const id = identifier ? `_${identifier}` : ''
  return `${prefix}/${timestamp}${id}_${random}.${extension}`
}

export { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL }
