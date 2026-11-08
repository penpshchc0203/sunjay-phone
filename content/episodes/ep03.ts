import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'
import settings from './settings/ep03.json'

export const ep03: Episode = {
  id: 'ep03', title: 'EP.03 첫 갈등', dateTime: '2026-05-17T23:59',
  characterIds: [],
  ...settings,
  content: loadEpisodeContent('ep03'),
}
