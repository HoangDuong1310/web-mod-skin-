// Environment configuration for upload URLs
const UPLOAD_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://upload.modskinslol.com'  // Bypass Cloudflare
  : '';  // Use relative URLs in development

export { UPLOAD_BASE_URL };
