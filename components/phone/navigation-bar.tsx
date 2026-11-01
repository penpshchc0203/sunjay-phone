'use client'

import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhone } from './phone-provider'

const navButton =
  'flex h-10 w-16 items-center justify-center rounded-full text-white/85 [.virtual-phone-scrollbars:has([data-app-drawer])_&]:text-zinc-700 [.virtual-phone-scrollbars:has([data-home-overlay])_&]:text-zinc-700 [.virtual-phone-scrollbars:has([data-weather-overlay])_&]:text-[#31526b] [.virtual-phone-scrollbars:has([data-reservations-overlay])_&]:text-zinc-700 outline-none transition-colors hover:bg-white/10 active:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60'

export function NavigationBar() {
  const { state, showRecents, toggleRecents, goHome, back } = usePhone()
  const canGoBack = showRecents || state.mode === 'app'
  const closeHomeOverlay = () => {
    const overlay = document.querySelector('[data-home-overlay], [data-weather-overlay], [data-reservations-overlay], [data-app-drawer]')
    if (overlay) window.dispatchEvent(new Event('phone:close-home-overlay'))
    return Boolean(overlay)
  }

  return (
    <nav
      aria-label="시스템 탐색"
      className={cn(
        'relative z-30 flex h-12 shrink-0 items-center justify-around px-6',
        state.mode === 'app' && !showRecents ? 'bg-[var(--phone-app-bg)]' : 'bg-transparent',
        '[.virtual-phone-scrollbars:has([data-home-overlay])_&]:bg-[#fafafa] [.virtual-phone-scrollbars:has([data-home-overlay])_&]:text-zinc-900',
        '[.virtual-phone-scrollbars:has([data-app-drawer])_&]:bg-[#f3f4f6]/80 [.virtual-phone-scrollbars:has([data-app-drawer])_&]:backdrop-blur-xl',
        '[.virtual-phone-scrollbars:has([data-weather-overlay])_&]:bg-[#d6e8f2]',
        '[.virtual-phone-scrollbars:has([data-reservations-overlay])_&]:bg-[#fafafa]',
      )}
    >
      <button
        type="button"
        onClick={() => { closeHomeOverlay(); toggleRecents() }}
        aria-label="최근 실행 앱"
        aria-pressed={showRecents}
        className={navButton}
      >
        <span aria-hidden="true" className="flex h-4 gap-[4px]">
          <span className="w-[2px] rounded-full bg-current" />
          <span className="w-[2px] rounded-full bg-current" />
          <span className="w-[2px] rounded-full bg-current" />
        </span>
      </button>
      <button type="button" onClick={() => { closeHomeOverlay(); goHome() }} aria-label="홈 화면" className={navButton}>
        <span aria-hidden="true" className="size-[18px] rounded-[6px] border-2 border-current" />
      </button>
      <button
        type="button"
        onClick={() => { if (!closeHomeOverlay()) back() }}
        disabled={!canGoBack && state.mode !== 'home'}
        aria-label="뒤로 가기"
        className={cn(navButton, 'disabled:opacity-40 disabled:hover:bg-transparent')}
      >
        <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden="true" />
      </button>
    </nav>
  )
}
