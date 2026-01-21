/**
 * YeuMoney URL Shortener API Integration
 * Utility for creating shortened URLs through YeuMoney API
 */

const YEUMONEY_API_URL = 'https://yeumoney.com/QL_api.php'
const YEUMONEY_TOKEN = process.env.YEUMONEY_API_TOKEN

export interface YeuMoneyResponse {
    status: 'success' | string
    shortenedUrl?: string
}

export interface ShortenUrlResult {
    success: boolean
    shortenedUrl?: string
    error?: string
}

/**
 * Shorten a URL using YeuMoney API
 * @param url The URL to shorten
 * @returns Result object with shortened URL or error
 */
export async function shortenUrl(url: string): Promise<ShortenUrlResult> {
    if (!YEUMONEY_TOKEN) {
        console.error('YEUMONEY_API_TOKEN is not configured')
        return {
            success: false,
            error: 'YeuMoney API token not configured'
        }
    }

    try {
        const apiUrl = new URL(YEUMONEY_API_URL)
        apiUrl.searchParams.set('token', YEUMONEY_TOKEN)
        apiUrl.searchParams.set('format', 'json')
        apiUrl.searchParams.set('url', url)

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            console.error('YeuMoney API request failed:', response.status, response.statusText)
            return {
                success: false,
                error: `API request failed: ${response.status}`
            }
        }

        const data: YeuMoneyResponse = await response.json()

        if (data.status === 'success' && data.shortenedUrl) {
            // Clean up the URL (remove escape characters if any)
            const cleanUrl = data.shortenedUrl.replace(/\\/g, '')
            return {
                success: true,
                shortenedUrl: cleanUrl
            }
        }

        return {
            success: false,
            error: data.status || 'Unknown error'
        }
    } catch (error) {
        console.error('YeuMoney API error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        }
    }
}

/**
 * Generate a callback URL for free key verification
 * @param sessionToken The unique session token
 * @param baseUrl The base URL of the application
 * @returns The callback URL
 */
export function generateCallbackUrl(sessionToken: string, baseUrl: string): string {
    const callbackUrl = new URL('/api/free-key/callback', baseUrl)
    callbackUrl.searchParams.set('token', sessionToken)
    return callbackUrl.toString()
}

/**
 * Create a shortened URL for free key generation
 * @param sessionToken The unique session token
 * @param baseUrl The base URL of the application (e.g., https://example.com)
 * @returns Result with shortened URL
 */
export async function createFreeKeyLink(
    sessionToken: string,
    baseUrl: string
): Promise<ShortenUrlResult> {
    const callbackUrl = generateCallbackUrl(sessionToken, baseUrl)
    return shortenUrl(callbackUrl)
}
