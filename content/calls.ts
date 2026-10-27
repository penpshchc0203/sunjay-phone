import type { CallLogEntry } from '@/lib/phone/content-types'

/** 통화 기록. 최신 기록을 위에 적습니다. */
export const CALL_LOG: CallLogEntry[] = [
  { id: 'call-1', unknownNumber: '02-555-0147', type: 'missed', calledAt: '2026-10-25T17:46' },
  { id: 'call-2', contactId: 'mom', type: 'incoming', calledAt: '2026-10-24T21:10', durationSec: 734 },
  { id: 'call-3', contactId: 'sunghoon', type: 'outgoing', calledAt: '2026-10-23T23:02', durationSec: 48 },
  { id: 'call-4', unknownNumber: '02-555-0147', type: 'rejected', calledAt: '2026-10-22T08:15' },
  { id: 'call-5', contactId: 'user', type: 'incoming', calledAt: '2026-10-21T22:30', durationSec: 1820 },
]
