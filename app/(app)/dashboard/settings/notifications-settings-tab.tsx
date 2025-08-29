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
  Bell,
  Mail,
  MessageSquare,
  Download,
  Star,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

export function NotificationsSettingsTab() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    // Admin Notifications
    newUserNotification: true,
    newProductNotification: true,
    newReviewNotification: true,
    systemErrorNotification: true,
    backupNotification: true,
    
    // User Notifications
    welcomeEmailEnabled: true,
    downloadConfirmationEnabled: false,
    reviewApprovalNotification: true,
    passwordChangeNotification: true,
    securityAlertNotification: true,
    
    // Notification Channels
    emailNotifications: true,
    browserNotifications: false,
    slackNotifications: false,
    
    // Notification Settings
    notificationFrequency: 'immediate',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    enableQuietHours: true,
    
    // Integration Settings
    slackWebhookUrl: '',
    discordWebhookUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
  })

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/notifications')
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
        console.error('Error loading notification settings:', error)
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
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save notification settings')
      }

      setTimeout(() => {
        toast.success('Notification settings saved successfully!')
      }, 0)
      
      // Reload settings without full page refresh
      const loadSettings = async () => {
        try {
          const response = await fetch('/api/settings/notifications')
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
      console.error('Error saving notification settings:', error)
      setTimeout(() => {
        toast.error('Failed to save notification settings')
      }, 0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestNotification = async (channel: string) => {
    try {
      const response = await fetch('/api/settings/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel }),
      })

      if (!response.ok) {
        throw new Error(`Test ${channel} notification failed`)
      }

      setTimeout(() => {
        toast.success(`Test ${channel} notification sent!`)
      }, 0)

    } catch (error) {
      console.error(`Error testing ${channel} notification:`, error)
      setTimeout(() => {
        toast.error(`Failed to send test ${channel} notification`)
      }, 0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading notification settings...</span>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Admin Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Notifications
          </CardTitle>
          <CardDescription>
            Get notified about important system events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New User Registrations</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when new users register
                </p>
              </div>
              <Switch
                checked={settings.newUserNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, newUserNotification: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Product Uploads</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when new products are uploaded
                </p>
              </div>
              <Switch
                checked={settings.newProductNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, newProductNotification: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Reviews</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when users submit reviews
                </p>
              </div>
              <Switch
                checked={settings.newReviewNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, newReviewNotification: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Errors</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about critical system errors
                </p>
              </div>
              <Switch
                checked={settings.systemErrorNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemErrorNotification: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Status</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about backup success/failure
                </p>
              </div>
              <Switch
                checked={settings.backupNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, backupNotification: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Notifications
          </CardTitle>
          <CardDescription>
            Configure notifications sent to your users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
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
                <Label>Download Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Email users when they download software
                </p>
              </div>
              <Switch
                checked={settings.downloadConfirmationEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, downloadConfirmationEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Review Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Notify users when their reviews are approved
                </p>
              </div>
              <Switch
                checked={settings.reviewApprovalNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reviewApprovalNotification: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify users about security-related events
                </p>
              </div>
              <Switch
                checked={settings.securityAlertNotification}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, securityAlertNotification: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how notifications are delivered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications via email
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestNotification('email')}
                  disabled={!settings.emailNotifications}
                >
                  Test
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-green-600" />
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show browser push notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.browserNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, browserNotifications: checked }))}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestNotification('browser')}
                  disabled={!settings.browserNotifications}
                >
                  Test
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <div>
                  <Label>Slack Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to Slack
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, slackNotifications: checked }))}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestNotification('slack')}
                  disabled={!settings.slackNotifications || !settings.slackWebhookUrl}
                >
                  Test
                </Button>
              </div>
            </div>
          </div>

          {/* Slack Configuration */}
          {settings.slackNotifications && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-200">
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  value={settings.slackWebhookUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Schedule</CardTitle>
          <CardDescription>
            Control when notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select 
              value={settings.notificationFrequency} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, notificationFrequency: value }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Don't send notifications during specified hours
              </p>
            </div>
            <Switch
              checked={settings.enableQuietHours}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableQuietHours: checked }))}
            />
          </div>

          {settings.enableQuietHours && (
            <div className="grid gap-4 md:grid-cols-2 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Quiet Hours Start</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => setSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Quiet Hours End</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => setSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>External Integrations</CardTitle>
          <CardDescription>
            Connect with external services for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Discord Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Discord Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications to Discord channel
                </p>
              </div>
              <Badge variant={settings.discordWebhookUrl ? 'default' : 'secondary'}>
                {settings.discordWebhookUrl ? 'Connected' : 'Not configured'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
              <Input
                id="discord-webhook"
                value={settings.discordWebhookUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, discordWebhookUrl: e.target.value }))}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            
            {settings.discordWebhookUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTestNotification('discord')}
              >
                Test Discord Notification
              </Button>
            )}
          </div>

          {/* Telegram Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Telegram Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via Telegram bot
                </p>
              </div>
              <Badge variant={settings.telegramBotToken ? 'default' : 'secondary'}>
                {settings.telegramBotToken ? 'Connected' : 'Not configured'}
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telegram-token">Bot Token</Label>
                <Input
                  id="telegram-token"
                  type="password"
                  value={settings.telegramBotToken}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="Bot token from @BotFather"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegram-chat">Chat ID</Label>
                <Input
                  id="telegram-chat"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder="Chat ID to send messages"
                />
              </div>
            </div>
            
            {settings.telegramBotToken && settings.telegramChatId && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTestNotification('telegram')}
              >
                Test Telegram Notification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Templates</CardTitle>
          <CardDescription>
            Customize notification messages and templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Welcome Email Template</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Welcome new users to your platform with a personalized message
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Edit Template
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Download Notification</span>
                <Badge variant="outline">Inactive</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Confirm successful downloads and provide support information
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Edit Template
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium">Security Alert</span>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Alert users about security events and login attempts
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Edit Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Notification settings will be applied immediately
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
