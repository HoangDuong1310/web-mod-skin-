import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle URL canonicalization (www vs non-www)
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  // Force non-www (adjust based on your preference)
  if (hostname.startsWith('www.')) {
    url.hostname = hostname.replace('www.', '')
    return NextResponse.redirect(url, 301)
  }

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/maintenance') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    // Check maintenance mode via API call (edge-runtime compatible)
    const maintenanceResponse = await fetch(new URL('/api/maintenance', request.url), {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      }
    }).catch(() => null)

    let maintenanceMode = false
    if (maintenanceResponse?.ok) {
      const data = await maintenanceResponse.json()
      maintenanceMode = data.maintenanceMode || false
    }
    
    if (maintenanceMode) {
      // Allow admins to access the site during maintenance
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })

      const isAdmin = token?.role === 'ADMIN'
      const isMaintenancePage = pathname === '/maintenance'

      if (!isAdmin && !isMaintenancePage) {
        // Redirect non-admin users to maintenance page
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }

      if (isAdmin && isMaintenancePage) {
        // Redirect admins away from maintenance page
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // For admin routes, we'll handle IP whitelisting in the API routes instead
    // since we can't use Prisma in Edge Runtime

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue on error to avoid blocking the site
    return NextResponse.next()
  }
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  if (remoteAddr) {
    return remoteAddr.trim()
  }
  
  return 'unknown'
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes (except settings)
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    '/((?!api/auth|api/health|api/maintenance|_next/static|_static|[\\w-]+\\.\\w+).*)',
  ],
}
