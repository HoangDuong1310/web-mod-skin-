// Centralized default configuration using environment variables
export const DEFAULT_CONFIG = {
  siteName:
    process.env.APP_NAME || process.env.NEXT_PUBLIC_SITE_NAME || 'Mod Skin LoL',
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Tải Mod Skin LoL và custom skin Liên Minh Huyền Thoại, xem hướng dẫn cài đặt và cập nhật phiên bản mới nhất.',
  siteUrl: (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://modskinslol.com'
  ).replace(/\/$/, ''),
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@modskinslol.com',
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@modskinslol.com',
  fromName: process.env.NEXT_PUBLIC_FROM_NAME || 'Mod Skin LoL',
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
