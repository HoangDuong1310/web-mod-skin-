'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  Database,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  Activity,
  Users,
  Package,
  Star,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemStats {
  users: number
  products: number
  downloads: number
  reviews: number
  posts: number
}

interface SystemSettingsTabProps {
  systemStats: SystemStats
  systemInfo?: {
    nodeVersion: string
    environment: string
    uptime: string
  }
}

export function SystemSettingsTab({ systemStats, systemInfo }: SystemSettingsTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [settings, setSettings] = useState({
    // Database Settings
    enableBackups: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    
    // Performance
    enableCaching: true,
    cacheTimeout: 3600, // seconds
    enableCompression: true,
    
    // Storage
    maxFileSize: 50, // MB
    allowedFileTypes: 'zip,rar,exe,msi,dmg,pkg',
    storageCleanupEnabled: true,
    
    // Logging
    logLevel: 'info',
    enableErrorReporting: true,
    enablePerformanceMonitoring: false,
  })

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/settings/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save system settings')
      }

      setTimeout(() => {
        toast.success('System settings saved successfully!')
      }, 0)

    } catch (error) {
      console.error('Error saving system settings:', error)
      setTimeout(() => {
        toast.error('Failed to save system settings')
      }, 0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackup = async () => {
    setIsBackingUp(true)
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Backup failed')
      }

      setTimeout(() => {
        toast.success('Database backup completed!')
      }, 0)

    } catch (error) {
      console.error('Error creating backup:', error)
      setTimeout(() => {
        toast.error('Backup failed')
      }, 0)
    } finally {
      setIsBackingUp(false)
    }
  }

  const getStorageUsage = () => {
    // Mock storage calculation - you can implement real storage checking
    const estimatedSize = systemStats.products * 25 // Assume 25MB per product on average
    return {
      used: estimatedSize,
      total: 10000, // 10GB
      percentage: Math.min((estimatedSize / 10000) * 100, 100)
    }
  }

  const storage = getStorageUsage()

  return (
    <div className="grid gap-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Overview
          </CardTitle>
          <CardDescription>
            Current system status and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{systemStats.users}</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Package className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{systemStats.products}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Download className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{systemStats.downloads}</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{systemStats.reviews}</div>
              <div className="text-sm text-muted-foreground">Reviews</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{systemStats.posts}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Management
          </CardTitle>
          <CardDescription>
            File storage and upload settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Storage Usage</Label>
              <span className="text-sm text-muted-foreground">
                {storage.used}MB / {storage.total}MB
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${storage.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {storage.percentage.toFixed(1)}% of total storage used
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-file-size">Max File Size (MB)</Label>
              <Input
                id="max-file-size"
                type="number"
                min="1"
                max="500"
                value={settings.maxFileSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 50 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allowed-types">Allowed File Types</Label>
              <Input
                id="allowed-types"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                placeholder="zip,rar,exe,msi"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Storage Cleanup</Label>
              <p className="text-sm text-muted-foreground">
                Remove unused files automatically
              </p>
            </div>
            <Switch
              checked={settings.storageCleanupEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, storageCleanupEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Database & Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database & Backups
          </CardTitle>
          <CardDescription>
            Database maintenance and backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup database on schedule
              </p>
            </div>
            <Switch
              checked={settings.enableBackups}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableBackups: checked }))}
            />
          </div>

          {settings.enableBackups && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select 
                    value={settings.backupFrequency} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retention-days">Retention (days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    min="7"
                    max="365"
                    value={settings.retentionDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Manual Backup */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Manual Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Create an immediate backup of your database
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleBackup}
                disabled={isBackingUp}
              >
                <Download className="h-4 w-4 mr-2" />
                {isBackingUp ? 'Creating...' : 'Backup Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance & Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Monitoring</CardTitle>
          <CardDescription>
            System performance and monitoring settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Caching</Label>
              <p className="text-sm text-muted-foreground">
                Cache database queries for better performance
              </p>
            </div>
            <Switch
              checked={settings.enableCaching}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCaching: checked }))}
            />
          </div>

          {settings.enableCaching && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label htmlFor="cache-timeout">Cache Timeout (seconds)</Label>
              <Input
                id="cache-timeout"
                type="number"
                min="60"
                max="86400"
                value={settings.cacheTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, cacheTimeout: parseInt(e.target.value) || 3600 }))}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress responses for faster loading
              </p>
            </div>
            <Switch
              checked={settings.enableCompression}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCompression: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Log Level</Label>
            <Select 
              value={settings.logLevel} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, logLevel: value }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error only</SelectItem>
                <SelectItem value="warn">Warning & Error</SelectItem>
                <SelectItem value="info">Info, Warning & Error</SelectItem>
                <SelectItem value="debug">Debug (all logs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>
            Dangerous actions that affect the entire system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 font-medium">
                  <RefreshCw className="h-4 w-4" />
                  Clear Cache
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Clear all cached data
                </p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 font-medium">
                  <Trash2 className="h-4 w-4" />
                  Cleanup Storage
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Remove unused files
                </p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 font-medium">
                  <Database className="h-4 w-4" />
                  Optimize Database
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Optimize database tables
                </p>
              </div>
            </Button>
            
            <Button variant="destructive" className="h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 font-medium">
                  <Trash2 className="h-4 w-4" />
                  Reset System
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ⚠️ Danger: Reset all data
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system environment and versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next.js Version:</span>
                <Badge variant="outline">14.0.4</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node.js Version:</span>
                <Badge variant="outline">{systemInfo?.nodeVersion || 'Unknown'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant={systemInfo?.environment === 'production' ? 'default' : 'secondary'}>
                  {systemInfo?.environment || 'development'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database:</span>
                <Badge variant="outline">MySQL</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cache:</span>
                <Badge variant={settings.enableCaching ? 'default' : 'secondary'}>
                  {settings.enableCaching ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime:</span>
                <Badge variant="outline">
                  {systemInfo?.uptime || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              System settings will be applied after restart (if required)
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save System Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
