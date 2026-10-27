import type { Photo } from '@/lib/phone/content-types'

/** 갤러리 사진. 최신 사진을 위에 적습니다. 사진 파일은 public/images/photos 에 넣으세요. */
export const PHOTOS: Photo[] = [
  {
    id: 'photo-flowers',
    src: '/images/photos/flowers.png',
    alt: '침대 위에 놓인 흰색과 연분홍색 꽃다발',
    takenAt: '2026-10-24T08:57',
    album: '일상',
    favorite: true,
  },
  {
    id: 'photo-rainy-street',
    src: '/images/photos/rainy-street.png',
    alt: '비 오는 밤 네온사인이 비치는 골목길과 투명 우산',
    takenAt: '2026-10-20T21:30',
    album: '산책',
    location: '서울 마포구',
  },
  {
    id: 'photo-han-river',
    src: '/images/photos/han-river.png',
    alt: '노을 진 한강과 불 켜진 다리',
    takenAt: '2026-10-20T18:41',
    album: '산책',
    location: '서울 한강공원',
  },
  {
    id: 'photo-cafe',
    src: '/images/photos/cafe.png',
    alt: '하트 라떼아트가 그려진 커피와 펼쳐진 노트',
    takenAt: '2026-10-18T14:50',
    album: '일상',
  },
]
