/**
 * API Route: /api/license/deactivate
 * Hủy kích hoạt thiết bị
 * Method: POST
 */

import { NextResponse } from 'next/server'
import { deactivateDevice, isValidKeyFormat, normalizeKey } from '@/lib/license-key'
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
    
    // Deactivate
    const result = await deactivateDevice({
      key: normalizedKey,
      hwid,
      ipAddress,
      userAgent,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('License deactivate error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Lỗi server' },
      { status: 500 }
    )
  }
}
