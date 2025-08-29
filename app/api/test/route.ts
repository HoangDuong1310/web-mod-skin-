import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    message: 'Debug endpoint working'
  })
}
