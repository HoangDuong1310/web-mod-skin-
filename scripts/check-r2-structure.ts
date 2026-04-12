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

async function main() {
  // List top-level prefixes under league-skins/
  const r = await c.send(new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME || 'modskinslol',
    Prefix: 'league-skins/',
    MaxKeys: 50,
    Delimiter: '/',
  }))
  
  console.log('=== Top-level prefixes under league-skins/ ===')
  console.log(r.CommonPrefixes?.map(p => p.Prefix))
  console.log('Direct objects:', r.Contents?.map(o => o.Key))

  // Check skins/ structure
  const r2 = await c.send(new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME || 'modskinslol',
    Prefix: 'league-skins/skins/',
    MaxKeys: 20,
    Delimiter: '/',
  }))
  console.log('\n=== Skins sub-prefixes ===')
  console.log(r2.CommonPrefixes?.map(p => p.Prefix))
  
  // Check first champion folder
  if (r2.CommonPrefixes && r2.CommonPrefixes.length > 0) {
    const champPrefix = r2.CommonPrefixes[0].Prefix!
    const r3 = await c.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'modskinslol',
      Prefix: champPrefix,
      MaxKeys: 30,
    }))
    console.log(`\n=== Contents of ${champPrefix} ===`)
    console.log(r3.Contents?.map(o => ({ key: o.Key, size: o.Size })))
  }
}

main().catch(console.error)
