// Banner types for both web and app
export type BannerType = 'INFO' | 'LIVESTREAM' | 'PROMOTION' | 'WARNING' | 'SUCCESS' | 'EVENT'
export type BannerPosition = 'TOP' | 'BOTTOM' | 'MODAL'
export type BannerAudience = 'ALL' | 'AUTHENTICATED' | 'GUEST'

export interface Banner {
  id: string
  title: string
  content?: string | null
  linkUrl?: string | null
  linkText?: string | null
  imageUrl?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  type: BannerType
  position: BannerPosition
  isActive: boolean
  isDismissible: boolean
  showOnMobile: boolean
  startDate?: string | null
  endDate?: string | null
  priority: number
  targetAudience: BannerAudience
  appVisible: boolean
  appData?: string | null
  viewCount?: number
  clickCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface BannerFormData {
  title: string
  content?: string
  linkUrl?: string
  linkText?: string
  imageUrl?: string
  backgroundColor?: string
  textColor?: string
  type: BannerType
  position: BannerPosition
  isActive: boolean
  isDismissible: boolean
  showOnMobile: boolean
  startDate?: string
  endDate?: string
  priority: number
  targetAudience: BannerAudience
  appVisible: boolean
  appData?: string
}

// App-specific banner data structure
export interface AppBannerData {
  // Notification settings
  showAsNotification?: boolean
  notificationTitle?: string
  notificationBody?: string
  
  // Deep link
  deepLink?: string
  
  // Styling for app
  appBackgroundColor?: string
  appTextColor?: string
  appButtonColor?: string
  
  // Schedule
  repeatDaily?: boolean
  reminderTime?: string // HH:mm format
  
  // Extra data
  extra?: Record<string, any>
}

// API Response types
export interface BannersResponse {
  banners: Banner[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BannerResponse {
  banner: Banner
  message?: string
}

// Banner style mapping
export const BANNER_STYLES: Record<BannerType, { bg: string; text: string; icon: string }> = {
  INFO: { bg: 'bg-blue-500', text: 'text-white', icon: 'info' },
  LIVESTREAM: { bg: 'bg-red-500', text: 'text-white', icon: 'video' },
  PROMOTION: { bg: 'bg-purple-500', text: 'text-white', icon: 'gift' },
  WARNING: { bg: 'bg-yellow-500', text: 'text-black', icon: 'alert-triangle' },
  SUCCESS: { bg: 'bg-green-500', text: 'text-white', icon: 'check-circle' },
  EVENT: { bg: 'bg-orange-500', text: 'text-white', icon: 'calendar' },
}

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  INFO: 'Thông tin',
  LIVESTREAM: 'Livestream',
  PROMOTION: 'Khuyến mãi',
  WARNING: 'Cảnh báo',
  SUCCESS: 'Thành công',
  EVENT: 'Sự kiện',
}

export const BANNER_POSITION_LABELS: Record<BannerPosition, string> = {
  TOP: 'Trên cùng',
  BOTTOM: 'Dưới cùng',
  MODAL: 'Popup',
}

export const BANNER_AUDIENCE_LABELS: Record<BannerAudience, string> = {
  ALL: 'Tất cả',
  AUTHENTICATED: 'Đã đăng nhập',
  GUEST: 'Khách',
}
