import { contacts } from './ep03/contacts'
import { calls } from './ep03/calls'
import { smsThreads } from './ep03/messages'
import { browserSearches, browserResults } from './ep03/browser'
import { kakaoAvatars } from './ep03/kakao-avatars'
import type { Episode } from './types'
import { kakao } from './ep03/kakao'
import { photos } from './ep03/photos'
import { notes } from './ep03/notes'
import { instagram } from './ep03/instagram'
export const ep03: Episode = {
  id: 'ep03', title: 'EP.03 연애 2년차', dateTime: '2026-10-27T09:00',
  characterIds: [],
  content: { ...kakao, ...photos, ...notes, ...instagram, contacts, calls, smsThreads, browserSearches, browserResults, kakaoAvatars, notifications: [] },
}
