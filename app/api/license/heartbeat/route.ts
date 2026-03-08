/**
 * API Route: /api/license/heartbeat
 * App gọi định kỳ để xác nhận vẫn đang sử dụng
 * Method: POST
 */

import { NextResponse } from 'next/server'
import { heartbeat, isValidKeyFormat, normalizeKey } from '@/lib/license-key'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, hwid } = body
    
    // Validate input
    if (!key || !hwid) {
      return NextResponse.json(
        { valid: false, error: 'MISSING_PARAMS' },
        { status: 400 }
      )
    }
    
    // Validate key format
    const normalizedKey = normalizeKey(key)
    if (!isValidKeyFormat(normalizedKey)) {
      return NextResponse.json(
        { valid: false, error: 'INVALID_FORMAT' },
        { status: 400 }
      )
    }
    
    // Get client info
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      'unknown'
    
    // Heartbeat
    const result = await heartbeat({
      key: normalizedKey,
      hwid,
      ipAddress,
    })
    
    if (!result.valid) {
      // SESSION_EXPIRED trả về 410 Gone - client cần re-activate
      const statusCode = result.error === 'SESSION_EXPIRED' ? 410 : 401
      return NextResponse.json(
        { valid: false, error: result.error, message: (result as any).message },
        { status: statusCode }
      )
    }
    
    return NextResponse.json({
      valid: true,
      data: result.data,
    })
  } catch (error) {
    console.error('License heartbeat error:', error)
    return NextResponse.json(
      { valid: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
