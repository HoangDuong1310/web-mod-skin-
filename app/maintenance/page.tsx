'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Clock, Shield } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Settings className="h-8 w-8 text-yellow-500 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Site Under Maintenance</CardTitle>
          <Badge variant="outline" className="mx-auto">
            <Clock className="h-4 w-4 mr-2" />
            Temporarily Unavailable
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground leading-relaxed">
              We're currently performing scheduled maintenance to improve your experience. 
              Our team is working hard to get everything back online as soon as possible.
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-500" />
              What's being updated?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Performance optimizations</li>
              <li>• Security enhancements</li>
              <li>• New features deployment</li>
              <li>• Database maintenance</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="default" className="flex-1">
              <Link href="/auth/signin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Login
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Expected downtime: <strong>1-2 hours</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Follow us on social media for real-time updates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
