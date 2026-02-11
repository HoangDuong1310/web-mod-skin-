import { prisma } from '@/lib/prisma'

export interface ReviewFilterRule {
  id: string
  type: string
  value: string
  action: string
  isActive: boolean
  description: string | null
}

export interface FilterCheckResult {
  blocked: boolean
  action: 'block' | 'hide' | 'flag' | 'allow'
  matchedFilters: {
    id: string
    type: string
    value: string
    action: string
  }[]
  reason?: string
}

// URL regex pattern
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|vn|co|me|info|biz|xyz|tk|ml|ga|cf|gq|top|site|online|shop|store|app|dev|tech|link|click|download|free)[^\s]*/gi

/**
 * Check review content against all active filters
 * Returns the most severe action found
 */
export async function checkReviewContent(
  title: string,
  content: string,
  guestName?: string,
  guestEmail?: string
): Promise<FilterCheckResult> {
  const filters = await prisma.reviewFilter.findMany({
    where: { isActive: true },
  })

  if (filters.length === 0) {
    return { blocked: false, action: 'allow', matchedFilters: [] }
  }

  const matchedFilters: FilterCheckResult['matchedFilters'] = []
  const textToCheck = `${title} ${content} ${guestName || ''} ${guestEmail || ''}`.toLowerCase()

  for (const filter of filters) {
    let matched = false

    switch (filter.type) {
      case 'keyword': {
        // Kiểm tra từ khóa (case-insensitive, hỗ trợ partial match)
        const keyword = filter.value.toLowerCase().trim()
        if (textToCheck.includes(keyword)) {
          matched = true
        }
        break
      }

      case 'url': {
        // Chặn URL cụ thể hoặc tất cả URL
        if (filter.value === '*') {
          // Block all URLs
          if (URL_PATTERN.test(textToCheck)) {
            matched = true
          }
          URL_PATTERN.lastIndex = 0
        } else {
          const urlPattern = filter.value.toLowerCase().trim()
          if (textToCheck.includes(urlPattern)) {
            matched = true
          }
        }
        break
      }

      case 'regex': {
        // Custom regex pattern
        try {
          const regex = new RegExp(filter.value, 'gi')
          if (regex.test(textToCheck)) {
            matched = true
          }
        } catch {
          // Invalid regex, skip
          console.warn(`Invalid regex filter: ${filter.value}`)
        }
        break
      }

      case 'email': {
        // Block specific email domains or addresses
        const emailPattern = filter.value.toLowerCase().trim()
        const emailToCheck = (guestEmail || '').toLowerCase()
        if (emailToCheck.includes(emailPattern)) {
          matched = true
        }
        break
      }

      default:
        break
    }

    if (matched) {
      matchedFilters.push({
        id: filter.id,
        type: filter.type,
        value: filter.value,
        action: filter.action,
      })
    }
  }

  if (matchedFilters.length === 0) {
    return { blocked: false, action: 'allow', matchedFilters: [] }
  }

  // Increment match counts in background
  const matchedIds = matchedFilters.map((f) => f.id)
  prisma.reviewFilter
    .updateMany({
      where: { id: { in: matchedIds } },
      data: { matchCount: { increment: 1 } },
    })
    .catch((err: Error) => console.error('Failed to update filter match counts:', err))

  // Determine the most severe action: block > hide > flag
  const actionPriority = { block: 3, hide: 2, flag: 1 }
  const mostSevereAction = matchedFilters.reduce((prev, curr) => {
    const prevPriority = actionPriority[prev.action as keyof typeof actionPriority] || 0
    const currPriority = actionPriority[curr.action as keyof typeof actionPriority] || 0
    return currPriority > prevPriority ? curr : prev
  })

  const action = mostSevereAction.action as 'block' | 'hide' | 'flag'
  const blocked = action === 'block'

  // Build reason message
  const reasons = matchedFilters.map((f) => {
    const typeLabel = {
      keyword: 'Từ khóa bị chặn',
      url: 'URL bị chặn',
      regex: 'Mẫu bị chặn',
      email: 'Email bị chặn',
    }[f.type] || 'Bộ lọc'
    return `${typeLabel}: "${f.value}"`
  })

  return {
    blocked,
    action,
    matchedFilters,
    reason: reasons.join(', '),
  }
}

/**
 * Check if content contains any URLs
 */
export function containsUrls(text: string): boolean {
  URL_PATTERN.lastIndex = 0
  return URL_PATTERN.test(text)
}

/**
 * Extract all URLs from text
 */
export function extractUrls(text: string): string[] {
  URL_PATTERN.lastIndex = 0
  return text.match(URL_PATTERN) || []
}
