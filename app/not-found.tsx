'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, FileX } from 'lucide-react'
import { useEffect } from 'react'

export default function NotFound() {
  // Set document metadata for 404 page
  useEffect(() => {
    document.title = '404 - Page Not Found'
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'The page you are looking for could not be found. Return to homepage or explore our products.')
    
    // Update robots meta
    let metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.setAttribute('name', 'robots')
      document.head.appendChild(metaRobots)
    }
    metaRobots.setAttribute('content', 'noindex, follow')
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileX className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">404 - Page Not Found</CardTitle>
          <CardDescription className="text-base">
            Oops! The page you are looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Don't worry, you can find what you're looking for from these helpful links:
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/products">
                <Search className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/categories">
                <Search className="mr-2 h-4 w-4" />
                Explore Categories
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              size="lg"
              onClick={() => window.history.back()}
            >
              <svg 
                className="mr-2 h-4 w-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
              Go Back
            </Button>
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact us</Link> or check our <Link href="/blog" className="text-primary hover:underline">blog</Link> for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}