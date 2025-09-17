// Data Dragon API utilities for League of Legends assets
// Official Riot Games CDN for champion data and images

// Current stable version - update when new patches are released
const CURRENT_VERSION = '15.9.1'

// Get the latest version from Riot API (cached)
let cachedVersion: string | null = null

export async function getLatestDataDragonVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion
  }

  try {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    const versions = await response.json()
    cachedVersion = versions[0] // Latest version is first
    return cachedVersion
  } catch (error) {
    console.warn('Failed to fetch latest Data Dragon version, using fallback:', CURRENT_VERSION)
    return CURRENT_VERSION
  }
}

// Get champion icon URL from Data Dragon CDN
export function getChampionIconUrl(championAlias: string, version?: string): string {
  if (!championAlias) return '/default-avatar.svg'
  const ddVersion = version || CURRENT_VERSION
  return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${championAlias}.png`
}

// Get champion square portrait URL
export function getChampionSquarePortraitUrl(championAlias: string, version?: string): string {
  if (!championAlias) return '/default-avatar.svg'
  const ddVersion = version || CURRENT_VERSION
  return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/square/${championAlias}.png`
}

// Get champion splash art URL
export function getChampionSplashUrl(championAlias: string, skinNum: number = 0): string {
  if (!championAlias) return '/default-skin.svg'
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championAlias}_${skinNum}.jpg`
}

// Get champion loading screen URL
export function getChampionLoadingUrl(championAlias: string, skinNum: number = 0): string {
  if (!championAlias) return '/default-skin.svg'
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championAlias}_${skinNum}.jpg`
}

// Get item icon URL
export function getItemIconUrl(itemId: string, version?: string): string {
  if (!itemId) return '/default-avatar.svg'
  const ddVersion = version || CURRENT_VERSION
  return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item/${itemId}.png`
}

// Validate if Data Dragon URL is accessible
export async function validateDataDragonUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

// Get champion data with fallback
export function getChampionIconWithFallback(championAlias: string): string {
  const iconUrl = getChampionIconUrl(championAlias)
  
  // Add error handling in the component that uses this
  return iconUrl
}
