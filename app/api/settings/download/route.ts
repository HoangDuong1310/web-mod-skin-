import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export async function GET() {
  try {
    const settings = await getSettings('site')
    
    return NextResponse.json({
      downloadDelayEnabled: settings.downloadDelayEnabled ?? true,
      downloadDelaySeconds: settings.downloadDelaySeconds ?? 30
    })
  } catch (error) {
    console.error('Error fetching download settings:', error)
    // Return defaults on error
    return NextResponse.json({
      downloadDelayEnabled: true,
      downloadDelaySeconds: 30
    })
  }
}