/**
 * API Route: /api/license/activate
 * Kích hoạt license key với HWID
 * Method: POST
 */

import { NextResponse } from 'next/server'
import { activateKey, isValidKeyFormat, normalizeKey } from '@/lib/license-key'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, hwid, deviceName, deviceInfo } = body
    
    // Validate input
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'MISSING_KEY', message: 'Vui lòng cung cấp license key' },
        { status: 400 }
      )
    }
    
    if (!hwid || typeof hwid !== 'string') {
      return NextResponse.json(
        { success: false, error: 'MISSING_HWID', message: 'Vui lòng cung cấp Hardware ID' },
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
    
    // Activate key
    const result = await activateKey({
      key: normalizedKey,
      hwid,
      deviceName: deviceName || undefined,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
      ipAddress,
      userAgent,
    })
    
    if (!result.success) {
      const statusCode = result.error === 'INVALID_KEY' ? 404 : 400
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: statusCode }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    })
  } catch (error) {
    console.error('License activate error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Lỗi server' },
      { status: 500 }
    )
  }
}
