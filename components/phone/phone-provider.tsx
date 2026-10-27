'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import { initialPhoneState, phoneReducer, sanitizePhoneState } from '@/lib/phone/reducer'
import { useEpisode, episodeStorageKey } from './episode-provider'
import type { AppId, PhoneState } from '@/lib/phone/types'

const STORAGE_KEY = 'virtual-phone:v1'

interface PhoneContextValue {
  state: PhoneState
  hydrated: boolean
  showRecents: boolean
  currentRoute: string | null
  unlock: () => void
  lock: () => void
  togglePower: () => void
  openApp: (appId: AppId) => void
  goHome: () => void
  back: () => void
  pushRoute: (route: string) => void
  toggleRecents: () => void
  removeRecent: (appId: AppId) => void
  clearRecents: () => void
  reset: () => void
}

const PhoneContext = createContext<PhoneContextValue | null>(null)

export function PhoneProvider({ children }: { children: ReactNode }) {
  const { episode } = useEpisode()
  const storageKey = episodeStorageKey(STORAGE_KEY, episode.id)
  const [state, dispatch] = useReducer(phoneReducer, initialPhoneState)
  const [hydrated, setHydrated] = useState(false)
  const [showRecents, setShowRecents] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) dispatch({ type: 'HYDRATE', state: { ...sanitizePhoneState(JSON.parse(raw)), mode: 'lock', currentApp: null } })
    } catch {
      window.localStorage.removeItem(storageKey)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Storage may be full or disabled (private mode); the phone keeps working in memory.
    }
  }, [state, hydrated])

  const unlock = useCallback(() => dispatch({ type: 'UNLOCK' }), [])
  const lock = useCallback(() => {
    setShowRecents(false)
    dispatch({ type: 'LOCK' })
  }, [])
  const togglePower = useCallback(() => {
    setShowRecents(false)
    dispatch({ type: state.mode === 'lock' ? 'UNLOCK' : 'LOCK' })
  }, [state.mode])
  const openApp = useCallback((appId: AppId) => {
    setShowRecents(false)
    dispatch({ type: 'OPEN_APP', appId })
  }, [])
  const goHome = useCallback(() => {
    setShowRecents(false)
    dispatch({ type: 'GO_HOME' })
  }, [])
  const back = useCallback(() => {
    if (showRecents) {
      setShowRecents(false)
      return
    }
    dispatch({ type: 'BACK' })
  }, [showRecents])
  const pushRoute = useCallback((route: string) => dispatch({ type: 'PUSH_ROUTE', route }), [])
  const toggleRecents = useCallback(() => setShowRecents((v) => !v), [])
  const removeRecent = useCallback((appId: AppId) => dispatch({ type: 'REMOVE_RECENT', appId }), [])
  const clearRecents = useCallback(() => dispatch({ type: 'CLEAR_RECENTS' }), [])
  const reset = useCallback(() => {
    setShowRecents(false)
    window.localStorage.removeItem(storageKey)
    dispatch({ type: 'RESET' })
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') back()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [back])

  const currentRoute = state.currentApp
    ? (state.appRoutes[state.currentApp]?.at(-1) ?? null)
    : null

  const value = useMemo<PhoneContextValue>(
    () => ({
      state,
      hydrated,
      showRecents,
      currentRoute,
      unlock,
      lock,
      togglePower,
      openApp,
      goHome,
      back,
      pushRoute,
      toggleRecents,
      removeRecent,
      clearRecents,
      reset,
    }),
    [
      state,
      hydrated,
      showRecents,
      currentRoute,
      unlock,
      lock,
      togglePower,
      openApp,
      goHome,
      back,
      pushRoute,
      toggleRecents,
      removeRecent,
      clearRecents,
      reset,
    ],
  )

  return <PhoneContext.Provider value={value}>{children}</PhoneContext.Provider>
}

export function usePhone() {
  const ctx = useContext(PhoneContext)
  if (!ctx) throw new Error('usePhone must be used within PhoneProvider')
  return ctx
}
