'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Calendar, LogOut, Settings, Download } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'STAFF':
        return 'default'
      case 'RESELLER':
        return 'default'
      case 'USER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator'
      case 'STAFF':
        return 'Staff Member'
      case 'RESELLER':
        return 'Reseller'
      case 'USER':
        return 'User'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">{session?.user?.name}</h2>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{session?.user?.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Role</span>
                </div>
                <Badge variant={getRoleColor(session?.user?.role || '')}>
                  {getRoleLabel(session?.user?.role || '')}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Member Since</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {session?.user?.createdAt 
                    ? new Date(session.user.createdAt).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>
            </div>

            {session?.user?.role === 'ADMIN' && (
              <>
                <Separator />
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Administrator Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You have administrator privileges and can access the admin dashboard.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">
                      <Settings className="h-4 w-4 mr-2" />
                      Go to Admin Dashboard
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <Link href="/products">
                  <Download className="h-4 w-4 mr-2" />
                  Browse Software
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/profile/downloads">
                  <Download className="h-4 w-4 mr-2" />
                  My Downloads
                </Link>
              </Button>

              <Button 
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
