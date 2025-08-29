import { NextResponse } from 'next/server'

// This endpoint is deprecated - use /download instead
export async function GET() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use /api/products/[id]/download instead.' },
    { status: 410 }
  )
}
