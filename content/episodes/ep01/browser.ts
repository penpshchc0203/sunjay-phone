import data from './browser.json'
import type { BrowserSearchEntry, BrowserHistoryEntry, BrowserSearchResult } from '@/lib/phone/content-types'

/** 이 에피소드의 검색 기록과 검색 결과는 browser.json에서 수정하세요. */
export const browserSearches = data.browserSearches as BrowserSearchEntry[]
export const browserHistory = data.browserHistory as BrowserHistoryEntry[]
export const browserResults = data.browserResults as BrowserSearchResult[]
