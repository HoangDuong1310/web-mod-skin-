// Environment configuration for upload URLs
const UPLOAD_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://upload.modskinslol.com'  // Bypass Cloudflare
  : '';  // Use relative URLs in development

// R2 CDN URL for serving files
const R2_CDN_URL = process.env.R2_PUBLIC_URL || 'https://cdn.modskinslol.com'

export { UPLOAD_BASE_URL, R2_CDN_URL };
