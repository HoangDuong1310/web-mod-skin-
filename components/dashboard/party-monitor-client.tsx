'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, Radio, Wifi, WifiOff, RefreshCw, Eye, Loader2 } from 'lucide-react'

interface PartyStats {
  rooms: number
  connections: number
  max_members_per_room: number
}

interface RoomSummary {
  key: string
  members: number
  created_at: string
}

interface RoomMember {
  summoner_id: number
  summoner_name: string
  skin: {
    champion_id: number
    skin_id: number
    chroma_id: number | null
  } | null
}

interface RoomDetail {
  key: string
  members: RoomMember[]
  created_at: string
}

export function PartyMonitorClient() {
  const [stats, setStats] = useState<PartyStats | null>(null)
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [online, setOnline] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Room detail dialog
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>(null)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [roomLoading, setRoomLoading] = useState(false)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const [statsRes, roomsRes] = await Promise.all([
        fetch('/api/party/stats'),
        fetch('/api/party/rooms'),
      ])

      if (!statsRes.ok || !roomsRes.ok) throw new Error()

      const [statsData, roomsData] = await Promise.all([
        statsRes.json(),
        roomsRes.json(),
      ])

      setStats(statsData)
      setRooms(roomsData)
      setOnline(true)
    } catch {
      setOnline(false)
      setStats(null)
      setRooms([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 15_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const viewRoom = async (key: string) => {
    setRoomLoading(true)
    setRoomDialogOpen(true)
    try {
      const res = await fetch(`/api/party/rooms/${key}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedRoom(data)
    } catch {
      setSelectedRoom(null)
    } finally {
      setRoomLoading(false)
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Party Mode data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relay Status</CardTitle>
            {online ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <Badge variant={online ? 'default' : 'destructive'}>
              {online ? 'Online' : 'Offline'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rooms ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.connections ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Rooms</CardTitle>
            <CardDescription>
              All currently active Party Mode rooms
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active rooms</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Key</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.key}>
                    <TableCell className="font-mono text-xs">
                      {room.key.substring(0, 16)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {room.members} / {stats?.max_members_per_room ?? 10}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(room.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewRoom(room.key)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Room Detail Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Room Details</DialogTitle>
            <DialogDescription>
              {selectedRoom
                ? `Room ${selectedRoom.key.substring(0, 16)}... — Created ${formatTime(selectedRoom.created_at)}`
                : 'Loading...'}
            </DialogDescription>
          </DialogHeader>
          {roomLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedRoom ? (
            <div className="space-y-3">
              {selectedRoom.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No members in this room</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Summoner</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Skin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRoom.members.map((member) => (
                      <TableRow key={member.summoner_id}>
                        <TableCell className="font-medium">{member.summoner_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {member.summoner_id}
                        </TableCell>
                        <TableCell>
                          {member.skin ? (
                            <Badge variant="outline" className="text-xs">
                              Champion {member.skin.champion_id} / Skin {member.skin.skin_id}
                              {member.skin.chroma_id && ` / Chroma ${member.skin.chroma_id}`}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <p className="text-sm text-destructive text-center py-4">Failed to load room details</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
