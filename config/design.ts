import {
  AlarmClock,
  ShoppingBag,
  AtSign,
  BookUser,
  Globe,
  Image as ImageIcon,
  MessageCircle,
  MessagesSquare,
  Phone,
  Settings,
  StickyNote,
  CalendarDays, ClipboardList, CloudSun, CalendarCheck, Layers3,
} from 'lucide-react'
import type { DesignConfig } from '@/lib/phone/config-types'

/**
 * 휴대폰의 겉모습 설정.
 * 배경화면·색상·앱 이름·아이콘·홈 화면 배치를 이 파일에서 바꿀 수 있습니다.
 */
export const DESIGN: DesignConfig = {
  lockScreen: {
    wallpaper: '/sunjay-phone/images/photos/y2f7n.jpg',
    dimOpacity: 0.25,
    clockColor: '#ffffff',
    textColor: '#ffffff',
  },

  homeScreen: {
    wallpaper: '/sunjay-phone/images/photos/photo-ep02-80twvm9o.jpg',
    dimOpacity: 0.1,
    clockColor: '#ffffff',
    textColor: '#ffffff',
  },

  statusBar: {
    textColor: '#ffffff',
    carrier: 'SKT',
    batteryLevel: 82,
    signalStrength: 4,
    wifi: true,
  },

  theme: {
    appBackground: '#09090b',
    surface: '#18181b',
    textColor: '#ffffff',
    accent: '#38bdf8',
  },

  apps: {
    /* ── 구현된 앱 ── */
    settings: {
      name: '설정',
      icon: Settings,
      iconImage: '/sunjay-phone/app-icons/settings.webp',
      tileColor: '#71717a',
      implemented: true,
    },

    /* ── 아직 구현되지 않은 앱 (콘텐츠 데이터만 준비됨, 누르면 "구현되지 않음" 화면 표시) ── */
    messages: {
      name: '메시지',
      icon: MessageCircle,
      iconImage: '/sunjay-phone/app-icons/message.webp',
      tileColor: '#0ea5e9',
      implemented: true,
    },
    kakao: {
      name: '카카오톡',
      icon: MessagesSquare,
      iconImage: '/sunjay-phone/app-icons/kakaotalk.png', // 기본 SVG. PNG 사용 시 '/sunjay-phone/app-icons/kakaotalk.png', 기본 Lucide 아이콘은 undefined
      tileColor: '#facc15',
      iconColor: '#3f2a14',
      implemented: true,
    },
    contacts: {
      name: '연락처',
      icon: BookUser,
      iconImage: '/sunjay-phone/app-icons/contact.webp',
      tileColor: '#f59e0b',
      implemented: true,
    },
    phone: {
      name: '전화',
      icon: Phone,
      iconImage: '/sunjay-phone/app-icons/call.webp',
      tileColor: '#10b981',
      implemented: true,
    },
    photos: {
      name: '갤러리',
      icon: ImageIcon,
      iconImage: '/sunjay-phone/app-icons/gallery.webp',
      tileColor: '#f43f5e',
      implemented: true,
    },
    alarms: {
      name: '시계',
      icon: AlarmClock,
      iconImage: '/sunjay-phone/app-icons/clock.webp',
      tileColor: '#353e58',
      implemented: true,
    },
    coupang: {
      name: '쿠팡',
      icon: ShoppingBag,
      iconImage: '/sunjay-phone/app-icons/coupang.png',
      tileColor: '#2676df',
      implemented: true,
    },
    notes: {
      name: '노트',
      icon: StickyNote,
      iconImage: '/sunjay-phone/app-icons/notes.webp',
      tileColor: '#eab308',
      implemented: true,
    },
    instagram: {
      name: 'Instagram',
      icon: AtSign,
      iconImage: '/sunjay-phone/app-icons/instagram.png', // 기본 SVG. PNG 사용 시 '/sunjay-phone/app-icons/instagram.png', 기본 Lucide 아이콘은 undefined
      tileColor: '#6366f1',
      implemented: true,
    },
    browser: {
      name: '브라우저',
      icon: Globe,
      iconImage: '/sunjay-phone/app-icons/browser.webp',
      tileColor: '#2563eb',
      implemented: true,
    },
  },

  homeGrid: ['photos', 'notes', 'instagram', 'kakao', 'alarms', 'coupang'],
  dock: ['phone', 'messages', 'browser', 'settings'],
}

/**
 * 홈 화면에서 직접 여는 추가 앱. 아이콘 이미지를 설정하면 Lucide 아이콘 대신 표시됩니다.
 * 기존 DESIGN.apps와 동일하게 이름/아이콘/색상을 여기에서 관리합니다.
 */
export const EXTRA_APPS = {
  calendar: { name: '캘린더', icon: CalendarDays, iconImage: '/sunjay-phone/app-icons/calendar.webp' as string | undefined, tileColor: '#10b981', iconColor: '#ffffff' },
  todo: { name: '할 일', icon: ClipboardList, iconImage: undefined as string | undefined, tileColor: '#2563eb', iconColor: '#ffffff' },
  weather: { name: '날씨', icon: CloudSun, iconImage: '/sunjay-phone/app-icons/weather.webp' as string | undefined, tileColor: '#38bdf8', iconColor: '#ffffff' },
  reservations: { name: '캐치테이블', icon: CalendarCheck, iconImage: '/sunjay-phone/app-icons/catchtable.png' as string | undefined, tileColor: '#f97316', iconColor: '#ffffff' },
  episode: { name: '에피소드', icon: Layers3, iconImage: undefined as string | undefined, tileColor: '#4f46e5', iconColor: '#ffffff' },
} as const

/** 두 번째 홈 화면에 표시할 앱 순서 */
// export const SECOND_PAGE_APPS = ['todo', 'messages', 'weather', 'reservations'] as const
export const SECOND_PAGE_APPS = [] as const
