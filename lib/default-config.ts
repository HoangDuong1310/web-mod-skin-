// Centralized default configuration using environment variables
export const DEFAULT_CONFIG = {
  siteName: 'Website',
  siteDescription: 'A modern web application',
  siteUrl: 'https://example.com',
  contactEmail: 'contact@example.com',
  supportEmail: 'support@example.com',
  fromName: 'Website',
}

// Helper function to get fallback values for development
export function getDevFallbacks() {
  if (process.env.NODE_ENV === 'development') {
    return {
      siteUrl: 'http://localhost:3000',
    }
  }
  return {}
}