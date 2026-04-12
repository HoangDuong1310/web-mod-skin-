'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Trash2, Eye, Loader2, CheckCircle, XCircle,
  FileUp, ArrowLeft, Search, FolderUp, ChevronDown, ChevronRight,
  Palette, Replace,
} from 'lucide-react'
import type { Skin } from './types'
import { toast } from 'sonner'

interface ChampionDetailProps {
  championId: number
  championName: string
  skins: Skin[]
  loading: boolean
  onBack: () => void
  onRefresh: () => void
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ChampionDetail({
  championId, championName, skins, loading, onBack, onRefresh,
}: ChampionDetailProps) {
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState<number | null>(null)
  const [previewSkin, setPreviewSkin] = useState<Skin | null>(null)
  const [deleteSkin, setDeleteSkin] = useState<Skin | null>(null)
  const [togglingActive, setTogglingActive] = useState<number | null>(null)
  const [filterFile, setFilterFile] = useState<'all' | 'has-file' | 'no-file'>('all')
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, matched: 0, errors: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetSkinId, setUploadTargetSkinId] = useState<number | null>(null)
  const [expandedSkins, setExpandedSkins] = useState<Set<number>>(new Set())

  const getSplashUrl = (skinId: number) => {
    const skinNum = skinId % 1000
    return `https://cdn.communitydragon.org/latest/champion/${championId}/splash-art/skin/${skinNum}`
  }

  // Group skins: main skins with their chromas
  const mainSkins = skins.filter(s => !s.isChroma)
  const chromaMap = new Map<number, Skin[]>()
  for (const s of skins.filter(s => s.isChroma && s.parentSkinId)) {
    const list = chromaMap.get(s.parentSkinId!) || []
    list.push(s)
    chromaMap.set(s.parentSkinId!, list)
  }

  const filtered = mainSkins.filter(s => {
    const matchSearch = !search ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.skinId.toString().includes(search)
    const matchFile = filterFile === 'all' ||
      (filterFile === 'has-file' && s.fileUrl) ||
      (filterFile === 'no-file' && !s.fileUrl)
    return matchSearch && matchFile
  })

