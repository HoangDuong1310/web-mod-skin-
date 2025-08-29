import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    try {
      // Protect dashboard routes (from (app) route group)
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        if (!req.nextauth.token) {
          return NextResponse.redirect(new URL('/auth/signin', req.url))
        }
        
        // Check admin access for dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          if (req.nextauth.token.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', req.url))
          }
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

