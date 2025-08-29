'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  User,
  Shield,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export function NewUserClient() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    image: '',
    sendWelcomeEmail: true,
    requireEmailVerification: false,
    forcePasswordChange: true,
  })

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
    if (!formData.password) {
      toast.error('Password is required')
      return false
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
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
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        image: formData.image.trim() || undefined,
        sendWelcomeEmail: formData.sendWelcomeEmail,
        requireEmailVerification: formData.requireEmailVerification,
        forcePasswordChange: formData.forcePasswordChange,
      }

      console.log('🔵 Creating user with data:', { ...userData, password: '[HIDDEN]' })

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Error response:', errorData)
        
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => `${detail.field}: ${detail.message}`).join(', ')
          throw new Error(`${errorData.error}: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'Failed to create user')
      }

      const result = await response.json()
      console.log('✅ User created:', result)

      toast.success('User created successfully!')
      router.push('/dashboard/users')
      router.refresh()

    } catch (error) {
      console.error('❌ Error creating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'USER': return 'Basic access, can download and review'
      case 'STAFF': return 'Can manage content and moderate'
      case 'ADMIN': return 'Full system access and user management'
      default: return 'Unknown role'
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2">
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
                    alt="Preview"
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
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/100 characters
              </p>
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
                Must be unique - used for login
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter temporary password..."
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={8}
              />
              <p className="text-sm text-muted-foreground">
                Minimum 8 characters. User should change on first login.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password..."
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Permissions</CardTitle>
            <CardDescription>
              Set user role and access level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>User Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
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
            </div>

            {/* Current Role Description */}
            <div className="p-3 bg-muted/50 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  formData.role === 'ADMIN' ? 'destructive' :
                  formData.role === 'STAFF' ? 'default' : 'secondary'
                }>
                  {formData.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(formData.role)}
              </p>
            </div>

            {/* Create Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.password}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating User...' : 'Create User'}
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/users">
                  Cancel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Options */}
        <Card>
          <CardHeader>
            <CardTitle>Account Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send-welcome"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="send-welcome" className="text-sm">
                Send welcome email
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require-verification"
                checked={formData.requireEmailVerification}
                onChange={(e) => setFormData(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="require-verification" className="text-sm">
                Require email verification
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="force-password-change"
                checked={formData.forcePasswordChange}
                onChange={(e) => setFormData(prev => ({ ...prev, forcePasswordChange: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="force-password-change" className="text-sm">
                Force password change on first login
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/users">
                <User className="h-4 w-4 mr-2" />
                View All Users
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <UserPlus className="h-4 w-4 mr-2" />
              Bulk Import Users
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Email must be unique in the system</p>
            <p>• Passwords must be at least 8 characters</p>
            <p>• Users will be notified via email if enabled</p>
            <p>• Role can be changed later if needed</p>
            <p>• Admin role should be used sparingly</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
