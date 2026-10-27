import type {
  InstagramAccount,
  InstagramDmThread,
  InstagramOwnProfile,
  InstagramPost,
} from '@/lib/phone/content-types'

/** 휴대폰 주인의 SNS 프로필 */
export const INSTAGRAM_PROFILE: InstagramOwnProfile = {
  username: 'simply.jjong',
  displayName: 'jay park',
  avatar: '/images/profile/jayinsta.jpg',
  bio: '',
  followers: 412,
  following: 288,
}

/** 다른 계정들. 게시물 댓글·DM 에서 id 로 가리킵니다. */
export const INSTAGRAM_ACCOUNTS: InstagramAccount[] = [
  { id: 'jake_k', username: 'jake_k', displayName: '심재윤', contactId: 'jake' },
  { id: 'sunghoon.h', username: 'sunghoon.h', displayName: '박성훈', contactId: 'sunghoon' },
  { id: 'unknown_lens', username: 'unknown_lens', displayName: '' },
  { id: 'torido0624', username: 'torido0624', displayName: '도토리' },
]

/** 내 게시물. 최신 게시물을 위에 적습니다. */
export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-flowers',
    images: ['/images/photos/jayinsta01.jpg'],
    caption: '따봉.',
    postedAt: '2026-10-24T09:12',
    likes: 87,
    comments: [
      { id: 'post-flowers-c1', accountId: 'jake_k', text: '헐 누구야?? 말해봐', commentedAt: '2026-10-24T09:30' },
      { id: 'post-flowers-c2', accountId: 'me', text: '나도 몰라 ㅋㅋ', commentedAt: '2026-10-24T09:41' },
    ],
  },
  {
    id: 'post-river',
    images: ['/images/photos/jayinsta02.jpg', '/images/photos/rainy-street.png'],
    caption: '꽃ㅋㅋ 내꺼아님',
    location: '서울 한강공원',
    postedAt: '2026-10-20T19:48',
    likes: 132,
    comments: [
      { id: 'post-river-c1', accountId: 'sunghoon.p', text: '누구껀데', commentedAt: '2026-10-20T20:05' },
    ],
  },
  {
    id: 'post-cafe',
    images: ['/images/photos/jayinsta03.jpg'],
    caption: '오오오 쿨타임 끝났구나\n한동안 해외를 많이 나가서 어렵겠지만 시간 생기면 또 하러가야겠다~~🩸🅱️🫡',
    postedAt: '2026-10-18T15:02',
    likes: 64,
    comments: [],
  },
]

/** DM 대화방. messages 는 오래된 것부터 순서대로 적습니다. */
export const INSTAGRAM_DMS: InstagramDmThread[] = [
  {
    id: 'dm-jake',
    accountId: 'jake_k',
    messages: [
      { id: 'dm-jake-1', from: 'them', text: '꽃 사진 진짜 누가 준 거야?', sentAt: '2026-10-24T09:33' },
      { id: 'dm-jake-2', from: 'me', text: '문 앞에 있었어. 카드도 없고', sentAt: '2026-10-24T09:45' },
    ],
  },
  {
    id: 'dm-unknown',
    accountId: 'unknown_lens',
    messages: [
      { id: 'dm-unknown-1', from: 'them', text: '꽃은 마음에 들었어요?', sentAt: '2026-10-24T23:51' },
    ],
  },
]

/** 스토리: 이미지 경로를 public 폴더 기준으로 작성합니다. 비어 있으면 스토리 영역을 숨깁니다. */
export const INSTAGRAM_STORIES: import('@/lib/phone/content-types').InstagramStory[] = [
  {id:'sample-owner-01',accountId:'me',image:'/images/photos/jayinsta01.jpg',caption:'오늘.',postedAt:'2026-10-25T09:00',fit:'cover'},
  {id:'sample-owner-02',accountId:'me',image:'/images/photos/jayinsta02.jpg',caption:'잠깐 산책',postedAt:'2026-10-25T18:00',fit:'cover'},
  {id:'torido0624',accountId:'torido0624',image:'/images/photos/toridostory_001.webp',caption:'',postedAt:'2026-10-25T22:10',fit:'cover'},
]

/** 계정 관계와 하이라이트는 선택적입니다. 아래 배열에 실제 계정 ID를 넣어 사용하세요.
 * INSTAGRAM_PROFILE.followerIds / followingIds, INSTAGRAM_ACCOUNTS[].followerIds / followingIds
 * INSTAGRAM_PROFILE.highlights / INSTAGRAM_ACCOUNTS[].highlights
 * INSTAGRAM_POSTS[].taggedAccountIds
 * 비공개 계정은 private: true로 설정하세요. 기본 데이터는 변경하지 않았습니다.
 */
