'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  Mail,
  Send,
  TestTube,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

export function EmailSettingsTab() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromName: 'Next.js App',
    fromEmail: '',
    replyToEmail: '',
    
    // Email notifications
    welcomeEmailEnabled: true,
    passwordResetEnabled: true,
    reviewNotificationEnabled: true,
    downloadNotificationEnabled: false,
    adminNotificationEnabled: true,
  })

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/email')
        if (response.ok) {
          const data = await response.json()
          // Convert null values to empty strings for React inputs
          const cleanSettings = Object.fromEntries(
            Object.entries(data.settings).map(([key, value]) => [
              key, 
              value === null ? '' : value
            ])
          )
          setSettings(prev => ({ ...prev, ...cleanSettings }))
        }
      } catch (error) {
        console.error('Error loading email settings:', error)
        // Don't show toast during initial load to avoid render warnings
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      console.log('🔵 Sending email settings:', settings)
      
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      
      console.log('🔵 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ API Error Response:', errorData)
        
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => `${detail.field}: ${detail.message}`).join(', ')
          throw new Error(`${errorData.error}: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'Failed to save email settings')
      }

      // Delay toast to avoid render phase warning
      setTimeout(() => {
        toast.success('Email settings saved successfully!')
      }, 0)
      
      // Reload settings without full page refresh
      const loadSettings = async () => {
        try {
          const response = await fetch('/api/settings/email')
          if (response.ok) {
            const data = await response.json()
            const cleanSettings = Object.fromEntries(
              Object.entries(data.settings).map(([key, value]) => [
                key, 
                value === null ? '' : value
              ])
            )
            setSettings(prev => ({ ...prev, ...cleanSettings }))
          }
        } catch (error) {
          console.error('Error reloading settings:', error)
        }
      }
      loadSettings()

    } catch (error) {
      console.error('Error saving email settings:', error)
      setTimeout(() => {
        toast.error('Failed to save email settings')
      }, 0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestEmail = async () => {
    setIsTesting(true)
    
    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Test email failed')
      }

      setTimeout(() => {
        toast.success('Test email sent successfully!')
      }, 0)

    } catch (error) {
      console.error('Error sending test email:', error)
      setTimeout(() => {
        toast.error('Failed to send test email')
      }, 0)
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading email settings...</span>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Configure email delivery settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SMTP</Label>
              <p className="text-sm text-muted-foreground">
                Use custom SMTP server for email delivery
              </p>
            </div>
            <Switch
              checked={settings.smtpEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smtpEnabled: checked }))}
            />
          </div>

          {settings.smtpEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    value={settings.smtpUsername}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    placeholder="your-app-password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">
                    Secure connection to SMTP server
                  </p>
                </div>
                <Switch
                  checked={settings.smtpSecure}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smtpSecure: checked }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Email Sender
          </CardTitle>
          <CardDescription>
            Configure sender information for outgoing emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                value={settings.fromName}
                onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="Your App Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@yoursite.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-to-email">Reply-To Email</Label>
            <Input
              id="reply-to-email"
              type="email"
              value={settings.replyToEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
              placeholder="support@yoursite.com"
            />
          </div>

          {/* Test Email */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleTestEmail}
              disabled={isTesting || !settings.smtpEnabled}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Sends a test email to verify your SMTP configuration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Configure which email notifications to send
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Welcome Emails</Label>
              <p className="text-sm text-muted-foreground">
                Send welcome email to new users
              </p>
            </div>
            <Switch
              checked={settings.welcomeEmailEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, welcomeEmailEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Password Reset</Label>
              <p className="text-sm text-muted-foreground">
                Send password reset emails
              </p>
            </div>
            <Switch
              checked={settings.passwordResetEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, passwordResetEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Review Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Notify users when their reviews are approved/rejected
              </p>
            </div>
            <Switch
              checked={settings.reviewNotificationEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reviewNotificationEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Admin Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications to admins for important events
              </p>
            </div>
            <Switch
              checked={settings.adminNotificationEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, adminNotificationEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Email settings will be saved and applied immediately
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Email Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
