'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Save,
  User,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
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

interface EditUserClientProps {
  user: UserData
  currentUserId: string
}

export function EditUserClient({ user, currentUserId }: EditUserClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    role: user.role,
    image: user.image || '',
    emailVerified: !!user.emailVerified,
  })

  const isOwnProfile = user.id === currentUserId

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'STAFF': return 'default'
      case 'USER': return 'secondary'
      default: return 'outline'
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please provide a valid email address')
      return false
    }
    if (formData.image && !formData.image.startsWith('http')) {
      toast.error('Image must be a valid URL')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        image: formData.image.trim() || '',
        emailVerified: formData.emailVerified,
      }

      console.log('🔵 Updating user:', user.id, updateData)

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Error response:', errorData)
        
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => `${detail.field}: ${detail.message}`).join(', ')
          throw new Error(`${errorData.error}: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'Failed to update user')
      }

      const result = await response.json()
      console.log('✅ User updated:', result)

      toast.success('User updated successfully!')
      router.push('/dashboard/users')
      router.refresh()

    } catch (error) {
      console.error('❌ Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    const newPassword = prompt('Enter new temporary password (min 8 characters):')
    
    if (!newPassword) return
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsResettingPassword(true)
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset password')
      }

      toast.success('Password reset successfully!')

    } catch (error) {
      console.error('❌ Error resetting password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDeleteUser = async () => {
    const confirmMessage = `Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully!')
      router.push('/dashboard/users')
      router.refresh()

    } catch (error) {
      console.error('❌ Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Basic user profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center space-x-4">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={user.name || 'User'}
                    className="h-16 w-16 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="space-y-2 flex-1">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={100}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                Used for login and notifications
              </p>
            </div>

            {/* Password Actions */}
            <div className="space-y-2">
              <Label>Password Management</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Send new temporary password
                </p>
              </div>
            </div>

            {/* Update Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" asChild>
                <Link href="/dashboard/users">
                  Cancel
                </Link>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{user._count.downloads}</div>
                <div className="text-sm text-muted-foreground">Downloads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{user._count.reviews}</div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Permissions</CardTitle>
            <CardDescription>
              User role and access level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Role */}
            <div className="space-y-2">
              <Label>Current Role</Label>
              <Badge variant={getRoleColor(user.role)} className="flex items-center w-fit">
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Change Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                disabled={isOwnProfile}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              {isOwnProfile && (
                <p className="text-xs text-muted-foreground">
                  Cannot change your own role
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Verified</span>
              <div className="flex items-center space-x-2">
                <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
                <input
                  type="checkbox"
                  checked={formData.emailVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailVerified: e.target.checked }))}
                  className="rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Account Status</span>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {!isOwnProfile && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting User...' : 'Delete User'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete the user and all their data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

