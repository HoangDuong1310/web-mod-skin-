import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'

const RELAY_ADMIN_URL = process.env.AINZ_RELAY_ADMIN_URL || 'http://localhost:8766'
const RELAY_ADMIN_KEY = process.env.AINZ_RELAY_ADMIN_KEY || ''

export async function GET(
  _req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canAccessDashboard(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${RELAY_ADMIN_URL}/admin/rooms/${params.key}`, {
      headers: { 'X-Admin-Key': RELAY_ADMIN_KEY },
      next: { revalidate: 0 },
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Relay server error' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Relay server unreachable' }, { status: 503 })
  }
}
