import { NextRequest } from 'next/server'

interface RateLimitOptions {
  requests: number
  windowMs: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// Simple in-memory store for rate limiting
const store: RateLimitStore = {}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 10 * 60 * 1000)

export function createRateLimit(options: RateLimitOptions) {
  const { requests, windowMs, keyGenerator } = options

  return async function rateLimit(req: NextRequest): Promise<{
    success: boolean
    limit: number
    remaining: number
    resetTime: number
  }> {
    try {
      const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req)
      const now = Date.now()

      // Initialize or reset if window expired
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 0,
          resetTime: now + windowMs,
        }
      }

      // Increment count
      store[key].count++

      const remaining = Math.max(0, requests - store[key].count)
      const success = store[key].count <= requests

      return {
        success,
        limit: requests,
        remaining,
        resetTime: store[key].resetTime,
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      // Allow request on error
      return {
        success: true,
        limit: requests,
        remaining: requests - 1,
        resetTime: Date.now() + windowMs,
      }
    }
  }
}

function getDefaultKey(req: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || req.ip || 'anonymous'
  
  return `rate_limit:${ip}`
}

// Pre-configured rate limiters
export const apiLimiter = createRateLimit({
  requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
})

export const strictLimiter = createRateLimit({
  requests: 10,
  windowMs: 60 * 1000, // 1 minute
})

export const authLimiter = createRateLimit({
  requests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

