import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'
import settings from './settings/ep01.json'

export const ep01: Episode = {
  id: 'ep01', title: 'EP.01 첫만남과 연락', dateTime: '2026-04-21T23:59',
  characterIds: [],
  ...settings,
  content: loadEpisodeContent('ep01'),
}
