'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Globe, Database, Sparkles, AlertTriangle, RefreshCw, Loader2,
  Download, CheckCircle, Package, Search, Eye, FileUp, HardDrive, Archive,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SyncData } from './types'

interface SyncOverviewProps {
  syncData: SyncData | null
  syncing: boolean
  importing: boolean
  onSync: () => void
  onImportAll: () => void
  onViewNewSkins: () => void
}

export function SyncOverview({
  syncData, syncing, importing, onSync, onImportAll, onViewNewSkins,
}: SyncOverviewProps) {
  const [showMissingFiles, setShowMissingFiles] = useState(false)
  const [missingSearch, setMissingSearch] = useState('')
  const [uploading, setUploading] = useState<number | null>(null)
  const [uploadedSkins, setUploadedSkins] = useState<Set<number>>(new Set())
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, matched: 0, errors: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetSkinId, setUploadTargetSkinId] = useState<number | null>(null)
  const [syncingR2, setSyncingR2] = useState(false)
  const [buildingPackage, setBuildingPackage] = useState(false)
  const [uploadingPackage, setUploadingPackage] = useState(false)
  const packageFileRef = useRef<HTMLInputElement>(null)
  const [packageInfo, setPackageInfo] = useState<{
    status: string
    builtAt: string | null
    hash: string | null
    size: string | null
    fileCount: string | null
    existsOnR2: boolean
    downloadUrl: string | null
    progress: { current: number; total: number; percent: number; bytes: number; elapsed: string } | null
  } | null>(null)

  const fetchPackageStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/league-skins/build-package')
      if (res.ok) {
        const data = await res.json()
        setPackageInfo(data)
        return data.status
      }
    } catch {}
    return null
  }, [])

  useEffect(() => {
    fetchPackageStatus()
  }, [fetchPackageStatus])

  // Poll while building
  useEffect(() => {
    if (packageInfo?.status !== 'building') return
    const interval = setInterval(async () => {
      const status = await fetchPackageStatus()
      if (status !== 'building') clearInterval(interval)
    }, 5000)
    return () => clearInterval(interval)
  }, [packageInfo?.status, fetchPackageStatus])

  const handleBuildPackage = async () => {
    if (!confirm('Bạn muốn build lại Full Package? Quá trình này mất 15-30 phút.')) return
    setBuildingPackage(true)
    try {
      const res = await fetch('/api/admin/league-skins/build-package', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Build failed')
      }
      toast.success('Đã bắt đầu build package. Vui lòng đợi 15-30 phút.')
      await fetchPackageStatus()
    } catch (err: any) {
      toast.error(err.message || 'Build thất bại')
    } finally {
      setBuildingPackage(false)
    }
  }

  const handleResetBuild = async () => {
    if (!confirm('Reset trạng thái build? Dùng khi build bị treo.')) return
    try {
      const res = await fetch('/api/admin/league-skins/build-package', { method: 'DELETE' })
      if (!res.ok) throw new Error('Reset failed')
      toast.success('Đã reset trạng thái build')
      await fetchPackageStatus()
    } catch {
      toast.error('Reset thất bại')
    }
  }

  const handleUploadPackage = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast.error('File phải là định dạng .zip')
      return
    }
    if (!confirm(`Upload file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) làm Full Package?`)) return

    setUploadingPackage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/league-skins/build-package', {
        method: 'PUT',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      const data = await res.json()
      toast.success(`Upload package thành công! Hash: ${data.package.hash}, Size: ${data.package.size}`)
      await fetchPackageStatus()
    } catch (err: any) {
      toast.error(err.message || 'Upload package thất bại')
    } finally {
      setUploadingPackage(false)
    }
  }

  const handleSyncR2 = async () => {
    setSyncingR2(true)
    try {
      const res = await fetch('/api/admin/league-skins/sync-r2', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      const { synced, removed, alreadyOk, r2Files, errors } = data.summary
      toast.success(
        `Sync R2 xong: ${synced} cap nhat, ${removed} xoa, ${alreadyOk} ok (${r2Files} file tren R2)${errors > 0 ? `, ${errors} loi` : ''}`
      )
    } catch {
      toast.error('Sync R2 that bai')
    } finally {
      setSyncingR2(false)
    }
  }

  // Single file upload
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
      toast.success(`Đã upload file cho skin ${skinId}`)
      setUploadedSkins(prev => new Set(prev).add(skinId))
    } catch {
      toast.error('Upload thất bại')
    } finally {
      setUploading(null)
    }
  }

  // Bulk folder upload - auto match {skinId}.zip files
  const handleBulkUpload = async (files: FileList) => {
    const missingSkinIds = new Set(missingFileSkins.map(s => s.skinId))
    const matchedFiles: { skinId: number; file: File }[] = []

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.zip')) continue
      const skinId = parseInt(file.name.replace(/\.zip$/i, ''))
      if (!isNaN(skinId) && missingSkinIds.has(skinId)) {
        matchedFiles.push({ skinId, file })
      }
    }

    if (matchedFiles.length === 0) {
      toast.error('Không tìm thấy file nào khớp với skin ID. File cần đặt tên theo format: {skinId}.zip')
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
        const res = await fetch(`/api/admin/league-skins/${skinId}`, {
          method: 'PUT',
          body: formData,
        })
        if (!res.ok) throw new Error('Upload failed')
        setUploadedSkins(prev => new Set(prev).add(skinId))
      } catch {
        errors++
      }
      setBulkProgress({ done: i + 1, total: matchedFiles.length, matched: matchedFiles.length, errors })
    }

    setBulkUploading(false)
    toast.success(`Bulk upload hoàn tất: ${matchedFiles.length - errors}/${matchedFiles.length} thành công`)
  }

  const coveragePercent = syncData
    ? Math.round((syncData.db.totalWithFiles / Math.max(syncData.db.totalSkins, 1)) * 100)
    : 0

  const missingFileSkins = syncData?.diff.skinsWithoutFiles || []
  const filteredMissing = missingSearch
    ? missingFileSkins.filter(s =>
        s.name.toLowerCase().includes(missingSearch.toLowerCase()) ||
        s.championName.toLowerCase().includes(missingSearch.toLowerCase()) ||
        s.skinId.toString().includes(missingSearch)
      )
    : missingFileSkins

  // Group missing by champion
  const missingByChampion = new Map<string, typeof missingFileSkins>()
  for (const skin of filteredMissing) {
    const key = skin.championName
    const list = missingByChampion.get(key) || []
    list.push(skin)
    missingByChampion.set(key, list)
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onSync} disabled={syncing} variant="outline" className="gap-2">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? 'Dang dong bo...' : 'Kiem tra cap nhat'}
        </Button>
        <Button onClick={handleSyncR2} disabled={syncingR2} variant="outline" className="gap-2">
          {syncingR2 ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
          {syncingR2 ? 'Dang sync R2...' : 'Sync R2 → DB'}
        </Button>
        {syncData && syncData.diff.totalNew > 0 && (
          <>
            <Button onClick={onViewNewSkins} variant="secondary" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Xem {syncData.diff.totalNew} skin mới
            </Button>
            <Button onClick={onImportAll} disabled={importing} className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {importing ? 'Đang import...' : `Import tất cả ${syncData.diff.totalNew} skin mới`}
            </Button>
          </>
        )}
      </div>

      {/* Stats Cards */}
      {syncData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CommunityDragon Stats */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Globe className="h-4 w-4" />
                CommunityDragon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncData.cdragon.totalSkins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {syncData.cdragon.totalChampions} tướng
              </p>
            </CardContent>
          </Card>

          {/* DB Stats */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                <Database className="h-4 w-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncData.db.totalSkins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {syncData.db.totalChampions} tướng
              </p>
            </CardContent>
          </Card>

          {/* New Skins */}
          <Card className={`${syncData.diff.totalNew > 0
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
            : 'border-gray-200 dark:border-gray-800'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium flex items-center gap-2 ${syncData.diff.totalNew > 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-muted-foreground'}`}>
                <Sparkles className="h-4 w-4" />
                Skin mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncData.diff.totalNew}</div>
              {syncData.diff.newChampions.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  + {syncData.diff.newChampions.length} tướng mới
                </p>
              )}
            </CardContent>
          </Card>

          {/* File Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                Có file
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coveragePercent}%</div>
              <Progress value={coveragePercent} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {syncData.db.totalWithFiles}/{syncData.db.totalSkins} skin
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync Status Banner */}
      {syncData && syncData.diff.totalNew === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">Đã cập nhật mới nhất</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Tất cả skin từ CommunityDragon đã có trong database.
            </p>
          </div>
        </div>
      )}

      {/* Missing Files Banner - Clickable */}
      {syncData && syncData.diff.totalMissingFiles > 0 && (
        <button
          onClick={() => setShowMissingFiles(true)}
          className="w-full flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors text-left"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {syncData.diff.totalMissingFiles} skin chưa có file
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Các skin đã import nhưng chưa upload file .zip — Click để xem danh sách
            </p>
          </div>
          <Eye className="h-5 w-5 text-amber-500" />
        </button>
      )}

      {/* Full Package Card */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Archive className="h-4 w-4" />
            Full Package (ZIP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              {packageInfo?.status === 'ready' && packageInfo.existsOnR2 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 text-white text-xs">Sẵn sàng</Badge>
                    {packageInfo.size && <span className="text-sm text-muted-foreground">{packageInfo.size}</span>}
                    {packageInfo.fileCount && <span className="text-sm text-muted-foreground">• {packageInfo.fileCount} files</span>}
                  </div>
                  {packageInfo.builtAt && (
                    <p className="text-xs text-muted-foreground">
                      Build lúc: {new Date(packageInfo.builtAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </>
              ) : packageInfo?.status === 'building' ? (
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-purple-700 dark:text-purple-400">
                      {packageInfo.progress
                        ? `Đang nén: ${packageInfo.progress.current}/${packageInfo.progress.total} files (${packageInfo.progress.percent.toFixed(1)}%)`
                        : 'Đang chuẩn bị...'}
                    </span>
                  </div>
                  {packageInfo.progress && (
                    <>
                      <Progress value={packageInfo.progress.percent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Đã xử lý: {(packageInfo.progress.bytes / (1024 * 1024)).toFixed(1)} MB • Thời gian: {packageInfo.progress.elapsed}
                      </p>
                    </>
                  )}
                </div>
              ) : packageInfo?.status === 'error' ? (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">Lỗi</Badge>
                  <span className="text-xs text-muted-foreground">Build thất bại</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có package. Bấm Build để tạo.</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {packageInfo?.downloadUrl && packageInfo.status === 'ready' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(packageInfo.downloadUrl!, '_blank')}
                >
                  <Download className="h-3.5 w-3.5" />
                  Tải
                </Button>
              )}
              {(packageInfo?.status === 'building' || packageInfo?.status === 'error') && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleResetBuild}
                >
                  Reset
                </Button>
              )}
              {/* Hidden file input for manual package upload */}
              <input
                ref={packageFileRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadPackage(file)
                  e.target.value = ''
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploadingPackage || buildingPackage || packageInfo?.status === 'building'}
                onClick={() => packageFileRef.current?.click()}
              >
                {uploadingPackage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileUp className="h-3.5 w-3.5" />
                )}
                {uploadingPackage ? 'Đang upload...' : 'Upload ZIP'}
              </Button>
              <Button
                variant={packageInfo?.status === 'ready' ? 'outline' : 'default'}
                size="sm"
                className="gap-1.5"
                disabled={buildingPackage || uploadingPackage || packageInfo?.status === 'building'}
                onClick={handleBuildPackage}
              >
                {packageInfo?.status === 'building' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                {packageInfo?.status === 'ready' ? 'Rebuild' : 'Build Package'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Files Dialog */}
      <Dialog open={showMissingFiles} onOpenChange={setShowMissingFiles}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Skin chưa có file ({missingFileSkins.length})
            </DialogTitle>
            <DialogDescription>
              Các skin đã import vào database nhưng chưa có file .zip. Upload từng file hoặc chọn thư mục chứa các file {'{skinId}.zip'}.
            </DialogDescription>
          </DialogHeader>

          {/* Bulk Upload Folder */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
            <input
              ref={folderInputRef}
              type="file"
              accept=".zip"
              multiple
              className="hidden"
              // @ts-ignore - webkitdirectory is not in types
              webkitdirectory=""
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleBulkUpload(e.target.files)
                }
                e.target.value = ''
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Bulk Upload</p>
              <p className="text-xs text-muted-foreground">
                Chọn thư mục chứa file .zip đặt tên theo skinId (vd: 1001.zip, 1002.zip...)
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={bulkUploading}
              onClick={() => folderInputRef.current?.click()}
            >
              {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {bulkUploading ? 'Đang upload...' : 'Chọn thư mục'}
            </Button>
          </div>

          {/* Bulk Progress */}
          {(bulkUploading || bulkProgress.total > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Đã match {bulkProgress.matched} file · Upload {bulkProgress.done}/{bulkProgress.total}
                  {bulkProgress.errors > 0 && <span className="text-destructive"> · {bulkProgress.errors} lỗi</span>}
                </span>
                <span className="text-muted-foreground">
                  {bulkProgress.total > 0 ? Math.round((bulkProgress.done / bulkProgress.total) * 100) : 0}%
                </span>
              </div>
              <Progress value={bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0} className="h-2" />
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm skin hoặc tướng..."
              value={missingSearch}
              onChange={e => setMissingSearch(e.target.value)}
              className="pl-9"
            />
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

          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-4">
              {Array.from(missingByChampion.entries()).map(([champName, skins]) => (
                <div key={champName}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{champName}</h4>
                    <Badge variant="secondary" className="text-xs">{skins.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {skins.map(skin => (
                      <div
                        key={skin.skinId}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <img
                          src={`https://cdn.communitydragon.org/latest/champion/${skin.championId}/splash-art/skin/${skin.skinId % 1000}`}
                          alt={skin.name}
                          className="h-10 w-16 rounded object-cover bg-muted flex-shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-skin.svg' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{skin.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {skin.skinId} · {skin.championName}
                          </p>
                        </div>
                        {uploadedSkins.has(skin.skinId) ? (
                          <Badge className="bg-green-600 text-white text-[10px] flex-shrink-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã upload
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 flex-shrink-0"
                            disabled={uploading === skin.skinId}
                            onClick={() => {
                              setUploadTargetSkinId(skin.skinId)
                              fileInputRef.current?.click()
                            }}
                          >
                            {uploading === skin.skinId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileUp className="h-3 w-3" />
                            )}
                            Upload .zip
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredMissing.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy skin nào
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
