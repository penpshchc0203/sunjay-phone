 'use client'

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import { EPISODES, DEFAULT_EPISODE_ID } from '@/content/episodes'
import { CONTACTS } from '@/content/contacts'
import { KAKAO_ROOMS, KAKAO_PROFILES } from '@/content/kakao'
import { INSTAGRAM_PROFILE, INSTAGRAM_ACCOUNTS, INSTAGRAM_POSTS, INSTAGRAM_DMS, INSTAGRAM_STORIES } from '@/content/instagram'
import { PHOTOS } from '@/content/photos'
import { NOTES } from '@/content/notes'
import { CALL_LOG } from '@/content/calls'
import { SMS_THREADS } from '@/content/messages'
import { LOCK_NOTIFICATIONS } from '@/content/lock-notifications'
import { BROWSER_SEARCHES, BROWSER_RESULTS } from '@/content/browser'
import type { Episode, EpisodeContent } from '@/content/episodes'

const LAST_KEY = 'virtual-phone:last-episode:v1'
const defaults: Required<EpisodeContent> = {
  kakaoAvatars: {}, contacts: CONTACTS, kakaoRooms: KAKAO_ROOMS, kakaoProfiles: KAKAO_PROFILES,
  instagramProfile: INSTAGRAM_PROFILE, instagramAccounts: INSTAGRAM_ACCOUNTS,
  instagramPosts: INSTAGRAM_POSTS, instagramDms: INSTAGRAM_DMS, instagramStories: INSTAGRAM_STORIES,
  photos: PHOTOS, notes: NOTES, calls: CALL_LOG, smsThreads: SMS_THREADS, notifications: LOCK_NOTIFICATIONS,
  browserSearches: BROWSER_SEARCHES, browserResults: BROWSER_RESULTS,
}
interface EpisodeContextValue { episode: Episode; content: Required<EpisodeContent>; selectEpisode: (id: string) => void; showPicker: () => void; hidePicker: () => void; choosing: boolean }
const Context = createContext<EpisodeContextValue | null>(null)
export function EpisodeProvider({ children }: {children: ReactNode}) {
  const [id, setId] = useState(DEFAULT_EPISODE_ID)
  const [previewContent, setPreviewContent] = useState<Partial<Required<EpisodeContent>> | null>(null)
  const [previewEpisode, setPreviewEpisode] = useState<Episode | null>(null)
  const [choosing, setChoosing] = useState(false)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('adminPreview') !== '1' || window.parent === window) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const data = event.data
      if (data?.type !== 'virtual-phone-admin-preview' || !data.content || typeof data.content !== 'object') return
      setPreviewContent(data.content)
      if (data.episode && typeof data.episode.id === 'string') setPreviewEpisode(data.episode)
      setChoosing(false)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({type:'virtual-phone-preview-ready'},window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  const episode = previewEpisode ?? EPISODES.find(ep=>ep.id===id) ?? EPISODES[0]
  const content = useMemo(() => ({ ...defaults, ...episode.content, ...(previewContent ?? {}) }), [episode, previewContent])
  const selectEpisode = (next: string) => { if (!EPISODES.some(ep=>ep.id===next)) return; setId(next); setChoosing(false); try {localStorage.setItem(LAST_KEY,next)}catch{} }
  const value = useMemo(() => ({episode,content,selectEpisode,showPicker:()=>setChoosing(true),hidePicker:()=>setChoosing(false),choosing}), [episode,content,choosing])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useEpisode() { const context = useContext(Context); if(!context) throw new Error('EpisodeProvider missing'); return context }
export const episodeStorageKey = (key: string, id: string) => id === DEFAULT_EPISODE_ID ? key : `${key}:episode:${id}`
