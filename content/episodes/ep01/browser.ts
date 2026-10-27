import { BROWSER_SEARCHES, BROWSER_RESULTS } from '@/content/browser'
import type { BrowserSearchEntry, BrowserSearchResult } from '@/lib/phone/content-types'
/** EP.01 전용 초기 인터넷 기록 */
export const browserSearches: BrowserSearchEntry[] = BROWSER_SEARCHES.map(x => ({...x}))
export const browserResults: BrowserSearchResult[] = BROWSER_RESULTS.map(x => ({...x}))
