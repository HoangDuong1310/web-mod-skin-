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
  Shield,
  Key,
  Clock,
  AlertTriangle,
  Eye,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettingsTab() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    // Password Policies
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordHistoryCount: 3,
    maxPasswordAge: 90, // days
    
    // Session Settings
    sessionTimeout: 24, // hours
    maxConcurrentSessions: 5,
    requireTwoFactor: false,
    
    // Account Security
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    enableCaptcha: false,
    
    // Admin Security
    adminIpWhitelist: '',
    enableAuditLog: true,
    requireAdminApproval: false,
  })

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/security')
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
        console.error('Error loading security settings:', error)
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
      const response = await fetch('/api/settings/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save security settings')
      }

      setTimeout(() => {
        toast.success('Security settings saved successfully!')
      }, 0)
      
      // Reload settings without full page refresh
      const loadSettings = async () => {
        try {
          const response = await fetch('/api/settings/security')
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
      console.error('Error saving security settings:', error)
      setTimeout(() => {
        toast.error('Failed to save security settings')
      }, 0)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading security settings...</span>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Password Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Policies
          </CardTitle>
          <CardDescription>
            Set requirements for user passwords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min-password">Minimum Length</Label>
              <Input
                id="min-password"
                type="number"
                min="6"
                max="20"
                value={settings.minPasswordLength}
                onChange={(e) => setSettings(prev => ({ ...prev, minPasswordLength: parseInt(e.target.value) || 8 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-history">Password History</Label>
              <Input
                id="password-history"
                type="number"
                min="0"
                max="10"
                value={settings.passwordHistoryCount}
                onChange={(e) => setSettings(prev => ({ ...prev, passwordHistoryCount: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Number of previous passwords to remember
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Require Uppercase</Label>
                <Switch
                  checked={settings.requireUppercase}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireUppercase: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Numbers</Label>
                <Switch
                  checked={settings.requireNumbers}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireNumbers: checked }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Require Special Characters</Label>
                <Switch
                  checked={settings.requireSpecialChars}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireSpecialChars: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-password-age">Max Password Age (days)</Label>
                <Input
                  id="max-password-age"
                  type="number"
                  min="0"
                  max="365"
                  value={settings.maxPasswordAge}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxPasswordAge: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Security
          </CardTitle>
          <CardDescription>
            Manage user sessions and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Input
                id="session-timeout"
                type="number"
                min="1"
                max="168"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 24 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-sessions">Max Concurrent Sessions</Label>
              <Input
                id="max-sessions"
                type="number"
                min="1"
                max="20"
                value={settings.maxConcurrentSessions}
                onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Force all users to use 2FA (future feature)
              </p>
            </div>
            <Switch
              checked={settings.requireTwoFactor}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireTwoFactor: checked }))}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Account Protection
          </CardTitle>
          <CardDescription>
            Protect against brute force attacks and abuse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input
                id="max-login-attempts"
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout-duration"
                type="number"
                min="5"
                max="60"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) || 15 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable CAPTCHA</Label>
              <p className="text-sm text-muted-foreground">
                Show CAPTCHA after failed login attempts
              </p>
            </div>
            <Switch
              checked={settings.enableCaptcha}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCaptcha: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Security
          </CardTitle>
          <CardDescription>
            Additional security measures for admin accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="admin-ip-whitelist">Admin IP Whitelist</Label>
            <Input
              id="admin-ip-whitelist"
              value={settings.adminIpWhitelist}
              onChange={(e) => setSettings(prev => ({ ...prev, adminIpWhitelist: e.target.value }))}
              placeholder="192.168.1.1,10.0.0.1 (comma-separated)"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to allow from any IP. Separate multiple IPs with commas.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Audit Log</Label>
              <p className="text-sm text-muted-foreground">
                Log all admin actions for security auditing
              </p>
            </div>
            <Switch
              checked={settings.enableAuditLog}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAuditLog: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Admin Approval</Label>
              <p className="text-sm text-muted-foreground">
                New registrations need admin approval
              </p>
            </div>
            <Switch
              checked={settings.requireAdminApproval}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireAdminApproval: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Security settings will affect all users immediately
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
