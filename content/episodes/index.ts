import { ep01 } from './ep01'
import { ep02 } from './ep02'
import { ep03 } from './ep03'
export type { Episode, EpisodeContent } from './types'
/** Add an epNN.ts and matching JSON files, then run the generator. */
export const EPISODES = [ep01, ep02, ep03]
export const DEFAULT_EPISODE_ID = 'ep01'
