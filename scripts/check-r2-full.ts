/**
 * Comprehensive check of R2 league-skins structure
 * Shows what files exist in old vs new format and leaked paths
 */
import 'dotenv/config'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const c = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})
const BUCKET = process.env.R2_BUCKET_NAME || 'modskinslol'

async function listAll(prefix: string) {
  const objects: { key: string; size: number }[] = []
  let ct: string | undefined
  do {
    const r = await c.send(new ListObjectsV2Command({
      Bucket: BUCKET, Prefix: prefix, MaxKeys: 1000, ContinuationToken: ct,
    }))
    for (const o of r.Contents || []) {
      if (o.Key && o.Size) objects.push({ key: o.Key, size: o.Size })
    }
    ct = r.NextContinuationToken
  } while (ct)
  return objects
}

async function main() {
  // Get ALL files under league-skins/
  const allFiles = await listAll('league-skins/')
  console.log(`Total files under league-skins/: ${allFiles.length}\n`)

  // Categorize
  const oldFlat: string[] = []       // league-skins/skins/{champ}/{skin}.zip
  const newNested: string[] = []     // league-skins/skins/{champ}/{skin}/{skin}.zip
  const newChroma: string[] = []     // league-skins/skins/{champ}/{parent}/{chroma}/{chroma}.zip
  const leaked: string[] = []        // league-skins/{champ}/ (no skins/ folder)
  const other: string[] = []

  for (const f of allFiles) {
    if (f.key.match(/^league-skins\/skins\/\d+\/\d+\.zip$/)) {
      oldFlat.push(f.key)
    } else if (f.key.match(/^league-skins\/skins\/\d+\/\d+\/\d+\.zip$/)) {
      newNested.push(f.key)
    } else if (f.key.match(/^league-skins\/skins\/\d+\/\d+\/\d+\/\d+\.zip$/)) {
      newChroma.push(f.key)
    } else if (f.key.match(/^league-skins\/\d+\//)) {
      leaked.push(f.key)
    } else {
      other.push(f.key)
    }
  }

  console.log(`=== Old flat format (skins/{champ}/{skin}.zip) ===`)
  console.log(`Count: ${oldFlat.length}`)
  if (oldFlat.length > 0) console.log(`Samples: ${oldFlat.slice(0, 5).join('\n  ')}`)

  console.log(`\n=== New nested format (skins/{champ}/{skin}/{skin}.zip) ===`)
  console.log(`Count: ${newNested.length}`)
  if (newNested.length > 0) console.log(`Samples: ${newNested.slice(0, 5).join('\n  ')}`)

  console.log(`\n=== New chroma format (skins/{champ}/{parent}/{chroma}/{chroma}.zip) ===`)
  console.log(`Count: ${newChroma.length}`)
  if (newChroma.length > 0) console.log(`Samples: ${newChroma.slice(0, 5).join('\n  ')}`)

  console.log(`\n=== Leaked files (league-skins/{number}/ - missing skins/ folder) ===`)
  console.log(`Count: ${leaked.length}`)
  if (leaked.length > 0) console.log(`Samples: ${leaked.slice(0, 10).join('\n  ')}`)

  console.log(`\n=== Other files ===`)
  console.log(`Count: ${other.length}`)
  if (other.length > 0) console.log(`Files: ${other.join('\n  ')}`)
}

main().catch(console.error)
