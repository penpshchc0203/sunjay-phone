import { CALL_LOG } from '@/content/calls'
import type { CallLogEntry } from '@/lib/phone/content-types'
export const calls: CallLogEntry[] = CALL_LOG.map(item => ({...item}))