  const handleUpload = async (skinId: number, file: File) => {
    setUploading(skinId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/admin/league-skins/${skinId}`, {
        method: 'PUT',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      toast.success(`Upload file cho skin ${skinId} thanh cong`)
      onRefresh()
    } catch {
      toast.error('Upload that bai')
    } finally {
      setUploading(null)
    }
  }

  const handleBulkUpload = async (files: FileList) => {
    const skinIds = new Set(skins.map(s => s.skinId))
    const matchedFiles: { skinId: number; file: File }[] = []
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.zip')) continue
      const skinId = parseInt(file.name.replace(/\.zip$/i, ''))
      if (!isNaN(skinId) && skinIds.has(skinId)) {
        matchedFiles.push({ skinId, file })
      }
    }
    if (matchedFiles.length === 0) {
      toast.error('Khong tim thay file nao khop voi skin ID')
      return
    }
    setBulkUploading(true)
    setBulkProgress({ done: 0, total: matchedFiles.length, matched: matchedFiles.length, errors: 0 })
    let errors = 0
    for (let i = 0; i < matchedFiles.length; i++) {
      const { skinId, file } = matchedFiles[i]
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`/api/admin/league-skins/${skinId}`, { method: 'PUT', body: formData })
        if (!res.ok) throw new Error('Upload failed')
      } catch {
        errors++
      }
      setBulkProgress({ done: i + 1, total: matchedFiles.length, matched: matchedFiles.length, errors })
    }
    setBulkUploading(false)
    toast.success(`Bulk upload: ${matchedFiles.length - errors}/${matchedFiles.length} thanh cong`)
    onRefresh()
  }

  const handleDelete = async (skin: Skin) => {
    try {
      const res = await fetch('/api/admin/league-skins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinId: skin.skinId }),
      })
      if (!res.ok) throw new Error('Delete failed')
      toast.success(`Da xoa skin ${skin.nameEn}`)
      onRefresh()
    } catch {
      toast.error('Xoa that bai')
    }
  }

  const handleToggleActive = async (skin: Skin) => {
    setTogglingActive(skin.skinId)
    try {
      const res = await fetch(`/api/admin/league-skins/${skin.skinId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !skin.isActive }),
      })
      if (!res.ok) throw new Error('Toggle failed')
      toast.success(`Skin ${skin.nameEn} da ${!skin.isActive ? 'bat' : 'tat'}`)
      onRefresh()
    } catch {
      toast.error('Cap nhat that bai')
    } finally {
      setTogglingActive(null)
    }
  }

  const toggleExpanded = (skinId: number) => {
    setExpandedSkins(prev => {
      const next = new Set(prev)
      if (next.has(skinId)) next.delete(skinId)
      else next.add(skinId)
      return next
    })
  }

  const withFile = skins.filter(s => s.fileUrl).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img
          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`}
          alt={championName}
          className="h-10 w-10 rounded-lg bg-muted"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
        />
        <div>
          <h2 className="text-lg font-semibold">{championName}</h2>
          <p className="text-sm text-muted-foreground">
            {mainSkins.length} skin &middot; {skins.length - mainSkins.length} chromas &middot; {withFile} co file
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tim skin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'has-file', 'no-file'] as const).map(f => (
            <Button
              key={f}
              variant={filterFile === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterFile(f)}
              className="text-xs"
            >
              {f === 'all' ? `Tat ca (${mainSkins.length})` :
               f === 'has-file' ? `Co file (${mainSkins.filter(s => s.fileUrl).length})` :
               `Chua co (${mainSkins.filter(s => !s.fileUrl).length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && uploadTargetSkinId) {
            handleUpload(uploadTargetSkinId, file)
          }
          e.target.value = ''
        }}
      />

      {/* Folder upload input */}
      <input
        ref={folderInputRef}
        type="file"
        accept=".zip"
        multiple
        className="hidden"
        {...{ webkitdirectory: '' } as any}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleBulkUpload(e.target.files)
          }
          e.target.value = ''
        }}
      />

      {/* Bulk Upload Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Bulk Upload</p>
          <p className="text-xs text-muted-foreground">
            Chon thu muc chua file .zip dat ten theo skinId (bao gom ca chromas)
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={bulkUploading}
          onClick={() => folderInputRef.current?.click()}
        >
          {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderUp className="h-4 w-4" />}
          {bulkUploading ? 'Dang upload...' : 'Chon thu muc'}
        </Button>
      </div>

      {/* Bulk Progress */}
      {(bulkUploading || bulkProgress.total > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Match {bulkProgress.matched} file &middot; Upload {bulkProgress.done}/{bulkProgress.total}
              {bulkProgress.errors > 0 && <span className="text-destructive"> &middot; {bulkProgress.errors} loi</span>}
            </span>
            <span className="text-muted-foreground">
              {bulkProgress.total > 0 ? Math.round((bulkProgress.done / bulkProgress.total) * 100) : 0}%
            </span>
          </div>
          <Progress value={bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0} className="h-2" />
        </div>
      )}

      {/* Skins List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(skin => {
            const splashUrl = getSplashUrl(skin.skinId)
            const chromas = chromaMap.get(skin.skinId) || []
            const hasChromas = chromas.length > 0
            const isExpanded = expandedSkins.has(skin.skinId)
            const chromasWithFile = chromas.filter(c => c.fileUrl).length

            return (
              <div
                key={skin.skinId}
                className={`group relative rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                  !skin.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Splash Art */}
                <div className="relative h-36 bg-muted overflow-hidden">
                  <img
                    src={splashUrl}
                    alt={skin.nameEn}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Status badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {skin.fileUrl ? (
                      <Badge className="bg-green-600 text-white text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Co file
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        <XCircle className="h-3 w-3 mr-1" />
                        Chua co
                      </Badge>
                    )}
                  </div>

                  {/* Preview button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setPreviewSkin(skin)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>

                  {/* Name overlay */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white font-medium text-sm truncate drop-shadow-lg">
                      {skin.nameEn}
                    </p>
                    <p className="text-white/70 text-xs">
                      ID: {skin.skinId} &middot; v{skin.version}
                      {skin.fileSize ? ` \u00B7 ${formatFileSize(skin.fileSize)}` : ''}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={skin.isActive}
                      disabled={togglingActive === skin.skinId}
                      onCheckedChange={() => handleToggleActive(skin)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {skin.isActive ? 'Bat' : 'Tat'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={uploading === skin.skinId}
                      onClick={() => {
                        setUploadTargetSkinId(skin.skinId)
                        fileInputRef.current?.click()
                      }}
                    >
                      {uploading === skin.skinId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : skin.fileUrl ? (
                        <Replace className="h-3 w-3" />
                      ) : (
                        <FileUp className="h-3 w-3" />
                      )}
                      {skin.fileUrl ? 'Thay file' : 'Upload'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteSkin(skin)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Chromas Section - Collapsible via state */}
                {hasChromas && (
                  <div className="border-t">
                    {/* Chromas toggle header */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-950/30 dark:to-pink-950/30 hover:from-purple-100/80 hover:to-pink-100/80 dark:hover:from-purple-950/50 dark:hover:to-pink-950/50 transition-colors"
                      onClick={() => toggleExpanded(skin.skinId)}
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          {chromas.length} Chromas
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({chromasWithFile}/{chromas.length} co file)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Mini dot indicators */}
                        <div className="flex gap-0.5">
                          {chromas.map(c => (
                            <div
                              key={c.skinId}
                              className={`w-1.5 h-1.5 rounded-full ${c.fileUrl ? 'bg-green-500' : 'bg-red-300 dark:bg-red-800'}`}
                            />
                          ))}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Chromas list - expanded */}
                    {isExpanded && (
                      <div className="divide-y">
                        {chromas.map(chroma => (
                          <div
                            key={chroma.skinId}
                            className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                              !chroma.isActive ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Chroma info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{chroma.nameEn}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">ID: {chroma.skinId}</span>
                                {chroma.fileUrl ? (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                    Co file
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                                    <XCircle className="h-2.5 w-2.5 mr-0.5" />
                                    Chua co
                                  </Badge>
                                )}
                                {chroma.fileSize ? (
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatFileSize(chroma.fileSize)}
                                  </span>
                                ) : null}
                                <span className="text-[10px] text-muted-foreground">v{chroma.version}</span>
                              </div>
                            </div>

                            {/* Chroma actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Switch
                                checked={chroma.isActive}
                                disabled={togglingActive === chroma.skinId}
                                onCheckedChange={() => handleToggleActive(chroma)}
                                className="scale-75"
                              />
                              <Button
                                variant={chroma.fileUrl ? 'outline' : 'default'}
                                size="sm"
                                className="h-7 text-[11px] gap-1 px-2"
                                disabled={uploading === chroma.skinId}
                                onClick={() => {
                                  setUploadTargetSkinId(chroma.skinId)
                                  fileInputRef.current?.click()
                                }}
                              >
                                {uploading === chroma.skinId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : chroma.fileUrl ? (
                                  <Replace className="h-3 w-3" />
                                ) : (
                                  <FileUp className="h-3 w-3" />
                                )}
                                {chroma.fileUrl ? 'Thay' : 'Upload'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                                onClick={() => setDeleteSkin(chroma)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          Khong tim thay skin nao
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewSkin} onOpenChange={() => setPreviewSkin(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewSkin?.nameEn}
              {previewSkin?.isChroma && (
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                  <Palette className="h-3 w-3 mr-1" />
                  Chroma
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewSkin && (
            <div className="space-y-3">
              <img
                src={getSplashUrl(previewSkin.isChroma && previewSkin.parentSkinId ? previewSkin.parentSkinId : previewSkin.skinId)}
                alt={previewSkin.nameEn}
                className="w-full rounded-lg"
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Skin ID:</span> {previewSkin.skinId}</div>
                <div><span className="text-muted-foreground">Version:</span> {previewSkin.version}</div>
                <div><span className="text-muted-foreground">File:</span> {previewSkin.fileUrl ? 'Co' : 'Chua co'}</div>
                <div><span className="text-muted-foreground">Size:</span> {formatFileSize(previewSkin.fileSize)}</div>
                <div><span className="text-muted-foreground">Active:</span> {previewSkin.isActive ? 'Bat' : 'Tat'}</div>
                {previewSkin.isChroma && previewSkin.parentSkinId && (
                  <div><span className="text-muted-foreground">Parent:</span> {previewSkin.parentSkinId}</div>
                )}
                {previewSkin.fileHash && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Hash:</span> {previewSkin.fileHash.substring(0, 24)}...
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSkin} onOpenChange={() => setDeleteSkin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xoa {deleteSkin?.isChroma ? 'chroma' : 'skin'} {deleteSkin?.nameEn}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSkin?.isChroma
                ? `Chroma "${deleteSkin?.nameEn}" (ID: ${deleteSkin?.skinId}) va file lien quan se bi xoa vinh vien.`
                : `Skin "${deleteSkin?.nameEn}" va file lien quan se bi xoa vinh vien khoi database va R2.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteSkin) {
                  handleDelete(deleteSkin)
                  setDeleteSkin(null)
                }
              }}
            >
              Xoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
