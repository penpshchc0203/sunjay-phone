import type { KakaoRoom, KakaoFriendProfile, InstagramAccount, InstagramDmThread, InstagramOwnProfile, InstagramPost, InstagramStory, Photo, Note, CallLogEntry, Contact, LockNotification, SmsThread, BrowserSearchEntry, BrowserSearchResult } from '@/lib/phone/content-types'

export interface CoupangOrderItem {
  id: string
  name: string
  option?: string
  image?: string
  price: number
  quantity: number
}
export interface CoupangOrder {
  id: string
  orderNumber: string
  orderedAt: string
  status: string
  deliveredAt?: string
  rocketFresh?: boolean
  items: CoupangOrderItem[]
  shippingFee: number
  totalPrice: number
  shippingAddress?: string
}

export interface Alarm {
  id: string
  time: string // HH:mm
  label: string
  repeatDays: string[] // mon, tue, wed, thu, fri, sat, sun
  enabled: boolean
}

/** 생략한 필드는 기존 content/의 기본값을 사용합니다. 새 회차의 독립 데이터는 []로 명시하세요. */
export interface EpisodeContent {
  kakaoAvatars?: Record<string, string>
  contacts?: Contact[]
  kakaoRooms?: KakaoRoom[]
  kakaoProfiles?: KakaoFriendProfile[]
  instagramProfile?: InstagramOwnProfile
  instagramAccounts?: InstagramAccount[]
  instagramPosts?: InstagramPost[]
  instagramDms?: InstagramDmThread[]
  instagramStories?: InstagramStory[]
  photos?: Photo[]
  alarms?: Alarm[]
  orders?: CoupangOrder[]
  notes?: Note[]
  calls?: CallLogEntry[]
  smsThreads?: SmsThread[]
  browserSearches?: BrowserSearchEntry[]
  browserResults?: BrowserSearchResult[]
  notifications?: LockNotification[]
}
export interface Episode {
  id: string
  title: string
  dateTime: string
  characterIds: string[]
  lockWallpaper?: string
  homeWallpaper?: string
  content: EpisodeContent
}
