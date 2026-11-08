import ep01 from './ep01.json'
import ep02 from './ep02.json'
import ep03 from './ep03.json'
import type { HistoryNotification } from './types'

const sources: Record<string, {notifications: HistoryNotification[]}> = {
  ep01: ep01 as {notifications: HistoryNotification[]},
  ep02: ep02 as {notifications: HistoryNotification[]},
  ep03: ep03 as {notifications: HistoryNotification[]},
}
export function getStoryNotifications(episodeId: string): HistoryNotification[] {
  return sources[episodeId]?.notifications ?? []
}
