'use client'

import { DESIGN } from '@/config/design'
import { Layers3 } from 'lucide-react'
import { useEpisode } from './episode-provider'
import { formatDate, formatTime, useNow } from '@/hooks/use-now'
import { DOCK_APPS, HOME_GRID_APPS } from '@/lib/phone/apps'
import { AppLauncherButton } from './app-icon'
import { usePhone } from './phone-provider'

export function HomeScreen() {
  const now = useNow()
  const { openApp } = usePhone()
  const { episode, showPicker } = useEpisode()

  return (
    <section
      aria-label="홈 화면"
      className="flex h-full flex-col px-4 pb-3"
      style={{ color: DESIGN.homeScreen.textColor }}
    >
      <div className="px-2 pt-8 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]">
        <p
          className="text-6xl font-light tabular-nums tracking-tight"
          style={{ color: DESIGN.homeScreen.clockColor }}
        >
          {formatTime(now)}
        </p>
        <p className="mt-2 text-sm font-medium opacity-90">{formatDate(now)}</p>
      </div>

      <div className="mt-auto">
        <ul aria-label="앱" className="grid grid-cols-4 gap-x-2 gap-y-5">
          {HOME_GRID_APPS.map((id) => (
            <li key={id} className="flex justify-center">
              <AppLauncherButton appId={id} onOpen={openApp} />
            </li>
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={showPicker}
              aria-label={`에피소드 선택, 현재 ${episode.title}`}
              className="group flex flex-col items-center gap-1.5 rounded-2xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span className="flex w-14 aspect-square items-center justify-center rounded-[32%] bg-indigo-600 text-white shadow-sm transition-transform group-active:scale-90 sm:w-[3.75rem] md:w-14">
                <Layers3 className="size-[48%]" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="max-w-[4.5rem] truncate text-xs font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">에피소드</span>
            </button>
          </li>
        </ul>

        <div aria-hidden="true" className="my-5 flex justify-center gap-1.5">
          <span className="size-1.5 rounded-full bg-white" />
          <span className="size-1.5 rounded-full bg-white/40" />
        </div>

        <ul aria-label="즐겨찾는 앱" className="grid grid-cols-4 gap-x-2 rounded-[1.75rem] bg-white/10 px-1 py-2.5 backdrop-blur-md">
          {DOCK_APPS.map((id) => (
            <li key={id} className="flex justify-center">
              <AppLauncherButton appId={id} onOpen={openApp} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
