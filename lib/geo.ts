/**
 * Geo Location Utilities
 * Detect user country from IP address
 */

// Vietnam country code
const VIETNAM_COUNTRY_CODES = ['VN', 'VNM']

// Check if country is Vietnam
export function isVietnam(countryCode: string | null | undefined): boolean {
  if (!countryCode) return true // Default to VN if unknown
  return VIETNAM_COUNTRY_CODES.includes(countryCode.toUpperCase())
}

// Get country from headers (set by Cloudflare, Vercel, etc.)
export function getCountryFromHeaders(headers: Headers): string | null {
  // Cloudflare
  const cfCountry = headers.get('cf-ipcountry')
  if (cfCountry) return cfCountry
  
  // Vercel
  const vercelCountry = headers.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry
  
  // AWS CloudFront
  const cfViewerCountry = headers.get('cloudfront-viewer-country')
  if (cfViewerCountry) return cfViewerCountry
  
  // Custom header (can be set by nginx/proxy)
  const geoCountry = headers.get('x-geo-country')
  if (geoCountry) return geoCountry
  
  return null
}

// Get currency based on country
export function getCurrencyForCountry(countryCode: string | null): 'VND' | 'USD' {
  if (isVietnam(countryCode)) {
    return 'VND'
  }
  return 'USD'
}

// Get locale based on country
export function getLocaleForCountry(countryCode: string | null): 'vi' | 'en' {
  if (isVietnam(countryCode)) {
    return 'vi'
  }
  return 'en'
}

// Format price based on currency
export function formatPrice(amount: number, currency: 'VND' | 'USD'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Transform plan data for display based on currency
export function transformPlanForCurrency(plan: any, currency: 'VND' | 'USD') {
  const isUsd = currency === 'USD'
  
  return {
    ...plan,
    displayName: isUsd && plan.nameEn ? plan.nameEn : plan.name,
    displayDescription: isUsd && plan.descriptionEn ? plan.descriptionEn : plan.description,
    displayPrice: isUsd && plan.priceUsd ? Number(plan.priceUsd) : Number(plan.price),
    displayComparePrice: isUsd && plan.comparePriceUsd 
      ? Number(plan.comparePriceUsd) 
      : plan.comparePrice ? Number(plan.comparePrice) : null,
    displayCurrency: currency,
    displayFeatures: isUsd && plan.featuresEn 
      ? (typeof plan.featuresEn === 'string' ? JSON.parse(plan.featuresEn) : plan.featuresEn)
      : (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features),
  }
}
