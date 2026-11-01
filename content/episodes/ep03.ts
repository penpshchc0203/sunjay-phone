import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'
import settings from './settings/ep03.json'

export const ep03: Episode = {
  id: 'ep03', title: 'EP.03 연애 초반 (추후 구현 예정)', dateTime: '',
  characterIds: [],
  ...settings,
  content: loadEpisodeContent('ep03'),
}
