import type { Note } from '@/lib/phone/content-types'

/** 메모 목록. pinned 가 true 인 메모는 위에 고정됩니다. */
export const NOTES: Note[] = [
  {
    id: 'note-todo',
    title: '이번 주 할 일',
    body: `- 월요일 회의 자료 지후 선배한테 보내기
- 엄마 반찬 받으면 연락
- 02-555-0147 이 번호 뭔지 알아보기`,
    createdAt: '2026-10-22T07:40',
    updatedAt: '2026-10-25T18:02',
    pinned: true,
  },
  {
    id: 'note-flowers',
    title: '10월 24일',
    body: `문 앞에 꽃이 있었다.
카드도, 이름도 없이.
누가 우리 집 주소를 아는 걸까.`,
    createdAt: '2026-10-24T09:05',
    folder: '일기',
  },
  {
    id: 'note-gift',
    title: '선물 아이디어',
    body: '민아 생일 - 필름 카메라? 향수?',
    createdAt: '2026-10-15T22:18',
  },
]
