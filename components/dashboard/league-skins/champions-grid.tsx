'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search, Trash2, ChevronLeft, ChevronRight,
  Loader2, Gamepad2,
} from 'lucide-react'
import type { Champion } from './types'

interface ChampionsGridProps {
  champions: Champion[]
  stats: { totalChampions: number; totalSkins: number; totalWithFiles: number } | null
  page: number
  totalPages: number
  search: string
  loading: boolean
  onSearchChange: (s: string) => void
  onPageChange: (p: number) => void
  onSelectChampion: (c: Champion) => void
  onRefresh: () => void
  onDeleteChampion: (championId: number) => void
}

export function ChampionsGrid({
  champions, stats, page, totalPages, search, loading,
  onSearchChange, onPageChange, onSelectChampion, onRefresh, onDeleteChampion,
}: ChampionsGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<Champion | null>(null)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm tướng..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : champions.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Chưa có tướng nào trong database</p>
          <p className="text-sm text-muted-foreground mt-1">Hãy đồng bộ từ CommunityDragon để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {champions.map(champ => {
            const withFile = champ.skins.filter(s => s.fileUrl).length
            const total = champ._count.skins
            const coverage = total > 0 ? Math.round((withFile / total) * 100) : 0

            return (
              <Card
                key={champ.id}
                className="group hover:shadow-md transition-all cursor-pointer border-muted hover:border-primary/30"
                onClick={() => onSelectChampion(champ)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.championId}.png`}
                      alt={champ.nameEn}
                      className="h-12 w-12 rounded-lg bg-muted flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{champ.nameEn}</h3>
                      {champ.nameVi && (
                        <p className="text-xs text-muted-foreground truncate">{champ.nameVi}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {total} skin
                        </Badge>
                        {withFile > 0 && (
                          <Badge
                            variant={coverage === 100 ? 'default' : 'outline'}
                            className={`text-xs ${coverage === 100 ? 'bg-green-600' : ''}`}
                          >
                            {withFile}/{total} file
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(champ) }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mini progress bar */}
                  {total > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            coverage === 100 ? 'bg-green-500' : coverage > 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${coverage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tướng {deleteTarget?.nameEn}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả {deleteTarget?._count.skins} skin và file liên quan sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDeleteChampion(deleteTarget.championId)
                  setDeleteTarget(null)
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
