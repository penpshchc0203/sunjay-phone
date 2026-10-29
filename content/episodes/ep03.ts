import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'

export const ep03: Episode = {
  id: 'ep03', title: 'EP.03 연애 2년차 (추후 구현 예정)', dateTime: '',
  characterIds: [],
  content: loadEpisodeContent('ep03'),
}
