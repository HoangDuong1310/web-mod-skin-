import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/settings'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // This endpoint is public to allow maintenance mode checking
    const maintenanceMode = await getSetting('site.maintenanceMode')
    
    return NextResponse.json({
      maintenanceMode: maintenanceMode || false
    })
    
  } catch (error) {
    console.error('Error checking maintenance status:', error)
    // Default to false if error occurs
    return NextResponse.json({
      maintenanceMode: false
    })
  }
}
