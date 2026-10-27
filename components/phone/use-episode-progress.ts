'use client'
import { useEffect } from 'react'
import { useEpisode } from './episode-provider'

/** 각 에피소드의 읽은 항목 ID를 독립적으로 보관합니다. */
export function useEpisodeProgress(kind: 'messages' | 'photos' | 'stories', id: string | null) {
  const { episode } = useEpisode()
  useEffect(() => {
    if (!id) return
    const key = `virtual-phone:progress:v1:${episode.id}:${kind}`
    try {
      const previous = JSON.parse(localStorage.getItem(key) || '[]') as unknown
      const ids = Array.isArray(previous) ? previous.filter((x): x is string => typeof x === 'string') : []
      if (!ids.includes(id)) localStorage.setItem(key, JSON.stringify([...ids, id]))
    } catch { /* Private browsing may block storage. */ }
  }, [episode.id, kind, id])
}
