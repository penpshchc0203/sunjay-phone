import type { KakaoFriendProfile, KakaoRoom } from '@/lib/phone/content-types'

/** 친구 목록에 보이는 상태 메시지. contactId 'me' 는 휴대폰 주인 본인입니다. */
export const KAKAO_PROFILES: KakaoFriendProfile[] = [
  { contactId: 'me', statusMessage: '' },
  { contactId: 'sunghoon', statusMessage: '' },
  { contactId: 'sunwoo', statusMessage: '😴' },
  { contactId: 'jake', statusMessage: '여행 D-14' },
  { contactId: 'jihu', statusMessage: '' },
]

/** 채팅방 목록. messages 는 오래된 것부터 순서대로 적습니다. */
export const KAKAO_ROOMS: KakaoRoom[] = [
  {
    id: 'kakao-user',
    type: 'direct',
    memberIds: ['sunwoo'],
    pinned: true,
    messages: [
      { id: 'kakao-user-1', from: 'user', text: '고디바모찌', sentAt: '2026-10-25T19:02' },
      { id: 'kakao-user-2', from: 'me', text: '그거 뭔데?', sentAt: '2026-10-25T19:10' },
      { id: 'kakao-user-3', from: 'me', text: '어디서 사?', sentAt: '2026-10-25T19:10' },
    ],
  },
  {
    id: 'kakao-friends',
    type: 'group',
    title: '고딩즈',
    memberIds: ['jake', 'sunghoon'],
    unreadCount: 3,
    messages: [
      { id: 'kakao-friends-1', from: 'jake', text: '다음 달 여행 숙소 정했어!!', sentAt: '2026-10-25T13:20' },
      { id: 'kakao-friends-2', from: 'jake', images: ['/sunjay-phone/images/photos/han-river.png','/sunjay-phone/images/photos/han-river.png','/sunjay-phone/images/photos/han-river.png','/sunjay-phone/images/photos/han-river.png',], sentAt: '2026-10-25T13:21' },
      { id: 'kakao-friends-3', from: 'sunghoon', text: '오 좋다. 갈 수 있어?', sentAt: '2026-10-25T13:45' },
    ],
  },
  {
    id: 'kakao-jihu',
    type: 'direct',
    memberIds: ['jihu'],
    muted: true,
    messages: [
      { id: 'kakao-jihu-1', from: 'jihu', text: '종성 씨, 월요일 회의 자료 공유 부탁해요.', sentAt: '2026-10-24T16:30' },
      { id: 'kakao-jihu-2', from: 'me', text: '네 선배님, 오늘 중으로 보내드릴게요!', sentAt: '2026-10-24T16:32' },
    ],
  },
]
