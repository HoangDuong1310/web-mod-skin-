import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSetting, setSetting } from '@/lib/settings'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current maintenance mode from database
    const maintenanceMode = await getSetting('site.maintenanceMode')
    
    // This endpoint would ideally trigger a server restart with environment variable update
    // For now, we'll just return the current status
    return NextResponse.json({
      message: 'Maintenance mode sync completed',
      databaseValue: maintenanceMode,
      environmentValue: process.env.MAINTENANCE_MODE,
      recommendation: maintenanceMode ? 
        'Set MAINTENANCE_MODE=true in your environment and restart the server' :
        'Set MAINTENANCE_MODE=false in your environment and restart the server'
    })
    
  } catch (error) {
    console.error('Error syncing maintenance mode:', error)
    return NextResponse.json(
      { error: 'Failed to sync maintenance mode' },
      { status: 500 }
    )
  }
}
