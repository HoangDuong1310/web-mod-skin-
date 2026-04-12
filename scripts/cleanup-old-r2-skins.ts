/**
 * Clean up old R2 objects that are no longer needed after migration
 * - Removes leftover empty "folder marker" objects from leaked paths (league-skins/{champId}/)
 * 
 * Usage: npx tsx scripts/cleanup-old-r2-skins.ts [--dry-run]
 */
import 'dotenv/config'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'

const BUCKET = process.env.R2_BUCKET_NAME || 'modskinslol'
const DRY_RUN = process.argv.includes('--dry-run')

const c = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function main() {
  console.log(`=== Cleanup Old R2 League Skins ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Check for remaining leaked files
  let ct: string | undefined
  const leaked: string[] = []
  
  do {
    const r = await c.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'league-skins/',
      MaxKeys: 1000,
      ContinuationToken: ct,
    }))
    for (const o of r.Contents || []) {
      if (o.Key && o.Key.match(/^league-skins\/\d+\//)) {
        leaked.push(o.Key)
      }
    }
    ct = r.NextContinuationToken
  } while (ct)

  console.log(`Found ${leaked.length} remaining leaked files`)
  
  let deleted = 0
  for (const key of leaked) {
    console.log(`  DELETE: ${key}`)
    if (!DRY_RUN) {
      try {
        await c.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
        deleted++
      } catch (err) {
        console.error(`    ERROR: ${err}`)
      }
    } else {
      deleted++
    }
  }

  console.log(`\nDeleted: ${deleted}`)
  if (DRY_RUN) console.log('This was a DRY RUN.')
}

main().catch(console.error)
