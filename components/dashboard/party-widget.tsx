'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Radio, Wifi, WifiOff } from 'lucide-react'

interface PartyStats {
  rooms: number
  connections: number
  max_members_per_room: number
}

export function PartyWidget() {
  const [stats, setStats] = useState<PartyStats | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/party/stats')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setStats(data)
        setOnline(true)
      } catch {
        setOnline(false)
        setStats(null)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Party Mode</CardTitle>
        {online === null ? (
          <Radio className="h-4 w-4 text-muted-foreground animate-pulse" />
        ) : online ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={online ? 'default' : 'destructive'} className="text-xs">
            {online === null ? 'Checking...' : online ? 'Online' : 'Offline'}
          </Badge>
        </div>
        {online && stats ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Radio className="h-3 w-3" />
              <span>{stats.rooms} rooms</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{stats.connections} players</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Relay server unreachable</p>
        )}
      </CardContent>
    </Card>
  )
}
