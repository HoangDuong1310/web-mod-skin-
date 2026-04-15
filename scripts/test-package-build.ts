/**
 * Debug script — test building package with verbose logging
 * Run directly: npx tsx scripts/test-package-build.ts
 * 
 * This runs the same logic but with extra logging to find where it hangs.
 */
import 'dotenv/config'
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import yazl from 'yazl'
import { createWriteStream, createReadStream, unlinkSync, statSync } from 'fs'
import { createHash } from 'crypto'
import { tmpdir } from 'os'
import { join } from 'path'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'modskinslol'

const PACKAGE_KEY = 'league-skins/full-package.zip'
const SKINS_PREFIX = 'league-skins/skins/'
const RESOURCES_PREFIX = 'league-skins/resources/'
const MANIFEST_KEY = 'league-skins/manifest.json'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

async function listAll(prefix: string) {
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

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)}MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)}GB`
}

async function main() {
  const tmpPath = join(tmpdir(), `test-package-${Date.now()}.zip`)
  console.log(`Temp path: ${tmpPath}`)

  // 1. List
  console.log('Listing files...')
  const [skins, resources] = await Promise.all([
    listAll(SKINS_PREFIX),
    listAll(RESOURCES_PREFIX),
  ])
  const allFiles = [...skins, ...resources]
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: MANIFEST_KEY }))
    allFiles.push({ key: MANIFEST_KEY, size: 0 })
  } catch {}
  console.log(`Found ${allFiles.length} files (${skins.length} skins, ${resources.length} resources)`)

  // 2. Download + zip
  console.log('Creating zip...')
  const zipFile = new yazl.ZipFile()
  let added = 0
  let skipped = 0
  let totalBytes = 0
  const startTime = Date.now()

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i]
    const zipPath = file.key.replace(/^league-skins\//, '')

    // Log every 100 files and around the problem area (8570-8710)
    const shouldLog = i % 100 === 0 || (i >= 8570 && i <= 8710)

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
        zipFile.addBuffer(Buffer.from(bytes), zipPath, { compress: false })
        totalBytes += bytes.length
        added++
        if (shouldLog) {
          console.log(`  [${i + 1}/${allFiles.length}] OK ${formatBytes(bytes.length)} ${file.key.split('/').pop()}`)
        }
      } else {
        skipped++
        if (shouldLog) console.log(`  [${i + 1}/${allFiles.length}] EMPTY ${file.key}`)
      }
    } catch (err: any) {
      skipped++
      console.log(`  [${i + 1}/${allFiles.length}] FAIL ${file.key}: ${err.message}`)
    }
  }

  const dlTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\nDownload done: ${added} added, ${skipped} skipped, ${formatBytes(totalBytes)} total, ${dlTime}s`)

  // 3. Finalize zip
  console.log('Calling zipFile.end()...')
  const endStart = Date.now()
  zipFile.end()
  console.log(`zipFile.end() returned in ${Date.now() - endStart}ms`)

  // 4. Write to disk
  console.log('Piping to disk...')
  const pipeStart = Date.now()
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(tmpPath)
    zipFile.outputStream.pipe(output)
    output.on('close', () => {
      console.log(`Pipe done in ${Date.now() - pipeStart}ms`)
      resolve()
    })
    output.on('error', reject)
    zipFile.outputStream.on('error', reject)
  })

  const stat = statSync(tmpPath)
  console.log(`Zip file: ${formatBytes(stat.size)}`)

  // 5. Hash
  console.log('Computing hash...')
  const hash = await new Promise<string>((resolve, reject) => {
    const h = createHash('md5')
    const s = createReadStream(tmpPath)
    s.on('data', (chunk) => h.update(chunk))
    s.on('end', () => resolve(h.digest('hex')))
    s.on('error', reject)
  })
  console.log(`Hash: ${hash.substring(0, 8)}`)

  // 6. Upload
  console.log('Uploading to R2...')
  const uploadStart = Date.now()
  const fileStream = createReadStream(tmpPath)
  const upload = new Upload({
    client,
    params: { Bucket: R2_BUCKET_NAME, Key: PACKAGE_KEY, Body: fileStream, ContentType: 'application/zip' },
    queueSize: 4,
    partSize: 10 * 1024 * 1024,
  })
  upload.on('httpUploadProgress', (p) => {
    if (p.loaded) process.stdout.write(`\r  Upload: ${formatBytes(p.loaded)}/${formatBytes(stat.size)}`)
  })
  await upload.done()
  console.log(`\nUpload done in ${((Date.now() - uploadStart) / 1000).toFixed(1)}s`)

  // Cleanup
  unlinkSync(tmpPath)
  console.log(`\n✅ DONE! Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
