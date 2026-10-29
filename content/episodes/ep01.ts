import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'

export const ep01: Episode = {
  id: 'ep01', title: 'EP.01 연애 전', dateTime: '2026-04-21T23:59',
  characterIds: [],
  content: loadEpisodeContent('ep01'),
}
