function normalizeBaseUrl(value?: string | null): string {
  return value?.trim().replace(/\/+$/, '') || ''
}

// Default to same-origin uploads unless an explicit upload host is configured.
const UPLOAD_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_UPLOAD_BASE_URL || process.env.UPLOAD_BASE_URL
)

// R2 CDN URL for serving files
const R2_CDN_URL = process.env.R2_PUBLIC_URL || 'https://cdn.modskinslol.com'

export { UPLOAD_BASE_URL, R2_CDN_URL };
