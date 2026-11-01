import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'
import settings from './settings/ep02.json'

export const ep02: Episode = {
  id: 'ep02', title: 'EP.02 강릉 여행과 썸', dateTime: '2026-05-10T23:59',
  characterIds: [],
  ...settings,
  content: loadEpisodeContent('ep02'),
}
