import { prisma } from '@/lib/prisma'
import { uploadToR2, R2_PREFIXES, listR2Objects, existsInR2 } from '@/lib/r2'
import { PACKAGE_KEY } from '@/lib/league-skins-package'

/**
 * Generate manifest.json from DB and upload to R2.
 * Called automatically after file uploads and Sync R2 → DB.
 * Includes package info if a full-package.zip exists on R2.
 */
export async function generateAndUploadManifest(): Promise<{
  skinsCount: number
  resourceLanguages: number
}> {
  const skins = await prisma.leagueSkin.findMany({
    where: { isActive: true, fileUrl: { not: null }, fileHash: { not: null } },
    select: { skinId: true, fileHash: true, fileSize: true },
    orderBy: [{ championId: 'asc' }, { skinId: 'asc' }],
  })

  // Detect available resource languages on R2
  const resourceObjects = await listR2Objects(`${R2_PREFIXES.LEAGUE_SKINS}/resources/`)
  const resourceLanguages: string[] = []
  for (const obj of resourceObjects) {
    const match = obj.key.match(/resources\/([^/]+)\/skin_ids\.json$/)
    if (match) resourceLanguages.push(match[1])
  }

  const skinsMap: Record<string, { hash: string; size: number | null }> = {}
  for (const s of skins) {
    // Only include skins with valid hash (fileHash is guaranteed non-null by query filter)
    skinsMap[s.skinId.toString()] = {
      hash: s.fileHash!.substring(0, 8),
      size: s.fileSize,
    }
  }

  // Check for package info from DB settings
  let packageInfo: { hash: string; size: string; buildTime: string } | null = null
  try {
    const pkgSettings = await prisma.setting.findMany({
      where: {
        key: { in: ['league_skins_package_hash', 'league_skins_package_size', 'league_skins_package_built_at'] },
      },
    })
    const pkgMap = Object.fromEntries(pkgSettings.map((s) => [s.key, s.value]))
    const pkgExists = await existsInR2(PACKAGE_KEY)

    if (pkgExists && pkgMap.league_skins_package_hash) {
      packageInfo = {
        hash: pkgMap.league_skins_package_hash || '',
        size: pkgMap.league_skins_package_size || '0',
        buildTime: pkgMap.league_skins_package_built_at || '',
      }
    }
  } catch {
    // Package info not available, skip
  }

  const manifest: Record<string, unknown> = {
    version: Date.now(),
    resources: resourceLanguages,
    skins: skinsMap,
  }

  if (packageInfo) {
    manifest.package = {
      url: PACKAGE_KEY,
      hash: packageInfo.hash,
      size: packageInfo.size,
      buildTime: packageInfo.buildTime,
    }
  }

  const manifestBuffer = Buffer.from(JSON.stringify(manifest), 'utf-8')
  await uploadToR2(`${R2_PREFIXES.LEAGUE_SKINS}/manifest.json`, manifestBuffer, 'application/json')

  return { skinsCount: skins.length, resourceLanguages: resourceLanguages.length }
}
