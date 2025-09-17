'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Image, 
  Archive,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  FolderOpen,
  HardDrive,
  AlertTriangle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { formatBytes, formatDate } from '@/lib/utils'

interface SkinFile {
  id: string
  filename: string
  originalName: string
  path: string
  size: number
  mimeType: string
  uploadedAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  skinId?: string
  skin?: {
    id: string
    name: string
    status: string
  }
  isActive: boolean
  downloads: number
}

interface FileStats {
  totalFiles: number
  totalSize: number
  activeFiles: number
  orphanedFiles: number
  storageUsed: number
  storageLimit: number
}

const FILE_TYPES = {
  'image/jpeg': { icon: Image, color: 'bg-blue-100 text-blue-800' },
  'image/png': { icon: Image, color: 'bg-blue-100 text-blue-800' },
  'image/webp': { icon: Image, color: 'bg-blue-100 text-blue-800' },
  'application/zip': { icon: Archive, color: 'bg-purple-100 text-purple-800' },
  'application/x-rar-compressed': { icon: Archive, color: 'bg-purple-100 text-purple-800' },
  'text/plain': { icon: FileText, color: 'bg-gray-100 text-gray-800' },
  'default': { icon: FileText, color: 'bg-gray-100 text-gray-800' }
}

export default function FileManagement() {
  const [files, setFiles] = useState<SkinFile[]>([])
  const [stats, setStats] = useState<FileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('uploadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        type: filterType,
        status: filterStatus,
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/admin/files?${params}`)
      if (!response.ok) throw new Error('Failed to fetch files')
      
      const data = await response.json()
      setFiles(data.files)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách file',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/files/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Upload files
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file)
      })

      // Use XMLHttpRequest for upload progress tracking
      const xhr = new XMLHttpRequest()
      
      const uploadPromise = new Promise<Response>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(progress)
          }
        })
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText
            }))
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        
        xhr.open('POST', '/api/admin/files/upload')
        xhr.send(formData)
      })
      
      const response = await uploadPromise

      if (!response.ok) throw new Error('Upload failed')

      toast({
        title: 'Thành công',
        description: `Đã tải lên ${selectedFiles.length} file`
      })

      fetchFiles()
      fetchStats()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lên file',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset input
      event.target.value = ''
    }
  }

  // Delete files
  const handleDeleteFiles = async (fileIds: string[]) => {
    try {
      const response = await fetch('/api/admin/files/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds })
      })

      if (!response.ok) throw new Error('Delete failed')

      toast({
        title: 'Thành công',
        description: `Đã xóa ${fileIds.length} file`
      })

      setSelectedFiles([])
      fetchFiles()
      fetchStats()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa file',
        variant: 'destructive'
      })
    }
  }

  // Download file
  const handleDownloadFile = async (file: SkinFile) => {
    try {
      const response = await fetch(`/api/admin/files/${file.id}/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải xuống file',
        variant: 'destructive'
      })
    }
  }

  // Clean orphaned files
  const handleCleanOrphanedFiles = async () => {
    try {
      const response = await fetch('/api/admin/files/cleanup', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Cleanup failed')
      
      const result = await response.json()
      toast({
        title: 'Thành công',
        description: `Đã dọn dẹp ${result.deletedCount} file không sử dụng`
      })

      fetchFiles()
      fetchStats()
    } catch (error) {
      console.error('Cleanup error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể dọn dẹp file',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchFiles()
    fetchStats()
  }, [currentPage, searchTerm, filterType, filterStatus, sortBy, sortOrder])

  const getFileTypeInfo = (mimeType: string) => {
    return FILE_TYPES[mimeType as keyof typeof FILE_TYPES] || FILE_TYPES.default
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || file.mimeType.startsWith(filterType)
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && file.isActive) ||
                         (filterStatus === 'inactive' && !file.isActive) ||
                         (filterStatus === 'orphaned' && !file.skinId)
    
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý File</h1>
          <p className="text-muted-foreground">Quản lý file skin và tài nguyên</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleCleanOrphanedFiles}
            disabled={!stats?.orphanedFiles}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Dọn dẹp file rác
          </Button>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Đang tải...' : 'Tải lên'}
              </span>
            </Button>
          </Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.zip,.rar,.txt"
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Đang tải lên...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng File</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(stats.totalSize)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Đang dùng</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeFiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeFiles / stats.totalFiles) * 100).toFixed(1)}% tổng số
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Rác</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.orphanedFiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Có thể xóa để tiết kiệm dung lượng
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dung lượng</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((stats.storageUsed / stats.storageLimit) * 100).toFixed(1)}%
              </div>
              <div className="mt-2">
                <Progress value={(stats.storageUsed / stats.storageLimit) * 100} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="image">Hình ảnh</SelectItem>
                <SelectItem value="application">Archive</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang dùng</SelectItem>
                <SelectItem value="inactive">Không dùng</SelectItem>
                <SelectItem value="orphaned">File rác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedFiles.length} file
              </span>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteFiles(selectedFiles)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa đã chọn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách File</CardTitle>
          <CardDescription>
            Hiển thị {filteredFiles.length} file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFiles(filteredFiles.map(f => f.id))
                      } else {
                        setSelectedFiles([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>File</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Skin</TableHead>
                <TableHead>Lượt tải</TableHead>
                <TableHead>Ngày tải lên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không có file nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map((file) => {
                  const fileTypeInfo = getFileTypeInfo(file.mimeType)
                  const FileIcon = fileTypeInfo.icon
                  
                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFiles([...selectedFiles, file.id])
                            } else {
                              setSelectedFiles(selectedFiles.filter(id => id !== file.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${fileTypeInfo.color}`}>
                            <FileIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{file.originalName}</div>
                            <div className="text-sm text-muted-foreground">{file.mimeType}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell>
                        {file.skin ? (
                          <div>
                            <div className="font-medium">{file.skin.name}</div>
                            <Badge variant={file.skin.status === 'APPROVED' ? 'default' : 'secondary'}>
                              {file.skin.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Không có</span>
                        )}
                      </TableCell>
                      <TableCell>{file.downloads.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(file.uploadedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={file.isActive ? 'default' : 'secondary'}>
                          {file.isActive ? 'Đang dùng' : 'Không dùng'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Tải xuống
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFiles([file.id])}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}