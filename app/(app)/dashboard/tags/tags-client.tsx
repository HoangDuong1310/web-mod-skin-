'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Hash,
  FileText
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TagData {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: Date
  _count: {
    postTags: number
  }
}

interface TagsClientProps {
  tags: TagData[]
}

export function TagsClient({ tags }: TagsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteTag = (tagId: string, postCount: number) => {
    if (postCount > 0) {
      alert('Cannot delete tag that is being used by posts')
      return
    }
    
    if (confirm('Are you sure you want to delete this tag?')) {
      // Add actual delete logic here
      console.log('Delete tag:', tagId)
      alert('Delete functionality needs to be implemented with API call')
    }
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            className="pl-8 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Posts</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTags.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No tags found matching your search' : 'No tags found'}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        Create your first tag
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Tag</DialogTitle>
                        <DialogDescription>
                          Add a new tag to organize your blog posts.
                        </DialogDescription>
                      </DialogHeader>
                      <form>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tag-name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="tag-name"
                              placeholder="e.g. Technology"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tag-slug" className="text-right">
                              Slug
                            </Label>
                            <Input
                              id="tag-slug"
                              placeholder="e.g. technology"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tag-description" className="text-right">
                              Description
                            </Label>
                            <Input
                              id="tag-description"
                              placeholder="Optional description"
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Tag</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredTags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  </div>
                  {tag.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {tag.description}
                    </p>
                  )}
                </TableCell>
                
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {tag.slug}
                  </code>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {tag._count.postTags}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {tag._count.postTags === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(tag.createdAt)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tag</DialogTitle>
                          <DialogDescription>
                            Update the tag information.
                          </DialogDescription>
                        </DialogHeader>
                        <form>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-tag-name" className="text-right">
                                Name
                              </Label>
                              <Input
                                id="edit-tag-name"
                                defaultValue={tag.name}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-tag-slug" className="text-right">
                                Slug
                              </Label>
                              <Input
                                id="edit-tag-slug"
                                defaultValue={tag.slug}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-tag-description" className="text-right">
                                Description
                              </Label>
                              <Input
                                id="edit-tag-description"
                                defaultValue={tag.description || ''}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Update Tag</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id, tag._count.postTags)}
                      disabled={tag._count.postTags > 0}
                      title={tag._count.postTags > 0 ? 'Cannot delete tag with posts' : 'Delete tag'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

