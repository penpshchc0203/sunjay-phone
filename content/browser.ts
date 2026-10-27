import type { BrowserHistoryEntry, BrowserSearchEntry, BrowserSearchResult } from '@/lib/phone/content-types'

/** 검색어 기록. 최신 기록을 위에 적습니다. */
export const BROWSER_SEARCHES: BrowserSearchEntry[] = [
  { id: 'search-1', query: '02-555-0147', searchedAt: '2026-10-25T17:50' },
  { id: 'search-2', query: '이름 없이 꽃 배달 보내는 법', searchedAt: '2026-10-24T09:20' },
  { id: 'search-3', query: '제주도 11월 날씨', searchedAt: '2026-10-21T23:11' },
]

/** 방문 기록. 최신 기록을 위에 적습니다. */
export const BROWSER_HISTORY: BrowserHistoryEntry[] = [
  {
    id: 'history-1',
    title: '02-555-0147 - 전화번호 검색 결과',
    url: 'https://search.example.com/?q=02-555-0147',
    visitedAt: '2026-10-25T17:51',
  },
  {
    id: 'history-2',
    title: '익명 꽃 배달 서비스 | 플라워메이트',
    url: 'https://flowers.example.com/anonymous',
    visitedAt: '2026-10-24T09:22', 
  },
  {
    id: 'history-3',
    title: '11월 제주 여행 코스 추천',
    url: 'https://travel.example.com/jeju-november',
    visitedAt: '2026-10-21T23:14',
  },
]

/** 가상 검색 결과. 기본값은 빈 목록이며, 작품에 맞는 검색어별 결과를 추가하세요. */
export const BROWSER_RESULTS: BrowserSearchResult[] = []
