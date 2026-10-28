import data from './calls.json'
import type { CallLogEntry } from '@/lib/phone/content-types'

/** 이 에피소드의 통화 기록은 calls.json에서 수정하세요. */
export const calls = data.calls as CallLogEntry[]
