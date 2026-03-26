'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import {
  Search,
  Upload,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  Gamepad2,
  Loader2,
  Download,
  Eye,
  Replace,
  Globe,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react'

interface Champion {
  id: string
  championId: number
  nameEn: string
  nameVi: string | null
  _count: { skins: number }
  skins: {
    skinId: number
    nameEn: string
    fileUrl: string | null
    isActive: boolean
  }[]
}

interface Skin {
  id: string
  skinId: number
  championId: number
  nameEn: string
  nameVi: string | null
  fileUrl: string | null
  fileSize: number | null
  fileHash: string | null
  version: number
  isActive: boolean
  champion: {
    nameEn: string
    nameVi: string | null
    championId: number
  }
}

interface Stats {
  totalChampions: number
  totalSkins: number
  totalWithFiles: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function LeagueSkinsManagement() {
  const [view, setView] = useState<'champions' | 'skins'>('champions')
  const [champions, setChampions] = useState<Champion[]>([])
  const [skins, setSkins] = useState<Skin[]>([])
  const [stats, setStats] = useState<Stats>({ totalChampions: 0, totalSkins: 0, totalWithFiles: 0 })
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [selectedChampionId, setSelectedChampionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generatingManifest, setGeneratingManifest] = useState(false)

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<Skin | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'skin' | 'champion'; id: number; name: string } | null>(null)

  // Skins detail dialog
  const [detailChampion, setDetailChampion] = useState<Champion | null>(null)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        view,
        page: page.toString(),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (selectedChampionId) params.set('championId', selectedChampionId.toString())

      const res = await fetch(`/api/admin/league-skins?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()

      if (view === 'champions') {
        setChampions(data.champions || [])
        setStats(data.stats || { totalChampions: 0, totalSkins: 0, totalWithFiles: 0 })
      } else {
        setSkins(data.skins || [])
      }
      setPagination(data.pagination)
    } catch {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [view, search, selectedChampionId])

  useEffect(() => {
    const timer = setTimeout(() => fetchData(1), 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  // Upload single file for a skin
  const handleUploadFile = async (file: File, skinId: number) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('skinId', skinId.toString())

      const res = await fetch('/api/admin/league-skins/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      toast.success(`Đã upload file cho skin #${skinId}`)
      setUploadDialogOpen(false)
      setUploadTarget(null)
      fetchData(pagination.page)
    } catch {
      toast.error('Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  // Bulk upload files
  const handleBulkUpload = async (files: FileList) => {
    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const res = await fetch('/api/admin/league-skins/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      toast.success(
        `Upload hoàn tất: ${data.summary.uploaded} thành công, ${data.summary.skipped} bỏ qua, ${data.summary.errors} lỗi`
      )
      fetchData(pagination.page)
    } catch {
      toast.error('Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  // Delete skin or champion
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const res = await fetch('/api/admin/league-skins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          deleteTarget.type === 'skin'
            ? { skinId: deleteTarget.id }
            : { championId: deleteTarget.id }
        ),
      })

      if (!res.ok) throw new Error('Delete failed')

      toast.success(`Đã xóa ${deleteTarget.name}`)
      setDeleteTarget(null)
      fetchData(pagination.page)
    } catch {
      toast.error('Xóa thất bại')
    }
  }

