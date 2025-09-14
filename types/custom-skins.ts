export interface Champion {
  id: number
  name: string
  description: string
  alias: string
  squarePortraitPath: string
  roles: string[]
  skinCount?: number
}

export interface SkinCategory {
  id: string
  name: string
  slug: string
  description?: string
  skinCount?: number
}

export interface CustomSkin {
  id: string
  name: string
  description: string
  version: string
  championId: number
  categoryId: string
  authorId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: 'ZIP' | 'RAR' | 'FANTOME'
  previewImages: string[]
  thumbnailImage?: string
  status: 'APPROVED' | 'FEATURED' | 'HIDDEN'
  downloadCount: number
  createdAt: string
  updatedAt: string
  champion: {
    id: number
    name: string
    alias: string
    squarePortraitPath: string
    roles?: string[]
  }
  category: {
    id: string
    name: string
    slug: string
  }
  author: {
    id: string
    name: string
  }
}

export interface SkinSubmission {
  id: string
  name: string
  description: string
  version: string
  championId: number
  categoryId: string
  submitterId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: 'ZIP' | 'RAR' | 'FANTOME'
  previewImages: string[]
  thumbnailImage?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
  reviewedById?: string
  reviewedAt?: string
  adminNotes?: string
  feedbackMessage?: string
  createdAt: string
  updatedAt: string
  champion: {
    name: string
    alias: string
    squarePortraitPath: string
  }
  category: {
    name: string
  }
  submitter?: {
    id: string
    name: string
    email: string
  }
  reviewer?: {
    name: string
  }
}

export interface SkinDownload {
  id: string
  userId?: string
  skinId: string
  downloadIp?: string
  userAgent?: string
  createdAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}