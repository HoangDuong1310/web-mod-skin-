import { describe, it, expect } from 'vitest'
import { 
  cn, 
  formatPrice, 
  formatDate, 
  slugify, 
  truncate, 
  isValidEmail, 
  isValidUrl,
  uniqueBy,
  omit,
  pick
} from '../utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
      expect(cn('px-4', 'px-2')).toBe('px-2')
      expect(cn('px-4', undefined, 'py-2')).toBe('px-4 py-2')
      expect(cn('px-4', false && 'py-2')).toBe('px-4')
    })
  })

  describe('formatPrice', () => {
    it('should format prices correctly', () => {
      expect(formatPrice(99.99)).toBe('$99.99')
      expect(formatPrice('149.50')).toBe('$149.50')
      expect(formatPrice(1000, 'EUR', 'de-DE')).toMatch(/€/)
    })

    it('should handle invalid prices', () => {
      expect(formatPrice('invalid')).toBe('$invalid')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15T10:30:00Z')
      expect(formatted).toContain('January')
    })
  })

  describe('slugify', () => {
    it('should create correct slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('  iPhone 15 Pro  ')).toBe('iphone-15-pro')
      expect(slugify('Product & Service')).toBe('product-service')
      expect(slugify('café-été')).toBe('caf-t')
      expect(slugify('---test---')).toBe('test')
    })
  })

  describe('truncate', () => {
    it('should truncate text correctly', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncate(longText, 20)).toBe('This is a very long...')
      expect(truncate('Short text', 20)).toBe('Short text')
      expect(truncate(longText)).toHaveLength(103) // 100 + "..."
    })
  })

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('example.com')).toBe(false)
    })
  })

  describe('uniqueBy', () => {
    it('should remove duplicates by key', () => {
      const array = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John Doe' },
        { id: 3, name: 'Bob' },
      ]
      
      const unique = uniqueBy(array, 'id')
      expect(unique).toHaveLength(3)
      expect(unique.map(item => item.id)).toEqual([1, 2, 3])
      expect(unique.find(item => item.id === 1)?.name).toBe('John')
    })
  })

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      const result = omit(obj, ['b', 'd'])
      expect(result).toEqual({ a: 1, c: 3 })
      expect(Object.keys(result)).not.toContain('b')
      expect(Object.keys(result)).not.toContain('d')
    })
  })

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      const result = pick(obj, ['a', 'c'])
      expect(result).toEqual({ a: 1, c: 3 })
      expect(Object.keys(result)).toHaveLength(2)
    })

    it('should handle missing keys', () => {
      const obj = { a: 1, b: 2 }
      const result = pick(obj, ['a', 'c'] as any)
      expect(result).toEqual({ a: 1 })
    })
  })
})

