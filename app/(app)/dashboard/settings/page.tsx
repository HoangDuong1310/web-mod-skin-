import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Globe,
  Mail,
  Shield,
  Database,
  Bell
} from 'lucide-react'
import { SiteSettingsTab } from './site-settings-tab'
import { EmailSettingsTab } from './email-settings-tab'
import { SecuritySettingsTab } from './security-settings-tab'
import { SystemSettingsTab } from './system-settings-tab'
import { NotificationsSettingsTab } from './notifications-settings-tab'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // Get current system stats for settings
  const systemStats = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.download.count(),
    prisma.review.count(),
    prisma.post.count(),
  ]).then(([users, products, downloads, reviews, posts]) => ({
    users,
    products,
    downloads,
    reviews,
    posts,
  }))

  // Get system information (server-side only)
  const systemInfo = {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure your application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="site" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <SiteSettingsTab />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettingsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettingsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettingsTab />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettingsTab systemStats={systemStats} systemInfo={systemInfo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
