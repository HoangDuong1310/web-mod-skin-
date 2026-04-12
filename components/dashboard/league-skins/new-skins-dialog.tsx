'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Download, Loader2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import type { SyncData } from './types'

interface NewSkinsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  syncData: SyncData | null
  importing: boolean
  onImportSelected: (skinIds: number[]) => void
  onImportAll: () => void
}

export function NewSkinsDialog({
  open, onOpenChange, syncData, importing, onImportSelected, onImportAll,
}: NewSkinsDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedSkins, setSelectedSkins] = useState<Set<number>>(new Set())
  const [expandedChamps, setExpandedChamps] = useState<Set<number>>(new Set())

  if (!syncData) return null

  const { newSkinsByChampion } = syncData.diff

  const filtered = search
    ? newSkinsByChampion
        .map(c => ({
          ...c,
          skins: c.skins.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            c.championName.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter(c => c.skins.length > 0)
    : newSkinsByChampion

  const toggleChamp = (champId: number) => {
    setExpandedChamps(prev => {
      const next = new Set(prev)
      if (next.has(champId)) next.delete(champId)
      else next.add(champId)
      return next
    })
  }

  const toggleSkin = (skinId: number) => {
    setSelectedSkins(prev => {
      const next = new Set(prev)
      if (next.has(skinId)) next.delete(skinId)
      else next.add(skinId)
      return next
    })
  }

  const toggleChampSkins = (skins: { skinId: number }[]) => {
    setSelectedSkins(prev => {
      const next = new Set(prev)
      const allSelected = skins.every(s => next.has(s.skinId))
      if (allSelected) {
        skins.forEach(s => next.delete(s.skinId))
      } else {
        skins.forEach(s => next.add(s.skinId))
      }
      return next
    })
  }

  const selectAll = () => {
    const allIds = filtered.flatMap(c => c.skins.map(s => s.skinId))
    setSelectedSkins(new Set(allIds))
  }

  const deselectAll = () => setSelectedSkins(new Set())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Skin mới từ CommunityDragon
          </DialogTitle>
          <DialogDescription>
            {syncData.diff.totalNew} skin mới được tìm thấy. Chọn skin để import vào database.
          </DialogDescription>
        </DialogHeader>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm skin hoặc tướng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={selectAll}>Chọn tất cả</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Bỏ chọn</Button>
        </div>

        {/* Skin List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filtered.map(champ => {
              const isExpanded = expandedChamps.has(champ.championId)
              const champAllSelected = champ.skins.every(s => selectedSkins.has(s.skinId))
              const champSomeSelected = champ.skins.some(s => selectedSkins.has(s.skinId))

              return (
                <div key={champ.championId} className="border rounded-lg overflow-hidden">
                  {/* Champion Header */}
                  <div
                    className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => toggleChamp(champ.championId)}
                  >
                    <Checkbox
                      checked={champAllSelected}
                      // @ts-ignore
                      indeterminate={champSomeSelected && !champAllSelected}
                      onCheckedChange={() => toggleChampSkins(champ.skins)}
                      onClick={e => e.stopPropagation()}
                    />
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <img
                      src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.championId}.png`}
                      alt={champ.championName}
                      className="h-8 w-8 rounded-full bg-muted"
                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
                    />
                    <span className="font-medium flex-1">{champ.championName}</span>
                    <Badge variant="secondary">{champ.skins.length} skin</Badge>
                  </div>

                  {/* Skins List */}
                  {isExpanded && (
                    <div className="divide-y">
                      {champ.skins.map(skin => (
                        <label
                          key={skin.skinId}
                          className="flex items-center gap-3 p-3 pl-12 hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedSkins.has(skin.skinId)}
                            onCheckedChange={() => toggleSkin(skin.skinId)}
                          />
                          <img
                            src={skin.splashUrl || `https://cdn.communitydragon.org/latest/champion/${champ.championId}/splash-art/skin/${skin.skinId % 1000}`}
                            alt={skin.name}
                            className="h-10 w-16 rounded object-cover bg-muted"
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{skin.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {skin.skinId}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy skin nào
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Đã chọn {selectedSkins.size} / {syncData.diff.totalNew} skin
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onImportAll}
              disabled={importing}
              className="gap-2"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Import tất cả
            </Button>
            <Button
              onClick={() => onImportSelected(Array.from(selectedSkins))}
              disabled={importing || selectedSkins.size === 0}
              className="gap-2"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Import đã chọn ({selectedSkins.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
