/**
 * API Route: /api/license/validate
 * Validate license key (không kích hoạt)
 * Method: POST
 */

import { NextResponse } from 'next/server'
import { validateKey, isValidKeyFormat, normalizeKey } from '@/lib/license-key'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, hwid } = body
    
    // Validate input
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'MISSING_KEY', message: 'Vui lòng cung cấp license key' },
        { status: 400 }
      )
    }
    
    // Validate key format
    const normalizedKey = normalizeKey(key)
    if (!isValidKeyFormat(normalizedKey)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_FORMAT', message: 'Định dạng key không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Get client info
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      'unknown'
    const userAgent = headersList.get('user-agent') || undefined
    
    // Validate key
    const result = await validateKey({
      key: normalizedKey,
      hwid: hwid || undefined,
      ipAddress,
      userAgent,
    })
    
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('License validate error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Lỗi server' },
      { status: 500 }
    )
  }
}
