'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Calendar,
  FileText,
  EyeOff,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ApprovedSkin {
  id: string
  name: string
  description: string
  version: string
  championId: number
  categoryId: string
  authorId: string
  fileName: string
  fileSize: string
  fileType: 'ZIP' | 'RAR' | 'FANTOME'
  previewImages: string[]
  thumbnailImage?: string
  status: 'APPROVED' | 'FEATURED' | 'HIDDEN'
  downloadCount: number
  createdAt: string
  updatedAt: string
  champion: {
    id: number
    name: string
    alias: string
  }
  category: {
    id: string
    name: string
    slug: string
  }
  author: {
    id: string
    name: string
  }
}

interface Champion {
  id: number
  name: string
  alias: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface AdminResponse {
  skins: ApprovedSkin[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ApprovedSkinsManagement() {
  const [skins, setSkins] = useState<ApprovedSkin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [championFilter, setChampionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedSkins, setSelectedSkins] = useState<string[]>([])
  
  // Reference data
  const [champions, setChampions] = useState<Champion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Dialog states
  const [selectedSkin, setSelectedSkin] = useState<ApprovedSkin | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDialog, setBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | 'feature' | 'unfeature' | 'hide' | 'unhide' | 'export'>('delete')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    version: '',
    categoryId: '',
    status: 'APPROVED' as 'APPROVED' | 'FEATURED' | 'HIDDEN'
  })

  // Fetch approved skins
  const fetchSkins = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(championFilter !== 'all' && { championId: championFilter }),
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/admin/custom-skins?${params}`)
      if (!response.ok) throw new Error('Failed to fetch skins')
      
      const data: AdminResponse = await response.json()
      setSkins(data.skins)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching skins:', error)
      toast.error('Failed to load skins')
    } finally {
      setLoading(false)
    }
  }

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [championsRes, categoriesRes] = await Promise.all([
        fetch('/api/champions'),
        fetch('/api/custom-skins/categories')
      ])
      
      if (championsRes.ok) {
        const championsData = await championsRes.json()
        setChampions(championsData.champions || [])
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching reference data:', error)
    }
  }

  useEffect(() => {
    fetchReferenceData()
  }, [])

  useEffect(() => {
    fetchSkins()
  }, [currentPage, searchTerm, championFilter, categoryFilter, statusFilter])

  // Handle edit skin
  const handleEdit = (skin: ApprovedSkin) => {
    setSelectedSkin(skin)
    setEditForm({
      name: skin.name,
      description: skin.description,
      version: skin.version,
      categoryId: skin.categoryId,
      status: skin.status
    })
    setShowEditDialog(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedSkin) return
    
    try {
      const response = await fetch(`/api/admin/custom-skins/${selectedSkin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (!response.ok) throw new Error('Failed to update skin')
      
      toast.success('Skin updated successfully')
      setShowEditDialog(false)
      fetchSkins()
    } catch (error) {
      console.error('Error updating skin:', error)
      toast.error('Failed to update skin')
    }
  }

  // Handle delete skin
  const handleDelete = async () => {
    if (!selectedSkin) return
    
    try {
      const response = await fetch(`/api/admin/custom-skins/${selectedSkin.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete skin')
      
      toast.success('Skin deleted successfully')
      setShowDeleteDialog(false)
      fetchSkins()
    } catch (error) {
      console.error('Error deleting skin:', error)
      toast.error('Failed to delete skin')
    }
  }

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (selectedSkins.length === 0) return
    
    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/custom-skins/approved/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          skinIds: selectedSkins
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform bulk action')
      }
      
      if (bulkAction === 'export') {
        // Download exported data as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `approved-skins-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      toast.success(data.message)
      setBulkDialog(false)
      setSelectedSkins([])
      fetchSkins()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to perform bulk action')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSkins(skins.map(skin => skin.id))
    } else {
      setSelectedSkins([])
    }
  }

  // Handle individual select
  const handleSelect = (skinId: string, checked: boolean) => {
    if (checked) {
      setSelectedSkins([...selectedSkins, skinId])
    } else {
      setSelectedSkins(selectedSkins.filter(id => id !== skinId))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FEATURED':
        return <Badge className="bg-yellow-500"><Star className="w-3 h-3 mr-1" />Featured</Badge>
      case 'HIDDEN':
        return <Badge variant="secondary">Hidden</Badge>
      default:
        return <Badge variant="default">Approved</Badge>
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approved Custom Skins</h1>
          <p className="text-muted-foreground">Manage all approved custom skins</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/custom-skins/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Skin
            </Button>
          </Link>
          {selectedSkins.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setBulkDialog(true)}
            >
              Bulk Actions ({selectedSkins.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Champion</Label>
              <Select value={championFilter} onValueChange={setChampionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Champions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Champions</SelectItem>
                  {champions.map(champion => (
                    <SelectItem key={champion.id} value={champion.id.toString()}>
                      {champion.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="FEATURED">Featured</SelectItem>
                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total Skins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {skins.reduce((sum, skin) => sum + skin.downloadCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {skins.filter(skin => skin.status === 'FEATURED').length}
                </p>
                <p className="text-xs text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(skins.map(skin => skin.authorId)).size}
                </p>
                <p className="text-xs text-muted-foreground">Authors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skins Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Skins ({total})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedSkins.length === skins.length && skins.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : skins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No skins found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skins.map((skin) => (
                <Card key={skin.id} className="overflow-hidden">
                  <div className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedSkins.includes(skin.id)}
                        onCheckedChange={(checked) => handleSelect(skin.id, checked as boolean)}
                      />
                    </div>
                    <div className="absolute top-2 right-2 z-10">
                      {getStatusBadge(skin.status)}
                    </div>
                    <div className="aspect-video bg-muted relative">
                      {skin.thumbnailImage || skin.previewImages[0] ? (
                        <img
                          src={`/api${skin.thumbnailImage || skin.previewImages[0]}`}
                          alt={skin.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold truncate">{skin.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {skin.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{skin.champion.name}</span>
                        <span>{skin.category.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(skin.fileSize)}</span>
                        <span>{skin.downloadCount} downloads</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>by {skin.author.name}</span>
                        <span>{format(new Date(skin.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/custom-skins/${skin.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(skin)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSkin(skin)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Skin</DialogTitle>
            <DialogDescription>
              Update skin information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Version</Label>
              <Input
                value={editForm.version}
                onChange={(e) => setEditForm({...editForm, version: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editForm.categoryId} onValueChange={(value) => setEditForm({...editForm, categoryId: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(value: any) => setEditForm({...editForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="FEATURED">Featured</SelectItem>
                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSkin?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Perform action on {selectedSkins.length} selected skins
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Mark as Featured</SelectItem>
                  <SelectItem value="unfeature">Remove Featured</SelectItem>
                  <SelectItem value="hide">Hide</SelectItem>
                  <SelectItem value="unhide">Unhide</SelectItem>
                  <SelectItem value="export">Export Data</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAction} disabled={bulkActionLoading}>
              {bulkActionLoading ? 'Processing...' : 'Apply Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}