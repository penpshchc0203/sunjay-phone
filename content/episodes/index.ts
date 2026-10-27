import { ep01 } from './ep01'
import { ep02 } from './ep02'
import { ep03 } from './ep03'
export type { Episode, EpisodeContent } from './types'
/** 목록에 표시할 회차를 추가하거나 순서를 변경하세요. */
export const EPISODES = [ep01, ep02, ep03]
export const DEFAULT_EPISODE_ID = 'ep01'
