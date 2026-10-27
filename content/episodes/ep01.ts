import { contacts } from './ep01/contacts'
import { calls } from './ep01/calls'
import { smsThreads } from './ep01/messages'
import { browserSearches, browserResults } from './ep01/browser'
import { kakaoAvatars } from './ep01/kakao-avatars'
import type { Episode } from './types'
import { kakao } from './ep01/kakao'
import { photos } from './ep01/photos'
import { notes } from './ep01/notes'
import { instagram } from './ep01/instagram'
/** 기존 content/ 파일을 그대로 사용하는 기본 에피소드. 원본 데이터는 수정하지 않습니다. */
export const ep01: Episode = {
  id: 'ep01', title: 'EP.01 연애 6개월차', dateTime: '2026-10-25T19:00',
  characterIds: [],
  // 기존 잠금화면/홈화면 배경을 그대로 사용합니다.
  content: { ...kakao, ...photos, ...notes, ...instagram, contacts, calls, smsThreads, browserSearches, browserResults, kakaoAvatars },
}
