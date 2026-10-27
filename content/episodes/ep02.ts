import { contacts } from './ep02/contacts'
import { calls } from './ep02/calls'
import { smsThreads } from './ep02/messages'
import { browserSearches, browserResults } from './ep02/browser'
import { kakaoAvatars } from './ep02/kakao-avatars'
import type { Episode } from './types'
import { kakao } from './ep02/kakao'
import { photos } from './ep02/photos'
import { notes } from './ep02/notes'
import { instagram } from './ep02/instagram'
/** 새 회차의 데이터. 배열을 직접 채워 넣으면 EP.01과 섞이지 않습니다. */
export const ep02: Episode = {
  id: 'ep02', title: 'EP.02 연애 6개월 차 (추후 구현 예정)', dateTime: '',
  characterIds: [],
  content: { ...kakao, ...photos, ...notes, ...instagram, contacts, calls, smsThreads, browserSearches, browserResults, kakaoAvatars, notifications: [] },
}
