import type { LockNotification } from '@/lib/phone/content-types'

/** 잠금 화면에 보이는 알림. 누르면 appId 에 해당하는 앱이 열립니다. */
export const LOCK_NOTIFICATIONS: LockNotification[] = [
  {
    id: 'lock-1',
    appId: 'messages',
    title: '떠누',
    body: '고디바모찌ㅠ',
    timeLabel: '방금',
  },
  {
    id: 'lock-2',
    appId: 'phone',
    title: '부재중 전화',
    body: '02-555-0147',
    timeLabel: '12분 전',
  },
  {
    id: 'lock-3',
    appId: 'instagram',
    title: 'SNS',
    body: 'torido0624님이 회원님의 게시물을 좋아합니다.',
    timeLabel: '1시간 전',
  },
]
