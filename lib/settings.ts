import { prisma } from '@/lib/prisma'

export interface SettingsData {
  [key: string]: any
}

export async function getSettings(category: string): Promise<SettingsData> {
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

    console.log(`✅ ${category} settings saved successfully`)
  } catch (error) {
    console.error(`❌ Error saving ${category} settings:`, error)
    throw new Error(`Failed to save ${category} settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getSetting(key: string): Promise<any> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    })

    if (!setting?.value) {
      return null
    }

    try {
      return JSON.parse(setting.value)
    } catch {
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
  } catch (error) {
    console.error(`Error setting ${key}:`, error)
    throw new Error(`Failed to set setting ${key}`)
  }
}
