'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wifi, WifiOff, RefreshCw, Loader2, Save } from 'lucide-react'

interface PartyStats {
  rooms: number
  connections: number
  max_members_per_room: number
}

export function PartySettingsTab() {
  const [stats, setStats] = useState<PartyStats | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  // Settings form (read-only display — actual config is via env vars)
  const relayUrl = process.env.NEXT_PUBLIC_AINZ_RELAY_WS_URL || 'Not configured'

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/party/stats')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStats(data)
      setOnline(true)
    } catch {
      setOnline(false)
      setStats(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="space-y-6">
      {/* Relay Server Status */}
      <Card>
        <CardHeader>
          <CardTitle>Relay Server Status</CardTitle>
          <CardDescription>
            Current status of the Party Mode WebSocket relay server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {online === null ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : online ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">
                  {online === null ? 'Checking...' : online ? 'Server Online' : 'Server Offline'}
                </p>
                {online && stats && (
                  <p className="text-sm text-muted-foreground">
                    {stats.rooms} active rooms, {stats.connections} connections
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={checkStatus} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Party Mode Configuration</CardTitle>
          <CardDescription>
            These settings are configured via environment variables on the server.
            Changes require a server restart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Relay Admin URL</Label>
              <Input
                value={process.env.NEXT_PUBLIC_AINZ_RELAY_ADMIN_URL || 'Set AINZ_RELAY_ADMIN_URL in .env'}
                disabled
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                HTTP admin API endpoint (env: AINZ_RELAY_ADMIN_URL)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Relay WebSocket URL</Label>
              <Input
                value={relayUrl}
                disabled
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                WebSocket URL for clients (env: NEXT_PUBLIC_AINZ_RELAY_WS_URL)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Members Per Room</Label>
              <Input
                value={stats?.max_members_per_room ?? 'N/A'}
                disabled
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Configured on relay server (env: RELAY_MAX_MEMBERS)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Admin API Key</Label>
              <Input
                value="••••••••"
                disabled
                type="password"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Authentication key (env: AINZ_RELAY_ADMIN_KEY)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 font-mono text-xs space-y-1">
            <p># Next.js server (in .env)</p>
            <p>AINZ_RELAY_ADMIN_URL=http://your-domain.com:8766</p>
            <p>AINZ_RELAY_ADMIN_KEY=your-secret-admin-key</p>
            <p>NEXT_PUBLIC_AINZ_RELAY_WS_URL=ws://your-domain.com:8765</p>
            <p></p>
            <p># Relay server (on VPS)</p>
            <p>RELAY_PORT=8765</p>
            <p>RELAY_HTTP_PORT=8766</p>
            <p>RELAY_ADMIN_KEY=your-secret-admin-key</p>
            <p>RELAY_MAX_MEMBERS=10</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
