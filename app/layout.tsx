import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AuthProvider } from '@/components/shared/auth-provider'
import { MaintenanceChecker } from '@/components/shared/maintenance-checker'
import { AnalyticsScripts } from '@/components/shared/analytics-scripts'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/shared/structured-data'
import { generateDynamicMetadata, getSEOSettings } from '@/lib/dynamic-seo'
import { DEFAULT_CONFIG } from '@/lib/default-config'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  return await generateDynamicMetadata()
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const seoSettings = await getSEOSettings()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.className
      )}>
        <AnalyticsScripts
          googleAnalyticsId={seoSettings.googleAnalyticsId}
          googleSearchConsoleId={seoSettings.googleSearchConsoleId}
          facebookPixelId={seoSettings.facebookPixelId}
        />
        <WebsiteStructuredData
          siteName={seoSettings.siteName || DEFAULT_CONFIG.siteName}
          siteDescription={seoSettings.siteDescription || DEFAULT_CONFIG.siteDescription}
          siteUrl={seoSettings.siteUrl || DEFAULT_CONFIG.siteUrl}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MaintenanceChecker>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
            </MaintenanceChecker>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

