import { prisma } from '@/lib/prisma'

export interface SettingsData {
  [key: string]: any
}

// In-memory cache to reduce database queries
const settingsCache = new Map<string, { data: SettingsData; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache TTL

// Cache for single settings
const singleSettingCache = new Map<string, { data: any; timestamp: number }>()
const SINGLE_CACHE_TTL = 30000 // 30 seconds for single settings

// Helper to clear cache for a category
function clearCategoryCache(category: string) {
  settingsCache.delete(category)
  // Also clear single setting caches that might be affected
  for (const key of singleSettingCache.keys()) {
    if (key.startsWith(`${category}.`)) {
      singleSettingCache.delete(key)
    }
  }
}

export async function getSettings(category: string): Promise<SettingsData> {
  const cacheKey = category
  const now = Date.now()

  // Check cache first
  const cached = settingsCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { startsWith: `${category}.` }
      },
      select: {
        key: true,
        value: true,
      },
    })

    const result: SettingsData = {}
    for (const setting of settings) {
      try {
        // Remove category prefix from key
        const actualKey = setting.key.replace(`${category}.`, '')
        // Try to parse as JSON, fallback to string
        result[actualKey] = setting.value ? JSON.parse(setting.value) : null
      } catch {
        const actualKey = setting.key.replace(`${category}.`, '')
        result[actualKey] = setting.value
      }
    }

    // Store in cache
    settingsCache.set(cacheKey, { data: result, timestamp: now })

    return result
  } catch (error) {
    console.error(`Error fetching ${category} settings:`, error)
    return {}
  }
}

export async function saveSettings(category: string, settings: SettingsData): Promise<void> {
  try {
    // Save settings individually (Prisma transaction có thể có issue với model names)
    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `${category}.${key}`
      const settingValue = typeof value === 'string' ? value : JSON.stringify(value)

      // Use upsert for atomic create/update
      await prisma.setting.upsert({
        where: { key: settingKey },
        update: {
          value: settingValue,
          updatedAt: new Date(),
        },
        create: {
          key: settingKey,
          value: settingValue,
          category,
          isPublic: false,
        }
      })
    }

    // Clear cache after saving
    clearCategoryCache(category)

    console.log(`✅ ${category} settings saved successfully`)
  } catch (error) {
    console.error(`❌ Error saving ${category} settings:`, error)
    throw new Error(`Failed to save ${category} settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getSetting(key: string): Promise<any> {
  const now = Date.now()

  // Check cache first
  const cached = singleSettingCache.get(key)
  if (cached && (now - cached.timestamp) < SINGLE_CACHE_TTL) {
    return cached.data
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    })

    if (!setting?.value) {
      singleSettingCache.set(key, { data: null, timestamp: now })
      return null
    }

    try {
      const parsed = JSON.parse(setting.value)
      singleSettingCache.set(key, { data: parsed, timestamp: now })
      return parsed
    } catch {
      singleSettingCache.set(key, { data: setting.value, timestamp: now })
      return setting.value
    }
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }
}

export async function setSetting(key: string, value: any, category: string = 'general'): Promise<void> {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

    await prisma.setting.upsert({
      where: { key },
      update: {
        value: stringValue,
        updatedAt: new Date(),
      },
      create: {
        key,
        value: stringValue,
        category,
        isPublic: false,
      },
    })

    // Clear cache after setting
    singleSettingCache.delete(key)
    if (category) {
      clearCategoryCache(category)
    }
  } catch (error) {
    console.error(`Error setting ${key}:`, error)
    throw new Error(`Failed to set setting ${key}`)
  }
}
