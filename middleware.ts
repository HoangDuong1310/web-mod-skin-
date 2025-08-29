import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    try {
      // Simple maintenance mode check using environment variable as backup
      const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
      
      // Skip maintenance check for admin routes, API routes, and static assets
      const isExcludedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                             req.nextUrl.pathname.startsWith('/auth') ||
                             req.nextUrl.pathname.startsWith('/api') ||
                             req.nextUrl.pathname.startsWith('/_next') ||
                             req.nextUrl.pathname.startsWith('/maintenance') ||
                             req.nextUrl.pathname === '/favicon.ico' ||
                             req.nextUrl.pathname === '/robots.txt' ||
                             req.nextUrl.pathname === '/sitemap.xml'

      // If maintenance mode is enabled via env variable, redirect non-admin users
      if (isMaintenanceMode && !isExcludedRoute) {
        const isAdmin = req.nextauth.token?.role === 'ADMIN'
        
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/maintenance', req.url))
        }
      }
      
      // Protect dashboard routes (from (app) route group)
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        if (!req.nextauth.token) {
          return NextResponse.redirect(new URL('/auth/signin', req.url))
        }
        
        // Check admin access for dashboard routes
        if (req.nextauth.token.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', req.url))
        }
      }
      
      return NextResponse.next()
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.next()
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (!req.nextUrl.pathname.startsWith('/dashboard')) {
          return true
        }
        
        // Require authentication for /dashboard routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}

