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
    name: '선우씨',
    phoneNumber: CHARACTER.user.phoneNumber,
    relation: '귀여워',
    avatar: CHARACTER.user.avatar,
    favorite: false,
  },
  {
    id: 'sunghoon',
    name: '박성훈',
    phoneNumber: '010-2002-1208',
    relation: '대학 동기',
    favorite: false,
  },
  {
    id: 'mom',
    name: '엄마',
    phoneNumber: '010-1234-5678',
    relation: '가족',
    favorite: true,
  },
  {
    id: 'dad',
    name: '아빠',
    phoneNumber: '010-8765-4321',
    relation: '가족',
    favorite: true,
  },
  {
    id: 'jake',
    name: '심재윤',
    phoneNumber: '010-2002-1115',
    relation: '고등학교 친구',
  },
  {
    id: 'jihu',
    name: '박지후 선배',
    phoneNumber: '010-4401-6650',
    relation: '회사 선배',
  },
  {
    id: 'dohyunkim',
    name: '데이터분석1-김도현팀장님',
    phoneNumber: '010-XXX-0001',
    relation: '데이터분석1팀 / 팀장',
  },
  {
    id: 'jaehyunpark',
    name: '데이터분석1-박재현차장님',
    phoneNumber: '010-XXX-0002',
    relation: '데이터분석1팀 / 차장',
  },
  {
    id: 'seungjunlee',
    name: '데이터분석1-이승준과장님',
    phoneNumber: '010-XXX-0003',
    relation: '데이터분석1팀 / 과장',
  },
  {
    id: 'yoonjaechoi',
    name: '데이터분석1-최윤재대리',
    phoneNumber: '010-XXX-0004',
    relation: '데이터분석1팀 / 대리',
  },
  {
    id: 'mingyujung',
    name: '통계분석-정민규선배',
    phoneNumber: '010-XXX-0005',
    relation: '통계분석팀 / 선임연구원',
  },
  {
    id: 'jihoonseo',
    name: '데이터분석1-서지훈',
    phoneNumber: '010-XXX-0006',
    relation: '데이터분석1팀 / 동기',
  },
  {
    id: 'yujinhan',
    name: '데이터분석1-한유진',
    phoneNumber: '010-XXX-0007',
    relation: '데이터분석1팀 / 동료',
  },
  {
    id: 'taeokang',
    name: '데이터분석2-강태오',
    phoneNumber: '010-XXX-0008',
    relation: '데이터분석2팀 / 사원',
  },
  {
    id: 'sejinoh',
    name: '데이터전략-오세진대리',
    phoneNumber: '010-XXX-0009',
    relation: '데이터전략팀 / 대리',
  },
  {
    id: 'jiwo oim',
    name: '데이터분석1-임지우',
    phoneNumber: '010-XXX-0010',
    relation: '데이터분석1팀 / 신입',
  },
  {
    id: 'sionbaek',
    name: '데이터분석1-백시온',
    phoneNumber: '010-XXX-0011',
    relation: '데이터분석1팀 / 후임',
  },
  {
    id: 'hajunyoo',
    name: '데이터eng-유하준',
    phoneNumber: '010-XXX-0012',
    relation: '데이터엔지니어링팀 / 사원',
  },
  {
    id: 'subinkwon',
    name: '경영지원-권수빈',
    phoneNumber: '010-XXX-0013',
    relation: '경영지원팀 / 인사담당',
  },
  {
    id: 'yerinsong',
    name: '경영지원-송예린',
    phoneNumber: '010-XXX-0014',
    relation: '경영지원팀 / 총무담당',
  },
  {
    id: 'hyunwoojang',
    name: '본부-장현우부장님',
    phoneNumber: '010-XXX-0015',
    relation: '데이터분석본부 / 부장',
  }
]
