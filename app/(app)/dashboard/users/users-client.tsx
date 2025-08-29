'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Mail,
  Shield,
  Download,
  Star,
  User,
  Search,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface UserData {
  id: string
  name?: string | null
  email: string
  role: string
  image?: string | null
  emailVerified?: Date | null
  createdAt: Date
  _count: {
    downloads: number
    reviews: number
    posts: number
  }
}

interface UsersClientProps {
  users: UserData[]
  currentUserId: string
}

export function UsersClient({ users, currentUserId }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'STAFF': return 'default'
      case 'USER': return 'secondary'
      default: return 'outline'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return Shield
      case 'STAFF': return Edit
      default: return User
    }
  }

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUserId) {
      toast.error('Cannot delete your own account')
      return
    }

    const confirmMessage = `Are you sure you want to delete user "${userName || 'Unknown'}"? This action cannot be undone.`
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(userId)
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      
      // Refresh the page to update the user list
      window.location.reload()

    } catch (error) {
      console.error('❌ Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role..."
            className="pl-8 w-full max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No users found matching your search' : 'No users found'}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => {
              const RoleIcon = getRoleIcon(user.role)
              const isCurrentUser = user.id === currentUserId
              
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {user.image ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={user.image}
                            alt=""
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name || 'Unnamed User'}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                          {user.emailVerified && (
                            <Badge variant="outline" className="ml-2 text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={getRoleColor(user.role)} className="flex items-center w-fit">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Download className="h-3 w-3 mr-1" />
                        {user._count.downloads} downloads
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        {user._count.reviews} reviews
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/users/edit/${user.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      {!isCurrentUser && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                          disabled={isDeleting === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
