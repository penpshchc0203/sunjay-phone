import type { AppId } from '@/lib/phone/types'

export type HistoryNotification = {
  id: string
  occurredAt: string
  appId: AppId
  title: string
  body: string
  type: 'kakao' | 'missed-call' | 'sms' | 'story' | 'event'
  targetId?: string
  read?: boolean
}
