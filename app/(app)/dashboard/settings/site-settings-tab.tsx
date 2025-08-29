'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Save,
  Globe,
  Image as ImageIcon,
  Palette,
  Search,
  BarChart3,
  FileText,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'

export function SiteSettingsTab() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    siteName: 'Next.js Full-Stack App',
    siteDescription: 'A modern full-stack application with Next.js 14, TypeScript, and Prisma',
    siteUrl: 'https://yoursite.com',
    siteLogo: '',
    favicon: '',
    language: 'en',
    timezone: 'UTC',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    defaultUserRole: 'USER',
    contactEmail: 'admin@yoursite.com',
    supportEmail: 'support@yoursite.com',
    socialLinks: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
    },
    // SEO Settings
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImage: '',
    twitterCard: 'summary_large_image',
    googleAnalyticsId: '',
    googleSearchConsoleId: '',
    facebookPixelId: '',
    // Sitemap Settings
    sitemapEnabled: true,
    robotsEnabled: true,
    seoIndexing: true,
  })

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/site')
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
        console.error('Error loading settings:', error)
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
      const response = await fetch('/api/settings/site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      // Delay toast to avoid render phase warning
      setTimeout(() => {
        toast.success('Site settings saved successfully!')
      }, 0)
      
      // Revalidate SEO cache
      try {
        await fetch('/api/admin/seo/revalidate', { method: 'POST' })
      } catch (error) {
        console.warn('Failed to revalidate SEO cache:', error)
      }
      
      // Reload settings without full page refresh
      const loadSettings = async () => {
        try {
          const response = await fetch('/api/settings/site')
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
      console.error('Error saving settings:', error)
      setTimeout(() => {
        toast.error('Failed to save settings')
      }, 0)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Information
          </CardTitle>
          <CardDescription>
            Basic information about your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                placeholder="Your Site Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site-url">Site URL</Label>
              <Input
                id="site-url"
                value={settings.siteUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                placeholder="https://yoursite.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              value={settings.siteDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
              placeholder="Brief description of your site"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="admin@yoursite.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                placeholder="support@yoursite.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Logo, favicon, and visual identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site-logo">Logo URL</Label>
              <Input
                id="site-logo"
                value={settings.siteLogo}
                onChange={(e) => setSettings(prev => ({ ...prev, siteLogo: e.target.value }))}
                placeholder="https://yoursite.com/logo.png"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 200x50px PNG with transparent background
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="favicon">Favicon URL</Label>
              <Input
                id="favicon"
                value={settings.favicon}
                onChange={(e) => setSettings(prev => ({ ...prev, favicon: e.target.value }))}
                placeholder="https://yoursite.com/favicon.ico"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 32x32px ICO or PNG format
              </p>
            </div>
          </div>

          {/* Logo Preview */}
          {settings.siteLogo && (
            <div className="space-y-2">
              <Label>Logo Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <img 
                  src={settings.siteLogo} 
                  alt="Site Logo" 
                  className="h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
          <CardDescription>
            Language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Registration */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Control how new users can join your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow User Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to create accounts
              </p>
            </div>
            <Switch
              checked={settings.allowRegistration}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowRegistration: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                New users must verify their email before accessing the platform
              </p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Default User Role</Label>
            <Select 
              value={settings.defaultUserRole} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, defaultUserRole: value }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Role assigned to new users upon registration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Your social media presence and links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={settings.socialLinks.twitter}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                }))}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={settings.socialLinks.facebook}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                }))}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.socialLinks.instagram}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                }))}
                placeholder="https://instagram.com/youraccount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={settings.socialLinks.linkedin}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                }))}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>
            Search engine optimization configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo-title">Default SEO Title</Label>
              <Input
                id="seo-title"
                value={settings.seoTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="Your Site Name - Default Title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seo-keywords">SEO Keywords</Label>
              <Input
                id="seo-keywords"
                value={settings.seoKeywords}
                onChange={(e) => setSettings(prev => ({ ...prev, seoKeywords: e.target.value }))}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo-description">Default SEO Description</Label>
            <Textarea
              id="seo-description"
              value={settings.seoDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="Default meta description for your site"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="og-image">Open Graph Image URL</Label>
              <Input
                id="og-image"
                value={settings.ogImage}
                onChange={(e) => setSettings(prev => ({ ...prev, ogImage: e.target.value }))}
                placeholder="https://yoursite.com/og-image.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twitter-card">Twitter Card Type</Label>
              <Select 
                value={settings.twitterCard} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, twitterCard: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Sitemap</Label>
                <p className="text-sm text-muted-foreground">
                  Generate XML sitemap at /sitemap.xml
                </p>
              </div>
              <Switch
                checked={settings.sitemapEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sitemapEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Robots.txt</Label>
                <p className="text-sm text-muted-foreground">
                  Generate robots.txt file for search engines
                </p>
              </div>
              <Switch
                checked={settings.robotsEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, robotsEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Search Engine Indexing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow search engines to index your site
                </p>
              </div>
              <Switch
                checked={settings.seoIndexing}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, seoIndexing: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Tracking
          </CardTitle>
          <CardDescription>
            Configure analytics and tracking codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="google-analytics">Google Analytics ID</Label>
              <Input
                id="google-analytics"
                value={settings.googleAnalyticsId}
                onChange={(e) => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-console">Google Search Console ID</Label>
              <Input
                id="search-console"
                value={settings.googleSearchConsoleId}
                onChange={(e) => setSettings(prev => ({ ...prev, googleSearchConsoleId: e.target.value }))}
                placeholder="google-site-verification=XXXXXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook-pixel">Facebook Pixel ID</Label>
            <Input
              id="facebook-pixel"
              value={settings.facebookPixelId}
              onChange={(e) => setSettings(prev => ({ ...prev, facebookPixelId: e.target.value }))}
              placeholder="123456789012345"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sitemap Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sitemap Management
          </CardTitle>
          <CardDescription>
            Manage your website's sitemap and SEO files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              onClick={() => window.open('/sitemap.xml', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Sitemap
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/robots.txt', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Robots.txt
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/seo/validate')
                  const data = await response.json()
                  
                  if (response.ok) {
                    if (data.sitemap.accessible && data.robots.accessible) {
                      toast.success('✅ SEO files are accessible!')
                    } else {
                      toast.error('❌ Some SEO files are not accessible')
                    }
                  }
                } catch (error) {
                  toast.error('Failed to validate SEO files')
                }
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Validate SEO
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline"
              onClick={() => {
                const metaTags = [
                  `<title>${settings.seoTitle || settings.siteName}</title>`,
                  `<meta name="description" content="${settings.seoDescription || settings.siteDescription}" />`,
                  settings.seoKeywords && `<meta name="keywords" content="${settings.seoKeywords}" />`,
                  settings.ogImage && `<meta property="og:image" content="${settings.ogImage}" />`,
                  `<meta name="twitter:card" content="${settings.twitterCard}" />`,
                  settings.googleSearchConsoleId && `<meta name="google-site-verification" content="${settings.googleSearchConsoleId.replace('google-site-verification=', '')}" />`,
                ].filter(Boolean).join('\n')
                
                navigator.clipboard.writeText(metaTags)
                toast.success('📋 Meta tags copied to clipboard!')
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Meta Tags
            </Button>
            
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  await fetch('/api/admin/seo/revalidate', { method: 'POST' })
                  toast.success('🔄 SEO cache cleared!')
                } catch (error) {
                  toast.error('Failed to clear SEO cache')
                }
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Clear SEO Cache
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/debug/url')
                  const data = await response.json()
                  
                  console.log('🔍 URL Debug Info:', data)
                  const info = `Environment: ${data.environment.NODE_ENV}\nDetected URL: ${data.urls.detectedURL}\nCurrent Host: ${data.currentHost}\nFull URL: ${data.fullURL}`
                  
                  alert(`🔍 URL Debug Info:\n\n${info}\n\nCheck console for full details.`)
                } catch (error) {
                  toast.error('Failed to debug URL')
                }
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Debug URL
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                🌐 Current URL Configuration:
              </p>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                <p><strong>Site URL:</strong> {settings.siteUrl || 'https://yoursite.com'}</p>
                <p className="mt-1 text-xs">
                  🔧 <strong>Production:</strong> Will use Site URL above<br/>
                  🔧 <strong>Development:</strong> Will use http://localhost:3000<br/>
                  🔧 <strong>Deploy platforms:</strong> Auto-detects Vercel/Railway URLs if Site URL is empty
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                🚀 Dynamic SEO Features:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• Meta tags automatically applied to all pages</li>
                <li>• Google Analytics & Facebook Pixel integrated</li>
                <li>• Structured data (JSON-LD) for better search visibility</li>
                <li>• Dynamic sitemap with published content</li>
                <li>• Robots.txt respects your indexing preferences</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ All settings are live! Changes apply immediately to your website's SEO.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Control */}
      <Card>
        <CardHeader>
          <CardTitle>System Control</CardTitle>
          <CardDescription>
            System-wide settings and maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Put the site in maintenance mode (only admins can access)
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Maintenance mode is enabled. Regular users cannot access the site.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/maintenance/sync', { method: 'POST' })
                      const data = await response.json()
                      
                      if (response.ok) {
                        toast.info(`📋 ${data.recommendation}`, {
                          duration: 8000,
                        })
                      } else {
                        toast.error('Failed to sync maintenance mode')
                      }
                    } catch (error) {
                      toast.error('Error syncing maintenance mode')
                    }
                  }}
                >
                  Sync Server Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Changes will be saved and applied immediately
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Site Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