  // Generate manifest
  const handleGenerateManifest = async () => {
    setGeneratingManifest(true)
    try {
      const res = await fetch('/api/admin/league-skins/manifest', {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed')

      const data = await res.json()
      toast.success(
        `Manifest đã tạo: ${data.stats.champions} champions, ${data.stats.skinsWithFiles} skins có file`
      )
    } catch {
      toast.error('Không thể tạo manifest')
    } finally {
      setGeneratingManifest(false)
    }
  }

  // Delete skin file only
  const handleDeleteFile = async (skinId: number) => {
    try {
      const res = await fetch(`/api/admin/league-skins/${skinId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Delete failed')

      toast.success('Đã xóa file')
      fetchData(pagination.page)
    } catch {
      toast.error('Xóa file thất bại')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">League Skins Manager</h1>
          <p className="text-muted-foreground">Quản lý file skin cho ứng dụng mod skin</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => bulkFileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Bulk Upload
          </Button>
          <input
            ref={bulkFileInputRef}
            type="file"
            multiple
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleBulkUpload(e.target.files)
              e.target.value = ''
            }}
          />
          <Button onClick={handleGenerateManifest} disabled={generatingManifest}>
            {generatingManifest ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Tạo Manifest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng Champions</CardDescription>
            <CardTitle className="text-2xl">{stats.totalChampions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng Skins</CardDescription>
            <CardTitle className="text-2xl">{stats.totalSkins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skins có File</CardDescription>
            <CardTitle className="text-2xl">
              {stats.totalWithFiles}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({stats.totalSkins > 0 ? ((stats.totalWithFiles / stats.totalSkins) * 100).toFixed(1) : 0}%)
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm champion hoặc skin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'champions' ? 'default' : 'outline'}
            onClick={() => { setView('champions'); setSelectedChampionId(null) }}
            size="sm"
          >
            <Gamepad2 className="h-4 w-4 mr-1" />
            Champions
          </Button>
          <Button
            variant={view === 'skins' ? 'default' : 'outline'}
            onClick={() => setView('skins')}
            size="sm"
          >
            <FileArchive className="h-4 w-4 mr-1" />
            All Skins
          </Button>
          {selectedChampionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedChampionId(null)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Bỏ lọc Champion
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : view === 'champions' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Tên (EN)</TableHead>
                  <TableHead>Tên (VI)</TableHead>
                  <TableHead className="w-24 text-center">Skins</TableHead>
                  <TableHead className="w-24 text-center">Có File</TableHead>
                  <TableHead className="w-32 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {champions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy champion nào. Hãy chạy seed script trước.
                    </TableCell>
                  </TableRow>
                ) : (
                  champions.map((champ) => {
                    const withFile = champ.skins.filter(s => s.fileUrl).length
                    return (
                      <TableRow key={champ.championId}>
                        <TableCell className="font-mono">{champ.championId}</TableCell>
                        <TableCell className="font-medium">{champ.nameEn}</TableCell>
                        <TableCell className="text-muted-foreground">{champ.nameVi || '—'}</TableCell>
                        <TableCell className="text-center">{champ._count.skins}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={withFile === champ._count.skins ? 'default' : withFile > 0 ? 'secondary' : 'outline'}>
                            {withFile}/{champ._count.skins}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setView('skins')
                                setSelectedChampionId(champ.championId)
                              }}
                              title="Xem skins"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget({
                                type: 'champion',
                                id: champ.championId,
                                name: champ.nameEn,
                              })}
                              title="Xóa champion"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Skin ID</TableHead>
                  <TableHead>Champion</TableHead>
                  <TableHead>Tên Skin (EN)</TableHead>
                  <TableHead>Tên (VI)</TableHead>
                  <TableHead className="w-20 text-center">Ver</TableHead>
                  <TableHead className="w-24 text-right">File Size</TableHead>
                  <TableHead className="w-20 text-center">Trạng thái</TableHead>
                  <TableHead className="w-40 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy skin nào
                    </TableCell>
                  </TableRow>
                ) : (
                  skins.map((skin) => (
                    <TableRow key={skin.skinId}>
                      <TableCell className="font-mono">{skin.skinId}</TableCell>
                      <TableCell className="text-muted-foreground">{skin.champion.nameEn}</TableCell>
                      <TableCell className="font-medium">{skin.nameEn}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{skin.nameVi || '—'}</TableCell>
                      <TableCell className="text-center font-mono">{skin.version}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatFileSize(skin.fileSize)}
                      </TableCell>
                      <TableCell className="text-center">
                        {skin.fileUrl ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={skin.fileUrl ? 'Thay thế file' : 'Upload file'}
                            onClick={() => {
                              setUploadTarget(skin)
                              setUploadDialogOpen(true)
                            }}
                          >
                            {skin.fileUrl ? (
                              <Replace className="h-4 w-4" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                          {skin.fileUrl && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Download"
                                onClick={() => {
                                  window.open(`/api/league-skins/${skin.skinId}/download`, '_blank')
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Xóa file"
                                onClick={() => handleDeleteFile(skin.skinId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchData(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchData(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uploadTarget?.fileUrl ? 'Thay thế File Skin' : 'Upload File Skin'}
            </DialogTitle>
            <DialogDescription>
              {uploadTarget ? `${uploadTarget.nameEn} (ID: ${uploadTarget.skinId})` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {uploadTarget?.fileUrl && (
              <p className="text-sm text-amber-600">
                ⚠️ File hiện tại sẽ bị thay thế. Version sẽ tăng lên.
              </p>
            )}
            <div className="border-2 border-dashed rounded-lg p-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && uploadTarget) {
                    handleUploadFile(file, uploadTarget.skinId)
                  }
                  e.target.value = ''
                }}
              />
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Đang upload...' : 'Nhấp để chọn file .zip'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'champion'
                ? `Bạn có chắc muốn xóa champion "${deleteTarget?.name}" và tất cả skins của nó? Thao tác này không thể hoàn tác.`
                : `Bạn có chắc muốn xóa skin "${deleteTarget?.name}"? File trên R2 cũng sẽ bị xóa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
