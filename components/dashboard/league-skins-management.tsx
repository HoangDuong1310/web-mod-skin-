'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gamepad2, Globe, Database } from 'lucide-react'
import { toast } from 'sonner'
import type { SyncData, Champion, Skin, Stats } from './league-skins/types'
import { SyncOverview } from './league-skins/sync-overview'
import { NewSkinsDialog } from './league-skins/new-skins-dialog'
import { ChampionsGrid } from './league-skins/champions-grid'
import { ChampionDetail } from './league-skins/champion-detail'

export default function LeagueSkinsManagement() {
  // Sync state
  const [syncData, setSyncData] = useState<SyncData | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showNewSkins, setShowNewSkins] = useState(false)

  // Champions list state
  const [champions, setChampions] = useState<Champion[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [champPage, setChampPage] = useState(1)
  const [champTotalPages, setChampTotalPages] = useState(1)
  const [champSearch, setChampSearch] = useState('')
  const [champLoading, setChampLoading] = useState(false)

  // Champion detail state
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null)
  const [championSkins, setChampionSkins] = useState<Skin[]>([])
  const [skinsLoading, setSkinsLoading] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState('sync')

  // Fetch champions list
  const fetchChampions = useCallback(async () => {
    setChampLoading(true)
    try {
      const params = new URLSearchParams({
        page: champPage.toString(),
        limit: '20',
        search: champSearch,
      })
      const res = await fetch(`/api/admin/league-skins?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setChampions(data.champions || [])
      setStats(data.stats || null)
      setChampTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('Không thể tải danh sách tướng')
    } finally {
      setChampLoading(false)
    }
  }, [champPage, champSearch])

  // Fetch skins for a champion
  const fetchChampionSkins = useCallback(async (championId: number) => {
    setSkinsLoading(true)
    try {
      const params = new URLSearchParams({
        view: 'skins',
        championId: championId.toString(),
        limit: '200',
      })
      const res = await fetch(`/api/admin/league-skins?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setChampionSkins(data.skins || [])
    } catch {
      toast.error('Không thể tải danh sách skin')
    } finally {
      setSkinsLoading(false)
    }
  }, [])

  // Sync with CommunityDragon
  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/league-skins/sync-cdragon')
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      setSyncData(data)
      if (data.diff.totalNew > 0) {
        toast.success(`Tìm thấy ${data.diff.totalNew} skin mới!`)
      } else {
        toast.success('Database đã cập nhật mới nhất')
      }
    } catch {
      toast.error('Đồng bộ thất bại')
    } finally {
      setSyncing(false)
    }
  }

  // Import skins
  const handleImportAll = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/admin/league-skins/sync-cdragon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importAll: true }),
      })
      if (!res.ok) throw new Error('Import failed')
      const data = await res.json()
      toast.success(`Đã import ${data.imported} skin mới`)
      setShowNewSkins(false)
      handleSync()
      fetchChampions()
    } catch {
      toast.error('Import thất bại')
    } finally {
      setImporting(false)
    }
  }

  const handleImportSelected = async (skinIds: number[]) => {
    setImporting(true)
    try {
      const res = await fetch('/api/admin/league-skins/sync-cdragon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinIds }),
      })
      if (!res.ok) throw new Error('Import failed')
      const data = await res.json()
      toast.success(`Đã import ${data.imported} skin`)
      setShowNewSkins(false)
      handleSync()
      fetchChampions()
    } catch {
      toast.error('Import thất bại')
    } finally {
      setImporting(false)
    }
  }

  // Delete champion
  const handleDeleteChampion = async (championId: number) => {
    try {
      const res = await fetch('/api/admin/league-skins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championId }),
      })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Đã xóa tướng và tất cả skin')
      fetchChampions()
    } catch {
      toast.error('Xóa thất bại')
    }
  }

  // Select champion to view detail
  const handleSelectChampion = (champ: Champion) => {
    setSelectedChampion(champ)
    fetchChampionSkins(champ.championId)
  }

  // Effects
  useEffect(() => {
    fetchChampions()
  }, [fetchChampions])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setChampPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [champSearch])

  // If viewing champion detail
  if (selectedChampion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">League Skins</h1>
        </div>
        <ChampionDetail
          championId={selectedChampion.championId}
          championName={selectedChampion.nameEn}
          skins={championSkins}
          loading={skinsLoading}
          onBack={() => setSelectedChampion(null)}
          onRefresh={() => fetchChampionSkins(selectedChampion.championId)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">League Skins</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sync" className="gap-2">
            <Globe className="h-4 w-4" />
            Đồng bộ
          </TabsTrigger>
          <TabsTrigger value="champions" className="gap-2">
            <Database className="h-4 w-4" />
            Tướng & Skin
            {stats && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({stats.totalChampions})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="mt-4">
          <SyncOverview
            syncData={syncData}
            syncing={syncing}
            importing={importing}
            onSync={handleSync}
            onImportAll={handleImportAll}
            onViewNewSkins={() => setShowNewSkins(true)}
          />
        </TabsContent>

        <TabsContent value="champions" className="mt-4">
          <ChampionsGrid
            champions={champions}
            stats={stats}
            page={champPage}
            totalPages={champTotalPages}
            search={champSearch}
            loading={champLoading}
            onSearchChange={setChampSearch}
            onPageChange={setChampPage}
            onSelectChampion={handleSelectChampion}
            onRefresh={fetchChampions}
            onDeleteChampion={handleDeleteChampion}
          />
        </TabsContent>
      </Tabs>

      {/* New Skins Dialog */}
      <NewSkinsDialog
        open={showNewSkins}
        onOpenChange={setShowNewSkins}
        syncData={syncData}
        importing={importing}
        onImportSelected={handleImportSelected}
        onImportAll={handleImportAll}
      />
    </div>
  )
}
