import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price with currency
export function formatPrice(
  price: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(numPrice)
  } catch (error) {
    console.error('Error formatting price:', error)
    return `$${price}`
  }
}

// Format date
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'en-US'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch (error) {
    console.error('Error formatting date:', error)
    return date.toString()
  }
}

// Generate slug from string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Convert image URL to API format if needed
export function getImageUrl(imageUrl: string): string {
  // Handle null, undefined, or empty strings
  if (!imageUrl || typeof imageUrl !== 'string') {
    console.warn('getImageUrl: Invalid imageUrl provided:', imageUrl)
    return '/placeholder-image.svg'
  }
  
  // Handle corrupted JSON fragments or malformed strings
  if (imageUrl.length < 3 || imageUrl === '[' || imageUrl === ']' || imageUrl === '{}' || imageUrl === 'null') {
    console.warn('getImageUrl: Corrupted or malformed imageUrl detected:', imageUrl)
    return '/placeholder-image.svg'
  }
  
  // Validate that it looks like a proper URL/path
  const urlPattern = /^(\/|http|data:)/
  if (!urlPattern.test(imageUrl)) {
    console.warn('getImageUrl: Invalid URL format:', imageUrl)
    return '/placeholder-image.svg'
  }
  
  // If it's already an API URL or external URL, return as is
  if (imageUrl.startsWith('/api/') || imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // If it's old format (/uploads/...), convert to API format
  if (imageUrl.startsWith('/uploads/')) {
    return `/api${imageUrl}`
  }
  
  return imageUrl
}

// Get champion icon URL from Riot CDN
export function getChampionIconUrl(championAlias: string): string {
  if (!championAlias) return '/placeholder-image.svg'
  return `http://ddragon.leagueoflegends.com/cdn/15.15.1/img/champion/${championAlias}.png`
}

// Get champion square portrait URL
export function getChampionSquarePortraitUrl(squarePortraitPath?: string): string {
  if (!squarePortraitPath) return '/placeholder-image.svg'
  return `http://ddragon.leagueoflegends.com/cdn/15.15.1/img/champion/square/${squarePortraitPath}`
}

// Get skin thumbnail with proper API path
export function getSkinThumbnailUrl(thumbnailImage?: string): string {
  if (!thumbnailImage) return '/placeholder-image.svg'
  
  if (thumbnailImage.startsWith('http')) {
    return thumbnailImage
  }
  
  // If already starts with /uploads/previews/, just add /api prefix
  if (thumbnailImage.startsWith('/uploads/previews/')) {
    return `/api${thumbnailImage}`
  }
  
  return `/api/uploads/previews/${thumbnailImage}`
}

// Truncate text
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Array helpers
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// Object helpers
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => {
    delete result[key]
  })
  return result
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

