'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Gamepad2, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

interface LiveStats {
  onlineCount: number
  inGameCount: number
  inLobbyCount: number
  idleCount: number
  totalInjections: number
}

export function LiveUsersWidget() {
  const [stats, setStats] = useState<LiveStats>({
    onlineCount: 0,
    inGameCount: 0,
    inLobbyCount: 0,
    idleCount: 0,
    totalInjections: 0,
  })
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/live-stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          setError(false)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoaded(true)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Real-Time Tracking
        </h3>
        <Link href="/dashboard/live-users" className="text-xs text-primary hover:underline">
          View Details →
        </Link>
      </div>
      {error && loaded && (
        <p className="text-xs text-muted-foreground mb-2">Unable to load live stats</p>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <div className="relative">
              <Users className="h-4 w-4 text-green-500" />
              {stats.onlineCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineCount}</div>
            <p className="text-xs text-muted-foreground">active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Game</CardTitle>
            <Gamepad2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inGameCount}</div>
            <p className="text-xs text-muted-foreground">playing now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Idle</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.idleCount}</div>
            <p className="text-xs text-muted-foreground">app open, not in game</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Injections</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInjections}</div>
            <p className="text-xs text-muted-foreground">total this session</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
