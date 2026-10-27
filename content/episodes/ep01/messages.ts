import { SMS_THREADS } from '@/content/messages'
import type { SmsThread } from '@/lib/phone/content-types'
export const smsThreads: SmsThread[] = SMS_THREADS.map(item => ({...item}))
