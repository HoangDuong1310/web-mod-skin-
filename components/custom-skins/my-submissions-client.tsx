'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Calendar, Download, Edit2, Eye, FileText, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'

interface Submission {
  id: string
  name: string
  description: string | null
  version: string | null
  fileName: string
  fileSize: number
  fileType: string
  previewImages: string | null
  thumbnailImage: string | null
  status: string
  feedbackMessage: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  champion: {
    id: string
    name: string
    alias: string
    squarePortraitPath: string | null
  } | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  reviewer: {
    id: string
    name: string
  } | null
}

interface MySubmissionsClientProps {
  submissions: Submission[]
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
}

export function MySubmissionsClient({ submissions }: MySubmissionsClientProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    
    try {
      const response = await fetch(`/api/custom-skins/submissions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete submission')
      }

      toast.success('Submission deleted successfully')
      window.location.reload() // Simple refresh for now
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete submission')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
    
    return (
      <Badge variant="secondary" className={colorClass}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
          <p className="text-muted-foreground text-center mb-6">
            You haven't submitted any custom skins yet. Start by uploading your first skin!
          </p>
          <Button asChild>
            <a href="/custom-skins/submit">Submit Your First Skin</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <div className="text-sm text-muted-foreground">Total Submissions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'PENDING' || s.status === 'UNDER_REVIEW').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {submissions.filter(s => s.status === 'REJECTED').length}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="grid gap-6">
        {submissions.map((submission) => {
          let previewImages: string[] = []
          
          try {
            if (submission.previewImages && typeof submission.previewImages === 'string') {
              // Ensure the string is valid JSON
              const trimmed = submission.previewImages.trim()
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                previewImages = JSON.parse(trimmed)
              } else {
                console.warn('Invalid previewImages format:', trimmed)
              }
            }
          } catch (error) {
            console.error('Failed to parse previewImages:', submission.previewImages, error)
            previewImages = []
          }
          
          // Ensure previewImages is an array and contains valid strings
          if (!Array.isArray(previewImages)) {
            previewImages = []
          }
          previewImages = previewImages.filter(img => typeof img === 'string' && img.length > 0)
          
          const primaryImage = submission.thumbnailImage || previewImages[0] || '/placeholder-image.svg'

          return (
            <Card key={submission.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="relative w-full md:w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={getImageUrl(primaryImage)}
                      alt={submission.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{submission.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {submission.champion?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>

                    {submission.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.description}
                      </p>
                    )}

                    {/* Feedback/Notes */}
                    {submission.feedbackMessage && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Review Feedback:</p>
                        <p className="text-sm text-muted-foreground">{submission.feedbackMessage}</p>
                        {submission.reviewer && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Reviewed by {submission.reviewer.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {/* View Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{submission.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium">Champion</p>
                                <p className="text-sm text-muted-foreground">{submission.champion?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium">Category</p>
                                <p className="text-sm text-muted-foreground">{submission.category?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium">File Size</p>
                                <p className="text-sm text-muted-foreground">
                                  {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">File Type</p>
                                <p className="text-sm text-muted-foreground">{submission.fileType.toUpperCase()}</p>
                              </div>
                            </div>
                            
                            {submission.description && (
                              <div>
                                <p className="font-medium mb-2">Description</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {submission.description}
                                </p>
                              </div>
                            )}

                            {previewImages.length > 0 && (
                              <div>
                                <p className="font-medium mb-2">Preview Images</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {previewImages.map((imagePath: string, index: number) => (
                                    <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                                      <Image
                                        src={getImageUrl(imagePath)}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Edit (only for pending submissions) */}
                      {submission.status === 'PENDING' && (
                        <Button variant="outline" size="sm" disabled>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{submission.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(submission.id)}
                              disabled={deletingId === submission.id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingId === submission.id ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* Download (for approved skins) */}
                      {submission.status === 'APPROVED' && (
                        <Button size="sm" asChild>
                          <a href={`/custom-skins/${submission.id}`}>
                            <Download className="h-4 w-4 mr-2" />
                            View Public
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
