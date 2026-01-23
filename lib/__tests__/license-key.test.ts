/**
 * Unit tests for license key expiration date calculation
 * Tests that durations are calculated correctly (e.g., 4 hours = 4 hours, 1 day = 24 hours)
 */

import { describe, it, expect } from 'vitest'
import { calculateExpirationDate, isKeyExpired, getDaysRemaining } from '../license-key'

describe('calculateExpirationDate', () => {
  describe('HOUR duration type', () => {
    it('should add exactly 4 hours when durationValue is 4', () => {
      const now = new Date('2026-01-23T10:00:00Z')
      const result = calculateExpirationDate('HOUR', 4, now)
      
      expect(result).toEqual(new Date('2026-01-23T14:00:00Z'))
    })

    it('should add exactly 1 hour when durationValue is 1', () => {
      const now = new Date('2026-01-23T23:00:00Z')
      const result = calculateExpirationDate('HOUR', 1, now)
      
      expect(result).toEqual(new Date('2026-01-24T00:00:00Z'))
    })

    it('should cross day boundary correctly', () => {
      const now = new Date('2026-01-23T22:30:00Z')
      const result = calculateExpirationDate('HOUR', 4, now)
      
      expect(result).toEqual(new Date('2026-01-24T02:30:00Z'))
    })
  })

  describe('DAY duration type', () => {
    it('should add exactly 24 hours (1 day) when durationValue is 1', () => {
      const now = new Date('2026-01-23T10:30:00Z')
      const result = calculateExpirationDate('DAY', 1, now)
      
      expect(result).toEqual(new Date('2026-01-24T10:30:00Z'))
    })

    it('should add exactly 48 hours (2 days) when durationValue is 2', () => {
      const now = new Date('2026-01-23T10:30:00Z')
      const result = calculateExpirationDate('DAY', 2, now)
      
      expect(result).toEqual(new Date('2026-01-25T10:30:00Z'))
    })
  })

  describe('WEEK duration type', () => {
    it('should add exactly 7 days (1 week) when durationValue is 1', () => {
      const now = new Date('2026-01-23T10:30:00Z')
      const result = calculateExpirationDate('WEEK', 1, now)
      
      expect(result).toEqual(new Date('2026-01-30T10:30:00Z'))
    })

    it('should add exactly 14 days (2 weeks) when durationValue is 2', () => {
      const now = new Date('2026-01-23T10:30:00Z')
      const result = calculateExpirationDate('WEEK', 2, now)
      
      expect(result).toEqual(new Date('2026-02-06T10:30:00Z'))
    })
  })

  describe('MONTH duration type', () => {
    it('should add 1 month correctly', () => {
      const now = new Date('2026-01-15T10:30:00Z')
      const result = calculateExpirationDate('MONTH', 1, now)
      
      expect(result).toEqual(new Date('2026-02-15T10:30:00Z'))
    })

    it('should handle month overflow (January to March)', () => {
      const now = new Date('2026-01-31T10:30:00Z')
      const result = calculateExpirationDate('MONTH', 2, now)
      
      // March has 31 days, so should be March 31
      expect(result).toEqual(new Date('2026-03-31T10:30:00Z'))
    })
  })

  describe('QUARTER duration type', () => {
    it('should add 3 months (1 quarter) correctly', () => {
      const now = new Date('2026-01-15T10:30:00Z')
      const result = calculateExpirationDate('QUARTER', 1, now)
      
      expect(result).toEqual(new Date('2026-04-15T10:30:00Z'))
    })

    it('should add 6 months (2 quarters) correctly', () => {
      const now = new Date('2026-01-15T10:30:00Z')
      const result = calculateExpirationDate('QUARTER', 2, now)
      
      expect(result).toEqual(new Date('2026-07-15T10:30:00Z'))
    })
  })

  describe('YEAR duration type', () => {
    it('should add 1 year correctly', () => {
      const now = new Date('2026-01-15T10:30:00Z')
      const result = calculateExpirationDate('YEAR', 1, now)
      
      expect(result).toEqual(new Date('2027-01-15T10:30:00Z'))
    })

    it('should add 2 years correctly', () => {
      const now = new Date('2026-01-15T10:30:00Z')
      const result = calculateExpirationDate('YEAR', 2, now)
      
      expect(result).toEqual(new Date('2028-01-15T10:30:00Z'))
    })
  })

  describe('LIFETIME duration type', () => {
    it('should return null for LIFETIME', () => {
      const now = new Date('2026-01-23T10:30:00Z')
      const result = calculateExpirationDate('LIFETIME', 1, now)
      
      expect(result).toBeNull()
    })
  })
})

describe('isKeyExpired', () => {
  it('should return false for future dates', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    expect(isKeyExpired(futureDate)).toBe(false)
  })

  it('should return true for past dates', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    expect(isKeyExpired(pastDate)).toBe(true)
  })

  it('should return false for null (lifetime keys)', () => {
    expect(isKeyExpired(null)).toBe(false)
  })
})

describe('getDaysRemaining', () => {
  it('should return correct days remaining for future dates', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    const days = getDaysRemaining(futureDate)
    
    expect(days).toBeGreaterThanOrEqual(2)
    expect(days).toBeLessThanOrEqual(3)
  })

  it('should return 0 for past dates', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    expect(getDaysRemaining(pastDate)).toBe(0)
  })

  it('should return null for lifetime keys', () => {
    expect(getDaysRemaining(null)).toBe(null)
  })
})
