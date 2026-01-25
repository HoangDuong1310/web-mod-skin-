import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/settings'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// In-memory cache sync for middleware
// This allows the maintenance API to update the middleware cache
let maintenanceCache: { value: boolean; timestamp: number } | null = null
const CACHE_TTL = 60000

export async function GET() {
  try {
    // This endpoint is public to allow maintenance mode checking
    const maintenanceMode = await getSetting('site.maintenanceMode')
    const siteName = await getSetting('site.siteName')
    const supportEmail = await getSetting('site.supportEmail')

    // Update cache for middleware
    maintenanceCache = {
      value: maintenanceMode || false,
      timestamp: Date.now()
    }

    return NextResponse.json({
      maintenanceMode: maintenanceMode || false,
      siteName: siteName || null,
      supportEmail: supportEmail || null
    })

  } catch (error) {
    console.error('Error checking maintenance status:', error)
    // Default to false if error occurs
    return NextResponse.json({
      maintenanceMode: false,
      siteName: null,
      supportEmail: null
    })
  }
}

// Export cache accessor for use in other modules (like middleware sync)
export function getMaintenanceCache() {
  if (!maintenanceCache) return null
  const now = Date.now()
  if (now - maintenanceCache.timestamp > CACHE_TTL) {
    return null
  }
  return maintenanceCache.value
}
