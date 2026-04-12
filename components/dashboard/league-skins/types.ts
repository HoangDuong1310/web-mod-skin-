export interface SyncData {
  cdragon: { totalChampions: number; totalSkins: number }
  db: { totalChampions: number; totalSkins: number; totalWithFiles: number }
  diff: {
    newChampions: { championId: number; name: string }[]
    newSkins: {
      skinId: number; championId: number; name: string
      isBase: boolean; splashUrl: string | null; championName: string
    }[]
    newSkinsByChampion: {
      championId: number; championName: string
      skins: { skinId: number; name: string; splashUrl: string | null }[]
    }[]
    skinsWithoutFiles: {
      skinId: number; championId: number; name: string
      championName: string; splashUrl: string | null
    }[]
    totalNew: number
    totalMissingFiles: number
  }
}

export interface Champion {
  id: string
  championId: number
  nameEn: string
  nameVi: string | null
  _count: { skins: number }
  skins: { skinId: number; nameEn: string; fileUrl: string | null; isActive: boolean }[]
}

export interface Skin {
  id: string
  skinId: number
  championId: number
  nameEn: string
  nameVi: string | null
  fileUrl: string | null
  fileSize: number | null
  fileHash: string | null
  version: number
  isActive: boolean
  isChroma: boolean
  parentSkinId: number | null
  chromas?: Skin[]
  champion?: { nameEn: string; nameVi: string | null; championId: number }
}

export interface Stats {
  totalChampions: number
  totalSkins: number
  totalWithFiles: number
}
