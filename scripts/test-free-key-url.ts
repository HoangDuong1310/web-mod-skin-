/**
 * Test script để kiểm tra free-key URL generation
 * Chạy: npx ts-node scripts/test-free-key-url.ts
 */

const { getSEOSettings } = require('../lib/dynamic-seo')
const crypto = require('crypto')

async function testFreeKeyUrlGeneration() {
    console.log('=== TEST: Free Key URL Generation ===\n')

    // 1. Test getSEOSettings
    console.log('1. Testing getSEOSettings()...')
    const settings = await getSEOSettings()
    console.log('   settings.siteUrl:', settings.siteUrl)
    console.log('   process.env.APP_URL:', process.env.APP_URL)
    console.log('   process.env.NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('   process.env.NODE_ENV:', process.env.NODE_ENV)
    console.log('')

    // 2. Generate test token và secret
    const testToken = crypto.randomBytes(32).toString('hex')
    const testSecret = crypto.randomBytes(16).toString('hex')
    console.log('2. Generated test tokens:')
    console.log('   Token:', testToken.substring(0, 16) + '...')
    console.log('   Secret:', testSecret)
    console.log('')

    // 3. Tính toán baseUrl theo logic trong generate route
    console.log('3. Calculating baseUrl (same logic as generate route)...')
    let baseUrl = ''

    try {
        baseUrl = settings.siteUrl || ''
        console.log('   Step 1 (settings.siteUrl):', baseUrl)
    } catch (e) {
        console.log('   ⚠️ Failed to get settings.siteUrl')
    }

    if (!baseUrl) {
        baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || ''
        console.log('   Step 2 (env vars):', baseUrl)
    }

    console.log('   FINAL baseUrl:', baseUrl)
    console.log('')

    // 4. Tạo callback URL
    const callbackUrl = `${baseUrl}/api/free-key/callback?token=${testToken}&secret=${testSecret}`
    console.log('4. Generated callback URL:')
    console.log('   ', callbackUrl.substring(0, 100) + '...')
    console.log('')

    // 5. Summary
    console.log('=== SUMMARY ===')
    console.log('URL này có chứa đúng domain https://modskinslol.com không?')
    const hasCorrectDomain = callbackUrl.includes('modskinslol.com')
    console.log('  ' + (hasCorrectDomain ? '✅ ĐÚNG' : '❌ SAI - Đang ra: ' + baseUrl))
    console.log('')

    // Check for localhost
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        console.log('🚨 PROBLEM: baseUrl đang là localhost!')
        console.log('   Kiểm tra: settings.siteUrl trong database =', settings.siteUrl)
        console.log('   Kiểm tra: process.env.APP_URL =', process.env.APP_URL)
    }
}

testFreeKeyUrlGeneration()
    .catch(console.error)
