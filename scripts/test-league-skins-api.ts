/**
 * Test all public League Skins API endpoints
 * Run: npx tsx scripts/test-league-skins-api.ts [baseUrl]
 * 
 * Examples:
 *   npx tsx scripts/test-league-skins-api.ts
 *   npx tsx scripts/test-league-skins-api.ts http://localhost:3000
 *   npx tsx scripts/test-league-skins-api.ts https://modskinslol.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'

function ok(msg: string) { console.log(`  ✅ ${msg}`) }
function fail(msg: string) { console.log(`  ❌ ${msg}`) }
function info(msg: string) { console.log(`  ℹ️  ${msg}`) }

async function testManifest() {
  console.log('\n📋 GET /api/league-skins/manifest')
  try {
    const res = await fetch(`${BASE_URL}/api/league-skins/manifest`)
    info(`Status: ${res.status}`)

    if (res.status === 404) {
      fail('Manifest not found — admin needs to generate it first')
      return null
    }

    if (res.status !== 200) {
      fail(`Unexpected status: ${res.status}`)
      return null
    }

    const data = await res.json()

    // Validate fields
    if (typeof data.version === 'number') ok(`version: ${data.version}`)
    else fail(`version should be number, got: ${typeof data.version}`)

    if (Array.isArray(data.resources)) ok(`resources: [${data.resources.join(', ')}]`)
    else fail(`resources should be array, got: ${typeof data.resources}`)

    if (typeof data.skins === 'object' && data.skins !== null) {
      const count = Object.keys(data.skins).length
      ok(`skins: ${count} entries`)

      // Check first skin entry format
      const firstKey = Object.keys(data.skins)[0]
      if (firstKey) {
        const firstSkin = data.skins[firstKey]
        info(`Sample skin [${firstKey}]: hash=${firstSkin.hash}, size=${firstSkin.size}`)
        if (firstSkin.hash === null || typeof firstSkin.hash === 'string') ok('hash field OK (string or null)')
        else fail(`hash should be string or null, got: ${typeof firstSkin.hash}`)
        if (firstSkin.size === null || typeof firstSkin.size === 'number') ok('size field OK (number or null)')
        else fail(`size should be number or null, got: ${typeof firstSkin.size}`)
      }
    } else {
      fail(`skins should be object, got: ${typeof data.skins}`)
    }

    if (data.package) {
      ok(`package present: hash=${data.package.hash}, size=${data.package.size}`)
      if (typeof data.package.size === 'string') ok('package.size is string (correct)')
      else fail(`package.size should be string, got: ${typeof data.package.size}`)
    } else {
      info('package field not present (package not built yet)')
    }

    return data
  } catch (err: any) {
    fail(`Request failed: ${err.message}`)
    return null
  }
}

async function testSkinDownload(skinId: number) {
  console.log(`\n📥 GET /api/league-skins/${skinId}/download`)
  try {
    const res = await fetch(`${BASE_URL}/api/league-skins/${skinId}/download`, {
      redirect: 'manual',
    })
    info(`Status: ${res.status}`)

    if (res.status === 302 || res.status === 307 || res.status === 308) {
      const location = res.headers.get('location')
      if (location) {
        ok(`Redirect ${res.status} to presigned URL: ${location.substring(0, 80)}...`)
        if (location.includes('r2.cloudflarestorage.com') || location.includes('X-Amz-Signature') || location.includes('cdn.')) {
          ok('URL is a valid presigned/CDN URL')
        } else {
          info(`Redirect URL: ${location.substring(0, 120)}`)
        }
      } else {
        fail(`${res.status} but no Location header`)
      }
    } else if (res.status === 404) {
      info(`Skin ${skinId} not found or no file`)
    } else {
      fail(`Unexpected status: ${res.status}`)
    }
  } catch (err: any) {
    fail(`Request failed: ${err.message}`)
  }
}

async function testInvalidSkinDownload() {
  console.log('\n📥 GET /api/league-skins/99999999/download (invalid)')
  try {
    const res = await fetch(`${BASE_URL}/api/league-skins/99999999/download`, {
      redirect: 'manual',
    })
    info(`Status: ${res.status}`)
    if (res.status === 404) {
      const data = await res.json()
      ok(`404 with error: ${data.error}`)
    } else {
      fail(`Expected 404, got ${res.status}`)
    }
  } catch (err: any) {
    fail(`Request failed: ${err.message}`)
  }
}

async function testPackage() {
  console.log('\n📦 GET /api/league-skins/package')
  try {
    const res = await fetch(`${BASE_URL}/api/league-skins/package`, {
      redirect: 'manual',
    })
    info(`Status: ${res.status}`)

    if (res.status === 302 || res.status === 307 || res.status === 308) {
      const location = res.headers.get('location')
      if (location) {
        ok(`Redirect ${res.status} to presigned URL: ${location.substring(0, 80)}...`)
      } else {
        fail(`${res.status} but no Location header`)
      }
    } else if (res.status === 404) {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        info(`Package not built yet: ${data.error}`)
      } catch {
        fail(`404 but response is HTML (route not deployed yet): ${text.substring(0, 80)}`)
      }
    } else {
      fail(`Unexpected status: ${res.status}`)
    }
  } catch (err: any) {
    fail(`Request failed: ${err.message}`)
  }
}

async function testResources(lang: string) {
  console.log(`\n🌐 GET /api/league-skins/resources/${lang}`)
  try {
    const res = await fetch(`${BASE_URL}/api/league-skins/resources/${lang}`)
    info(`Status: ${res.status}`)

    if (res.status === 200) {
      const contentType = res.headers.get('content-type')
      const contentDisposition = res.headers.get('content-disposition')
      ok(`Content-Type: ${contentType}`)
      ok(`Content-Disposition: ${contentDisposition}`)

      const text = await res.text()
      try {
        const json = JSON.parse(text)
        const count = Object.keys(json).length
        ok(`Valid JSON with ${count} skin entries`)
        const firstKey = Object.keys(json)[0]
        if (firstKey) info(`Sample: "${firstKey}": "${json[firstKey]}"`)
      } catch {
        fail('Response is not valid JSON')
      }
    } else if (res.status === 404) {
      info(`Language "${lang}" not available on R2`)
    } else {
      fail(`Unexpected status: ${res.status}`)
    }
  } catch (err: any) {
    fail(`Request failed: ${err.message}`)
  }
}

async function testInvalidLang() {
  console.log('\n🌐 GET /api/league-skins/resources/invalid_lang')
  try {
    const res = await fetch(`${BASE_URL}/api/league-skins/resources/invalid_lang`)
    info(`Status: ${res.status}`)
    if (res.status === 400) {
      const data = await res.json()
      ok(`400 with error: ${data.error}`)
    } else {
      fail(`Expected 400, got ${res.status}`)
    }
  } catch (err: any) {
    fail(`Request failed: ${err.message}`)
  }
}

async function main() {
  console.log(`\n🧪 Testing League Skins API at: ${BASE_URL}`)
  console.log('='.repeat(60))

  // 1. Test manifest
  const manifest = await testManifest()

  // 2. Test skin download with real skinId from manifest
  if (manifest?.skins) {
    const skinIds = Object.keys(manifest.skins)
    if (skinIds.length > 0) {
      await testSkinDownload(parseInt(skinIds[0]))
    }
  } else {
    // Test with a common skinId
    await testSkinDownload(1001)
  }

  // 3. Test invalid skin
  await testInvalidSkinDownload()

  // 4. Test package
  await testPackage()

  // 5. Test resources
  await testResources('vi')
  await testResources('en')

  // 6. Test invalid lang
  await testInvalidLang()

  console.log('\n' + '='.repeat(60))
  console.log('✅ Test complete\n')
}

main().catch(console.error)
