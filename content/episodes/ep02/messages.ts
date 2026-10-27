import data from './messages.json'
import type { SmsThread } from '@/lib/phone/content-types'

/** 이 에피소드의 문자 메시지는 messages.json에서 수정하세요. */
export const smsThreads = data.smsThreads as unknown as SmsThread[]
