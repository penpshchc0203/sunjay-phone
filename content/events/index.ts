import type { PhoneEventDefinition } from '@/lib/phone/event-types'
import ep01 from './ep01.json'
import ep02 from './ep02.json'
import ep021 from './ep02-1.json'
import ep022 from './ep02-2.json'
import ep023 from './ep02-3.json'
import ep03 from './ep03.json'
const sets: Record<string, {events: PhoneEventDefinition[]}> = { ep01, ep02, 'ep02-1': ep021, 'ep02-2': ep022, 'ep02-3': ep023, ep03 } as unknown as Record<string, {events: PhoneEventDefinition[]}> 
export const getPhoneEvents = (episodeId: string): PhoneEventDefinition[] => sets[episodeId]?.events ?? []
