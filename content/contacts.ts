import { CHARACTER } from '@/config/character'
import type { Contact } from '@/lib/phone/content-types'

/** 사용자 본인을 가리키는 연락처 ID. 이름은 config/character.ts 의 user.displayName 을 따릅니다. */
export const USER_CONTACT_ID = 'user'

/**
 * 연락처 목록.
 * 여기 적은 id 를 messages.ts, kakao.ts, calls.ts 등에서 사람을 가리킬 때 사용합니다.
 */
export const CONTACTS: Contact[] = [
  {
    id: 'sunwoo',
    name: CHARACTER.user.displayName,
    phoneNumber: CHARACTER.user.phoneNumber,
    relation: '귀염둥이',
    avatar: CHARACTER.user.avatar,
    favorite: true,
  },
  {
    id: 'sunghoon',
    name: '박성훈',
    phoneNumber: '010-5512-3307',
    relation: '대학 동기',
    favorite: true,
  },
  {
    id: 'mom',
    name: '엄마',
    phoneNumber: '010-8820-1145',
    relation: '가족',
    favorite: true,
  },
  {
    id: 'jake',
    name: '심재윤',
    phoneNumber: '010-7734-9021',
    relation: '고등학교 친구',
  },
  {
    id: 'jihu',
    name: '박지후 선배',
    phoneNumber: '010-4401-6650',
    relation: '회사 선배',
  },
]
