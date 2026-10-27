import type { EpisodeContent } from '@/content/episodes'
import { CONTACTS } from '@/content/contacts'
import type { AppId } from './types'

export interface PhoneNotification {
  id: string
  appId: AppId
  title: string
  body: string
  timeLabel: string
  occurredAt?: string
  targetId?: string
  count: number
}
const name = (id?: string) => CONTACTS.find(c => c.id === id)?.name || id || '알 수 없음'
const preview = (message?: {text?: string; image?: string}) => message?.text || (message?.image ? '사진을 보냈습니다' : '새 메시지')
const time = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('ko-KR', {hour:'numeric',minute:'2-digit'}) : ''

/** 기존 콘텐츠에서 알림을 생성합니다. 읽지 않은 대화방만 알림이 되며, 수동 알림은 별도로 유지됩니다. */
export function getInitialNotifications(data: Required<EpisodeContent>): PhoneNotification[] {
  const KAKAO_ROOMS = data.kakaoRooms
  const INSTAGRAM_DMS = data.instagramDms
  const INSTAGRAM_ACCOUNTS = data.instagramAccounts
  const SMS_THREADS = data.smsThreads
  const CALL_LOG = data.calls
  const LOCK_NOTIFICATIONS = data.notifications
  const generated: PhoneNotification[] = []
  for (const room of KAKAO_ROOMS) {
    if (!room.unreadCount) continue
    const last = room.messages.at(-1)
    generated.push({id:`kakao:${room.id}`,appId:'kakao',targetId:room.id,title:room.title || room.memberIds.map(name).join(', '),body:preview(last),timeLabel:time(last?.sentAt),occurredAt:last?.sentAt,count:room.unreadCount})
  }
  for (const thread of INSTAGRAM_DMS) {
    if (!thread.unreadCount) continue
    const last = thread.messages.at(-1)
    generated.push({id:`instagram:${thread.id}`,appId:'instagram',targetId:thread.id,title:INSTAGRAM_ACCOUNTS.find(a=>a.id===thread.accountId)?.username || thread.accountId,body:preview(last),timeLabel:time(last?.sentAt),occurredAt:last?.sentAt,count:thread.unreadCount})
  }
  for (const thread of SMS_THREADS) {
    if (!thread.unreadCount) continue
    const last = thread.messages.at(-1)
    generated.push({id:`messages:${thread.id}`,appId:'messages',targetId:thread.id,title:thread.unknownNumber || name(thread.contactId),body:preview(last),timeLabel:time(last?.sentAt),occurredAt:last?.sentAt,count:thread.unreadCount})
  }
  for (const call of CALL_LOG) {
    if (call.type !== 'missed') continue
    generated.push({id:`phone:${call.id}`,appId:'phone',targetId:call.id,title:'부재중 전화',body:call.unknownNumber || name(call.contactId),timeLabel:time(call.calledAt),occurredAt:call.calledAt,count:1})
  }
  for (const item of LOCK_NOTIFICATIONS) {
    generated.push({id:item.id,appId:item.appId,title:item.title,body:item.body,timeLabel:item.timeLabel,targetId:item.targetId,count:1})
  }
  return generated.sort((a,b)=>(b.occurredAt || '').localeCompare(a.occurredAt || ''))
}
