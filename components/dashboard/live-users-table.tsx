'use client'

import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LiveUser {
  id: number
  licenseKey: string
  summonerName: string | null
  region: string | null
  phase: string | null
  gameMode: string | null
  champion: string | null
  skin: string | null
  appVersion: string | null
  uptimeMinutes: number
  injectionCount: number
  partyMode: boolean
  lastHeartbeat: string
}

interface LiveUsersResponse {
  total: number
  users: LiveUser[]
}

const phaseVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  InProgress: 'default',
  ChampSelect: 'default',
  Lobby: 'secondary',
  FINALIZATION: 'default',
  Matchmaking: 'secondary',
  ReadyCheck: 'secondary',
  GameStart: 'default',
  WaitingForStats: 'outline',
  EndOfGame: 'outline',
  Idle: 'outline',
}

const phaseColor: Record<string, string> = {
  InProgress: 'bg-green-500 hover:bg-green-600',
  ChampSelect: 'bg-blue-500 hover:bg-blue-600',
  FINALIZATION: 'bg-blue-400 hover:bg-blue-500',
  Lobby: 'bg-yellow-500 hover:bg-yellow-600',
  Matchmaking: 'bg-orange-500 hover:bg-orange-600',
  ReadyCheck: 'bg-orange-400 hover:bg-orange-500',
  GameStart: 'bg-emerald-500 hover:bg-emerald-600',
  WaitingForStats: 'bg-gray-500 hover:bg-gray-600',
  EndOfGame: 'bg-gray-400 hover:bg-gray-500',
  Idle: '',
}

function formatUptime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

export function LiveUsersTable() {
  const [data, setData] = useState<LiveUsersResponse | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/live-users')
        if (res.ok) {
          setData(await res.json())
        }
      } catch {
        // Silently fail
      }
    }

    fetchUsers()
    const interval = setInterval(fetchUsers, 10000)
    return () => clearInterval(interval)
  }, [])

  const users = data?.users || []
  const filtered = users.filter(
    (u) =>
      !search ||
      (u.summonerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.licenseKey || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.champion || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.skin || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.region || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Users ({data?.total || 0})</CardTitle>
          <Input
            placeholder="Search by name, key, champion, skin, region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Summoner</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Champion</TableHead>
                <TableHead>Skin</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Injects</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    {users.length === 0 ? 'No users online' : 'No matching users'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {u.summonerName || u.licenseKey}
                        {u.partyMode && (
                          <Badge variant="outline" className="text-xs">🎉</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.region || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={phaseColor[u.phase || 'Idle'] || ''}>
                        {u.phase || 'Idle'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{u.gameMode || '-'}</TableCell>
                    <TableCell className="text-sm">{u.champion || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" title={u.skin || ''}>
                      {u.skin || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.appVersion || '-'}</TableCell>
                    <TableCell className="text-sm">{formatUptime(u.uptimeMinutes)}</TableCell>
                    <TableCell className="text-sm">{u.injectionCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastHeartbeat ? timeAgo(u.lastHeartbeat) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
