import type { Episode } from './types'
import { loadEpisodeContent } from './load-content'

export const ep02: Episode = {
  id: 'ep02', title: 'EP.02 연애 6개월 차 (추후 구현 예정)', dateTime: '',
  characterIds: [],
  content: loadEpisodeContent('ep02'),
}
