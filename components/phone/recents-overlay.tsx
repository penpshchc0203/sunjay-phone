'use client'

import { X } from 'lucide-react'
import { APPS } from '@/lib/phone/apps'
import { AppIconTile } from './app-icon'
import { usePhone } from './phone-provider'

export function RecentsOverlay() {
  const { state, openApp, removeRecent, clearRecents } = usePhone()

  return (
    <section
      aria-label="최근 실행 앱"
      className="absolute inset-x-0 bottom-12 top-9 z-20 flex flex-col bg-black/70 backdrop-blur-xl"
    >
      {state.recentApps.length === 0 ? (
        <p className="m-auto text-sm text-white/70">최근 실행한 앱이 없습니다</p>
      ) : (
        <>
          <ul className="flex min-h-0 flex-1 snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[15%]">
            {state.recentApps.map((id) => (
              <li key={id} className="relative h-[70%] w-full shrink-0 snap-center">
                <button
                  type="button"
                  onClick={() => openApp(id)}
                  aria-label={`${APPS[id].name} 열기`}
                  className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-[var(--phone-surface)] text-left outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <span className="flex items-center gap-2 px-4 py-3">
                    <AppIconTile appId={id} className="w-7" />
                    <span className="text-sm font-medium text-white">{APPS[id].name}</span>
                  </span>
                  <span className="flex flex-1 items-center justify-center bg-[var(--phone-app-bg)]">
                    <AppIconTile appId={id} className="w-16 opacity-60" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeRecent(id)}
                  aria-label={`${APPS[id].name} 닫기`}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-white/70 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-center pb-6">
            <button
              type="button"
              onClick={clearRecents}
              className="h-10 rounded-full bg-white/15 px-6 text-sm font-medium text-white outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              모두 닫기
            </button>
          </div>
        </>
      )}
    </section>
  )
}
