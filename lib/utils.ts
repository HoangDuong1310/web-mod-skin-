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
  if (!imageUrl) return ''
  
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

