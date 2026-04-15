import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import yazl from 'yazl'
import {
  createWriteStream, createReadStream, unlinkSync, statSync,
  existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync,
} from 'fs'
import { createHash } from 'crypto'
import { join, dirname } from 'path'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'modskinslol'

const PACKAGE_KEY = 'league-skins/full-package.zip'
const SKINS_PREFIX = 'league-skins/skins/'
const RESOURCES_PREFIX = 'league-skins/resources/'
const MANIFEST_KEY = 'league-skins/manifest.json'

// Cache directory — persists between builds
const CACHE_DIR = join(process.cwd(), '.cache', 'league-skins-package')

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

async function listAllObjects(client: S3Client, prefix: string) {
  const objects: { key: string; size: number }[] = []
  let ct: string | undefined
  do {
    const r = await client.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: prefix, MaxKeys: 1000, ContinuationToken: ct })
    )
    for (const o of r.Contents || []) {
      if (o.Key && o.Size !== undefined) objects.push({ key: o.Key, size: o.Size })
    }
    ct = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (ct)
  return objects
}

export interface BuildProgress {
  phase: 'listing' | 'downloading' | 'zipping' | 'uploading' | 'done' | 'error'
  current: number
  total: number
  currentFile?: string
  bytesProcessed: number
  cached: number
  downloaded: number
  error?: string
}

export type ProgressCallback = (progress: BuildProgress) => void

/**
 * Build the full league-skins package zip with local file cache.
 *
 * Cache: .cache/league-skins-package/ — files cached by R2 key + size
 * On rebuild: only downloads new/changed files (compared by size)
 * Then builds zip from cache and uploads to R2.
 *
 * First build: ~18 min (download all). Subsequent: ~1-2 min (mostly cached).
 */
export async function buildFullPackage(
  onProgress?: ProgressCallback
): Promise<{ key: string; size: number; hash: string; fileCount: number }> {
  const client = getR2Client()
  const tmpZipPath = join(CACHE_DIR, `_package-${Date.now()}.zip`)

  // Ensure cache dir exists
  mkdirSync(CACHE_DIR, { recursive: true })

  // Load cache index (key → size mapping of cached files)
  const cacheIndexPath = join(CACHE_DIR, '_index.json')
  let cacheIndex: Record<string, number> = {}
  try {
    if (existsSync(cacheIndexPath)) {
      cacheIndex = JSON.parse(readFileSync(cacheIndexPath, 'utf-8'))
    }
  } catch {}

  const progress: BuildProgress = {
    phase: 'listing',
    current: 0,
    total: 0,
    bytesProcessed: 0,
    cached: 0,
    downloaded: 0,
  }
  const emit = () => onProgress?.(progress)

  try {
    // 1. List all files on R2
    emit()
    const [skinFiles, resourceFiles] = await Promise.all([
      listAllObjects(client, SKINS_PREFIX),
      listAllObjects(client, RESOURCES_PREFIX),
    ])
    const allFiles = [...skinFiles, ...resourceFiles]

    try {
      await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: MANIFEST_KEY }))
      allFiles.push({ key: MANIFEST_KEY, size: 0 })
    } catch {}

    progress.total = allFiles.length
    progress.phase = 'downloading'
    emit()

    // 2. Download only new/changed files to cache
    const newCacheIndex: Record<string, number> = {}

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i]
      // Cache path: .cache/league-skins-package/skins/1/1000/1000.zip
      const relativePath = file.key.replace(/^league-skins\//, '')
      const cachePath = join(CACHE_DIR, relativePath)

      progress.current = i + 1
      progress.currentFile = file.key
      emit()

      // Check if cached version is still valid (same size)
      const isCached = cacheIndex[file.key] === file.size &&
        existsSync(cachePath) &&
        (file.size === 0 || statSync(cachePath).size === file.size)

      if (isCached) {
        progress.cached++
        newCacheIndex[file.key] = file.size
        continue
      }

      // Download from R2
      try {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 30000)

        const resp = await client.send(
          new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: file.key }),
          { abortSignal: ac.signal }
        )
        const bytes = await resp.Body?.transformToByteArray()
        clearTimeout(timer)

        if (bytes && bytes.length > 0) {
          mkdirSync(dirname(cachePath), { recursive: true })
          writeFileSync(cachePath, bytes)
          progress.bytesProcessed += bytes.length
          progress.downloaded++
          newCacheIndex[file.key] = bytes.length
        }
      } catch (err: any) {
        console.error(`[${i + 1}/${allFiles.length}] SKIP ${file.key}: ${err.message || err}`)
      }
    }

    // Save updated cache index
    writeFileSync(cacheIndexPath, JSON.stringify(newCacheIndex, null, 2))

    console.log(`\n📋 Cache: ${progress.cached} cached, ${progress.downloaded} downloaded, ${allFiles.length} total`)

    // 3. Build zip from cache
    progress.phase = 'zipping'
    progress.current = 0
    emit()

    const zipFile = new yazl.ZipFile()
    let addedCount = 0

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i]
      const relativePath = file.key.replace(/^league-skins\//, '')
      const cachePath = join(CACHE_DIR, relativePath)

      progress.current = i + 1
      emit()

      if (existsSync(cachePath)) {
        const buf = readFileSync(cachePath)
        if (buf.length > 0) {
          zipFile.addBuffer(buf, relativePath, { compress: false })
          addedCount++
        }
      }
    }

    console.log(`📦 Added ${addedCount} files to zip. Writing...`)

    zipFile.end()

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(tmpZipPath)
      zipFile.outputStream.pipe(output)
      output.on('close', resolve)
      output.on('error', reject)
      zipFile.outputStream.on('error', reject)
    })

    const stat = statSync(tmpZipPath)
    console.log(`✅ Zip: ${(stat.size / (1024 * 1024)).toFixed(1)} MB`)

    // 4. Hash
    const hash = await new Promise<string>((resolve, reject) => {
      const h = createHash('md5')
      const s = createReadStream(tmpZipPath)
      s.on('data', (chunk) => h.update(chunk))
      s.on('end', () => resolve(h.digest('hex')))
      s.on('error', reject)
    })

    // 5. Upload to R2
    progress.phase = 'uploading'
    progress.current = 0
    progress.total = stat.size
    progress.bytesProcessed = 0
    emit()

    console.log(`☁️  Uploading...`)
    const fileStream = createReadStream(tmpZipPath)
    const upload = new Upload({
      client,
      params: { Bucket: R2_BUCKET_NAME, Key: PACKAGE_KEY, Body: fileStream, ContentType: 'application/zip' },
      queueSize: 4,
      partSize: 10 * 1024 * 1024,
    })
    upload.on('httpUploadProgress', (p) => {
      if (p.loaded) {
        progress.bytesProcessed = p.loaded
        progress.current = p.loaded
        emit()
      }
    })
    await upload.done()

    progress.phase = 'done'
    progress.bytesProcessed = stat.size
    emit()

    return { key: PACKAGE_KEY, size: stat.size, hash, fileCount: addedCount }
  } finally {
    try { unlinkSync(tmpZipPath) } catch {}
  }
}

export { PACKAGE_KEY }
