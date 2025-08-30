import type { Session } from 'next-auth'
import { canAccessDashboard } from './auth-utils'

/**
 * Get the appropriate redirect URL after successful login
 */
export function getPostLoginRedirectUrl(session: Session | null, requestedUrl?: string): string {
  if (!session?.user) {
    return '/'
  }

  // If user requested a specific URL, try to honor it
  if (requestedUrl && requestedUrl !== '/auth/signin') {
    // Check if user can access the requested URL
    if (requestedUrl.startsWith('/dashboard')) {
      return canAccessDashboard(session.user.role) ? requestedUrl : '/'
    }
    return requestedUrl
  }

  // Default redirect based on user role
  if (canAccessDashboard(session.user.role)) {
    return '/dashboard'
  }

  return '/'
}

/**
 * Get the appropriate redirect URL after logout
 */
export function getPostLogoutRedirectUrl(): string {
  // Always redirect to home page after logout
  return '/'
}