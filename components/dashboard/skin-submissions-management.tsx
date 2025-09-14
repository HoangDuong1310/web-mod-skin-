'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Eye, Download, Filter, Search, Calendar, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'

interface SkinSubmission {
  id: string
  name: string
  description: string
  version: string
  championId: number
  categoryId: string
  submitterId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  previewImages: string[]
  thumbnailImage: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedById: string | null
  reviewedAt: string | null
  adminNotes: string | null
  feedbackMessage: string | null
  createdAt: string
  updatedAt: string
  champion: {
    name: string
    alias: string
    squarePortraitPath: string
  }
  category: {
    name: string
    slug: string
  }
  submitter: {
    name: string
    image: string | null
  }
  reviewer?: {
    name: string
    image: string | null
  }
}

interface AdminResponse {
  submissions: SkinSubmission[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function SkinSubmissionsManagement() {
  const [submissions, setSubmissions] = useState<SkinSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Dialog states
  const [selectedSubmission, setSelectedSubmission] = useState<SkinSubmission | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase())
      params.append('page', currentPage.toString())
      params.append('limit', '10')

      const response = await fetch(`/api/admin/skin-submissions?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data: AdminResponse = await response.json()
      setSubmissions(data.submissions)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [searchTerm, statusFilter, currentPage])

  const handleReview = (submission: SkinSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission)
    setReviewAction(action)
    setFeedbackMessage('')
    setAdminNotes('')
    setShowReviewDialog(true)
  }

  const submitReview = async () => {
    if (!selectedSubmission) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/skin-submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action: reviewAction,
          feedbackMessage: feedbackMessage || undefined,
          adminNotes: adminNotes || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Review failed')
      }

      toast.success(`Submission ${reviewAction}d successfully`)
      setShowReviewDialog(false)
      setSelectedSubmission(null)
      fetchSubmissions() // Refresh list
    } catch (error) {
      console.error('Review error:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const viewSubmission = (submission: SkinSubmission) => {
    setSelectedSubmission(submission)
    setShowViewDialog(true)
  }

  const downloadFile = async (submission: SkinSubmission) => {
    try {
      const response = await fetch(`/api/admin/skin-submissions/download/${submission.id}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = submission.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSize = (sizeStr: string) => {
    const size = parseInt(sizeStr)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Skin Submissions</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage community skin submissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {submissions.length} of {total} submissions
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                No submissions match your current filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skin</TableHead>
                  <TableHead>Champion</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                          {submission.thumbnailImage ? (
                            <Image
                              src={submission.thumbnailImage}
                              alt={submission.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{submission.name}</div>
                          <div className="text-sm text-muted-foreground">
                            v{submission.version} • {formatFileSize(submission.fileSize)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Image
                          src={getImageUrl(submission.champion.squarePortraitPath)}
                          alt={submission.champion.name}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                        {submission.champion.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={submission.submitter.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {submission.submitter.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {submission.submitter.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(submission.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(submission)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {submission.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleReview(submission, 'approve')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleReview(submission, 'reject')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} className="px-2">...</span>
              }
              return null
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Submission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  Are you sure you want to {reviewAction} "{selectedSubmission.name}"?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feedback Message (for submitter)</label>
              <Textarea
                placeholder="Optional message to the submitter..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Admin Notes (internal)</label>
              <Textarea
                placeholder="Internal notes for other admins..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={submitting}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting ? 'Processing...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p>{selectedSubmission.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Champion</label>
                  <p>{selectedSubmission.champion.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p>{selectedSubmission.category.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Size</label>
                  <p>{formatFileSize(selectedSubmission.fileSize)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{selectedSubmission.description}</p>
              </div>

              {/* Preview Images */}
              {selectedSubmission.previewImages && selectedSubmission.previewImages.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Preview Images</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedSubmission.previewImages.map((image, index) => (
                      <div key={index} className="relative h-32 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={image}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Info */}
              {selectedSubmission.status !== 'PENDING' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Reviewed At</label>
                      <p>{selectedSubmission.reviewedAt ? format(new Date(selectedSubmission.reviewedAt), 'PPpp') : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Reviewed By</label>
                      <p>{selectedSubmission.reviewer?.name || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {selectedSubmission.feedbackMessage && (
                    <div className="mt-2">
                      <label className="text-muted-foreground">Feedback Message</label>
                      <p className="text-sm">{selectedSubmission.feedbackMessage}</p>
                    </div>
                  )}
                  
                  {selectedSubmission.adminNotes && (
                    <div className="mt-2">
                      <label className="text-muted-foreground">Admin Notes</label>
                      <p className="text-sm">{selectedSubmission.adminNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
