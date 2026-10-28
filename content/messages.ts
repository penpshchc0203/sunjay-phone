import type { SmsThread } from '@/lib/phone/content-types'

/** 문자 메시지 대화방. 각 대화방의 messages 는 오래된 것부터 순서대로 적습니다. */
export const SMS_THREADS: SmsThread[] = [
  // {
  //   id: 'sms-sunghoon',
  //   contactId: 'sunghoon',
  //   unreadCount: 1,
  //   messages: [
  //     { id: 'sms-sunghoon-1', from: 'them', text: '이번 주 언제 시간 돼?', sentAt: '2026-10-24T18:12' },
  //     { id: 'sms-sunghoon-2', from: 'me', text: '주말은 좀 바쁠 것 같아. 왜?', sentAt: '2026-10-24T18:40' },
  //     { id: 'sms-sunghoon-3', from: 'them', text: '오늘 끝나고 잠깐 볼 수 있어? 할 말이 있어.', sentAt: '2026-10-25T17:58' },
  //   ],
  // },
  // {
  //   id: 'sms-mom',
  //   contactId: 'mom',
  //   messages: [
  //     { id: 'sms-mom-1', from: 'them', text: '밥은 챙겨 먹고 다니니', sentAt: '2026-10-23T12:05' },
  //     { id: 'sms-mom-2', from: 'me', text: '응 먹었어~ 걱정 마', sentAt: '2026-10-23T12:30' },
  //     { id: 'sms-mom-3', from: 'them', text: '반찬 보냈다. 내일 도착할 거야', sentAt: '2026-10-23T20:14' },
  //   ],
  // },
  // {
  //   id: 'sms-unknown-0147',
  //   unknownNumber: '02-555-0147',
  //   messages: [
  //     {
  //       id: 'sms-unknown-0147-1',
  //       from: 'them',
  //       text: '[안내] 박종성 고객님, 보관 중인 물품 확인이 필요합니다. 연락 부탁드립니다.',
  //       sentAt: '2026-10-25T17:40',
  //     },
  //   ],
  // },
]
