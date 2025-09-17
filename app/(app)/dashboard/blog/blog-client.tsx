'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User,
  Search,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  title: string
  slug: string
  status: string
  excerpt?: string | null
  publishedAt?: Date | null
  createdAt: Date
  author: {
    name?: string | null
    email: string
  }
  postTags: {
    tag: {
      name: string
      slug: string
    }
  }[]
}

interface BlogClientProps {
  posts: Post[]
}

export function BlogClient({ posts }: BlogClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'default'
      case 'DRAFT': return 'secondary'
      case 'ARCHIVED': return 'outline'
      default: return 'outline'
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeletePost = (postId: string) => {
    // This would be implemented with a proper delete API call
    console.log('Delete post:', postId)
    if (confirm('Are you sure you want to delete this post?')) {
      // Add actual delete logic here
      alert('Delete functionality needs to be implemented with API call')
    }
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-8 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPosts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No posts found matching your search' : 'No posts found'}
                  </p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/blog/new">
                      Create your first post
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {post.postTags.slice(0, 3).map((postTag) => (
                        <Badge 
                          key={postTag.tag.slug} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {postTag.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {post.author.name || 'Anonymous'}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={getStatusColor(post.status)}>
                    {post.status.toLowerCase()}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/blog/edit/${post.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
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

