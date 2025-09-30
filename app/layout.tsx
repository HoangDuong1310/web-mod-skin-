import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AuthProvider } from '@/components/shared/auth-provider'
import { MaintenanceChecker } from '@/components/shared/maintenance-checker'
import { AnalyticsScripts } from '@/components/shared/analytics-scripts'
import { DonationProvider } from '@/components/shared/donation-provider'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/shared/structured-data'
import { generateDynamicMetadata, getSEOSettings } from '@/lib/dynamic-seo'
import { DEFAULT_CONFIG } from '@/lib/default-config'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'
import { Live2DWidget } from '@/components/shared/live2d-widget'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading to prevent render blocking
  preload: true,
  fallback: ['system-ui', 'arial'],
})

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
      <head>
        {/* CRITICAL: Error suppressor must load FIRST */}
        <Script
          src="/live2d-project/error-suppressor.js"
          strategy="beforeInteractive"
        />
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
      </head>
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
        <OrganizationStructuredData
          siteName={seoSettings.siteName || DEFAULT_CONFIG.siteName}
          siteDescription={seoSettings.siteDescription || DEFAULT_CONFIG.siteDescription}
          siteUrl={seoSettings.siteUrl || DEFAULT_CONFIG.siteUrl}
          logo="/images/logo.png"
          socialLinks={{
            facebook: "https://facebook.com/yourpage",
            twitter: "https://twitter.com/yourhandle",
            instagram: "https://instagram.com/yourhandle"
          }}
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
              <DonationProvider />
            </MaintenanceChecker>
            <Toaster richColors position="top-right" />
            {/* Live2D Widget */}
            <Live2DWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

