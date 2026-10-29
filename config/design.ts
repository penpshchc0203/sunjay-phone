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
    wallpaper: '/sunjay-phone/images/homescreen.jpg',
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
      tileColor: '#71717a',
      implemented: true,
    },

    /* ── 아직 구현되지 않은 앱 (콘텐츠 데이터만 준비됨, 누르면 "구현되지 않음" 화면 표시) ── */
    messages: {
      name: '메시지',
      icon: MessageCircle,
      tileColor: '#0ea5e9',
      implemented: false,
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
      tileColor: '#f59e0b',
      implemented: true,
    },
    phone: {
      name: '전화',
      icon: Phone,
      tileColor: '#10b981',
      implemented: true,
    },
    photos: {
      name: '사진',
      icon: ImageIcon,
      tileColor: '#f43f5e',
      implemented: true,
    },
    alarms: {
      name: '시계',
      icon: AlarmClock,
      tileColor: '#353e58',
      implemented: true,
    },
    coupang: {
      name: '쿠팡',
      icon: ShoppingBag,
      iconImage: '/sunjay-phone/app-icons/coupang.webp',
      tileColor: '#2676df',
      implemented: true,
    },
    notes: {
      name: '메모',
      icon: StickyNote,
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
      name: '인터넷',
      icon: Globe,
      tileColor: '#2563eb',
      implemented: true,
    },
  },

  homeGrid: ['contacts', 'photos', 'notes', 'instagram', 'kakao', 'alarms', 'coupang'],
  dock: ['phone', 'messages', 'browser', 'settings'],
}
