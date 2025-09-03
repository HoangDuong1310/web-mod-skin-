'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, Settings, Users, Clock, CheckCircle } from 'lucide-react'

interface EmailSettings {
  enabled: boolean
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
  fromName: string
  fromEmail: string
  replyTo: string
  enableTLS: boolean
  templates: {
    welcome: string
    download: string
    security: string
  }
}

export function EmailNotificationPanel() {
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: true,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromName: 'Your Platform',
    fromEmail: '',
    replyTo: '',
    enableTLS: true,
    templates: {
      welcome: '',
      download: '',
      security: ''
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save email settings')
      }

      // Show success message
      console.log('Email settings saved successfully')
    } catch (error) {
      console.error('Error saving email settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) return
    
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: testEmail,
          settings: settings 
        }),
      })

      const result = await response.json()
      
      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? 'Test email sent successfully!' : 'Failed to send test email')
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error occurred while sending test email'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <div>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Configure SMTP settings for email notifications</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SMTP Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                value={settings.smtpHost}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                placeholder="smtp.gmail.com"
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Select
                value={settings.smtpPort}
                onValueChange={(value) => setSettings(prev => ({ ...prev, smtpPort: value }))}
                disabled={!settings.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 (Non-encrypted)</SelectItem>
                  <SelectItem value="587">587 (STARTTLS)</SelectItem>
                  <SelectItem value="465">465 (SSL/TLS)</SelectItem>
                  <SelectItem value="2525">2525 (Alternative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input
                id="smtp-user"
                type="email"
                value={settings.smtpUser}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                placeholder="your-email@gmail.com"
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input
                id="smtp-password"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                placeholder="App password or SMTP password"
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable TLS/SSL</Label>
              <p className="text-sm text-muted-foreground">
                Enable secure connection for SMTP
              </p>
            </div>
            <Switch
              checked={settings.enableTLS}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableTLS: checked }))}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sender Information</CardTitle>
          <CardDescription>Configure how emails appear to recipients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                value={settings.fromName}
                onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="Your Company Name"
                disabled={!settings.enabled}
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
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-to">Reply-To Email (Optional)</Label>
            <Input
              id="reply-to"
              type="email"
              value={settings.replyTo}
              onChange={(e) => setSettings(prev => ({ ...prev, replyTo: e.target.value }))}
              placeholder="support@yoursite.com"
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Customize email notification templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Welcome Email</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Sent to new users when they register
              </p>
              <Textarea
                value={settings.templates.welcome}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  templates: { ...prev.templates, welcome: e.target.value }
                }))}
                placeholder="Welcome to our platform! Your account has been created successfully..."
                rows={3}
                disabled={!settings.enabled}
              />
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Download Confirmation</span>
                <Badge variant="outline">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Sent when users successfully download software
              </p>
              <Textarea
                value={settings.templates.download}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  templates: { ...prev.templates, download: e.target.value }
                }))}
                placeholder="Your download is ready! Thank you for choosing our software..."
                rows={3}
                disabled={!settings.enabled}
              />
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-red-600" />
                <span className="font-medium">Security Alert</span>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Sent for security-related events and alerts
              </p>
              <Textarea
                value={settings.templates.security}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  templates: { ...prev.templates, security: e.target.value }
                }))}
                placeholder="Security alert: We detected unusual activity on your account..."
                rows={3}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle>Test Email</CardTitle>
          <CardDescription>Send a test email to verify your configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address to test"
                disabled={!settings.enabled || isLoading}
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={!settings.enabled || !testEmail || isLoading}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Test'}
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{testResult.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={!settings.enabled || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save Email Settings'}
        </Button>
      </div>
    </div>
  )
}