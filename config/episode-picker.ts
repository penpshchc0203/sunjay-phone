import type { Episode } from '@/content/episodes/types'

/** 에피소드 선택창에 표시할 내용입니다. 추가 회차는 아래에 항목만 추가하세요. */
export const EPISODE_PICKER: Record<string, {
  enabled: boolean
  dateLabel: string
  description: string
  thumbnailColor: string
}> = {
  ep01: { enabled: true, dateLabel: '2026.04.30까지', description: '첫 만남과 연락', thumbnailColor: 'bg-[#b6d9ec]' },
  ep02: { enabled: true, dateLabel: '2026.05.01부터', description: '썸', thumbnailColor: 'bg-[#79b7cf]' },
  ep03: { enabled: true, dateLabel: '2026.05.17까지', description: '첫 갈등', thumbnailColor: 'bg-[#777e9e]' },
}

/** 미등록 에피소드도 표시되며, 공개 여부는 명시적으로 설정해야 합니다. */
export function getEpisodePickerInfo(ep: Episode) {
  const configured = EPISODE_PICKER[ep.id]
  return configured ?? {
    enabled: false,
    dateLabel: ep.dateTime ? ep.dateTime.slice(0, 10).replace(/-/g, '.') : '날짜 미정',
    description: ep.title,
    thumbnailColor: 'bg-[#777e9e]',
  }
}
